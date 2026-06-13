"""Service for document ingestion: extraction, chunking, embedding, and storage."""
import pdfplumber
import uuid
from typing import List, Tuple
from sentence_transformers import SentenceTransformer
from app.core.pinecone_client import pinecone_index
from app.models.db_models import Document
from sqlalchemy.orm import Session
import nltk

# Download nltk sentence tokenizer data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

# Initialize embedding model (384 dimensions)
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')


def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """Extract text from PDF or TXT file."""
    if filename.endswith('.pdf'):
        # Extract text from PDF using pdfplumber
        import io
        text = ""
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    elif filename.endswith('.txt'):
        # Read text file directly
        return file_content.decode('utf-8')
    else:
        raise ValueError("Unsupported file type. Only .pdf and .txt are allowed.")


def chunk_text_fixed(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into fixed-size chunks with overlap."""
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():  # Only add non-empty chunks
            chunks.append(chunk)
        start += (chunk_size - overlap)
    
    return chunks


def chunk_text_sentence(text: str) -> List[str]:
    """Split text on sentence boundaries using nltk."""
    sentences = nltk.sent_tokenize(text)
    return [s.strip() for s in sentences if s.strip()]


def generate_embeddings(chunks: List[str]) -> List[List[float]]:
    """Generate embeddings for text chunks using sentence-transformers."""
    embeddings = embedding_model.encode(chunks, convert_to_tensor=False)
    return embeddings.tolist()


def store_in_pinecone(chunks: List[str], embeddings: List[List[float]], 
                     filename: str, strategy: str, document_id: str) -> None:
    """Store embeddings and metadata in Pinecone."""
    vectors = []
    
    for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vector_id = f"{document_id}_{idx}"
        metadata = {
            "chunk_index": idx,
            "source_filename": filename,
            "strategy": strategy,
            "document_id": document_id,
            "text": chunk
        }
        vectors.append({
            "id": vector_id,
            "values": embedding,
            "metadata": metadata
        })
    
    # Upsert vectors in batches of 100 (Pinecone best practice)
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        pinecone_index.upsert(vectors=batch)


def save_document_metadata(db: Session, document_id: str, filename: str, 
                          chunk_count: int, strategy: str) -> None:
    """Save document metadata to SQLite."""
    document = Document(
        document_id=document_id,
        filename=filename,
        chunk_count=chunk_count,
        strategy=strategy
    )
    db.add(document)
    db.commit()


def ingest_document(file_content: bytes, filename: str, strategy: str, db: Session) -> Tuple[str, int]:
    """Complete document ingestion pipeline."""
    # Generate unique document ID
    document_id = str(uuid.uuid4())
    
    # Step 1: Extract text
    text = extract_text_from_file(file_content, filename)
    
    # Step 2: Chunk text based on strategy
    if strategy == "fixed":
        chunks = chunk_text_fixed(text)
    elif strategy == "sentence":
        chunks = chunk_text_sentence(text)
    else:
        raise ValueError("Invalid strategy. Must be 'fixed' or 'sentence'.")
    
    # Step 3: Generate embeddings
    embeddings = generate_embeddings(chunks)
    
    # Step 4: Store in Pinecone
    store_in_pinecone(chunks, embeddings, filename, strategy, document_id)
    
    # Step 5: Save metadata to SQLite
    save_document_metadata(db, document_id, filename, len(chunks), strategy)
    
    return document_id, len(chunks)
