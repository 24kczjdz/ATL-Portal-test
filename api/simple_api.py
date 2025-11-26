#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Lightweight ATL Chatbot API for Vercel
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from typing import Optional, Dict, Any

# Initialize FastAPI app
app = FastAPI(
    title="ATL Chatbot API",
    description="Lightweight API for the Arts Technology Lab Chatbot",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: Optional[str] = None
    timestamp: str

@app.get("/")
async def root():
    return {"message": "ATL Chatbot API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ATL Chatbot API"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Chat endpoint that provides ATL-specific responses
    """
    try:
        # Generate contextual ATL response
        message_lower = request.message.lower()
        
        if any(word in message_lower for word in ['hello', 'hi', 'hey', 'start']):
            response_text = "Hello! Welcome to the Arts Technology Lab at HKU. I'm here to help you learn about our facilities, workshops, and creative technology programs. What would you like to know?"
        elif any(word in message_lower for word in ['workshop', 'class', 'course']):
            response_text = "We offer various workshops throughout the year covering creative coding, digital arts, interactive media, and emerging technologies. Our workshops are designed for both beginners and advanced practitioners."
        elif any(word in message_lower for word in ['equipment', 'facility', 'lab', 'space']):
            response_text = "Our lab is equipped with cutting-edge technology including 3D printers, VR/AR systems, digital media production tools, electronics prototyping equipment, and collaborative workspaces for creative projects."
        elif any(word in message_lower for word in ['program', 'study', 'learn']):
            response_text = "ATL offers programs that bridge art, technology, and innovation. We focus on creative coding, digital fabrication, interactive design, and interdisciplinary collaboration between arts and technology."
        elif any(word in message_lower for word in ['help', 'support', 'guidance']):
            response_text = "I'm here to provide information about ATL's resources, upcoming events, workshop schedules, equipment booking, and how to get involved in our creative community."
        else:
            response_text = f"Thank you for your question about '{request.message}'. The Arts Technology Lab is a creative space where art meets technology. We offer workshops, equipment access, and collaborative opportunities. What specific aspect would you like to know more about?"
        
        import datetime
        timestamp = datetime.datetime.now().isoformat()
        
        return ChatResponse(
            response=response_text,
            session_id=request.session_id,
            timestamp=timestamp
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.get("/status")
async def status():
    return {
        "api": "ATL Chatbot API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": ["/", "/health", "/chat", "/status"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)