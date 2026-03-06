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
# ─── Constants ──────────────────────────────────────────────────

DISEASE_CLASSES = [
    "No Finding",           # 0 - Normal
    "Pneumonia",            # 1
    "Cardiomegaly",         # 2 - Enlarged heart
    "Pleural Effusion",     # 3 - Fluid around lungs
    "Pneumothorax",         # 4 - Collapsed lung
    "Atelectasis",          # 5 - Partial lung collapse
    "Consolidation",        # 6 - Lung filled with fluid
    "Lung Opacity",         # 7 - General opacity
    "Nodule/Mass",          # 8 - Suspicious mass
    "Infiltration",         # 9 - Substance in lungs
    "Fibrosis",             # 10 - Lung scarring
    "Pleural Thickening",   # 11 - Thickened pleura
    "Calcification",        # 12 - Calcium deposits
    "Other Lesion"          # 13 - Misc findings
]

CLINICAL_FEATURES = [
    "age", "sex", "temperature", "o2_saturation", "heart_rate",
    "cough", "fever", "shortness_of_breath", "chest_pain", "fatigue",
    "wheezing", "night_sweats", "weight_loss", "hemoptysis", "sputum_production"
]

SEVERITY_WEIGHTS = {
    "No Finding": 0.0, "Pneumonia": 1.2, "Cardiomegaly": 0.9,
    "Pleural Effusion": 1.0, "Pneumothorax": 1.5, "Atelectasis": 0.7,
    "Consolidation": 1.1, "Lung Opacity": 0.6, "Nodule/Mass": 1.3,
    "Infiltration": 0.8, "Fibrosis": 0.7, "Pleural Thickening": 0.5,
    "Calcification": 0.4, "Other Lesion": 0.6,
}


# ─── Model Architecture ────────────────────────────────────────

class ImageBranch(nn.Module):
    """DenseNet-121 backbone as a 1024-d feature extractor."""

    def __init__(self):
        super().__init__()
        densenet = models.densenet121(weights="IMAGENET1K_V1")
        self.features = densenet.features       # All conv layers
        self.pool = nn.AdaptiveAvgPool2d(1)     # Global average pool → 1024

    def forward(self, x):
        feat = self.features(x)     # (B, 1024, 7, 7)
        feat = self.pool(feat)      # (B, 1024, 1, 1)
        feat = feat.flatten(1)      # (B, 1024)
        return feat


class ClinicalBranch(nn.Module):
    """
    Lightweight MLP for clinical metadata → 16-d embedding.
    Uses LayerNorm (safe at batch_size=1) and input dropout
    to prevent over-reliance on synthetic clinical features.
    """

    def __init__(self, input_dim=15, embed_dim=16, dropout_rate=0.2):
        super().__init__()
        self.input_dropout = nn.Dropout(p=0.15)  # FIX #6: Zero out clinical data 15% during training
        self.mlp = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.LayerNorm(32),                     # FIX #2: LayerNorm instead of BatchNorm1d
            nn.ReLU(inplace=True),
            nn.Dropout(dropout_rate),
            nn.Linear(32, embed_dim),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        x = self.input_dropout(x)  # Forces the fusion head to rely on the image branch too
        return self.mlp(x)


class MediFlowMultimodal(nn.Module):
    """
    Multimodal Clinical Risk Stratification Model.
    Fuses DenseNet-121 image features (1024-d) with clinical MLP (16-d)
    for 14-class per-pathology risk scoring.
    """

    def __init__(self, num_classes=14, clinical_input_dim=15, clinical_embed_dim=16):
        super().__init__()

        # Branches
        self.image_branch = ImageBranch()                       # → 1024-d
        self.clinical_branch = ClinicalBranch(                  # → 16-d
            input_dim=clinical_input_dim,
            embed_dim=clinical_embed_dim
        )

        # Fusion head: concatenate embeddings → classify
        fusion_dim = 1024 + clinical_embed_dim  # 1040
        self.fusion_head = nn.Sequential(
            nn.Linear(fusion_dim, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)         # Raw logits → sigmoid at inference
        )

        # Temperature parameter for post-training calibration
        self.temperature = nn.Parameter(torch.ones(1))

    def forward(self, image, clinical_data=None):
        img_embed = self.image_branch(image)                        # (B, 1024)

        if clinical_data is not None:
            clin_embed = self.clinical_branch(clinical_data)        # (B, 16)
        else:
            # Image-only fallback: zero-fill clinical embedding
            clin_embed = torch.zeros(image.size(0), 16, device=image.device)

        fused = torch.cat([img_embed, clin_embed], dim=1)          # (B, 1040)
        logits = self.fusion_head(fused)                            # (B, 14)
        return logits

    def predict_calibrated(self, image, clinical_data=None):
        """Inference with temperature-scaled calibration."""
        logits = self.forward(image, clinical_data)
        calibrated_logits = logits / self.temperature
        return torch.sigmoid(calibrated_logits)


# ─── Preprocessing ──────────────────────────────────────────────

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])


def preprocess_clinical_input(clinical_dict):
    """
    Convert a clinical data dictionary into a normalized 15-d tensor.
    Handles missing values with safe defaults (healthy baselines).
    """
    features = np.zeros(15, dtype=np.float32)

    # Vitals (normalized)
    features[0] = clinical_dict.get("age", 50) / 100.0
    features[1] = 1.0 if str(clinical_dict.get("sex", "")).upper() in ("M", "MALE") else 0.0
    features[2] = (clinical_dict.get("temperature", 37.0) - 36.0) / 4.0
    features[3] = (clinical_dict.get("o2_saturation", 97) - 80.0) / 20.0
    features[4] = (clinical_dict.get("heart_rate", 75) - 40.0) / 160.0

    # Symptom indicators (binary)
    symptom_keys = [
        "cough", "fever", "shortness_of_breath", "chest_pain", "fatigue",
        "wheezing", "night_sweats", "weight_loss", "hemoptysis", "sputum_production"
    ]
    for i, key in enumerate(symptom_keys):
        features[5 + i] = 1.0 if clinical_dict.get(key, False) else 0.0

    return torch.tensor(features, dtype=torch.float32)


# ─── Utility Functions ──────────────────────────────────────────

def get_severity(confidence):
    """Map confidence score to clinical severity label."""
    if confidence >= 0.8:
        return "high"
    elif confidence >= 0.6:
        return "moderate"
    return "low"


def compute_risk_score(probs, thresholds):
    """
    Compute a composite clinical risk score (1-10) from per-pathology probabilities.
    """
    DISEASE_CLASSES = [
        "No Finding", "Pneumonia", "Cardiomegaly", "Pleural Effusion",
        "Pneumothorax", "Atelectasis", "Consolidation", "Lung Opacity",
        "Nodule/Mass", "Infiltration", "Fibrosis", "Pleural Thickening",
        "Calcification", "Other Lesion"
    ]

    SEVERITY_WEIGHTS = {
        "No Finding":         0.0,
        "Pneumonia":          1.2,
        "Cardiomegaly":       0.9,
        "Pleural Effusion":   1.0,
        "Pneumothorax":       1.5,   
        "Atelectasis":        0.7,
        "Consolidation":      1.1,
        "Lung Opacity":       0.6,
        "Nodule/Mass":        1.3,   
        "Infiltration":       0.8,
        "Fibrosis":           0.7,
        "Pleural Thickening": 0.5,
        "Calcification":      0.4,
        "Other Lesion":       0.6,
    }
    
    # 🟢 Initialize variables (This is what was missing!)
    weighted_score = 0.0
    active_findings = 0
    
    for i, disease in enumerate(DISEASE_CLASSES):
        prob = float(probs[i]) # 🟢 Cast to native float
        weight = float(SEVERITY_WEIGHTS.get(disease, 0.5))
        
        # Safely handle thresholds whether it's a list or single number
        thresh = float(thresholds[i]) if isinstance(thresholds, (list, tuple)) else 0.5
        
        if prob >= thresh:
            weighted_score += prob * weight
            active_findings += 1
    
    # Normalize to 1-10 scale
    if active_findings == 0:
        risk = 1.0
    else:
        raw = float(weighted_score) / max(int(active_findings), 1)
        risk = float(min(10.0, max(1.0, round(raw * 10.0, 1))))
    
    # Clinical interpretation
    if risk >= 8:
        level = "Critical"
        interpretation = "Immediate physician review required"
        urgency = "STAT"
    elif risk >= 6:
        level = "High"
        interpretation = "Physician review recommended within 1 hour"
        urgency = "Urgent"
    elif risk >= 4:
        level = "Moderate"
        interpretation = "Physician review recommended within 4 hours"
        urgency = "Semi-Urgent"
    elif risk >= 2.5:
        level = "Low"
        interpretation = "Standard workflow, review within 24 hours"
        urgency = "Routine"
    else:
        level = "Minimal"
        interpretation = "No abnormalities flagged — routine evaluation"
        urgency = "Non-Urgent"
    
    return {
        "value": float(risk),
        "level": level,
        "scale": "1-10",
        "interpretation": interpretation,
        "urgency": urgency,
        "active_findings": int(active_findings)
    }


def generate_suggestion(findings, risk_score):
    """Generate clinical suggestion text based on top finding."""
    if not findings:
        return "No significant abnormalities detected. Routine follow-up recommended."

    top = findings[0]["disease"]
    suggestions = {
        "Pneumonia": "Consider chest CT and sputum culture. Start empiric antibiotics if clinical presentation supports.",
        "Cardiomegaly": "Recommend echocardiogram for cardiac function assessment. Check BNP levels.",
        "Pleural Effusion": "Consider thoracentesis if clinically significant. Evaluate for underlying cause.",
        "Pneumothorax": "URGENT: Evaluate for chest tube placement. Repeat imaging to assess progression.",
        "Nodule/Mass": "Recommend CT chest with contrast for further characterization. Consider biopsy if >8mm.",
        "Consolidation": "Correlate with clinical presentation. Consider CT if no response to antibiotics.",
        "Atelectasis": "Encourage deep breathing exercises. Consider bronchoscopy if persistent.",
        "Infiltration": "Correlate with clinical presentation. May indicate infection or inflammation.",
        "Fibrosis": "Consider pulmonary function tests. Recommend pulmonology consultation.",
    }

    return suggestions.get(top, f"Abnormality detected ({top}). Recommend specialist consultation.")


# ─── Model Loading ──────────────────────────────────────────────

def load_multimodal_model(model_path="dummy_model.pth"):
    """
    Load the multimodal model on MacBook (MPS or CPU).
    Works with both dummy (untrained) and trained checkpoints.
    """
    if torch.backends.mps.is_available():
        device = torch.device("mps")
        print("⚡ Apple Silicon MPS acceleration")
    else:
        device = torch.device("cpu")
        print("🖥 CPU inference mode")

    checkpoint = torch.load(model_path, map_location=device, weights_only=False)

    # Build model from checkpoint metadata
    num_classes = checkpoint.get("num_classes", 14) if isinstance(checkpoint, dict) else 14
    clinical_dim = checkpoint.get("clinical_input_dim", 15) if isinstance(checkpoint, dict) else 15
    clinical_embed = checkpoint.get("clinical_embed_dim", 16) if isinstance(checkpoint, dict) else 16

    model = MediFlowMultimodal(
        num_classes=num_classes,
        clinical_input_dim=clinical_dim,
        clinical_embed_dim=clinical_embed
    )

    # Load weights
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
        thresholds = checkpoint.get("optimal_thresholds", [0.5] * num_classes)
        temp = checkpoint.get("temperature", 1.0)
        model.temperature.data = torch.tensor([temp])
    else:
        model.load_state_dict(checkpoint)
        thresholds = [0.5] * num_classes

    model.to(device)
    model.eval()

    # Log model info
    arch = checkpoint.get("architecture", "MediFlow-Multimodal-v4") if isinstance(checkpoint, dict) else "unknown"
    auroc = checkpoint.get("best_auroc", "untrained") if isinstance(checkpoint, dict) else "unknown"
    print(f"✅ Loaded: {arch}")
    print(f"📊 Validation AUROC: {auroc}")

    return model, device, thresholds


# ─── Inference Pipeline ─────────────────────────────────────────
def predict_multimodal(image_bytes, clinical_data, model, device, thresholds=None):
    """
    Full multimodal inference pipeline with Grad-CAM Explainability.
    Returns structured triage JSON and a Base64 encoded heatmap.
    """
    if thresholds is None:
        thresholds = [0.5] * 14

    try:
        # Preprocess image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_tensor = transform(image).unsqueeze(0).to(device)

        # Preprocess clinical data
        clinical_tensor = preprocess_clinical_input(clinical_data or {}).unsqueeze(0).to(device)

        # 🟢 1. SET UP GRAD-CAM HOOKS
        activations = None
        gradients = None

        def forward_hook(module, input, output):
            nonlocal activations
            activations = output

        def backward_hook(module, grad_input, grad_output):
            nonlocal gradients
            gradients = grad_output[0]

        # Attach hooks to the final convolutional block of DenseNet
        target_layer = model.image_branch.features
        h1 = target_layer.register_forward_hook(forward_hook)
        h2 = target_layer.register_full_backward_hook(backward_hook)

        # 🟢 2. FORWARD PASS (Must enable gradients for Grad-CAM!)
        model.eval()
        model.zero_grad()
        
        # We temporarily enable gradients even in eval mode
        with torch.set_grad_enabled(True):
            image_tensor.requires_grad = True
            logits = model(image_tensor, clinical_tensor)
            
            # Calibrate and get probabilities
            calibrated_logits = logits / model.temperature
            probs = torch.sigmoid(calibrated_logits).cpu().detach().numpy()[0]

            # Find the highest predicted ACTUAL disease (indices 1-13)
            # We skip "No Finding" (index 0) because calculating a heatmap for "nothing" is just noise.
            disease_probs = probs[1:]
            target_class_idx = np.argmax(disease_probs) + 1 
            
            # 🟢 3. BACKWARD PASS (Trigger the gradients)
            target_score = logits[0, target_class_idx]
            target_score.backward()

        # 🟢 4. GENERATE HEATMAP
        # Pool the gradients across spatial dimensions
        pooled_gradients = torch.mean(gradients, dim=[0, 2, 3])
        
        # Weight the activations by the gradients
        for i in range(activations.shape[1]):
            activations[:, i, :, :] *= pooled_gradients[i]
            
        # Average the channels and apply ReLU to only keep features that have a positive influence
        heatmap = torch.mean(activations, dim=1).squeeze()
        heatmap = F.relu(heatmap)
        
        # Normalize the heatmap between 0 and 1
        heatmap_max = torch.max(heatmap)
        if heatmap_max > 0:
            heatmap /= heatmap_max
            
        heatmap = heatmap.cpu().detach().numpy()

        # Remove the hooks to prevent memory leaks
        h1.remove()
        h2.remove()

        # 🟢 5. BLEND WITH ORIGINAL IMAGE USING OPENCV
        # Resize heatmap to match the 224x224 image
        heatmap_resized = cv2.resize(heatmap, (224, 224))
        heatmap_uint8 = np.uint8(255 * heatmap_resized)
        
        # Apply the JET colormap (Red = High Activation, Blue = Low)
        heatmap_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        
        # Prepare the original image
        orig_img = np.array(image.resize((224, 224)))
        if orig_img.shape[-1] == 4: # Handle PNG RGBA
            orig_img = orig_img[..., :3]
            
        # Convert RGB to BGR for OpenCV blending
        orig_img_bgr = cv2.cvtColor(orig_img, cv2.COLOR_RGB2BGR)
            
        # Blend: 40% Heatmap, 60% Original Image
        superimposed_img = cv2.addWeighted(heatmap_color, 0.4, orig_img_bgr, 0.6, 0)
        
        # Encode back to JPEG -> Base64 string
        _, buffer = cv2.imencode('.jpg', superimposed_img)
        heatmap_base64 = base64.b64encode(buffer).decode('utf-8')
        heatmap_data_uri = f"data:image/jpeg;base64,{heatmap_base64}"


        # 🟢 6. BUILD THE CLINICAL RESPONSE (Same logic as before)
        DISEASE_CLASSES_LOCAL = [
            "No Finding", "Pneumonia", "Cardiomegaly", "Pleural Effusion",
            "Pneumothorax", "Atelectasis", "Consolidation", "Lung Opacity",
            "Nodule/Mass", "Infiltration", "Fibrosis", "Pleural Thickening",
            "Calcification", "Other Lesion"
        ]

        high_priority = []
        secondary = []
        no_finding_prob = float(probs[0])
        
        for i in range(1, 14):
            disease = DISEASE_CLASSES_LOCAL[i]
            prob = float(probs[i])
            thresh = float(thresholds[i]) if isinstance(thresholds, (list, tuple)) else 0.5
            
            if prob >= thresh:
                high_priority.append({"disease": disease, "confidence": prob, "severity": "high"})
            elif prob >= (thresh * 0.75):
                secondary.append({"disease": disease, "confidence": prob, "severity": "low"})

        high_priority = sorted(high_priority, key=lambda x: x["confidence"], reverse=True)
        secondary = sorted(secondary, key=lambda x: x["confidence"], reverse=True)

        if len(high_priority) > 0:
            overall_status = "Review Recommended"
            primary_flag = high_priority[0]["disease"]
            flag_confidence = high_priority[0]["confidence"]
            clinical_suggestion = f"Abnormality detected ({primary_flag}). Recommend specialist consultation and appropriate imaging follow-up."
        else:
            overall_status = "Normal Evaluation"
            primary_flag = "No Finding"
            flag_confidence = no_finding_prob
            clinical_suggestion = "No acute cardiopulmonary abnormalities detected. Routine care recommended."

        risk_score = compute_risk_score(probs, thresholds)

        return {
            "success": True,
            "primary_flag": primary_flag,
            "flag_confidence": float(flag_confidence),
            "high_priority_findings": high_priority,
            "secondary_anomalies": secondary,
            "evaluated_negative": [],
            "risk_score": risk_score,
            "overall_status": overall_status,
            "clinical_suggestion": clinical_suggestion,
            "heatmap_image": heatmap_data_uri,  # 🟢 NEW: Return the Base64 image!
            "heatmap_target": DISEASE_CLASSES_LOCAL[target_class_idx], # Tell the UI what the heatmap represents
            "model_info": {
                "name": "MediFlow-Multimodal-v4",
                "architecture": "DenseNet121 + ClinicalMLP Fusion",
                "mode": "Triage Assist + Grad-CAM"
            }
        }
        
    except Exception as e:
        import traceback
        print(f"Inference Error: {traceback.format_exc()}")
        raise ValueError(f"Failed to process multimodal request: {str(e)}")

# ─── Dummy Model Generator ─────────────────────────────────────

def generate_dummy_model(save_path="dummy_model.pth"):
    """
    Generate an untrained multimodal model for Day 1 pipeline testing.
    Run this script directly: python predict_multimodal.py
    """
    import os

    print("🏗  Building MediFlowMultimodal architecture...")
    model = MediFlowMultimodal(num_classes=14)

    # Verify forward pass with dummy tensors
    dummy_img = torch.randn(1, 3, 224, 224)
    dummy_clin = torch.randn(1, 15)

    model.eval()
    with torch.no_grad():
        output = model(dummy_img, dummy_clin)

    print(f"✅ Forward pass OK → output shape: {output.shape}")
    print(f"   Raw logits sample: {output[0][:5].tolist()}")

    # Also verify calibrated output
    with torch.no_grad():
        probs = model.predict_calibrated(dummy_img, dummy_clin)
    print(f"   Sigmoid probs sample: {probs[0][:5].tolist()}")

    # Also verify image-only fallback
    with torch.no_grad():
        fallback_output = model(dummy_img, None)
    print(f"✅ Image-only fallback OK → shape: {fallback_output.shape}")

    # Save checkpoint
    checkpoint = {
        "model_state_dict": model.state_dict(),
        "architecture": "MediFlow-Multimodal-v4",
        "num_classes": 14,
        "clinical_input_dim": 15,
        "clinical_embed_dim": 16,
        "disease_classes": DISEASE_CLASSES,
        "clinical_features": CLINICAL_FEATURES,
        "optimal_thresholds": [0.5] * 14,
        "temperature": 1.0,
        "best_auroc": "untrained",
        "training_status": "dummy — random weights"
    }

    torch.save(checkpoint, save_path)
    size_mb = os.path.getsize(save_path) / 1e6
    print(f"📦 Dummy model saved: {save_path} ({size_mb:.1f} MB)")
    print("🚀 Ready for full-stack pipeline testing!")


if __name__ == "__main__":
    generate_dummy_model()
