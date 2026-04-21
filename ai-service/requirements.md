# MediFlow AI - Project Requirements & Specifications

This document outlines the core components of the MediFlow AI project, specifically focusing on the AI service, the datasets used, the machine learning architectures instantiated, and the supporting libraries.

## 1. Datasets Used

Based on the training scripts and categories supported by the models, the following datasets are utilized:

*   **Chest X-Ray Datasets**: The primary structure in `dataset/chest_xray/` contains structured folders (`train`, `test`, `val`). Models are trained to classify findings such as "No Finding", "Pneumonia", "Cardiomegaly", and "Pleural Effusion". This is strongly indicative of datasets like:
    *   **Kaggle Chest X-Ray Images (Pneumonia)** dataset or similar splits.
    *   Multilabel classes suggest influence from the **NIH ChestX-ray14** dataset or **VinDr-CXR** (as hinted by the `vindr_epoch3.pth` model file). 

## 2. Machine Learning Models

The architecture employs an ensemble "Dual-Brain" vision system, augmented by state-of-the-art Large Language Models and embedding models for RAG (Retrieval-Augmented Generation).

### Vision Models (Computer Vision)
*   **DenseNet121**: Used as one of the primary medical imaging feature extractors (`mediflow_production_v1.pth`).
*   **ResNet50**: Used as the secondary vision core for the ensemble thresholding (`mediflow_resnet_production.pth`). 
*   **EfficientNet-B0**: Evaluated/experimented with during the pipeline (`train_model.py` specifically uses `EfficientNet_B0_Weights`).

### Language & Knowledge AI (NLP & GraphRAG)
*   **Llama 3.1 8B (Instant)**: The primary medical assistant LLM, served via the Groq API. It powers the chatbot and GraphRAG systems by synthesizing medical records into definitive, authoritative feedback.
*   **Gemini 1.5 Series (Pro/Flash)**: Accessed via the new Google GenAI SDK (`google-genai`). Historically or alternatively used for multi-modal generation and contextual extraction.
*   **all-MiniLM-L6-v2**: A lightweight open-source SentenceTransformer embedding model used to chunk and vectorize patient documents locally before pushing coordinates to the vector database.

## 3. Core Libraries & Python Packages

The backend is built as a highly performant API service encompassing AI inference, database management, and asynchronous operations.

### API & Servicing
*   **FastAPI**: The main web framework utilized for building both the AI and Chat API endpoints asynchronously.
*   **Uvicorn**: ASGI server to run the FastAPI application.
*   **Pydantic**: For strict type hints and schema enforcement on HTTP requests/responses.

### AI & Data Science
*   **PyTorch (`torch`, `torchvision`)**: The deep learning backbone processing the DenseNet/ResNet models, running on `mps`, `cuda`, or `cpu`.
*   **OpenCV-Python (`cv2`)**: Employed for advanced medical image processing and manipulation.
*   **Pillow (`PIL`)**: Baseline image handling.
*   **Sentence-Transformers**: Powers the local vectorization of PDF texts to `all-MiniLM-L6-v2`.

### GraphRAG & NLP Pipeline
*   **Neo4j (`neo4j`)**: The native Graph Database driver. It serves double duty by anchoring the property graph relationships and running native vector similarity searches via Neo4j's vector indexes.
*   **LangChain Text Splitters (`langchain-text-splitters`)**: Specifically utilizes `RecursiveCharacterTextSplitter` configured for specific chunk bounds (300 tokens, 50 overlap) to enforce strict context windows for the GraphRAG implementation.
*   **PyPDF2**: Used to parse and extract text context from raw, uploaded patient PDFs.

### Cloud AI Integrations
*   **Groq API (`groq`)**: Extremely fast inference for the Llama 3 models heavily relied upon for the prompt extraction and chatbot outputs.
*   **Google GenAI (`google-genai`)**: Interacts with the Gemini ecosystem.

### Environment & Utilities
*   **python-dotenv**: Rapid environment constraint loading (handling `.env` secrets).
*   **NumPy**: Baseline numerical transformations.
*   **tqdm**: Visualization mapping during training logs.