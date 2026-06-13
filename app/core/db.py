"""Database setup and session management."""
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create SQLite engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # Required for SQLite
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency function to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    """Apply lightweight schema migrations that aren't handled by create_all.
    
    SQLAlchemy's create_all only adds new tables, not new columns on existing
    tables. This function handles additive column migrations safely.
    """
    with engine.connect() as conn:
        # Add file_hash column if it doesn't exist (for de-duplication)
        try:
            conn.execute(text("ALTER TABLE documents ADD COLUMN file_hash VARCHAR"))
            conn.commit()
            print("[DB] Migration applied: added file_hash column to documents")
        except Exception:
            pass  # Column already exists — safe to ignore
