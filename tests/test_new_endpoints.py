"""Test script for new IntelliDoc endpoints."""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health check endpoint."""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")

def test_analyze(document_id):
    """Test analyze endpoint."""
    print(f"Testing analyze endpoint with document_id: {document_id}...")
    response = requests.post(
        f"{BASE_URL}/analyze",
        json={"document_id": document_id}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Summary: {data['summary'][:100]}...")
        print(f"Insights count: {len(data['insights'])}")
        print(f"Mindmap central: {data['mindmap']['central']}")
        print(f"Branches: {len(data['mindmap']['branches'])}\n")
    else:
        print(f"Error: {response.text}\n")

def test_debate(session_id, user_message, document_id):
    """Test debate endpoint."""
    print(f"Testing debate endpoint...")
    response = requests.post(
        f"{BASE_URL}/debate",
        json={
            "session_id": session_id,
            "user_message": user_message,
            "document_id": document_id
        }
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Summarizer: {data['debate']['summarizer'][:80]}...")
        print(f"Critic: {data['debate']['critic'][:80]}...")
        print(f"Devil's Advocate: {data['debate']['devils_advocate'][:80]}...")
        print(f"Moderator: {data['debate']['moderator'][:80]}...\n")
    else:
        print(f"Error: {response.text}\n")

if __name__ == "__main__":
    print("=" * 60)
    print("IntelliDoc API Test Suite")
    print("=" * 60 + "\n")
    
    # Test 1: Health check
    test_health()
    
    # Test 2 & 3: Replace with actual document_id after ingesting a document
    document_id = input("Enter a document_id to test (or press Enter to skip): ").strip()
    
    if document_id:
        test_analyze(document_id)
        test_debate("test-session-001", "What are the main arguments?", document_id)
    else:
        print("Skipping analyze and debate tests. Upload a document first!")
        print("\nTo test:")
        print("1. Upload a document using /ingest endpoint")
        print("2. Copy the document_id from the response")
        print("3. Run this script again with that document_id")
