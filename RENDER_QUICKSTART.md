# Render Quick Start (10 Minutes)

## What You Need

1. GitHub account (you already have this ✅)
2. Your `.env` file open (to copy API keys)
3. Browser

## Quick Steps

### 1. Sign Up for Render (2 minutes)

- Go to: **https://render.com**
- Click "**Get Started**" or "**Sign Up**"
- **Sign up with GitHub** (click GitHub icon)
- Authorize Render to access your repos

### 2. Create Web Service (3 minutes)

1. Click "**New +**" button (top right)
2. Select "**Web Service**"
3. Find your repository: **IntelliDoc**
4. Click "**Connect**"

### 3. Configure Service (3 minutes)

**Basic Info:**
- Name: `intellidoc-backend`
- Region: Any (default is fine)
- Branch: `master`
- Runtime: **Python 3**

**Build & Start:**
- Build Command: `pip install --upgrade pip && pip install -r requirements.txt`
- Start Command: `python start_server.py`

**Plan:**
- Select: **Free** (512 MB RAM)

### 4. Add Environment Variables (2 minutes)

Click "**Advanced**" then add these 6 variables (copy from your `.env` file):

```
GROQ_API_KEY = your_value_here
PINECONE_API_KEY = your_value_here
PINECONE_INDEX_NAME = your_value_here
UPSTASH_REDIS_URL = your_value_here
UPSTASH_REDIS_TOKEN = your_value_here
DATABASE_URL = sqlite:///./app.db
```

**For each variable:**
1. Click "Add Environment Variable"
2. Paste Key name
3. Paste Value from your `.env`
4. Repeat for all 6

### 5. Deploy! (3-5 minutes)

1. Click "**Create Web Service**" (bottom)
2. Wait for build to complete (watch logs)
3. Look for: `INFO:     Uvicorn running on...`

### 6. Test Your Backend

Copy your Render URL (looks like: `https://intellidoc-backend.onrender.com`)

Open it in browser. Should see:
```json
{
  "status": "online",
  "message": "IntelliDoc API - Multi-Agent Document Intelligence Platform"
}
```

### 7. Update Frontend

Edit `frontend/.env.production`:
```
VITE_API_URL=https://your-render-url-here.onrender.com
```

Save, commit, push:
```bash
git add frontend/.env.production
git commit -m "Update to Render backend"
git push
```

Vercel will auto-deploy.

---

## Done! 🎉

Your backend is live on Render.

**Note:** First request after 15min inactivity takes 30-60s (service wakes up). This is normal for free tier.

---

## Need More Details?

Read: `RENDER_DEPLOYMENT.md`
