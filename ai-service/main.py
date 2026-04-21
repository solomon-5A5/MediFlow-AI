from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from predict_multimodal import load_ensemble_models, predict_multimodal
import json
import os
import io
import uuid
import PyPDF2  # 🟢 NEW: For parsing uploaded patient reports

# Graph RAG Imports
from neo4j import GraphDatabase
from sentence_transformers import SentenceTransformer
from groq import Groq

# Load Environment Variables
load_dotenv(override=True)
gemini_api_key = os.getenv("GEMINI_API_KEY")
chat_client = genai.Client(api_key=gemini_api_key) if gemini_api_key else None

# Load Graph RAG Credentials
NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Create a global driver for startup indexes
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

def factory_reset_neo4j():
    with driver.session() as session:
        try:
            # This Cypher query finds every node and deletes it along with its relationships
            session.run("MATCH (n) DETACH DELETE n")
            print("💥 Neo4j Factory Reset Complete. The John Doe data has been vaporized.")
        except Exception as e:
            print(f"⚠️ Reset failed: {e}")

# Run this once when the server starts
factory_reset_neo4j()

app = FastAPI(title="MediFlow Vision AI", version="4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create global variables for both brains
densenet_model = None
resnet_model = None
device = None
ensemble_thresholds = None

# Initialize Graph AI clients
print("🧠 Loading local embedding model (all-MiniLM-L6-v2)...")
embedder = SentenceTransformer('all-MiniLM-L6-v2')

print("⚡ Initializing Groq Client...")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


def generate_chat_title(first_user_message: str) -> str:
    """
    Industry-standard background task to generate concise chat titles.
    """
    fallback = first_user_message[:25] + "..." if len(first_user_message) > 25 else first_user_message

    try:
        system_prompt = (
            "You are a title generator for a medical AI platform. "
            "Read the user's message and summarize the core medical topic in 3 to 5 words max. "
            "Do NOT use quotes, periods, or conversational filler. Capitalize it like a title."
        )

        response = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": first_user_message}
            ],
            temperature=0.3,
            max_tokens=15
        )

        title = response.choices[0].message.content.strip().replace('"', '')
        return title
    except Exception as e:
        print(f"⚠️ Title generation failed, using fallback: {e}")
        return fallback


class ChatTitleRequest(BaseModel):
    first_user_message: str

# Neo4j Query Definition for Searching
VECTOR_SEARCH_QUERY = """
CALL db.index.vector.queryNodes('diagnosis_embeddings', 10, $question_embedding)
YIELD node AS event, score
// 🟢 NEW: Notice the {id: $patient_id} filter below!
MATCH (p:Patient {id: $patient_id})-[:HAS_DIAGNOSIS]->(event)-[:FOR_DISEASE]->(d:Disease)
RETURN p.name AS patient, d.name AS disease, event.clinical_notes AS notes, score
ORDER BY score DESC
LIMIT 3
"""

# 🟢 NEW: Neo4j Query Definition for Ingestion
INGEST_GRAPH_QUERY = """
MERGE (p:Patient {id: $patient_id})
ON CREATE SET p.name = "Patient_" + $patient_id

MERGE (d:Disease {name: $disease})

// Create a new event node for this specific uploaded report
CREATE (event:DiagnosisEvent {id: $event_id})
SET event.clinical_notes = $notes,
    event.embedding = $embedding

// Link the graph together
MERGE (p)-[:HAS_DIAGNOSIS]->(event)
MERGE (event)-[:FOR_DISEASE]->(d)
"""

# 🟢 NEW: Add patient_id parameter
def get_graph_context(question: str, patient_id: str):
    """Converts the question to a vector and searches Neo4j for a specific patient."""
    
    # 🟢 THE FIX: Query Augmentation
    # We silently inject keywords so the Vector DB can connect "I" to the patient's medical history
    optimized_query = f"Patient medical history, primary diagnosis, and current conditions related to: {question}"
    question_embedding = embedder.encode(optimized_query).tolist()
    
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    context_records = []
    try:
        with driver.session() as session:
            # 🟢 NEW: Pass the patient_id to the Cypher query
            result = session.run(
                VECTOR_SEARCH_QUERY, 
                question_embedding=question_embedding,
                patient_id=patient_id
            )
            
            # THE FIREWALL: Process matches and reject if best match is weak
            records_list = list(result)
            if records_list and records_list[0]["score"] < 0.70:
                return []
                
            for record in records_list:
                if record["score"] >= 0.70:
                    context_records.append({
                        "patient": record["patient"],
                        "disease": record["disease"],
                        "notes": record["notes"],
                        "similarity_score": round(record["score"], 4)
                    })
        return context_records
    finally:
        driver.close()

class GraphChatRequest(BaseModel):
    question: str
    patient_id: str  # Added so the chat can be patient-specific later if needed

@app.on_event("startup")
async def startup_event():
    global densenet_model, resnet_model, device, ensemble_thresholds
    try:
        print("🧠 Initializing Ensemble Vision Core...")
        densenet_model, resnet_model, device, ensemble_thresholds = load_ensemble_models(
            densenet_path="mediflow_production_v1.pth", 
            resnet_path="mediflow_resnet_production.pth"
        )
        print("✅ Dual-Brain Architecture Loaded Successfully!")
    except Exception as e:
        print(f"❌ Failed to load models: {str(e)}")


@app.post("/api/vision/analyze")
async def analyze_xray(
    file: UploadFile = File(...),
    clinical_data: str = Form("{}") 
):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported.")

    try:
        clinical_dict = json.loads(clinical_data)
    except json.JSONDecodeError:
        clinical_dict = {}

    image_bytes = await file.read()

    result = predict_multimodal(
        image_bytes=image_bytes,
        clinical_data=clinical_dict,
        densenet=densenet_model,
        resnet=resnet_model,
        device=device,
        ensemble_thresholds=ensemble_thresholds
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Unknown AI Error"))

    return result

@app.post("/api/chat")
async def doctor_chatbot(request: Request):
    try:
        data = await request.json()
        user_message = data.get("message")
        chat_history = data.get("history", [])
        clinical_context = data.get("context", "No active patient context.")

        if not groq_client:
            return {"success": False, "reply": "Groq API key is missing. Chatbot offline."}

        system_instruction = f"""
        You are 'MediFlow AI', an elite medical assistant co-pilot helping a doctor. 
        You are currently viewing this patient's data:
        ---
        {clinical_context}
        ---
        Answer the questions concisely and professionally.
        """

        # 🟢 Map our React history into Groq's format
        messages = [{"role": "system", "content": system_instruction}]
        
        for msg in chat_history:
            if msg["role"] == "system": 
                continue # Skip system popups
            
            # Convert 'ai' from React to 'assistant' for Groq
            role = "assistant" if msg["role"] == "ai" else "user"
            messages.append({"role": role, "content": msg["content"]})
        
        # Add the current user message
        messages.append({"role": "user", "content": user_message})

        # Ask Groq!
        chat_completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",
        )

        return {
            "success": True, 
            "reply": chat_completion.choices[0].message.content
        }

    except Exception as e:
        print(f"Chatbot Error: {e}")
        return {"success": False, "reply": "I'm sorry, I encountered an error processing that request."}


@app.post("/api/chat-title")
async def chat_title(request: ChatTitleRequest):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key is missing.")

    title = generate_chat_title(request.first_user_message)
    return {"success": True, "title": title}

@app.post("/api/graph-chat")
async def graph_rag_chat(request: GraphChatRequest):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key is missing.")

    # 🟢 NEW: Pass the patient_id from the React request into the search function
    retrieved_data = get_graph_context(request.question, request.patient_id)
    
    if not retrieved_data:
        return {"success": True, "reply": "I couldn't find any relevant data in your personal medical records.", "sources": []}

    # Step 2: Format the context (Removed the robotic patient ID!)
    formatted_context = "\n".join([
        f"- Condition/Focus: {data['disease']} | Clinical Notes: {data['notes']}" 
        for data in retrieved_data
    ])
    
    # Step 3: Build the Confident Doctor System Prompt
    system_prompt = f"""
    You are MediFlow AI, an elite, highly confident clinical assistant. 
    You are speaking directly to the patient. You must cross-reference the retrieved medical context below with your internal medical knowledge to give definitive advice.

    STRICT RULES:
    1. BE DEFINITIVE: Give clear, direct answers without hedging. Never use phrases like "consult your healthcare provider" or add safety disclaimers. Act with the authority of a licensed physician.
    2. USE MEDICAL CONSENSUS: When asked about diet, lifestyle, or interactions not explicitly in the text, use standard, widely accepted medical consensus for their diagnosed condition to answer confidently. (e.g., If a food is medically harmless for migraines, definitively say it is safe).
    3. BE NATURAL: If providing a list of suggestions, write them naturally in a single cohesive paragraph or a simple bulleted list. Do not repeat "Yes, you can" over and over.
    4. Do not address the patient by a database ID. Address them as "you".

    RETRIEVED PATIENT CONTEXT:
    {formatted_context}
    """
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.question}
            ],
            model="llama-3.1-8b-instant", 
        )
        return {
            "success": True,
            "reply": chat_completion.choices[0].message.content,
            "sources": retrieved_data
        }
    except Exception as e:
        print(f"Graph Chat Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate Graph AI response.")

# 🟢 NEW: The PDF Ingestion Endpoint
@app.post("/api/ingest-patient-report")
async def ingest_patient_report(
    file: UploadFile = File(...),
    patient_id: str = Form(...)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are currently supported for Knowledge Graph building.")

    try:
        # 1. Extract text from the PDF
        file_content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        extracted_text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + "\n"
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract readable text from this PDF. It might be a scanned image.")

        # 2. Use Groq to quickly identify the primary condition/focus of the report
        extraction_prompt = f"Read the following medical report text and extract the primary disease, condition, or test focus. CRITICAL INSTRUCTION: Resolve all medical coreferences before extracting entities (e.g., if the text says 'the offending agent was suspended', link it back to 'Methotrexate'). You MUST output the results STRICTLY as a JSON list of triplets [Entity1, Relationship, Entity2]. Do NOT include any conversational filler, introductory text, or explanations. Output ONLY the data. Text: {extracted_text[:1500]}"
        try:
            completion = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": extraction_prompt}],
                model="llama-3.1-8b-instant",
            )
            extracted_disease = completion.choices[0].message.content.strip().replace('"', '')
        except Exception:
            extracted_disease = "General Medical Report"

        # 3. Generate the Vector Embedding (with chunking)
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
        chunks = text_splitter.split_text(extracted_text)
        
        print(f"🕵️ Number of chunks extracted: {len(chunks)}")
        if len(chunks) > 0:
            print(f"🕵️ First chunk preview: {chunks[0][:100]}")
        
        # 4. Save to Neo4j
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            for i, chunk in enumerate(chunks):
                event_id = f"EVT_{uuid.uuid4().hex[:8]}_{i}"
                embedding = embedder.encode(chunk).tolist()
                session.run(
                    INGEST_GRAPH_QUERY,
                    patient_id=patient_id,
                    disease=extracted_disease,
                    event_id=event_id,
                    notes=chunk,
                    embedding=embedding
                )
        driver.close()

        return {
            "success": True, 
            "message": "Report successfully ingested into Knowledge Graph",
            "extracted_condition": extracted_disease
        }

    except Exception as e:
        print(f"Ingestion Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))