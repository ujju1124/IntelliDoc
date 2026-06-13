"""Service for multi-agent debate using LangGraph."""
from typing import TypedDict, List, Annotated
from langgraph.graph import StateGraph, END
from app.services.retrieval_service import retrieve_relevant_chunks
from app.services.llm_service import call_groq_api
from app.core.redis_client import redis_client
import json


class DebateState(TypedDict):
    """State for the debate graph."""
    session_id: str
    user_message: str
    document_id: str
    context: List[str]
    chat_history: List[dict]
    summarizer_response: str
    critic_response: str
    devils_advocate_response: str
    moderator_response: str


def retrieve_context_node(state: DebateState) -> DebateState:
    """Node 1: Retrieve context from Pinecone and chat history from Redis."""
    
    # Query Pinecone for top 5 relevant chunks
    context_chunks = retrieve_relevant_chunks(
        user_message=state["user_message"],
        document_id=state["document_id"],
        top_k=5
    )
    
    # Fetch last 4 messages from Redis for this session
    session_key = f"session:{state['session_id']}"
    history_json = redis_client.get(session_key)
    
    chat_history = []
    if history_json:
        try:
            full_history = json.loads(history_json)
            # Get last 4 messages
            chat_history = full_history[-4:] if len(full_history) >= 4 else full_history
        except:
            chat_history = []
    
    state["context"] = context_chunks
    state["chat_history"] = chat_history
    
    return state


def summarizer_agent_node(state: DebateState) -> DebateState:
    """Node 2: Summarizer agent - provides factual, objective response."""
    
    context_text = "\n".join(state["context"])
    
    system_prompt = f"""You are the Summarizer. Your role is to provide a factual, objective response based strictly on the document. Stick to what the document says. Be concise and clear.

Document context:
{context_text}

User question: {state['user_message']}

Provide your factual summary:"""
    
    response = call_groq_api(system_prompt, model="llama3-8b-8192")
    
    state["summarizer_response"] = response
    return state


def critic_agent_node(state: DebateState) -> DebateState:
    """Node 3: Critic agent - challenges assumptions and finds weaknesses."""
    
    context_text = "\n".join(state["context"])
    
    system_prompt = f"""You are the Critic. Your role is to challenge assumptions and find weaknesses. Review what the Summarizer said and identify gaps, limitations, or problems.

Document context:
{context_text}

Summarizer said:
{state['summarizer_response']}

User question: {state['user_message']}

Provide your critical analysis:"""
    
    response = call_groq_api(system_prompt, model="llama3-8b-8192")
    
    state["critic_response"] = response
    return state


def devils_advocate_agent_node(state: DebateState) -> DebateState:
    """Node 4: Devil's Advocate agent - argues opposite perspective."""
    
    context_text = "\n".join(state["context"])
    
    system_prompt = f"""You are the Devil's Advocate. Argue the opposite perspective. Challenge what the Critic said and defend alternative viewpoints.

Document context:
{context_text}

Critic said:
{state['critic_response']}

User question: {state['user_message']}

Provide your counter-argument:"""
    
    response = call_groq_api(system_prompt, model="llama3-8b-8192")
    
    state["devils_advocate_response"] = response
    return state


def moderator_agent_node(state: DebateState) -> DebateState:
    """Node 5: Moderator agent - synthesizes all perspectives into final verdict."""
    
    system_prompt = f"""You are the Moderator. Synthesize all perspectives into a balanced final verdict. Consider what the Summarizer, Critic, and Devil's Advocate said and give the most useful answer to the user.

Summarizer: {state['summarizer_response']}

Critic: {state['critic_response']}

Devil's Advocate: {state['devils_advocate_response']}

User question: {state['user_message']}

Provide your final synthesized answer:"""
    
    response = call_groq_api(system_prompt, model="llama3-8b-8192")
    
    state["moderator_response"] = response
    return state


def create_debate_graph():
    """Create and compile the LangGraph debate workflow."""
    
    # Create the graph
    workflow = StateGraph(DebateState)
    
    # Add nodes
    workflow.add_node("retrieve_context", retrieve_context_node)
    workflow.add_node("summarizer_agent", summarizer_agent_node)
    workflow.add_node("critic_agent", critic_agent_node)
    workflow.add_node("devils_advocate_agent", devils_advocate_agent_node)
    workflow.add_node("moderator_agent", moderator_agent_node)
    
    # Define edges (flow)
    workflow.set_entry_point("retrieve_context")
    workflow.add_edge("retrieve_context", "summarizer_agent")
    workflow.add_edge("summarizer_agent", "critic_agent")
    workflow.add_edge("critic_agent", "devils_advocate_agent")
    workflow.add_edge("devils_advocate_agent", "moderator_agent")
    workflow.add_edge("moderator_agent", END)
    
    # Compile the graph
    app = workflow.compile()
    
    return app


def run_debate(session_id: str, user_message: str, document_id: str) -> dict:
    """Execute the multi-agent debate workflow.
    
    Args:
        session_id: Session identifier
        user_message: User's question
        document_id: Document to query against
        
    Returns:
        Dictionary with all agent responses
    """
    
    # Create initial state
    initial_state = {
        "session_id": session_id,
        "user_message": user_message,
        "document_id": document_id,
        "context": [],
        "chat_history": [],
        "summarizer_response": "",
        "critic_response": "",
        "devils_advocate_response": "",
        "moderator_response": ""
    }
    
    # Create and run the debate graph
    debate_graph = create_debate_graph()
    final_state = debate_graph.invoke(initial_state)
    
    # Save the full debate to Redis
    session_key = f"session:{session_id}"
    
    # Get existing history
    history_json = redis_client.get(session_key)
    history = []
    if history_json:
        try:
            history = json.loads(history_json)
        except:
            history = []
    
    # Add user message and all agent responses
    history.append({"role": "user", "content": user_message})
    history.append({
        "role": "assistant",
        "content": {
            "type": "debate",
            "summarizer": final_state["summarizer_response"],
            "critic": final_state["critic_response"],
            "devils_advocate": final_state["devils_advocate_response"],
            "moderator": final_state["moderator_response"]
        }
    })
    
    # Save back to Redis
    redis_client.set(session_key, json.dumps(history))
    
    # Return debate results
    return {
        "session_id": session_id,
        "user_message": user_message,
        "debate": {
            "summarizer": final_state["summarizer_response"],
            "critic": final_state["critic_response"],
            "devils_advocate": final_state["devils_advocate_response"],
            "moderator": final_state["moderator_response"]
        }
    }
