# Deta Space Deployment Guide

This guide shows how to deploy IntelliDoc backend to Deta Space (completely free, no credit card required).

## Prerequisites

- Deta Space account (sign up at https://deta.space)
- Space CLI installed on your computer

## Step 1: Install Space CLI

Open Command Prompt and run:

```cmd
powershell -c "irm https://deta.space/assets/space-cli.ps1 | iex"
```

Verify installation:
```cmd
space --version
```

## Step 2: Login to Deta Space

```cmd
space login
```

This will open a browser window. Login with your Deta Space account (you can use GitHub login).

## Step 3: Create a New Space Project

Navigate to your IntelliDoc directory:
```cmd
cd c:\Users\Ujwal\OneDrive\Desktop\IntelliDoc
```

Initialize the Space project (this reads the Spacefile we created):
```cmd
space new
```

When prompted:
- **Project name**: `intellidoc-backend`
- **Confirm Spacefile**: Yes

## Step 4: Add Environment Variables (Secrets)

Add your API keys as secrets (these won't be visible in code):

```cmd
space secrets set GROQ_API_KEY your_groq_key_here
space secrets set PINECONE_API_KEY your_pinecone_key_here
space secrets set PINECONE_INDEX_NAME your_index_name_here
space secrets set UPSTASH_REDIS_URL your_redis_url_here
space secrets set UPSTASH_REDIS_TOKEN your_redis_token_here
```

**Replace `your_*_here` with your actual values from your `.env` file.**

## Step 5: Copy requirements file

Copy the Deta-optimized requirements:
```cmd
copy requirements-deta.txt requirements.txt
```

⚠️ **IMPORTANT**: We're temporarily replacing requirements.txt. Don't worry - we'll restore it after deployment if needed.

## Step 6: Deploy to Deta Space

Push your app to Deta Space:
```cmd
space push
```

This will:
1. Upload your code
2. Install dependencies
3. Start the backend
4. Give you a live URL

**Expected output:**
```
✓ Successfully pushed your code and created a new Micro!
✓ Your app is available at: https://intellidoc-backend-1-x1234567.deta.app
```

## Step 7: Test the Deployment

Open the URL from Step 6 in your browser. You should see:
```json
{
  "status": "online",
  "message": "IntelliDoc API - Multi-Agent Document Intelligence Platform",
  "endpoints": ["/ingest", "/chat", "/sessions", "/analyze", "/debate", "/documents"]
}
```

## Step 8: Update Frontend

Copy your backend URL from Step 6, then update the frontend:

Edit `frontend/.env.production`:
```env
VITE_API_URL=https://intellidoc-backend-1-x1234567.deta.app
```

**Replace with your actual Deta URL.**

## Step 9: Restore Original requirements.txt (Optional)

If you want to keep the HF Spaces setup intact:
```cmd
git checkout requirements.txt
```

Or manually restore from the original file.

## Managing Your Deta Space App

**View logs:**
```cmd
space logs
```

**Update environment variables:**
```cmd
space secrets set KEY_NAME new_value
```

**Redeploy after code changes:**
```cmd
space push
```

**Delete the app (if migration fails):**
```cmd
space delete
```

## Deta Space Limits (Free Tier)

- ✅ Unlimited apps
- ✅ 512MB RAM per app (should be enough for sentence-transformers)
- ✅ Always-on (no cold starts after first load)
- ✅ Custom domains supported
- ✅ No credit card required

## Troubleshooting

### "Module not found" errors
Make sure you ran `copy requirements-deta.txt requirements.txt` before `space push`.

### "Out of memory" errors
Deta Space free tier has 512MB RAM. sentence-transformers uses ~450MB.
- Try using a smaller model in `app/core/embeddings.py`
- Or consider switching to OpenAI embeddings API

### Backend not responding
Check logs: `space logs --follow`

### Need to rollback?
Simply delete the Deta files we created:
- `Spacefile`
- `.spaceignore`
- `requirements-deta.txt`
- `DETA_DEPLOYMENT.md`

Your original setup remains untouched.

## Support

- Deta Space Docs: https://deta.space/docs
- Deta Discord: https://go.deta.dev/discord
- IntelliDoc Issues: Contact developer

---

**Note**: This deployment is experimental. If it doesn't work, all original files (Dockerfile, HF setup) remain unchanged. Simply delete the new Deta files and you're back to the previous state.
