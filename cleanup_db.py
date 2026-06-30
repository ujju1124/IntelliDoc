"""Clean up database and Pinecone for fresh start."""
import sys
from app.core.db import SessionLocal
from app.models.db_models import Document
from app.core.pinecone_client import pinecone_index

def cleanup():
    print("🧹 Cleaning up database and Pinecone...")
    
    # 1. Delete all documents from SQLite
    db = SessionLocal()
    try:
        count = db.query(Document).delete()
        db.commit()
        print(f"✅ Deleted {count} documents from SQLite")
    finally:
        db.close()
    
    # 2. Delete all vectors from Pinecone
    try:
        pinecone_index.delete(delete_all=True)
        print("✅ Deleted all vectors from Pinecone")
    except Exception as e:
        print(f"⚠️  Pinecone cleanup warning: {e}")
    
    print("\n✨ Cleanup complete! You can now upload documents fresh.")

if __name__ == "__main__":
    cleanup()
