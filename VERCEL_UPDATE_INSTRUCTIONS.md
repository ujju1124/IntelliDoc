# Update Vercel Frontend to Use HF Spaces Backend

## Backend Deployment Status
✅ Code pushed to: `https://huggingface.co/spaces/Ujju33/intellidoc-backend`

HF Spaces is now building your Docker container. This takes **5-10 minutes** for the first build.

---

## Step 1: Wait for HF Spaces Build to Complete

1. Go to: https://huggingface.co/spaces/Ujju33/intellidoc-backend
2. Click the **"Logs"** tab
3. Wait until you see: `Application startup complete` and `Uvicorn running on http://0.0.0.0:7860`
4. The Space will show "Running" status (green indicator)

**Build Progress Stages:**
- Building Docker image (~3 minutes)
- Installing PyTorch CPU (~2 minutes)
- Installing dependencies (~2 minutes)
- Downloading NLTK data (~1 minute)
- Starting application (~1 minute)

---

## Step 2: Test the Backend

Once the build completes, test the backend:

```bash
# Test health endpoint
curl https://Ujju33-intellidoc-backend.hf.space/

# Expected response:
{
  "status": "online",
  "message": "IntelliDoc API - Multi-Agent Document Intelligence Platform",
  "endpoints": ["/ingest", "/chat", "/sessions", "/analyze", "/debate", "/documents"]
}
```

**If you get an error**, check:
- All 5 secrets are added in Space Settings → Repository secrets
- Build logs show no errors
- Space status is "Running"

---

## Step 3: Update Vercel Frontend Environment Variable

### Option A: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Select your `intelli-doc` project (or whatever your frontend project is named)
3. Click **Settings** tab
4. Click **Environment Variables** in left sidebar
5. Find `VITE_API_URL` variable
6. Click the **"..."** menu → **Edit**
7. Change value from:
   ```
   https://intellidoc-2qra.onrender.com
   ```
   To:
   ```
   https://Ujju33-intellidoc-backend.hf.space
   ```
8. Select which environments to update:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
9. Click **Save**

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login
vercel login

# Set environment variable
vercel env add VITE_API_URL production
# When prompted, enter: https://Ujju33-intellidoc-backend.hf.space

# Repeat for preview and development
vercel env add VITE_API_URL preview
vercel env add VITE_API_URL development
```

---

## Step 4: Redeploy Vercel Frontend

Environment variable changes require a redeploy to take effect.

### Option A: Via Dashboard
1. In Vercel dashboard → your project
2. Click **Deployments** tab
3. Find the latest deployment
4. Click **"..."** menu → **Redeploy**
5. Check "Use existing Build Cache" ✅
6. Click **Redeploy**

### Option B: Via Git Push
```bash
cd frontend

# Trigger redeploy with empty commit
git commit --allow-empty -m "Update API URL to HF Spaces"
git push
```

### Option C: Via CLI
```bash
vercel --prod
```

---

## Step 5: Verify End-to-End

1. Go to: https://intelli-doc-dusky.vercel.app
2. Open browser DevTools (F12) → Console tab
3. Upload a document (use `rag_test_document.txt` or any PDF)
4. **Check Console** - should see no CORS errors
5. Verify dashboard loads with summary, insights, mindmap
6. Try starting a debate
7. Check all 4 agents respond

**Expected Behavior:**
- ✅ No CORS errors in console
- ✅ Upload works
- ✅ Dashboard loads in 5-8 seconds
- ✅ Debate agents respond sequentially
- ✅ Session history saves

**If you see CORS errors:**
- Backend CORS is configured for `*.vercel.app`
- Check backend logs: https://huggingface.co/spaces/Ujju33/intellidoc-backend (Logs tab)
- Verify your Vercel URL matches the pattern

---

## Step 6: Update GitHub Repo (Optional)

Update your GitHub README to reflect the new deployment:

```bash
# In your local repo
cd /path/to/IntelliDoc

# Update DEPLOYMENT_VERIFICATION.md
# Change backend URL from Render to HF Spaces

git add DEPLOYMENT_VERIFICATION.md
git commit -m "Update deployment docs: migrated backend to HF Spaces"
git push origin master
```

---

## Troubleshooting

### Backend shows "Building" for >15 minutes
- Check Logs tab for errors
- Common issue: Missing secrets (add all 5 required variables)
- Try: Settings → Factory reboot

### Frontend still connects to old Render URL
- Verify environment variable was saved correctly
- Clear Vercel build cache: redeploy without cache
- Check frontend build logs for `VITE_API_URL` value

### CORS errors persist
- Confirm backend is running (test health endpoint)
- Check backend logs for incoming requests
- Verify Vercel URL matches pattern: `https://*.vercel.app`

### Backend responds slowly (30+ seconds)
- HF Spaces free tier sleeps after 48 hours of inactivity
- First request after sleep takes 30-60 seconds (cold start)
- Subsequent requests are fast (~1-2 seconds)
- **Solution**: Upgrade to CPU Upgrade ($21/month) for always-on

### Upload fails with 500 error
- Check backend logs for error details
- Verify Pinecone index exists and has dimension=384
- Verify all 5 secrets are set correctly
- Test with a small file first (<1MB)

---

## Summary

**What You Just Did:**
1. ✅ Pushed IntelliDoc backend to HF Spaces
2. ⏳ Backend is building (wait 5-10 minutes)
3. ⏭️ Update Vercel env var to new backend URL
4. ⏭️ Redeploy frontend
5. ⏭️ Test end-to-end

**New URLs:**
- Backend: `https://Ujju33-intellidoc-backend.hf.space`
- Frontend: `https://intelli-doc-dusky.vercel.app` (unchanged)
- API Docs: `https://Ujju33-intellidoc-backend.hf.space/docs`

**Cost:**
- HF Spaces CPU Basic: **$0/month** (with 48hr sleep)
- Vercel Frontend: **$0/month**
- **Total: FREE** 🎉

---

## Next Steps After Successful Deployment

1. **Update Portfolio Links**
   - LinkedIn project link → https://intelli-doc-dusky.vercel.app
   - GitHub README → Add "Live Demo" link

2. **Monitor Usage**
   - HF Spaces shows request count in dashboard
   - Vercel shows pageviews and API calls

3. **Consider Upgrades** (Optional)
   - HF Spaces CPU Upgrade ($21/month) for always-on
   - Vercel Pro ($20/month) for custom domain

4. **Add Analytics** (Optional)
   - Vercel Analytics (built-in)
   - Google Analytics
   - PostHog (free tier)

---

**Questions?** Check:
- HF Spaces docs: https://huggingface.co/docs/hub/spaces-overview
- Vercel docs: https://vercel.com/docs
- Your backend logs: https://huggingface.co/spaces/Ujju33/intellidoc-backend (Logs tab)
