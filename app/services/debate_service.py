"""Multi-agent debate service using LangGraph.

Improvements over v1:
- Graph compiled once at module load (singleton) — not on every request
- Chat history injected into all agent prompts for follow-up awareness
- Shared embedding model via app.core.embeddings
"""
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from app.services.retrieval_service import retrieve_relevant_chunks
from app.services.llm_service import call_groq_api
from app.core.redis_client import redis_client
import json


# ─── State ───────────────────────────────────────────────────────────────────

class DebateState(TypedDict):
    session_id: str
    user_message: str
    document_id: str
    context: List[str]
    chat_history: List[dict]
    summarizer_response: str
    critic_response: str
    devils_advocate_response: str
    moderator_response: str


# ─── Nodes ────────────────────────────────────────────────────────────────────

def retrieve_context_node(state: DebateState) -> DebateState:
    """Retrieve context from Pinecone and chat history from Redis."""

    context_chunks = retrieve_relevant_chunks(
        user_message=state["user_message"],
        document_id=state["document_id"],
        top_k=5
    )

    # Last 4 turns from Redis
    session_key = f"session:{state['session_id']}"
    history_json = redis_client.get(session_key)
    chat_history = []
    if history_json:
        try:
            full_history = json.loads(history_json)
            chat_history = full_history[-4:] if len(full_history) >= 4 else full_history
        except Exception:
            chat_history = []

    state["context"] = context_chunks
    state["chat_history"] = chat_history
    return state


def _format_history(chat_history: List[dict]) -> str:
    """Format Redis chat history into a readable string for agent prompts."""
    if not chat_history:
        return ""
    lines = []
    for msg in chat_history:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == "user":
            lines.append(f"User: {content}")
        elif role == "assistant":
            # content may be a dict (debate turn) or a string
            if isinstance(content, dict):
                summary = content.get("moderator", "")
                if summary:
                    lines.append(f"Previous moderator verdict: {summary[:300]}")
            else:
                lines.append(f"Assistant: {str(content)[:300]}")
    return "\n".join(lines)


def summarizer_agent_node(state: DebateState) -> DebateState:
    """Summarizer — factual, objective response grounded in the document."""

    context_text = "\n".join(state["context"])
    history_text = _format_history(state["chat_history"])
    history_section = f"\nPrevious conversation:\n{history_text}\n" if history_text else ""

    prompt = f"""You are the Summarizer. Provide a factual, objective response based strictly on the document. Stick to what the document says. Be concise and clear.
{history_section}
Document context:
{context_text}

User question: {state['user_message']}

Provide your factual summary:"""

    state["summarizer_response"] = call_groq_api(prompt, model="llama-3.1-8b-instant")
    return state


def critic_agent_node(state: DebateState) -> DebateState:
    """Critic — challenges the Summarizer, finds gaps and weaknesses."""

    context_text = "\n".join(state["context"])
    history_text = _format_history(state["chat_history"])
    history_section = f"\nPrevious conversation:\n{history_text}\n" if history_text else ""

    prompt = f"""You are the Critic. Challenge assumptions and find weaknesses in the Summarizer's response. Identify gaps, limitations, or problems.
{history_section}
Document context:
{context_text}

Summarizer said:
{state['summarizer_response']}

User question: {state['user_message']}

Provide your critical analysis:"""

    state["critic_response"] = call_groq_api(prompt, model="llama-3.1-8b-instant")
    return state


def devils_advocate_agent_node(state: DebateState) -> DebateState:
    """Devil's Advocate — argues the opposite perspective to the Critic."""

    context_text = "\n".join(state["context"])
    history_text = _format_history(state["chat_history"])
    history_section = f"\nPrevious conversation:\n{history_text}\n" if history_text else ""

    prompt = f"""You are the Devil's Advocate. Argue the opposite perspective. Challenge what the Critic said and defend alternative viewpoints.
{history_section}
Document context:
{context_text}

Critic said:
{state['critic_response']}

User question: {state['user_message']}

Provide your counter-argument:"""

    state["devils_advocate_response"] = call_groq_api(prompt, model="llama-3.1-8b-instant")
    return state


def moderator_agent_node(state: DebateState) -> DebateState:
    """Moderator — synthesizes all perspectives into a balanced final verdict."""

    history_text = _format_history(state["chat_history"])
    history_section = f"\nPrevious conversation:\n{history_text}\n" if history_text else ""

    prompt = f"""You are the Moderator. Synthesize all perspectives into a balanced final verdict. Give the most useful answer to the user.
{history_section}
Summarizer: {state['summarizer_response']}

Critic: {state['critic_response']}

Devil's Advocate: {state['devils_advocate_response']}

User question: {state['user_message']}

Provide your final synthesized answer:"""

    state["moderator_response"] = call_groq_api(prompt, model="llama-3.1-8b-instant")
    return state


# ─── Singleton graph — compiled once at import time ───────────────────────────

def _build_graph():
    workflow = StateGraph(DebateState)
    workflow.add_node("retrieve_context",       retrieve_context_node)
    workflow.add_node("summarizer_agent",        summarizer_agent_node)
    workflow.add_node("critic_agent",            critic_agent_node)
    workflow.add_node("devils_advocate_agent",   devils_advocate_agent_node)
    workflow.add_node("moderator_agent",         moderator_agent_node)

    workflow.set_entry_point("retrieve_context")
    workflow.add_edge("retrieve_context",      "summarizer_agent")
    workflow.add_edge("summarizer_agent",       "critic_agent")
    workflow.add_edge("critic_agent",           "devils_advocate_agent")
    workflow.add_edge("devils_advocate_agent",  "moderator_agent")
    workflow.add_edge("moderator_agent",        END)

    return workflow.compile()


# Compiled once when the module is first imported
_debate_graph = _build_graph()


# ─── Public API ───────────────────────────────────────────────────────────────

def run_debate(session_id: str, user_message: str, document_id: str) -> dict:
    """Execute the multi-agent debate workflow and persist results to Redis."""

    initial_state: DebateState = {
        "session_id": session_id,
        "user_message": user_message,
        "document_id": document_id,
        "context": [],
        "chat_history": [],
        "summarizer_response": "",
        "critic_response": "",
        "devils_advocate_response": "",
        "moderator_response": "",
    }

    # Reuse the pre-compiled graph
    final_state = _debate_graph.invoke(initial_state)

    # Persist to Redis
    session_key = f"session:{session_id}"
    history_json = redis_client.get(session_key)
    history = []
    if history_json:
        try:
            history = json.loads(history_json)
        except Exception:
            history = []

    history.append({"role": "user", "content": user_message})
    history.append({
        "role": "assistant",
        "content": {
            "type": "debate",
            "summarizer":       final_state["summarizer_response"],
            "critic":           final_state["critic_response"],
            "devils_advocate":  final_state["devils_advocate_response"],
            "moderator":        final_state["moderator_response"],
        }
    })
    redis_client.set(session_key, json.dumps(history))

    return {
        "session_id": session_id,
        "user_message": user_message,
        "debate": {
            "summarizer":       final_state["summarizer_response"],
            "critic":           final_state["critic_response"],
            "devils_advocate":  final_state["devils_advocate_response"],
            "moderator":        final_state["moderator_response"],
        }
    }
