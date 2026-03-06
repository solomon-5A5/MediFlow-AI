import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import json
import io

# Disease classes (adjust based on your actual training)
DISEASE_CLASSES = [
    "No Finding",           # 0 - Normal
    "Pneumonia",            # 1 - From your existing + VinDr
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

class MediFlowDenseNet(nn.Module):
    def __init__(self, num_classes=14, pretrained=True, simple_classifier=False):
        super().__init__()
        
        # Load pretrained DenseNet-121
        self.densenet = models.densenet121(pretrained=pretrained)
        
        # Replace classifier for multi-label
        num_features = self.densenet.classifier.in_features  # 1024
        
        if simple_classifier:
            # Simple direct classifier (matches your trained model)
            self.densenet.classifier = nn.Linear(num_features, num_classes)
        else:
            # Multi-layer classifier
            self.densenet.classifier = nn.Sequential(
                nn.Linear(num_features, 512),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(512, num_classes)
            )
    
    def forward(self, x):
        return self.densenet(x)

# Preprocessing transforms
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Load model
def load_multilabel_model(model_path="vindr_epoch3.pth"):
    """Load the trained multi-disease model"""
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    
    # Load the checkpoint first to check its structure
    checkpoint = torch.load(model_path, map_location=device)
    
    # Handle different checkpoint formats
    if 'model_state_dict' in checkpoint:
        state_dict = checkpoint['model_state_dict']
    else:
        state_dict = checkpoint
    
    # Check if this is a simple classifier (direct output) or complex
    has_simple_classifier = False
    if 'classifier.weight' in state_dict:
        classifier_shape = state_dict['classifier.weight'].shape
        # If classifier outputs directly to num_classes, it's simple
        if classifier_shape[0] == len(DISEASE_CLASSES):  # 14 classes
            has_simple_classifier = True
    
    # Create model with appropriate architecture
    model = MediFlowDenseNet(num_classes=len(DISEASE_CLASSES), simple_classifier=has_simple_classifier)
    
    # Check if state_dict keys match our model structure
    model_keys = set(model.state_dict().keys())
    checkpoint_keys = set(state_dict.keys())
    
    # If there's a mismatch, try to map the keys
    if not checkpoint_keys.issubset(model_keys):
        print("🔧 Mapping state dict keys...")
        new_state_dict = {}
        
        for key, value in state_dict.items():
            # Map keys from standard DenseNet to our wrapped version
            if key.startswith('features.') or key.startswith('classifier'):
                new_key = f'densenet.{key}'
                new_state_dict[new_key] = value
            else:
                new_state_dict[key] = value
        
        state_dict = new_state_dict
    
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    
    print(f"✅ Loaded multi-disease model from {model_path}")
    print(f"📊 Architecture: {'Simple' if has_simple_classifier else 'Complex'} classifier")
    return model, device

def get_severity(confidence):
    """Convert confidence score to severity level"""
    if confidence >= 0.8:
        return "high"
    elif confidence >= 0.6:
        return "moderate"
    else:
        return "low"

def predict_multilabel(image_bytes, model, device, threshold=0.05):
    """
    Predict multiple diseases from chest X-ray bytes and structure for triage.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        image_tensor = transform(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            logits = model(image_tensor)
            probs = torch.sigmoid(logits)  
        
        probs_np = probs.cpu().numpy()[0] 
        
        # 🟢 NEW: Categorize findings into Clinical Tiers
        high_confidence_findings = []
        low_confidence_findings = []
        ruled_out = []

        for i, prob in enumerate(probs_np):
            finding_data = {
                "disease": DISEASE_CLASSES[i],
                "confidence": round(float(prob), 3),
            }
            
            if prob >= 0.50:  # Threshold for clinical flagging
                finding_data["severity"] = get_severity(float(prob))
                high_confidence_findings.append(finding_data)
            elif prob >= 0.15:  # Potential anomalies
                finding_data["severity"] = "low"
                low_confidence_findings.append(finding_data)
            else:  # Below 15%, statistically insignificant
                ruled_out.append(finding_data)

        # Sort arrays by confidence
        high_confidence_findings.sort(key=lambda x: x["confidence"], reverse=True)
        low_confidence_findings.sort(key=lambda x: x["confidence"], reverse=True)
        
        # 🟢 NEW: Triage-Focused Data Structure
        return {
            "success": True,
            # We change the terminology here from 'prediction' to 'primary_flag'
            "primary_flag": high_confidence_findings[0]["disease"] if high_confidence_findings else "No Primary Abnormalities Flagged",
            "flag_confidence": high_confidence_findings[0]["confidence"] if high_confidence_findings else 0,
            
            # Grouped results for nuanced display
            "high_priority_findings": high_confidence_findings,
            "secondary_anomalies": low_confidence_findings,
            
            "overall_status": "Review Recommended" if high_confidence_findings else "Normal Evaluation",
            
            "model_info": {
                "name": "MediFlow-DenseNet121-v2",
                "architecture": "Multi-Label Sigmoid",
                "mode": "Triage Assist"
            }
        }
        
    except Exception as e:
        import traceback
        print("Inference Error:", traceback.format_exc())
        return {
            "success": False,
            "error": str(e)
        }
    """Test the model with a sample image"""
    print("🧪 Testing Multi-Disease Model...")
    
    # Load model
    model, device = load_multilabel_model()
    
    # Run prediction
    results = predict_multilabel(image_path, model, device)
    
    # Display results
    if results["success"]:
        print(f"\n📊 Analysis Results for: {image_path}")
        print(f"Overall Status: {results['overall_status']}")
        print(f"Primary Diagnosis: {results['primary_diagnosis']}")
        print("\n🔍 Detailed Findings:")
        
        for finding in results["findings"]:
            print(f"  • {finding['disease']}: {finding['confidence']*100:.1f}% ({finding['severity']})")
    else:
        print(f"❌ Error: {results['error']}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        test_model(sys.argv[1])
    else:
        print("Usage: python predict_multilabel.py <image_path>")
        print("Example: python predict_multilabel.py test_xray.jpg")