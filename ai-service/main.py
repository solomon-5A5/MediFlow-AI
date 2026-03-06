from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os

# 🟢 Import from the NEW multimodal module
from predict_multimodal import load_multimodal_model, predict_multimodal

app = FastAPI(title="MediFlow Vision AI", version="4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🟢 LOAD MULTIMODAL MODEL GLOBALLY ON STARTUP
print("🧠 Initializing Multimodal Vision Core...")
# Use absolute path to model file (same directory as this script)
model_path = os.path.join(os.path.dirname(__file__), "mediflow_production_v1.pth")
model, device, thresholds = load_multimodal_model(model_path)
print("✅ Multimodal Vision Core Ready!")


@app.post("/api/vision/analyze")
async def analyze_xray(
    file: UploadFile = File(...),
    clinical_data: str = Form("{}")  # 🟢 Accept clinical data as stringified JSON form field
):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported.")

    # Parse clinical JSON (gracefully default to empty dict)
    try:
        clinical_dict = json.loads(clinical_data)
    except json.JSONDecodeError:
        clinical_dict = {}

    image_bytes = await file.read()

    # 🟢 Pass BOTH image and clinical data to the multimodal pipeline
    result = predict_multimodal(
        image_bytes=image_bytes,
        clinical_data=clinical_dict,
        model=model,
        device=device,
        thresholds=thresholds
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Unknown AI Error"))

    return result