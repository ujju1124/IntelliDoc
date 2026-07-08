# Render.com Deployment Guide

Deploy IntelliDoc backend to Render.com (free tier, 512MB RAM, no credit card required initially).

## Prerequisites

- Render.com account (sign up at https://render.com)
- GitHub account
- Your code pushed to GitHub

## Step 1: Sign Up for Render

1. Go to https://render.com
2. Click "Get Started" or "Sign Up"
3. **Sign up with GitHub** (easiest - automatic repo access)
4. Authorize Render to access your GitHub repos

## Step 2: Create a New Web Service

1. From Render Dashboard, click "**New +**" button (top right)
2. Select "**Web Service**"
3. Connect your GitHub repository:
   - If not connected: Click "Connect Account" and authorize GitHub
   - Find and select your **IntelliDoc** repository
4. Click "**Connect**"

## Step 3: Configure the Service

Render should auto-detect settings from `render.yaml`, but verify:

### Basic Settings:
- **Name**: `intellidoc-backend` (or your choice)
- **Region**: Choose closest to you (or Oregon - default)
- **Branch**: `main` (or `master`)
- **Root Directory**: Leave blank (unless your code is in a subdirectory)

### Build Settings:
- **Runtime**: Python 3
- **Build Command**: 
  ```bash
  pip install --upgrade pip && pip install -r requirements.txt
  ```
- **Start Command**:
  ```bash
  python start_server.py
  ```

### Instance Type:
- **Plan**: **Free** (512 MB RAM, sleeps after 15 min inactivity)

## Step 4: Add Environment Variables

Click "**Advanced**" or go to "**Environment**" tab, then add these secrets:

```
GROQ_API_KEY=your_groq_api_key_here
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_INDEX_NAME=your_pinecone_index_name
UPSTASH_REDIS_URL=your_redis_url_here
UPSTASH_REDIS_TOKEN=your_redis_token_here
DATABASE_URL=sqlite:///./app.db
```

**Get these values from your `.env` file!**

### How to Add Each Variable:
1. Click "**Add Environment Variable**"
2. Enter **Key** (e.g., `GROQ_API_KEY`)
3. Enter **Value** (paste from your `.env` file)
4. Repeat for all 6 variables

## Step 5: Deploy

1. Click "**Create Web Service**" (bottom of page)
2. Render will:
   - Clone your repo
   - Install dependencies (~3-5 minutes)
   - Start your backend
3. Watch the logs in real-time

**Expected logs:**
```
==> Installing dependencies...
==> Building...
==> Starting service...
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:XXXXX
```

## Step 6: Get Your Backend URL

Once deployed, Render gives you a URL like:
```
https://intellidoc-backend.onrender.com
```

**Test it!** Open that URL in your browser. You should see:
```json
{
  "status": "online",
  "message": "IntelliDoc API - Multi-Agent Document Intelligence Platform",
  "endpoints": ["/ingest", "/chat", "/sessions", "/analyze", "/debate", "/documents"]
}
```

## Step 7: Update Frontend

Edit `frontend/.env.production`:
```env
VITE_API_URL=https://intellidoc-backend.onrender.com
```

**Replace with your actual Render URL.**

Then commit and push to trigger Vercel redeployment:
```bash
git add frontend/.env.production
git commit -m "Update backend URL to Render"
git push
```

## Render Free Tier Details

✅ **Free Forever** (no credit card for first 90 days)
✅ **512MB RAM** (tight but works with MiniLM model)
✅ **Automatic HTTPS**
✅ **Auto-deploy on git push**

⚠️ **Limitations**:
- Sleeps after 15 minutes of inactivity
- First request after sleep: 30-60 seconds to wake up
- 750 hours/month free (roughly 1 month of 24/7 uptime)

## Managing Your Service

### View Logs:
Dashboard → Your Service → Logs tab

### Redeploy Manually:
Dashboard → Your Service → "Manual Deploy" button → "Deploy latest commit"

### Update Environment Variables:
Dashboard → Your Service → Environment tab → Edit

### Pause Service (Stop Billing Free Hours):
Dashboard → Your Service → Settings → "Suspend Service"

## Troubleshooting

### "Out of Memory" Error
Your embedding model (~80MB) + dependencies should fit in 512MB, but if you see OOM errors:
1. Check logs for actual memory usage
2. Consider reducing dependencies in requirements.txt
3. Upgrade to paid plan ($7/month for 512MB without sleep)

### "Service Unavailable" / 502 Error
- Service is sleeping (first request wakes it up - wait 30-60s)
- Check logs for startup errors
- Verify all environment variables are set correctly

### CORS Errors from Frontend
- Your main.py already includes Vercel CORS config
- Should work automatically

### Build Fails
- Check that all dependencies in requirements.txt are correct
- Verify Python version compatibility (Render uses Python 3.11 by default)
- Check build logs for specific error

## Cost After Free Tier

After 90 days, Render asks for credit card to continue free tier OR:
- Paid plan: $7/month for no-sleep 512MB instance
- At that point, you can migrate to HF Spaces if you have quota

## Rollback Plan

If Render doesn't work:
- Your original HF Spaces Dockerfile is untouched
- render.yaml and start_server.py don't affect other deployments
- Simply delete the Render service from dashboard

---

## Success Criteria

✅ Backend deployed and responding at Render URL
✅ Health check endpoint returns JSON
✅ File upload works (may be slow on first request)
✅ Analysis and debate endpoints functional
✅ Frontend successfully connects

---

**Ready to deploy?** Follow Steps 1-7 above!

Need help? Check Render docs: https://render.com/docs
