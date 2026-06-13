"""Debug insights generation to see what LLM returns."""
import requests
import json

document_id = "6678ca70-67e6-4334-8134-00b4ee794a63"

print("Testing /analyze endpoint to debug insights...")
print("=" * 60)

response = requests.post(
    "http://127.0.0.1:8000/analyze",
    json={"document_id": document_id}
)

if response.status_code == 200:
    result = response.json()
    
    print("Status: 200 OK\n")
    print("Insights received:")
    for i, insight in enumerate(result['insights'], 1):
        print(f"{i}. {insight}")
    
    print("\n" + "=" * 60)
    
    # Check if these are fallback insights
    fallback_phrases = [
        "This document contains key information",
        "Multiple important concepts",
        "noteworthy perspectives",
        "Key themes emerge",
        "Further analysis"
    ]
    
    is_fallback = any(phrase in str(result['insights']) for phrase in fallback_phrases)
    
    if is_fallback:
        print("⚠️  FALLBACK INSIGHTS DETECTED")
        print("This means the LLM didn't return valid JSON.\n")
        print("Let me test the raw LLM response...")
    else:
        print("✅ LLM-generated insights (not fallback)")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
