"""Redis client for chat memory using Upstash."""
import redis
from app.core.config import settings

# Parse the Redis URL
redis_url = settings.UPSTASH_REDIS_URL

# Initialize Redis client for Upstash
# For newer redis-py versions, SSL is automatically handled via rediss:// URL
redis_client = redis.from_url(
    url=redis_url,
    password=settings.UPSTASH_REDIS_TOKEN,
    decode_responses=True
)


def get_redis_client():
    """Get Redis client instance."""
    return redis_client
