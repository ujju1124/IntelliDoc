# IntelliDoc

**Multi-agent document intelligence platform**

> A personal portfolio project showcasing advanced RAG architecture with LangGraph-powered multi-agent systems.

---

## 🎯 Features

### Mode 1: Intelligence Dashboard
Upload a document and instantly get:
- **Auto Summary** — 3-4 sentence document overview
- **Key Insights** — 5-7 bullet-point takeaways
- **Interactive Mind Map** — Visual node-based knowledge graph

### Mode 2: Multi-Agent Debate Panel
Ask a question and watch four AI agents debate:
- 🔵 **Summarizer** — Factual response based strictly on the document
- 🔴 **Critic** — Challenges assumptions and finds weaknesses
- 🟡 **Devil's Advocate** — Argues the opposite perspective
- 🟢 **Moderator** — Synthesizes all perspectives into a final verdict

Each agent reacts to the previous agent's response, creating a live panel debate experience.

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** — High-performance async API framework
- **LangGraph** — Multi-agent workflow orchestration
- **Groq API** — Ultra-fast LLM inference (llama3-8b-8192)
- **Pinecone** — Vector database for semantic search
- **Redis** — Session and conversation memory
- **SQLite** — Document metadata storage
- **Sentence Transformers** — Document embeddings

### Frontend
- **React** (Vite) — Fast, modern UI framework
- **Tailwind CSS** — Utility-first styling
- **Framer Motion** — Smooth animations
- **Axios** — API integration
- **React Router** — Client-side routing

---

## 📋 Prerequisites

- Python 3.10+
- Node.js 18+
- API Keys:
  - Groq API key
  - Pinecone API key
  - Upstash Redis credentials

---

## 🚀 Setup Instructions

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/ujju1124/IntelliDoc.git
cd IntelliDoc
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=your_pinecone_index_name
UPSTASH_REDIS_URL=your_redis_url_here
UPSTASH_REDIS_TOKEN=your_redis_token_here
DATABASE_URL=sqlite:///./app.db
```

5. **Run the backend server**
```bash
uvicorn app.main:app --reload
```

Backend will be available at: `http://localhost:8000`

API docs: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## 📡 API Endpoints

### 1. Document Ingestion
```bash
curl -X POST "http://localhost:8000/ingest?strategy=sentence" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "document_id": "doc_1234567890",
  "filename": "document.pdf",
  "chunk_count": 42,
  "strategy": "sentence"
}
```

---

### 2. Intelligence Analysis
```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "doc_1234567890"
  }'
```

**Response:**
```json
{
  "document_id": "doc_1234567890",
  "summary": "This document discusses...",
  "insights": [
    "Key insight 1",
    "Key insight 2",
    "Key insight 3"
  ],
  "mindmap": {
    "central": "Main Topic",
    "branches": [
      {
        "label": "Branch 1",
        "children": ["Child 1", "Child 2"]
      }
    ]
  }
}
```

---

### 3. Multi-Agent Debate
```bash
curl -X POST "http://localhost:8000/debate" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session_abc123",
    "user_message": "What are the main arguments presented?",
    "document_id": "doc_1234567890"
  }'
```

**Response:**
```json
{
  "session_id": "session_abc123",
  "user_message": "What are the main arguments presented?",
  "debate": {
    "summarizer": "The document presents three main arguments...",
    "critic": "However, the summarizer overlooks...",
    "devils_advocate": "On the contrary, we should consider...",
    "moderator": "Taking all perspectives into account..."
  }
}
```

---

### 4. Conversational Chat
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session_abc123",
    "user_message": "Tell me about the methodology",
    "document_id": "doc_1234567890"
  }'
```

**Response:**
```json
{
  "session_id": "session_abc123",
  "user_message": "Tell me about the methodology",
  "assistant_reply": "The methodology described in the document..."
}
```

---

## 🏗️ Architecture

### Multi-Agent Workflow (LangGraph)

```
User Question
     ↓
[Retrieve Context] → Query Pinecone + Fetch Redis History
     ↓
[Summarizer Agent] → Factual response from document
     ↓
[Critic Agent] → Challenges Summarizer's response
     ↓
[Devil's Advocate] → Argues opposite to Critic
     ↓
[Moderator Agent] → Synthesizes all perspectives
     ↓
Save to Redis → Return to User
```

### Data Flow

1. **Document Upload** → PDF processed → Chunked → Embedded → Stored in Pinecone
2. **Intelligence Analysis** → Retrieve chunks → Generate summary/insights/mindmap via Groq
3. **Debate Panel** → User query → Context retrieval → Sequential agent execution → Structured response
4. **Chat** → Traditional RAG with conversation memory

---

## 🎨 Design System

### Premium Dark Theme
- Background: `#080810` (near-black with blue tint)
- Surface: `#0f0f1a` (cards, panels)
- Accent: `#7c3aed` (violet primary)
- Agent Colors:
  - Summarizer: `#3b82f6` (blue)
  - Critic: `#ef4444` (red)
  - Devil's Advocate: `#f59e0b` (amber)
  - Moderator: `#10b981` (green)

### Typography
- Font: Inter (Google Fonts)
- Headings: 700 weight
- Body: 400 weight

---

## 📸 Demo Screenshots

_Screenshots coming soon..._

---

## 🧪 Testing

### Backend Tests
```bash
# Test all endpoints
python test_new_endpoints.py

# Or use the interactive API docs
# Navigate to http://localhost:8000/docs
```

### Frontend Testing
1. Upload a PDF document
2. Navigate to Intelligence Dashboard
3. Navigate to Debate Panel and ask questions

---

## 📝 License

This is a personal portfolio project. Feel free to explore and learn from the code.

---

## 👤 Author

**Ujwal Dahal**
- GitHub: [@ujju1124](https://github.com/ujju1124)

---

## 🙏 Acknowledgments

- Built with FastAPI, LangGraph, and React
- Powered by Groq's ultra-fast inference
- Vector search by Pinecone
