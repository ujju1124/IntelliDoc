# Deta Space Quick Start (5 Minutes)

## What You Need

1. Your `.env` file open (to copy API keys)
2. Command Prompt open
3. Internet connection

## Step 1: Install Space CLI (2 minutes)

```cmd
powershell -c "irm https://deta.space/assets/space-cli.ps1 | iex"
```

Wait for installation to complete, then verify:
```cmd
space --version
```

## Step 2: Login (1 minute)

```cmd
space login
```

A browser will open. Login with:
- GitHub account (recommended), OR
- Email

## Step 3: Deploy (2 minutes)

Navigate to IntelliDoc:
```cmd
cd c:\Users\Ujwal\OneDrive\Desktop\IntelliDoc
```

Initialize project:
```cmd
space new
```

Enter project name when prompted:
```
intellidoc-backend
```

Add your secrets (copy values from your `.env` file):
```cmd
space secrets set GROQ_API_KEY paste_your_key_here
space secrets set PINECONE_API_KEY paste_your_key_here
space secrets set PINECONE_INDEX_NAME paste_your_index_here
space secrets set UPSTASH_REDIS_URL paste_your_url_here
space secrets set UPSTASH_REDIS_TOKEN paste_your_token_here
```

**Copy Deta requirements:**
```cmd
copy requirements-deta.txt requirements.txt
```

**Deploy:**
```cmd
space push
```

Wait 2-3 minutes for deployment. You'll get a URL like:
```
https://intellidoc-backend-1-x1234567.deta.app
```

## Step 4: Test

Open the URL in your browser. You should see:
```json
{
  "status": "online",
  "message": "IntelliDoc API - Multi-Agent Document Intelligence Platform"
}
```

## Step 5: Update Frontend

Edit `frontend/.env.production`:
```env
VITE_API_URL=https://intellidoc-backend-1-x1234567.deta.app
```

**Save, commit, and push to trigger Vercel deployment.**

## Done! 🎉

Your backend is now live on Deta Space (free forever, no credit card).

---

## If Something Goes Wrong

**See logs:**
```cmd
space logs --follow
```

**Redeploy:**
```cmd
space push
```

**Delete and start over:**
```cmd
space delete
```

**Rollback completely:**
```cmd
del Spacefile
del .spaceignore  
del requirements-deta.txt
del DETA_*.md
```

Your original HF setup is untouched.

---

## Need More Detail?

Read: `DETA_DEPLOYMENT.md`
