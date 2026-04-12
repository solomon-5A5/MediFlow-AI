import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import json
import io
import numpy as np
import cv2
import base64
import torch.nn.functional as F
from dotenv import load_dotenv

# 🟢 NEW: Import the modern Google GenAI SDK
from google import genai

# 🟢 SECURE API KEY LOADING
load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")

if not gemini_api_key:
    print("⚠️ WARNING: GEMINI_API_KEY not found in .env file!")
    client = None
else:
    # Initialize the new, modern client
    client = genai.Client(api_key=gemini_api_key)

# ─── Constants ──────────────────────────────────────────────────
DISEASE_CLASSES = [
    "No Finding", "Pneumonia", "Cardiomegaly", "Pleural Effusion",
    "Pneumothorax", "Atelectasis", "Consolidation", "Lung Opacity",
    "Nodule/Mass", "Infiltration", "Fibrosis", "Pleural Thickening",
    "Calcification", "Other Lesion"
]

# ─── ARCHITECTURE 1: DenseNet (Texture Specialist) ──────────────
class ImageBranch(nn.Module):
    def __init__(self):
        super().__init__()
        densenet = models.densenet121(weights="IMAGENET1K_V1")
        self.features = densenet.features       
        self.pool = nn.AdaptiveAvgPool2d(1)     

    def forward(self, x):
        feat = self.features(x)     
        feat = self.pool(feat)      
        return feat.flatten(1)      

class ClinicalBranch(nn.Module):
    def __init__(self, input_dim=15, embed_dim=16, dropout_rate=0.2):
        super().__init__()
        self.input_dropout = nn.Dropout(p=0.15)  
        self.mlp = nn.Sequential(
            nn.Linear(input_dim, 32), nn.LayerNorm(32), nn.ReLU(inplace=True),
            nn.Dropout(dropout_rate), nn.Linear(32, embed_dim), nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.mlp(self.input_dropout(x))

class MediFlowMultimodal(nn.Module):
    def __init__(self, num_classes=14, clinical_input_dim=15, clinical_embed_dim=16):
        super().__init__()
        self.image_branch = ImageBranch()                       
        self.clinical_branch = ClinicalBranch(input_dim=clinical_input_dim, embed_dim=clinical_embed_dim)
        self.fusion_head = nn.Sequential(
            nn.Linear(1024 + clinical_embed_dim, 256), nn.ReLU(inplace=True),
            nn.Dropout(0.3), nn.Linear(256, num_classes)         
        )
        self.temperature = nn.Parameter(torch.ones(1))

    def forward(self, image, clinical_data=None):
        img_embed = self.image_branch(image)                        
        clin_embed = self.clinical_branch(clinical_data) if clinical_data is not None else torch.zeros(image.size(0), 16, device=image.device)
        return self.fusion_head(torch.cat([img_embed, clin_embed], dim=1))

# ─── ARCHITECTURE 2: ResNet50 (Structural Specialist) ───────────
class ResNetBranch(nn.Module):
    def __init__(self):
        super().__init__()
        resnet = models.resnet50(weights="IMAGENET1K_V1")
        self.features = nn.Sequential(*list(resnet.children())[:-1]) 

    def forward(self, x):
        return self.features(x).flatten(1)      

class MediFlowResNetMultimodal(nn.Module):
    def __init__(self, num_classes=14, clinical_input_dim=15, clinical_embed_dim=16):
        super().__init__()
        self.image_branch = ResNetBranch()                       
        self.clinical_branch = ClinicalBranch(input_dim=clinical_input_dim, embed_dim=clinical_embed_dim)
        self.fusion_head = nn.Sequential(
            nn.Linear(2048 + clinical_embed_dim, 256), nn.ReLU(inplace=True),
            nn.Dropout(0.3), nn.Linear(256, num_classes)         
        )
        self.temperature = nn.Parameter(torch.ones(1))

    def forward(self, image, clinical_data=None):
        img_embed = self.image_branch(image)
        clin_embed = self.clinical_branch(clinical_data) if clinical_data is not None else torch.zeros(image.size(0), 16, device=image.device)
        return self.fusion_head(torch.cat([img_embed, clin_embed], dim=1))

# ─── Preprocessing ──────────────────────────────────────────────
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

def preprocess_clinical_input(clinical_dict):
    features = np.zeros(15, dtype=np.float32)
    features[0] = clinical_dict.get("age", 50) / 100.0
    features[1] = 1.0 if str(clinical_dict.get("sex", "")).upper() in ("M", "MALE") else 0.0
    features[2] = (clinical_dict.get("temperature", 37.0) - 36.0) / 4.0
    features[3] = (clinical_dict.get("o2_saturation", 97) - 80.0) / 20.0
    features[4] = (clinical_dict.get("heart_rate", 75) - 40.0) / 160.0

    symptom_keys = ["cough", "fever", "shortness_of_breath", "chest_pain", "fatigue", "wheezing", "night_sweats", "weight_loss", "hemoptysis", "sputum_production"]
    for i, key in enumerate(symptom_keys):
        features[5 + i] = 1.0 if clinical_dict.get(key, False) else 0.0

    return torch.tensor(features, dtype=torch.float32)

# ─── Risk Scoring ──────────────────────────────────────────────
def compute_risk_score(probs, thresholds):
    SEVERITY_WEIGHTS = {
        "No Finding": 0.0, "Pneumonia": 1.2, "Cardiomegaly": 0.9, "Pleural Effusion": 1.0,
        "Pneumothorax": 1.5, "Atelectasis": 0.7, "Consolidation": 1.1, "Lung Opacity": 0.6,
        "Nodule/Mass": 1.3, "Infiltration": 0.8, "Fibrosis": 0.7, "Pleural Thickening": 0.5,
        "Calcification": 0.4, "Other Lesion": 0.6,
    }
    weighted_score = 0.0
    active_findings = 0
    for i, disease in enumerate(DISEASE_CLASSES):
        prob = float(probs[i]) 
        weight = float(SEVERITY_WEIGHTS.get(disease, 0.5))
        thresh = float(thresholds[i]) if isinstance(thresholds, (list, tuple)) else 0.5
        if prob >= thresh:
            weighted_score += prob * weight
            active_findings += 1
    
    if active_findings == 0: risk = 1.0
    else:
        raw = float(weighted_score) / max(int(active_findings), 1)
        risk = float(min(10.0, max(1.0, round(raw * 10.0, 1))))
    
    if risk >= 8: level, interpretation, urgency = "Critical", "Immediate physician review required", "STAT"
    elif risk >= 6: level, interpretation, urgency = "High", "Physician review recommended within 1 hour", "Urgent"
    elif risk >= 4: level, interpretation, urgency = "Moderate", "Physician review recommended within 4 hours", "Semi-Urgent"
    elif risk >= 2.5: level, interpretation, urgency = "Low", "Standard workflow, review within 24 hours", "Routine"
    else: level, interpretation, urgency = "Minimal", "No abnormalities flagged — routine evaluation", "Non-Urgent"
    
    return {"value": float(risk), "level": level, "scale": "1-10", "interpretation": interpretation, "urgency": urgency, "active_findings": int(active_findings)}

# ─── Model Loading ──────────────────────────────────────────────
def load_ensemble_models(densenet_path="mediflow_production_v1.pth", resnet_path="mediflow_resnet_production.pth"):
    if torch.backends.mps.is_available(): device = torch.device("mps"); print("⚡ Apple Silicon MPS acceleration")
    else: device = torch.device("cpu"); print("🖥 CPU inference mode")

    print("🧠 Loading Model 1: DenseNet121...")
    densenet = MediFlowMultimodal()
    ckpt_d = torch.load(densenet_path, map_location=device, weights_only=False)
    if isinstance(ckpt_d, dict) and "model_state_dict" in ckpt_d:
        densenet.load_state_dict(ckpt_d["model_state_dict"])
        d_thresh = ckpt_d.get("optimal_thresholds", [0.5]*14)
    else:
        densenet.load_state_dict(ckpt_d)
        d_thresh = [0.5]*14
    densenet.to(device).eval()

    print("🧠 Loading Model 2: ResNet50...")
    resnet = MediFlowResNetMultimodal()
    ckpt_r = torch.load(resnet_path, map_location=device, weights_only=False)
    resnet.load_state_dict(ckpt_r["model_state_dict"])
    resnet.to(device).eval()
    r_thresh = ckpt_r.get("optimal_thresholds", [0.5]*14)

    ensemble_thresholds = [(d + r) / 2.0 for d, r in zip(d_thresh, r_thresh)]
    print("✅ Ensemble Engine Armed & Ready!")
    return densenet, resnet, device, ensemble_thresholds

# ─── Inference Pipeline ─────────────────────────────────────────
def predict_multimodal(image_bytes, clinical_data, densenet, resnet, device, ensemble_thresholds):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_tensor = transform(image).unsqueeze(0).to(device)
        clinical_data_safe = clinical_data or {}
        clinical_tensor = preprocess_clinical_input(clinical_data_safe).unsqueeze(0).to(device)

        # 🟢 1. RUN DENSENET (Texture Specialist)
        activations, gradients = None, None
        def forward_hook(module, input, output): nonlocal activations; activations = output
        def backward_hook(module, grad_input, grad_output): nonlocal gradients; gradients = grad_output[0]

        target_layer = densenet.image_branch.features
        h1 = target_layer.register_forward_hook(forward_hook)
        h2 = target_layer.register_full_backward_hook(backward_hook)

        densenet.eval()
        densenet.zero_grad()
        
        with torch.set_grad_enabled(True):
            image_tensor.requires_grad = True
            logits_d = densenet(image_tensor, clinical_tensor)
            probs_d = torch.sigmoid(logits_d / densenet.temperature).cpu().detach().numpy()[0]
            
            d_top_idx = np.argmax(probs_d[1:]) + 1 
            d_top_disease = DISEASE_CLASSES[d_top_idx]
            d_top_conf = float(probs_d[d_top_idx])
            
            target_score = logits_d[0, d_top_idx]
            target_score.backward()

        # 🟢 2. RUN RESNET (Structural Specialist)
        resnet.eval()
        with torch.no_grad():
            logits_r = resnet(image_tensor, clinical_tensor)
            probs_r = torch.sigmoid(logits_r / resnet.temperature).cpu().numpy()[0]
            
            r_top_idx = np.argmax(probs_r[1:]) + 1
            r_top_disease = DISEASE_CLASSES[r_top_idx]
            r_top_conf = float(probs_r[r_top_idx])

        # 🟢 3. RUN GEMINI (Clinical Synthesizer) - NEW SDK
        symptoms = [k.replace('_', ' ') for k, v in clinical_data_safe.items() if v is True and k not in ['age', 'sex', 'temperature', 'o2_saturation', 'heart_rate']]
        symptom_text = ", ".join(symptoms) if symptoms else "None reported"
        
        prompt = f"""You are an expert radiologist AI panelist. 
        Analyze this chest X-ray alongside the following patient clinical vitals:
        - Age: {clinical_data_safe.get('age', 'Unknown')}
        - Sex: {clinical_data_safe.get('sex', 'Unknown')}
        - Temperature: {clinical_data_safe.get('temperature', 'Unknown')}°C
        - SpO2: {clinical_data_safe.get('o2_saturation', 'Unknown')}%
        - Heart Rate: {clinical_data_safe.get('heart_rate', 'Unknown')} bpm
        - Presenting Symptoms: {symptom_text}
        
        Provide a highly concise, 2-3 sentence clinical interpretation and triage recommendation based strictly on the visual evidence in the X-ray and the vitals provided. Do not use formatting like bolding or bullet points. Act as a medical professional."""
        
        try:
            if client:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[prompt, image]
                )
                gemini_analysis = response.text.strip()
            else:
                gemini_analysis = "Vision LLM currently unavailable. API key missing."
        except Exception as e:
            gemini_analysis = "Vision LLM currently unavailable. Please rely on local model consensus."
            print(f"Gemini API Error: {e}")

        # 🟢 4. ENSEMBLE AVERAGING & HEATMAP
        ensemble_probs = (probs_d + probs_r) / 2.0

        pooled_gradients = torch.mean(gradients, dim=[0, 2, 3])
        for i in range(activations.shape[1]): activations[:, i, :, :] *= pooled_gradients[i]
        heatmap = torch.mean(activations, dim=1).squeeze()
        heatmap = F.relu(heatmap)
        heatmap_max = torch.max(heatmap)
        if heatmap_max > 0: heatmap /= heatmap_max
        heatmap = heatmap.cpu().detach().numpy()
        h1.remove(); h2.remove()

        heatmap_resized = cv2.resize(heatmap, (224, 224))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)
        heatmap_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        
        orig_img = np.array(image.resize((224, 224)))
        if orig_img.shape[-1] == 4: orig_img = orig_img[..., :3]
        orig_img_bgr = cv2.cvtColor(orig_img, cv2.COLOR_RGB2BGR)
            
        superimposed_img = cv2.addWeighted(heatmap_color, 0.4, orig_img_bgr, 0.6, 0)
        _, buffer = cv2.imencode('.jpg', superimposed_img)
        heatmap_data_uri = f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

        # 🟢 5. FINAL PAYLOAD CONSTRUCTION
        high_priority = []
        secondary = []
        no_finding_prob = float(ensemble_probs[0])
        SENSITIVITY = 0.85 
        
        for i in range(1, 14):
            disease = DISEASE_CLASSES[i]
            prob = float(ensemble_probs[i])
            thresh = float(ensemble_thresholds[i]) * SENSITIVITY
            
            if prob >= thresh:
                high_priority.append({"disease": disease, "confidence": prob, "severity": "high"})
            elif prob >= (thresh * 0.75):
                secondary.append({"disease": disease, "confidence": prob, "severity": "low"})

        high_priority = sorted(high_priority, key=lambda x: x["confidence"], reverse=True)
        secondary = sorted(secondary, key=lambda x: x["confidence"], reverse=True)

        overall_status = "Review Recommended" if len(high_priority) > 0 else "Normal Evaluation"
        primary_flag = high_priority[0]["disease"] if len(high_priority) > 0 else "No Finding"
        flag_confidence = high_priority[0]["confidence"] if len(high_priority) > 0 else no_finding_prob

        return {
            "success": True,
            "overall_status": overall_status,
            "primary_flag": primary_flag,
            "flag_confidence": float(flag_confidence),
            "high_priority_findings": high_priority,
            "secondary_anomalies": secondary,
            "evaluated_negative": [],
            "risk_score": compute_risk_score(ensemble_probs, ensemble_thresholds),
            "clinical_suggestion": "See Consensus Panel for detailed AI analysis.",
            "heatmap_image": heatmap_data_uri, 
            "heatmap_target": DISEASE_CLASSES[d_top_idx],
            "consensus_panel": {
                "densenet": {
                    "primary_finding": d_top_disease,
                    "confidence": d_top_conf,
                    "specialty": "Texture Analysis"
                },
                "resnet": {
                    "primary_finding": r_top_disease,
                    "confidence": r_top_conf,
                    "specialty": "Structural Analysis"
                },
                "gemini_clinical_synthesis": gemini_analysis
            }
        }
    except Exception as e:
        import traceback
        print(f"Inference Error: {traceback.format_exc()}")
        raise ValueError(f"Failed to process multimodal request: {str(e)}")