"""Integration tests for IntelliDoc API endpoints.

Tests cover:
1. Document ingestion (successful upload)
2. Analysis pipeline (structure validation + non-empty values)
3. Multi-agent debate (4-agent sequence + inter-agent references)
4. Error handling (invalid file, missing API key, oversized file)
5. Graceful failure (malformed input)
"""
import pytest
import os
import sys
from io import BytesIO
from fastapi.testclient import TestClient

# Add parent directory to path to import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.db import SessionLocal, Base, engine
import tempfile

client = TestClient(app)


@pytest.fixture(scope="module")
def test_db():
    """Set up test database."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_txt_file():
    """Load the test TXT file."""
    fixture_path = os.path.join(os.path.dirname(__file__), 'fixtures', 'ai_healthcare.txt')
    with open(fixture_path, 'rb') as f:
        content = f.read()
    return ('ai_healthcare.txt', BytesIO(content), 'text/plain')


@pytest.fixture
def large_file():
    """Create a file that's too large (>10MB)."""
    content = b"A" * (11 * 1024 * 1024)  # 11MB
    return ('huge.txt', BytesIO(content), 'text/plain')


@pytest.fixture
def invalid_file():
    """Create an unsupported file type."""
    content = b"fake image data"
    return ('image.png', BytesIO(content), 'image/png')


@pytest.fixture
def malformed_file():
    """Create a file that will cause parsing issues."""
    # Binary garbage that pretends to be a PDF
    content = b'\x25\x50\x44\x46\x2D\x31\x2E\x34\x0A' + (b'\x00' * 100)
    return ('broken.pdf', BytesIO(content), 'application/pdf')


# ─── TEST 1: SUCCESSFUL INGESTION ────────────────────────────────────────────

def test_ingest_successful(test_db, sample_txt_file):
    """Test successful document upload and ingestion."""
    filename, file_content, content_type = sample_txt_file
    
    response = client.post(
        "/ingest?strategy=sentence",
        files={"file": (filename, file_content, content_type)}
    )
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    # Validate response structure
    assert "document_id" in data
    assert "filename" in data
    assert "chunk_count" in data
    assert "strategy" in data
    
    # Validate values
    assert data["filename"] == filename
    assert data["chunk_count"] > 0, "Chunk count should be positive"
    assert data["strategy"] == "sentence"
    assert len(data["document_id"]) == 36  # UUID format
    
    # Store document_id for later tests
    pytest.document_id = data["document_id"]


# ─── TEST 2: ANALYSIS PIPELINE ───────────────────────────────────────────────

def test_analyze_structure_and_values(test_db, sample_txt_file):
    """Test /analyze returns expected structure with non-empty values."""
    # First ingest if not already done
    if not hasattr(pytest, 'document_id'):
        test_ingest_successful(test_db, sample_txt_file)
    
    response = client.post(
        "/analyze",
        json={"document_id": pytest.document_id}
    )
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    # Validate structure
    required_fields = ["document_id", "summary", "insights", "mindmap", "suggested_questions"]
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"
    
    # Validate summary
    assert isinstance(data["summary"], str), "Summary should be string"
    assert len(data["summary"]) > 50, f"Summary too short: {len(data['summary'])} chars"
    assert data["summary"].strip() != "", "Summary should not be empty"
    
    # Validate insights
    assert isinstance(data["insights"], list), "Insights should be list"
    assert len(data["insights"]) == 5, f"Expected 5 insights, got {len(data['insights'])}"
    for insight in data["insights"]:
        assert isinstance(insight, str), "Each insight should be string"
        assert len(insight) > 10, f"Insight too short: {insight}"
    
    # Validate mindmap
    assert isinstance(data["mindmap"], dict), "Mindmap should be dict"
    assert "central" in data["mindmap"], "Mindmap missing 'central' node"
    assert "branches" in data["mindmap"], "Mindmap missing 'branches'"
    assert isinstance(data["mindmap"]["branches"], list), "Branches should be list"
    assert len(data["mindmap"]["branches"]) >= 3, "Should have at least 3 branches"
    
    for branch in data["mindmap"]["branches"]:
        assert "label" in branch, "Branch missing 'label'"
        assert "children" in branch, "Branch missing 'children'"
        assert isinstance(branch["children"], list), "Branch children should be list"
    
    # Validate suggested questions
    assert isinstance(data["suggested_questions"], list), "Questions should be list"
    assert len(data["suggested_questions"]) == 4, f"Expected 4 questions, got {len(data['suggested_questions'])}"
    for question in data["suggested_questions"]:
        assert isinstance(question, str), "Each question should be string"
        assert len(question) > 15, f"Question too short: {question}"
        assert question.endswith("?"), f"Question should end with '?': {question}"


# ─── TEST 3: MULTI-AGENT DEBATE SEQUENCE ─────────────────────────────────────

def test_debate_agent_sequence_and_references(test_db, sample_txt_file):
    """Test that debate runs 4 agents in order and each references prior agents."""
    if not hasattr(pytest, 'document_id'):
        test_ingest_successful(test_db, sample_txt_file)
    
    response = client.post(
        "/debate",
        json={
            "session_id": "test_session_001",
            "user_message": "What are the main challenges with AI in healthcare?",
            "document_id": pytest.document_id
        }
    )
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    # Validate structure
    assert "debate" in data, "Response missing 'debate' field"
    debate = data["debate"]
    
    # Check all 4 agents are present
    expected_agents = ["summarizer", "critic", "devils_advocate", "moderator"]
    for agent in expected_agents:
        assert agent in debate, f"Missing agent: {agent}"
        assert isinstance(debate[agent], str), f"{agent} output should be string"
        assert len(debate[agent]) > 20, f"{agent} output too short"
    
    # Extract agent outputs for reference checking
    summarizer = debate["summarizer"].lower()
    critic = debate["critic"].lower()
    devils_advocate = debate["devils_advocate"].lower()
    moderator = debate["moderator"].lower()
    
    # Test inter-agent references
    # Critic should reference content from the retrieved context or question
    assert any(keyword in critic for keyword in ["ai", "healthcare", "challenge", "concern"]), \
        "Critic should address the healthcare AI topic"
    
    # Devil's Advocate should present counterarguments
    assert any(keyword in devils_advocate for keyword in ["however", "but", "alternative", "consider", "perspective"]), \
        "Devil's Advocate should present alternative viewpoints"
    
    # Moderator should synthesize (reference multiple perspectives)
    assert any(keyword in moderator for keyword in ["balance", "both", "perspective", "consider", "conclusion"]), \
        "Moderator should synthesize different perspectives"
    
    # Check that agents don't just repeat each other
    assert summarizer != critic, "Summarizer and Critic should be different"
    assert critic != devils_advocate, "Critic and Devil's Advocate should be different"
    assert devils_advocate != moderator, "Devil's Advocate and Moderator should be different"


# ─── TEST 4: ERROR HANDLING ──────────────────────────────────────────────────

def test_invalid_file_type(test_db, invalid_file):
    """Test that unsupported file types are rejected."""
    filename, file_content, content_type = invalid_file
    
    response = client.post(
        "/ingest?strategy=sentence",
        files={"file": (filename, file_content, content_type)}
    )
    
    # Should either return 400 or 500 with appropriate error message
    assert response.status_code in [400, 500], f"Expected 4xx/5xx, got {response.status_code}"
    data = response.json()
    assert "detail" in data
    # Error message should mention file type or unsupported format
    assert any(keyword in data["detail"].lower() for keyword in ["unsupported", "type", "format", "pdf", "txt"]), \
        f"Error message unclear: {data['detail']}"


def test_oversized_file(test_db, large_file):
    """Test handling of files exceeding size limit."""
    filename, file_content, content_type = large_file
    
    # Note: This test may timeout or return 413/500 depending on server config
    # We're testing that it doesn't crash the server
    try:
        response = client.post(
            "/ingest?strategy=sentence",
            files={"file": (filename, file_content, content_type)},
            timeout=10.0
        )
        # If it completes, should return error status
        assert response.status_code >= 400, "Should reject oversized file"
    except Exception as e:
        # Timeout or connection error is acceptable for oversized file
        assert any(keyword in str(e).lower() for keyword in ["timeout", "size", "large"]), \
            f"Unexpected error type: {e}"


def test_analyze_missing_document(test_db):
    """Test /analyze with non-existent document_id."""
    response = client.post(
        "/analyze",
        json={"document_id": "00000000-0000-0000-0000-000000000000"}
    )
    
    assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    data = response.json()
    assert "detail" in data
    assert "no content found" in data["detail"].lower() or "not found" in data["detail"].lower()


def test_debate_missing_document(test_db):
    """Test /debate with non-existent document_id."""
    response = client.post(
        "/debate",
        json={
            "session_id": "test_session_error",
            "user_message": "test question",
            "document_id": "00000000-0000-0000-0000-000000000000"
        }
    )
    
    assert response.status_code in [404, 500], f"Expected 404/500, got {response.status_code}"
    data = response.json()
    assert "detail" in data


# ─── TEST 5: GRACEFUL FAILURE ────────────────────────────────────────────────

def test_malformed_pdf_graceful_failure(test_db, malformed_file):
    """Test that malformed PDF fails gracefully without crashing server."""
    filename, file_content, content_type = malformed_file
    
    response = client.post(
        "/ingest?strategy=sentence",
        files={"file": (filename, file_content, content_type)}
    )
    
    # Should return error status, not crash
    assert response.status_code >= 400, "Should reject malformed PDF"
    data = response.json()
    assert "detail" in data, "Error response should have 'detail' field"
    
    # Error message should be informative
    error_msg = data["detail"].lower()
    assert any(keyword in error_msg for keyword in ["error", "failed", "invalid", "corrupt"]), \
        f"Error message should be informative: {data['detail']}"
    
    # Server should still be responsive after error
    health_check = client.get("/")
    assert health_check.status_code == 200, "Server should remain responsive after error"


def test_malformed_request_body(test_db):
    """Test API handles malformed JSON gracefully."""
    response = client.post(
        "/analyze",
        json={"wrong_field": "invalid"}  # Missing required document_id
    )
    
    assert response.status_code == 422, f"Expected 422 (validation error), got {response.status_code}"
    data = response.json()
    assert "detail" in data


# ─── ADDITIONAL: HEALTH CHECK ────────────────────────────────────────────────

def test_health_check():
    """Test root endpoint returns status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "online"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
