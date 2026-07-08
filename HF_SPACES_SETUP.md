# Hugging Face Spaces Deployment Guide for IntelliDoc Backend

## Prerequisites
1. Create a new Space on Hugging Face: https://huggingface.co/spaces
2. Choose **Docker** as the SDK
3. Choose **CPU basic** (free tier) or **CPU upgrade** ($0.70/day) for more RAM

---

## Required Environment Variables / Secrets

Add these as **Repository Secrets** in your HF Space settings (Settings → Repository secrets):

### 1. GROQ_API_KEY (Required)
- **Description**: API key for Groq LLM inference (llama-3.1-8b-instant)
- **Get it from**: https://console.groq.com
- **Format**: Starts with `gsk_...`
- **Why needed**: Powers all LLM calls (summarization, debate, chat)

### 2. PINECONE_API_KEY (Required)
- **Description**: API key for Pinecone vector database
- **Get it from**: https://app.pinecone.io
- **Format**: Starts with `pcsk_...`
- **Why needed**: Stores and retrieves document embeddings for semantic search

### 3. PINECONE_INDEX_NAME (Required)
- **Description**: Name of your Pinecone index
- **Get it from**: Your Pinecone dashboard (index must already exist)
- **Example**: `conversational-rag`
- **Why needed**: Specifies which Pinecone index to use for vector storage
- **⚠️ Important**: Index must have dimension=384 (for sentence-transformers/all-MiniLM-L6-v2)

### 4. UPSTASH_REDIS_URL (Required)
- **Description**: Redis connection URL for session storage
- **Get it from**: https://upstash.com (create free Redis database)
- **Format**: Starts with `rediss://`
- **Why needed**: Stores chat history and session data

### 5. UPSTASH_REDIS_TOKEN (Required)
- **Description**: Authentication token for Upstash Redis
- **Get it from**: Upstash Redis dashboard
- **Format**: Long base64-encoded string
- **Why needed**: Authenticates Redis connections

### 6. DATABASE_URL (Optional - Auto-configured)
- **Description**: SQLite database path for document metadata
- **Default**: `sqlite:////app/data/app.db` (set in Dockerfile)
- **Why needed**: Stores uploaded document metadata (filenames, chunk counts, etc.)
- **Note**: You typically don't need to set this as secret - Dockerfile handles it

---

## How to Find Your Values

Check your local `.env` file for these values. They should look like:
- GROQ_API_KEY: Starts with `gsk_...`
- PINECONE_API_KEY: Starts with `pcsk_...`
- PINECONE_INDEX_NAME: Your index name (e.g., `conversational-rag`)
- UPSTASH_REDIS_URL: Starts with `rediss://...`
- UPSTASH_REDIS_TOKEN: Long base64 string

**⚠️ Security**: Never commit these values to git. Only add them as HF Spaces secrets.

---

## Deployment Steps

See `DEPLOYMENT_COMPLETE.md` for full deployment instructions.

**Quick Start**:
1. Create HF Space with Docker SDK
2. Add all 5 secrets in Space Settings
3. Push code to HF Space
4. Wait for build (~5-10 minutes)
5. Test at: `https://YOUR-USERNAME-intellidoc-backend.hf.space`
