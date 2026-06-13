"""Main FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ingest, chat, sessions
from app.core.db import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Conversational RAG Backend",
    description="Production-ready backend with document ingestion and conversational RAG APIs",
    version="1.0.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default port
        "http://localhost:3000",  # React default port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ingest.router, tags=["Ingestion"])
app.include_router(chat.router, tags=["Chat"])
app.include_router(sessions.router, tags=["Sessions"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "message": "Conversational RAG Backend API is running",
        "endpoints": ["/ingest", "/chat", "/sessions"]
    }
