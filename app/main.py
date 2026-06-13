"""Main FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ingest, chat, sessions, analyze, debate
from app.core.db import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="IntelliDoc - Multi-Agent Document Intelligence",
    description="Premium document intelligence platform with multi-agent debate and analysis",
    version="2.0.0"
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
app.include_router(analyze.router, tags=["Analysis"])
app.include_router(debate.router, tags=["Debate"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "message": "IntelliDoc API - Multi-Agent Document Intelligence Platform",
        "endpoints": ["/ingest", "/chat", "/sessions", "/analyze", "/debate"]
    }
