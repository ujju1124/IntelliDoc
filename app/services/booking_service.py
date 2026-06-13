"""Service for booking intent detection and extraction."""
import json
import uuid
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.db_models import Booking
from app.models.schemas import BookingData
from app.services.llm_service import call_groq_api


# Keywords for booking intent detection
BOOKING_KEYWORDS = ["book", "schedule", "interview", "appointment", "available", "meeting", "slot"]


def detect_booking_intent(user_message: str) -> bool:
    """Check if user message contains booking-related keywords."""
    message_lower = user_message.lower()
    return any(keyword in message_lower for keyword in BOOKING_KEYWORDS)


def extract_booking_info(conversation_messages: List[dict]) -> Optional[BookingData]:
    """Extract booking information using Groq API with robust JSON parsing."""
    
    # Build conversation context (last 5 messages including current)
    conversation_text = ""
    for msg in conversation_messages[-5:]:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == "user":
            conversation_text += f"User: {content}\n"
        elif role == "assistant":
            conversation_text += f"Assistant: {content}\n"
    
    # Improved extraction prompt with stricter instructions
    extraction_prompt = f"""Extract booking information from this conversation.

Conversation:
{conversation_text}

Extract these fields if present:
- name: Full name of the person
- email: Email address
- date: Date of appointment (any format)
- time: Time of appointment (any format)

IMPORTANT: Return ONLY a valid JSON object with these exact keys. Use null for missing fields.
Do not add explanations, markdown, or any other text.

Required format:
{{"name": null, "email": null, "date": null, "time": null}}"""
    
    try:
        # Call Groq API for extraction WITH JSON MODE for guaranteed valid JSON
        response = call_groq_api(extraction_prompt, json_mode=True)
        
        # With json_mode=True, Groq guarantees valid JSON
        # Still clean whitespace
        response_clean = response.strip()
        
        # Parse JSON (should be clean now)
        booking_dict = json.loads(response_clean)
        
        # Validate with Pydantic (this ensures type safety and validation)
        # Pydantic will handle None/null values and validate the structure
        booking_data = BookingData(**booking_dict)
        
        # Only return if at least one field is present
        if all(v is None for v in [booking_data.name, booking_data.email, 
                                     booking_data.date, booking_data.time]):
            print("Booking extraction: All fields are null, returning None")
            return None
        
        return booking_data
        
    except json.JSONDecodeError as e:
        print(f"Booking extraction error: Invalid JSON - {e}")
        print(f"Response was: {response_clean}")
        return None
    except Exception as e:
        print(f"Booking extraction error: {e}")
        return None


def save_booking(db: Session, session_id: str, booking_data: BookingData) -> str:
    """Save booking to SQLite database."""
    booking_id = str(uuid.uuid4())
    
    booking = Booking(
        booking_id=booking_id,
        session_id=session_id,
        name=booking_data.name,
        email=booking_data.email,
        date=booking_data.date,
        time=booking_data.time
    )
    
    db.add(booking)
    db.commit()
    
    return booking_id


def process_booking(db: Session, session_id: str, user_message: str, 
                   chat_history: List[dict]) -> Optional[BookingData]:
    """Process booking intent: detect, extract, and save."""
    
    # Check for booking intent
    if not detect_booking_intent(user_message):
        return None
    
    # Build conversation including current message
    conversation = chat_history + [{"role": "user", "content": user_message}]
    
    # Extract booking information
    booking_data = extract_booking_info(conversation)
    
    if booking_data:
        # Save to database
        save_booking(db, session_id, booking_data)
        return booking_data
    
    return None
