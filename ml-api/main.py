#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
ATL Heavy ML Chatbot API - For Railway/Render Deployment
This handles the heavy ML components separately from Vercel
"""

import os
import sys
import logging
import traceback
from datetime import datetime
from typing import Optional, Dict, Any

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
    description="Heavy ML API for the Arts Technology Lab Chatbot",
    version="1.0.0"
)

# Add CORS middleware - Allow Vercel domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # For development - restrict in production
        "https://*.vercel.app",
        "https://atl-dashboard-one.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Copy ML components from original API
try:
    # Copy these files from /api/src/ to /ml-api/
    from response_generators import generate_lightweight_response
    from data_loader import InformationFeed
    from model_manager import load_model
    ML_AVAILABLE = True
except ImportError as e:
    logger.error(f"ML components not available: {e}")
    ML_AVAILABLE = False

# Global variables for ML components
info_feed = None
model = None
tokenizer = None

def initialize_ml_components():
    """Initialize ML components on startup"""
    global info_feed, model, tokenizer
    
    if not ML_AVAILABLE:
        logger.warning("ML components not available - using fallback")
        return False
    
    try:
        logger.info("Initializing InformationFeed...")
        info_feed = InformationFeed()
        logger.info("InformationFeed initialized successfully")
        
        logger.info("Loading model...")
        model, tokenizer = load_model(lightweight_mode=True)
        logger.info("Model loaded successfully")
        
        return True
    except Exception as e:
        logger.error(f"Failed to initialize ML components: {e}")
        logger.error(traceback.format_exc())
        return False

# Request/Response models
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

@app.on_event("startup")
async def startup_event():
    """Initialize ML components on startup"""
    logger.info("Starting ML API initialization...")
    success = initialize_ml_components()
    if success:
        logger.info("✅ ML API ready with full capabilities")
    else:
        logger.warning("⚠️ ML API running with fallback responses")

@app.get("/")
async def root():
    return {
        "message": "ATL ML Chatbot API is running",
        "status": "healthy",
        "ml_available": ML_AVAILABLE and model is not None
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "ml_available": ML_AVAILABLE and model is not None,
        "timestamp": str(datetime.now()),
        "service": "ATL ML Chatbot API"
    }

@app.post("/chat", response_model=MLChatResponse)
async def ml_chat(request: MLChatRequest):
    """
    ML Chat endpoint with full capabilities
    """
    try:
        logger.info(f"Received ML chat request: {request.message}")
        
        # Try to use ML components first
        if ML_AVAILABLE and model is not None and info_feed is not None and request.use_ml:
            try:
                response = generate_lightweight_response(
                    generator=model,
                    user_input=request.message,
                    info_feed=info_feed
                )
                
                return MLChatResponse(
                    response=response,
                    session_id=request.session_id,
                    timestamp=datetime.now().isoformat(),
                    source="ml",
                    metadata={
                        "model_used": True,
                        "message_length": len(request.message),
                        "response_length": len(response)
                    }
                )
            except Exception as e:
                logger.error(f"ML processing failed: {e}")
                # Fall through to fallback
        
        # Fallback response
        response = generate_fallback_response(request.message)
        return MLChatResponse(
            response=response,
            session_id=request.session_id,
            timestamp=datetime.now().isoformat(),
            source="fallback",
            metadata={
                "model_used": False,
                "fallback_reason": "ML unavailable or disabled"
            }
        )
        
    except Exception as e:
        logger.error(f"Chat processing error: {e}")
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)