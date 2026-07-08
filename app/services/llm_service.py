"""Service for LLM text generation using HuggingFace Inference API."""
import requests
import json
from typing import List
from app.core.config import settings

# HuggingFace Inference API endpoint
HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
HF_HEADERS = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"}


def build_rag_prompt(context_chunks: List[str], chat_history: List[dict], user_message: str) -> str:
    """Build the RAG prompt with system message, context, history, and user message."""
    
    # System message
    system_msg = "You are a helpful assistant. Answer only based on the context provided. If the answer is not in the context, say you don't know."
    
    # Context section
    context = "\n".join(context_chunks)
    context_section = f"Context:\n{context}\n"
    
    # Chat history section
    history_section = "Chat History:\n"
    for msg in chat_history:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == "user":
            history_section += f"Human: {content}\n"
        elif role == "assistant":
            history_section += f"Assistant: {content}\n"
    
    # Current user message
    user_section = f"User: {user_message}\n"
    
    # Combine all parts
    full_prompt = f"{system_msg}\n\n{context_section}\n{history_section}\n{user_section}\nAssistant:"
    
    return full_prompt


def call_huggingface_api(prompt: str, max_tokens: int = 1024) -> str:
    """Call HuggingFace Inference API for text generation.
    
    Args:
        prompt: The prompt to send
        max_tokens: Maximum tokens to generate
    """
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": max_tokens,
            "temperature": 0.7,
            "top_p": 0.95,
            "return_full_text": False
        }
    }
    
    try:
        response = requests.post(HF_API_URL, headers=HF_HEADERS, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        # Handle different response formats
        if isinstance(result, list) and len(result) > 0:
            return result[0].get("generated_text", "")
        elif isinstance(result, dict):
            return result.get("generated_text", "")
        
        return str(result)
        
    except requests.exceptions.Timeout:
        return "Error: Request timed out. Please try again."
    except requests.exceptions.RequestException as e:
        return f"Error calling HuggingFace API: {str(e)}"


def generate_rag_response(context_chunks: List[str], chat_history: List[dict], user_message: str) -> str:
    """Generate RAG response using HuggingFace Inference API."""
    prompt = build_rag_prompt(context_chunks, chat_history, user_message)
    response = call_huggingface_api(prompt)
    return response
