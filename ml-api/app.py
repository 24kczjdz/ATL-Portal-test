#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
ATL Heavy ML Chatbot API - For Hugging Face Spaces Deployment
This handles the heavy ML components separately from Vercel
"""

import os
import sys
import logging
import traceback
from datetime import datetime
from typing import Optional, Dict, Any

import gradio as gr
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("atl_ml_api")

# Initialize FastAPI app
app = FastAPI(
    title="ATL ML Chatbot API",
    description="Heavy ML API for the Arts Technology Lab Chatbot - Hosted on Hugging Face Spaces",
    version="1.0.0"
)

# Add CORS middleware - Allow Vercel domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Allow all origins for Hugging Face Spaces
        "https://*.vercel.app",
        "https://atl-dashboard-one.vercel.app",
        "https://*.hf.space"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Copy ML components from original API
try:
    # These will be copied from /api/src/ to /ml-api/
    from response_generators import generate_lightweight_response
    from data_loader import InformationFeed
    from model_manager import load_model
    ML_AVAILABLE = True
    logger.info("ML components imported successfully")
except ImportError as e:
    logger.error(f"ML components not available: {e}")
    ML_AVAILABLE = False

# Global variables for ML components
info_feed = None
model = None
tokenizer = None
initialization_status = "not_started"

def initialize_ml_components():
    """Initialize ML components on startup"""
    global info_feed, model, tokenizer, initialization_status
    
    initialization_status = "initializing"
    
    if not ML_AVAILABLE:
        logger.warning("ML components not available - using fallback")
        initialization_status = "fallback_only"
        return False
    
    try:
        logger.info("🤖 Initializing InformationFeed...")
        info_feed = InformationFeed()
        logger.info("✅ InformationFeed initialized successfully")
        
        logger.info("🧠 Loading model...")
        model, tokenizer = load_model(lightweight_mode=True)
        logger.info("✅ Model loaded successfully")
        
        initialization_status = "ready"
        return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize ML components: {e}")
        logger.error(traceback.format_exc())
        initialization_status = "failed"
        return False

# Request/Response models for API
class MLChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    use_ml: Optional[bool] = True

class MLChatResponse(BaseModel):
    response: str
    session_id: Optional[str] = None
    timestamp: str
    source: str  # "ml" or "fallback"
    metadata: Optional[Dict[str, Any]] = None

# Initialize ML components at startup
logger.info("🚀 Starting ATL ML API initialization...")
ml_success = initialize_ml_components()
if ml_success:
    logger.info("✅ ATL ML API ready with full capabilities")
else:
    logger.warning("⚠️ ATL ML API running with fallback responses")

@app.get("/")
async def root():
    return {
        "message": "ATL ML Chatbot API is running on Hugging Face Spaces",
        "status": "healthy",
        "ml_available": ML_AVAILABLE and model is not None,
        "initialization_status": initialization_status,
        "service": "Arts Technology Lab Chatbot"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "ml_available": ML_AVAILABLE and model is not None,
        "initialization_status": initialization_status,
        "timestamp": str(datetime.now()),
        "service": "ATL ML Chatbot API",
        "platform": "Hugging Face Spaces"
    }

@app.post("/chat", response_model=MLChatResponse)
async def ml_chat(request: MLChatRequest):
    """
    ML Chat endpoint with full ATL chatbot capabilities
    """
    try:
        logger.info(f"📨 Received ML chat request: {request.message}")
        
        # Try to use ML components first
        if ML_AVAILABLE and model is not None and info_feed is not None and request.use_ml:
            try:
                logger.info("🧠 Using ML model for response generation...")
                response = generate_lightweight_response(
                    generator=model,
                    user_input=request.message,
                    info_feed=info_feed
                )
                
                logger.info("✅ ML response generated successfully")
                return MLChatResponse(
                    response=response,
                    session_id=request.session_id,
                    timestamp=datetime.now().isoformat(),
                    source="ml",
                    metadata={
                        "model_used": True,
                        "message_length": len(request.message),
                        "response_length": len(response),
                        "platform": "huggingface_spaces"
                    }
                )
            except Exception as e:
                logger.error(f"❌ ML processing failed: {e}")
                # Fall through to fallback
        
        # Fallback response
        logger.info("📝 Using fallback response")
        response = generate_fallback_response(request.message)
        return MLChatResponse(
            response=response,
            session_id=request.session_id,
            timestamp=datetime.now().isoformat(),
            source="fallback",
            metadata={
                "model_used": False,
                "fallback_reason": "ML unavailable or disabled",
                "platform": "huggingface_spaces"
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Chat processing error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Chat processing failed: {str(e)}"
        )

def generate_fallback_response(user_input: str) -> str:
    """Generate ATL-specific fallback responses"""
    message_lower = user_input.lower()
    
    if any(word in message_lower for word in ['hello', 'hi', 'hey', 'start']):
        return "Hello! Welcome to the Arts Technology Lab at HKU. I'm here to help you learn about our facilities, workshops, and creative technology programs. What would you like to know?"
    elif any(word in message_lower for word in ['workshop', 'class', 'course']):
        return "We offer various workshops throughout the year covering creative coding, digital arts, interactive media, and emerging technologies. Our workshops are designed for both beginners and advanced practitioners."
    elif any(word in message_lower for word in ['equipment', 'facility', 'lab', 'space']):
        return "Our lab is equipped with cutting-edge technology including 3D printers, VR/AR systems, digital media production tools, electronics prototyping equipment, and collaborative workspaces for creative projects."
    elif any(word in message_lower for word in ['program', 'study', 'learn']):
        return "ATL offers programs that bridge art, technology, and innovation. We focus on creative coding, digital fabrication, interactive design, and interdisciplinary collaboration between arts and technology."
    elif any(word in message_lower for word in ['help', 'support', 'guidance']):
        return "I'm here to provide information about ATL's resources, upcoming events, workshop schedules, equipment booking, and how to get involved in our creative community."
    else:
        return f"Thank you for your question about '{user_input}'. The Arts Technology Lab is a creative space where art meets technology. We offer workshops, equipment access, and collaborative opportunities. What specific aspect would you like to know more about?"

# Gradio interface for testing (Hugging Face Spaces feature)
def gradio_chat(message, history):
    """Gradio interface for testing the chatbot"""
    try:
        # Simulate the API call
        if ML_AVAILABLE and model is not None and info_feed is not None:
            response = generate_lightweight_response(
                generator=model,
                user_input=message,
                info_feed=info_feed
            )
            source = "🧠 ML Model"
        else:
            response = generate_fallback_response(message)
            source = "📝 Fallback"
            
        return f"**{source}**: {response}"
    except Exception as e:
        return f"❌ Error: {str(e)}"

# Create Gradio interface
with gr.Blocks(title="ATL Chatbot API Test") as gradio_app:
    gr.Markdown("# 🎨 Arts Technology Lab Chatbot API")
    gr.Markdown("### Test the ML chatbot API hosted on Hugging Face Spaces")
    gr.Markdown(f"**Status**: {initialization_status} | **ML Available**: {ML_AVAILABLE and model is not None}")
    
    chatbot = gr.Chatbot(height=400)
    msg = gr.Textbox(label="Your message", placeholder="Ask about ATL workshops, equipment, or programs...")
    clear = gr.Button("Clear")
    
    msg.submit(gradio_chat, [msg, chatbot], [chatbot])
    clear.click(lambda: None, None, chatbot, queue=False)

# Mount both FastAPI and Gradio
app = gr.mount_gradio_app(app, gradio_app, path="/")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))  # Hugging Face Spaces uses port 7860
    host = os.environ.get("HOST", "0.0.0.0")
    
    logger.info(f"🚀 Starting ATL ML API server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)