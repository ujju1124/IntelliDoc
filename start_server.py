"""Start the IntelliDoc backend server.

Locally:  python start_server.py  →  http://localhost:8000
Render:   Render sets $PORT automatically, host must be 0.0.0.0
"""
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0" if os.environ.get("RENDER") else "127.0.0.1"

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=False,   # Never reload in production
    )
