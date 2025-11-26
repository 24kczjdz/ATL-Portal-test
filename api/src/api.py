#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
ATL Chatbot API Server

This module provides a FastAPI server to expose the chatbot functionality via REST API.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import os
import sys
import traceback
from typing import Optional, Dict, Any
from datetime import datetime

# Add src directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import chatbot components with fallback
try:
    from response_generators import generate_lightweight_response
    from data_loader import InformationFeed
    from model_manager import load_model
except ImportError as e:
    logger.warning(f"Failed to import ML components: {e}")
    # Define fallback functions
    def generate_lightweight_response(generator, user_input, info_feed):
        return f"ML components not available. Fallback response for: {user_input}"
    
    class InformationFeed:
        def __init__(self):
            pass
    
    def load_model(lightweight_mode=True):
        return None, None

# Set up logging with more detail
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("atl_chatbot_api")

# Initialize FastAPI app
app = FastAPI(
    title="ATL Chatbot API",
    description="API for the Arts Technology Lab Chatbot",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize components with fallback for serverless environments
info_feed = None
model = None
tokenizer = None

def initialize_components():
    """Lazy initialization for serverless environments"""
    global info_feed, model, tokenizer
    
    if info_feed is None:
        try:
            logger.info("Initializing InformationFeed...")
            info_feed = InformationFeed()
            logger.info("InformationFeed initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing InformationFeed: {str(e)}")
            info_feed = "fallback"  # Mark as attempted
    
    if model is None:
        try:
            logger.info("Loading model...")
            model, tokenizer = load_model(lightweight_mode=True)
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            model = "fallback"  # Mark as attempted

def generate_fallback_response(user_input: str) -> str:
    """Generate ATL-specific fallback responses when ML components fail"""
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

class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    response: str
    session_id: Optional[str]
    metadata: Optional[Dict[str, Any]] = None

@app.get("/")
async def root():
    """Root endpoint to check if API is running"""
    return {
        "status": "ok",
        "message": "ATL Chatbot API is running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker health checks"""
    try:
        # Check if model is loaded
        model_status = "ok" if model is not None else "error"
        info_feed_status = "ok" if info_feed is not None else "error"
        
        return {
            "status": "healthy",
            "timestamp": str(datetime.now()),
            "services": {
                "model": model_status,
                "info_feed": info_feed_status
            },
            "message": "ATL Chatbot API is healthy"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": str(datetime.now()),
            "error": str(e),
            "message": "ATL Chatbot API health check failed"
        }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint that processes user messages and returns chatbot responses
    
    Args:
        request (ChatRequest): The chat request containing the user's message
        
    Returns:
        ChatResponse: The chatbot's response
    """
    try:
        # Log incoming request
        logger.info(f"Received chat request with message: {request.message}")
        
        # Initialize components lazily
        initialize_components()
        
        # Generate response with fallback for serverless
        if model != "fallback" and info_feed != "fallback":
            logger.debug("Calling generate_lightweight_response...")
            response = generate_lightweight_response(
                generator=model,
                user_input=request.message,
                info_feed=info_feed
            )
            logger.debug("Response generated successfully")
        else:
            # Fallback response for when ML components fail to load
            logger.info("Using fallback response due to component initialization failure")
            response = generate_fallback_response(request.message)
            logger.debug("Fallback response generated")
        
        # Prepare the response
        chat_response = ChatResponse(
            response=response,
            session_id=request.session_id,
            metadata={
                "timestamp": str(datetime.now()),
                "message_length": len(request.message),
                "response_length": len(response)
            }
        )
        
        # Log the response
        logger.info(f"Generated response: {response[:100]}...")
        
        return chat_response
        
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"Error processing chat request: {str(e)}\n{tb}")
        # Return the traceback in the response for debugging
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your request: {str(e)}\n{tb}"
        )

# For local development
if __name__ == "__main__":
    import uvicorn
    # Run the API server with debug logging
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload during development
        log_level="debug"
    ) 