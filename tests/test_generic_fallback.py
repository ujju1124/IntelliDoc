"""Test the generic fallback insights."""
import requests
import json

# Test with a document that might trigger fallback
document_id = "6678ca70-67e6-4334-8134-00b4ee794a63"

print("Testing generic fallback insights...")
print("=" * 60)

response = requests.post(
    "http://127.0.0.1:8000/analyze",
    json={"document_id": document_id}
)

if response.status_code == 200:
    result = response.json()
    
    print(f"✅ Status: {response.status_code}\n")
    print(f"Insights Count: {len(result['insights'])}\n")
    
    print("Insights:")
    for i, insight in enumerate(result['insights'], 1):
        print(f"  {i}. {insight}")
    
    print("\n" + "=" * 60)
    
    # Check if generic fallback was used
    generic_phrases = [
        "This document contains key information",
        "Multiple important concepts",
        "noteworthy perspectives",
        "Key themes emerge",
        "Further analysis"
    ]
    
    is_fallback = any(phrase in insight for insight in result['insights'] for phrase in generic_phrases)
    
    if is_fallback:
        print("⚠️  Generic fallback insights detected")
        print("This is expected if LLM fails to return valid JSON")
    else:
        print("✅ LLM-generated insights successfully parsed")
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)
