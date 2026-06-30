# Dockerfile for IntelliDoc Backend on Hugging Face Spaces
# Uses CPU-only torch to minimize memory footprint
# Runs on port 7860 (HF Spaces requirement)

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for PDF processing and Python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for Docker layer caching)
COPY requirements.txt .

# Install PyTorch CPU version first (prevents pulling GPU dependencies)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data (required for sentence chunking)
RUN python -c "import nltk; nltk.download('punkt'); nltk.download('punkt_tab')"

# Copy application code
COPY . .

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose port 7860 (HF Spaces requirement)
EXPOSE 7860

# Set environment variable for database path (persistent storage)
ENV DATABASE_URL=sqlite:////app/data/app.db

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:7860/ || exit 1

# Run the application on 0.0.0.0:7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
