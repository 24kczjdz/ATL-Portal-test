# ATL ML Chatbot API - Hugging Face Spaces

This is the heavy ML API component for the Arts Technology Lab Chatbot, designed to run on Hugging Face Spaces.

## 🚀 Deployment Instructions

### Step 1: Copy ML Components
Copy these files from `/Users/judyyip/Desktop/ATL 2/ATL-Chatbot-API/src/` to `/ml-api/`:
- `response_generators.py`
- `data_loader.py` 
- `model_manager.py`
- `rag_system.py`
- `text_processors.py`
- `terminology.py`
- `website_links.py`

Copy the `/data/` folder from `/Users/judyyip/Desktop/ATL 2/ATL-Chatbot-API/data/` to `/ml-api/data/`

### Step 2: Create Hugging Face Space
1. Go to https://huggingface.co/spaces
2. Click "Create new Space"
3. Choose:
   - **Space name**: `atl-chatbot-api` (or your preferred name)
   - **License**: Apache 2.0
   - **SDK**: Docker
   - **Hardware**: CPU basic (free) or GPU if needed

### Step 3: Upload Files
Upload all files from `/ml-api/` to your Hugging Face Space:
- `Dockerfile` (Docker configuration based on original proven version from ATL-Chatbot-API)
- `app.py` (main application)
- `requirements.txt` (optimized dependencies from original ATL-Chatbot-API)
- `.dockerignore`
- `README.md`
- All ML component files copied from step 1

### Step 4: Configure Space
1. Set visibility to **Public** (free) or **Private** (paid)
2. Wait for automatic deployment
3. Your API will be available at: `https://YOUR_USERNAME-atl-chatbot-api.hf.space`

## 🔗 API Endpoints

Once deployed, your API will have:
- **Chat endpoint**: `POST /chat`
- **Health check**: `GET /health`
- **Interactive UI**: Available at the root URL for testing

## 📡 Integration with Vercel

The Vercel website will call this API at:
```
https://YOUR_USERNAME-atl-chatbot-api.hf.space/chat
```

## ✅ Features
- **Free hosting** on Hugging Face Spaces
- **Full ML capabilities** with RAG system
- **Fallback responses** if ML components fail
- **Interactive testing UI** via Gradio
- **CORS enabled** for Vercel integration
- **Comprehensive logging** for debugging

## 🔧 Local Testing

### Option 1: Direct Python
```bash
cd ml-api
pip install -r requirements.txt
python app.py
```

### Option 2: Docker (Recommended)
```bash
cd ml-api
docker-compose up --build
```

### Option 3: Docker without compose
```bash
cd ml-api
docker build -t atl-ml-api .
docker run -p 7860:7860 atl-ml-api
```

Visit http://localhost:7860 to test the interface.