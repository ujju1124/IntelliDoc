# Deta Space Migration Checklist

## What We Created (New Files - Safe to Delete if Migration Fails)

✅ **Spacefile** - Deta Space configuration
✅ **.spaceignore** - Files to exclude from deployment  
✅ **requirements-deta.txt** - Optimized dependencies for Deta
✅ **DETA_DEPLOYMENT.md** - Step-by-step deployment guide
✅ **DETA_MIGRATION_CHECKLIST.md** - This file

## What We DID NOT Touch (Your Original Setup is Safe)

✅ **Dockerfile** - Still works for HF Spaces
✅ **app/** - No code changes needed
✅ **requirements.txt** - Original remains (we create a copy)
✅ **.env** - Your secrets stay local
✅ **All other files** - Unchanged

## Rollback Plan (If Deta Doesn't Work)

If Deta Space deployment fails, simply delete these 5 new files:

```cmd
del Spacefile
del .spaceignore
del requirements-deta.txt
del DETA_DEPLOYMENT.md
del DETA_MIGRATION_CHECKLIST.md
```

Your original HF Spaces setup will remain completely intact.

## Pre-Deployment Checklist

Before running `space push`, make sure you have:

- [ ] Deta Space account created (https://deta.space)
- [ ] Space CLI installed (`space --version` works)
- [ ] Logged in (`space login` completed)
- [ ] Your API keys ready from `.env` file:
  - GROQ_API_KEY
  - PINECONE_API_KEY
  - PINECONE_INDEX_NAME
  - UPSTASH_REDIS_URL
  - UPSTASH_REDIS_TOKEN

## Deployment Steps (Quick Reference)

```cmd
# 1. Navigate to project
cd c:\Users\Ujwal\OneDrive\Desktop\IntelliDoc

# 2. Initialize Space project
space new

# 3. Add secrets
space secrets set GROQ_API_KEY your_key_here
space secrets set PINECONE_API_KEY your_key_here
space secrets set PINECONE_INDEX_NAME your_index_name_here
space secrets set UPSTASH_REDIS_URL your_url_here
space secrets set UPSTASH_REDIS_TOKEN your_token_here

# 4. Copy Deta requirements (temporarily)
copy requirements-deta.txt requirements.txt

# 5. Deploy
space push

# 6. Restore original requirements (optional)
git checkout requirements.txt
```

## Known Limitations

⚠️ **Memory**: Deta free tier = 512MB RAM
- sentence-transformers uses ~450MB
- Should work but might be tight
- If "out of memory" errors occur, we'll need to optimize

⚠️ **Cold Starts**: First request after inactivity may be slow (~30-60s)
- This is similar to HF Spaces free tier
- Subsequent requests will be fast

⚠️ **No GPU**: Deta is CPU-only
- Embeddings generation will be slower than GPU
- Still acceptable for production use

## Success Criteria

✅ Backend responds at Deta URL  
✅ Root endpoint (`/`) returns status JSON
✅ File upload works (`/ingest`)
✅ Analysis endpoint works (`/analyze`)
✅ Debate endpoint works (`/debate`)
✅ Frontend can connect to new backend URL

## If Migration Succeeds

1. Update `frontend/.env.production` with new Deta URL
2. Push frontend to Vercel
3. Update README.md with new backend URL
4. (Optional) Delete HF Spaces files if you want to clean up

## If Migration Fails

1. Delete the 5 new Deta files (see Rollback Plan above)
2. Keep using current setup
3. Consider alternatives:
   - Wait for HF Spaces quota to free up
   - Replace one of your other HF projects
   - Try a different platform

## Questions?

Follow the detailed guide in `DETA_DEPLOYMENT.md`

---

**Remember**: This is a NON-DESTRUCTIVE migration. Your original setup is completely safe.
