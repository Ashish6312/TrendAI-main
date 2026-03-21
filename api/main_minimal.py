from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime

# Create minimal FastAPI app
app = FastAPI()

# Simple CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Minimal API Test", 
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "version": "minimal-test"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "test": "minimal"
    }

@app.get("/test")
def test_endpoint():
    return {
        "test": "success",
        "message": "Minimal API is working",
        "timestamp": datetime.now().isoformat()
    }