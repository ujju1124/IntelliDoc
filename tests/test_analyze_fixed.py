"""Test the improved analyze endpoint."""
import requests
import json

# Test with the uploaded document
document_id = "6678ca70-67e6-4334-8134-00b4ee794a63"

print("Testing improved /analyze endpoint...")
print("=" * 60)

response = requests.post(
    "http://127.0.0.1:8000/analyze",
    json={"document_id": document_id}
)

print(f"Status: {response.status_code}\n")

if response.status_code == 200:
    result = response.json()
    
    print("=== SUMMARY ===")
    print(result['summary'][:300], "...\n")
    
    print(f"=== INSIGHTS (Count: {len(result['insights'])}) ===")
    for i, insight in enumerate(result['insights'], 1):
        print(f"{i}. {insight}")
    
    print("\n=== MIND MAP ===")
    print(f"Central: {result['mindmap']['central']}")
    print(f"Branches: {len(result['mindmap']['branches'])}")
    for branch in result['mindmap']['branches']:
        print(f"  - {branch['label']}: {len(branch['children'])} children")
    
    print("\n" + "=" * 60)
    print("✅ All fields populated successfully!")
else:
    print(f"❌ Error: {response.text}")
