"""Service for LLM text generation using Groq API."""
from groq import Groq
from typing import List
from app.core.config import settings

# Initialize Groq client
groq_client = Groq(api_key=settings.GROQ_API_KEY)


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


def call_groq_api(prompt: str, model: str = "llama-3.1-8b-instant", json_mode: bool = False) -> str:
    """Call Groq API for text generation.
    
    Args:
        prompt: The prompt to send
        model: Model to use (default: llama-3.1-8b-instant)
        json_mode: If True, forces response to be valid JSON
    """
    
    messages = [{"role": "user", "content": prompt}]
    
    # Add JSON mode if requested
    extra_params = {}
    if json_mode:
        extra_params["response_format"] = {"type": "json_object"}
    
    response = groq_client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.7,
        max_tokens=500,
        **extra_params
    )
    
    return response.choices[0].message.content


def generate_rag_response(context_chunks: List[str], chat_history: List[dict], user_message: str) -> str:
    """Generate RAG response using Groq API."""
    prompt = build_rag_prompt(context_chunks, chat_history, user_message)
    response = call_groq_api(prompt)
    return response
