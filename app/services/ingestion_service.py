"""Service for document ingestion: extraction, chunking, embedding, and storage."""
import pdfplumber
import uuid
import hashlib
from typing import List, Tuple
from app.core.embeddings import embed
from app.core.pinecone_client import pinecone_index
from app.models.db_models import Document
from sqlalchemy.orm import Session
import nltk

# Download nltk sentence tokenizer data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab')


def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """Extract text from PDF or TXT file."""
    if filename.endswith('.pdf'):
        import io
        text = ""
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    elif filename.endswith('.txt'):
        return file_content.decode('utf-8')
    else:
        raise ValueError("Unsupported file type. Only .pdf and .txt are allowed.")


def content_hash(file_content: bytes) -> str:
    """SHA-256 hash of raw file bytes — used for de-duplication."""
    return hashlib.sha256(file_content).hexdigest()


def chunk_text_fixed(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into fixed-size chunks with overlap."""
    chunks = []
    start = 0
    while start < len(text):
        chunk = text[start:start + chunk_size]
        if chunk.strip():
            chunks.append(chunk)
        start += (chunk_size - overlap)
    return chunks


def chunk_text_sentence(text: str) -> List[str]:
    """Split text on sentence boundaries using nltk."""
    sentences = nltk.sent_tokenize(text)
    return [s.strip() for s in sentences if s.strip()]


def store_in_pinecone(chunks: List[str], embeddings: List[List[float]],
                      filename: str, strategy: str, document_id: str) -> None:
    """Store embeddings and metadata in Pinecone."""
    vectors = []
    for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vectors.append({
            "id": f"{document_id}_{idx}",
            "values": embedding,
            "metadata": {
                "chunk_index": idx,
                "source_filename": filename,
                "strategy": strategy,
                "document_id": document_id,
                "text": chunk,
            }
        })

    # Upsert in batches of 100 (Pinecone best practice)
    for i in range(0, len(vectors), 100):
        pinecone_index.upsert(vectors=vectors[i:i + 100])


def save_document_metadata(db: Session, document_id: str, filename: str,
                           chunk_count: int, strategy: str,
                           file_hash: str) -> None:
    """Save document metadata to SQLite."""
    document = Document(
        document_id=document_id,
        filename=filename,
        chunk_count=chunk_count,
        strategy=strategy,
        file_hash=file_hash,
    )
    db.add(document)
    db.commit()


def ingest_document(file_content: bytes, filename: str, strategy: str,
                    db: Session) -> Tuple[str, int]:
    """Complete document ingestion pipeline with de-duplication.

    If the same file (same content hash + same chunking strategy) was already
    ingested, the existing document_id is returned without re-processing.
    """
    file_hash = content_hash(file_content)

    # ── De-duplication check ──────────────────────────────────────────────────
    existing = (
        db.query(Document)
        .filter(Document.file_hash == file_hash, Document.strategy == strategy)
        .first()
    )
    if existing:
        print(f"[Ingest] Duplicate detected — returning existing document_id: {existing.document_id}")
        return existing.document_id, existing.chunk_count

    # ── Fresh ingestion ───────────────────────────────────────────────────────
    document_id = str(uuid.uuid4())

    # Step 1: Extract text
    text = extract_text_from_file(file_content, filename)

    # Step 2: Chunk
    if strategy == "fixed":
        chunks = chunk_text_fixed(text)
    elif strategy == "sentence":
        chunks = chunk_text_sentence(text)
    else:
        raise ValueError("Invalid strategy. Must be 'fixed' or 'sentence'.")

    # Step 3: Embed (shared singleton model)
    embeddings = embed(chunks)

    # Step 4: Store in Pinecone
    store_in_pinecone(chunks, embeddings, filename, strategy, document_id)

    # Step 5: Save metadata
    save_document_metadata(db, document_id, filename, len(chunks), strategy, file_hash)

    return document_id, len(chunks)
