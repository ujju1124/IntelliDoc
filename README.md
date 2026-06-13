# IntelliDoc

**Multi-Agent Document Intelligence Platform**

> A portfolio project showcasing advanced RAG architecture with LangGraph-powered multi-agent debate systems.

---

## Features

### Intelligence Dashboard
Upload any document and get an instant AI-powered analysis:
- **Auto Summary** — 3–4 sentence overview of the document
- **Key Insights** — 5 extracted takeaways from the content
- **Interactive Mind Map** — Visual node-based knowledge graph rendered as SVG

### Multi-Agent Debate Panel
Ask a question and watch four AI agents debate in real time:
- 🔵 **Summarizer** — Factual response grounded strictly in the document
- 🔴 **Critic** — Challenges assumptions and identifies weaknesses
- 🟡 **Devil's Advocate** — Argues the opposite perspective
- 🟢 **Moderator** — Synthesizes all views into a balanced final verdict

Each agent reads the previous agent's response before replying, creating a true sequential debate chain.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | High-performance async REST API |
| LangGraph | Multi-agent workflow orchestration |
| Groq API (`llama-3.1-8b-instant`) | Ultra-fast LLM inference |
| Pinecone | Vector database for semantic search |
| Redis (Upstash) | Session and conversation memory |
| SQLite + SQLAlchemy | Document metadata storage |
| Sentence Transformers | Document chunk embeddings |

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | Fast, modern UI framework |
| Tailwind CSS | Utility-first styling |
| Framer Motion | Smooth page and element animations |
| Axios | HTTP client for API integration |
| React Router | Client-side navigation |

---

## Architecture

### Multi-Agent Workflow (LangGraph StateGraph)

```
User Question
     │
     ▼
[Context Retrieval]
   Query Pinecone (top 5 semantic chunks)
   Load Redis session history
     │
     ▼
[Summarizer Agent]
   Factual response from document context
     │
     ▼
[Critic Agent]
   Identifies gaps, limitations, counterpoints
     │
     ▼
[Devil's Advocate Agent]
   Defends original positions, challenges the Critic
     │
     ▼
[Moderator Agent]
   Synthesizes all 3 perspectives into final verdict
     │
     ▼
   Save full debate to Redis → Return to client
```

### Data Flow
1. **Upload** → File chunked with sentence or fixed strategy → Embedded → Stored in Pinecone
2. **Analyze** → General query retrieves top 10 chunks → Summary + insights + mind map via Groq
3. **Debate** → User question → Top 5 chunks retrieved → 4 agents execute sequentially
4. **Chat** → Standard conversational RAG with Redis memory

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- API keys for:
  - [Groq](https://console.groq.com) — LLM inference
  - [Pinecone](https://app.pinecone.io) — Vector database
  - [Upstash Redis](https://upstash.com) — Session memory

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/ujju1124/IntelliDoc.git
cd IntelliDoc
```

### 2. Backend setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the root:

```env
GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
DATABASE_URL=sqlite:///./app.db
```

Start the backend:

```bash
python start_server.py
```

Backend runs at `http://localhost:8000`  
Interactive API docs at `http://localhost:8000/docs`

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## API Reference

### `POST /ingest`
Upload and process a document.

```bash
curl -X POST "http://localhost:8000/ingest?strategy=sentence" \
  -F "file=@document.pdf"
```

```json
{
  "document_id": "a2a5ca77-c00b-4a0d-a4f9-4ed3841d4f1a",
  "filename": "document.pdf",
  "chunk_count": 42,
  "strategy": "sentence"
}
```

---

### `POST /analyze`
Generate intelligence dashboard data for a document.

```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{"document_id": "a2a5ca77-..."}'
```

```json
{
  "document_id": "a2a5ca77-...",
  "summary": "This document explores...",
  "insights": [
    "Insight one about the document",
    "Insight two about key themes",
    "Insight three about implications",
    "Insight four about challenges",
    "Insight five about conclusions"
  ],
  "mindmap": {
    "central": "Main Topic",
    "branches": [
      { "label": "Branch 1", "children": ["Child A", "Child B"] },
      { "label": "Branch 2", "children": ["Child C", "Child D"] }
    ]
  }
}
```

---

### `POST /debate`
Send a message to the multi-agent debate panel.

```bash
curl -X POST "http://localhost:8000/debate" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-123",
    "user_message": "What are the main arguments?",
    "document_id": "a2a5ca77-..."
  }'
```

```json
{
  "session_id": "session-123",
  "user_message": "What are the main arguments?",
  "debate": {
    "summarizer": "The document presents three main arguments...",
    "critic": "However, the summarizer overlooks...",
    "devils_advocate": "On the contrary, we should consider...",
    "moderator": "Taking all perspectives into account..."
  }
}
```

---

### `POST /chat`
Conversational RAG with memory.

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-123",
    "user_message": "Explain the methodology",
    "document_id": "a2a5ca77-..."
  }'
```

```json
{
  "session_id": "session-123",
  "user_message": "Explain the methodology",
  "assistant_reply": "The methodology described in the document..."
}
```

---

## Design System

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| Background | `#080810` | Page background |
| Surface | `#0f0f1a` | Cards, panels |
| Violet | `#7c3aed` | Primary accent, CTAs |
| Summarizer | `#3b82f6` | Blue agent bubble |
| Critic | `#ef4444` | Red agent bubble |
| Devil's Advocate | `#f59e0b` | Amber agent bubble |
| Moderator | `#10b981` | Green agent bubble |

---

## Project Structure

```
IntelliDoc/
├── app/
│   ├── core/           # Config, DB, Pinecone, Redis clients
│   ├── models/         # SQLAlchemy models and Pydantic schemas
│   ├── routers/        # FastAPI route handlers
│   │   ├── analyze.py  # Intelligence dashboard endpoint
│   │   ├── debate.py   # Multi-agent debate endpoint
│   │   ├── ingest.py   # Document upload endpoint
│   │   ├── chat.py     # Conversational chat endpoint
│   │   └── sessions.py # Session management
│   ├── services/       # Business logic
│   │   ├── debate_service.py    # LangGraph multi-agent workflow
│   │   ├── ingestion_service.py # Chunking and embedding
│   │   ├── llm_service.py       # Groq API wrapper
│   │   ├── memory_service.py    # Redis session management
│   │   └── retrieval_service.py # Pinecone semantic search
│   └── main.py         # FastAPI app entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Navbar, FileUpload, MindMap, AgentBubble, etc.
│   │   ├── pages/       # UploadPage, DashboardPage, DebatePage
│   │   ├── hooks/       # useUpload, useAnalysis, useDebate
│   │   ├── context/     # AppContext (global state + sessionStorage)
│   │   └── services/    # api.js (Axios API client)
│   └── index.html
├── requirements.txt
├── start_server.py
└── .env.example
```

---

## Author

**Ujwal Dahal** — [@ujju1124](https://github.com/ujju1124)
