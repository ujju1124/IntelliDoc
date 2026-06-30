# IntelliDoc Deployment Verification Checklist

## Current Deployment Status

**Frontend**: https://intelli-doc-dusky.vercel.app ✅ DEPLOYED  
**Backend**: https://intellidoc-2qra.onrender.com ⚠️ BLOCKED (Free tier RAM limit)

---

## Verification Steps for Live Demo

### 1. Backend Health Check
```bash
curl https://intellidoc-2qra.onrender.com/
```

**Expected Response**:
```json
{
  "status": "online",
  "message": "IntelliDoc API - Multi-Agent Document Intelligence Platform",
  "endpoints": ["/ingest", "/chat", "/sessions", "/analyze", "/debate", "/documents"]
}
```

**Current Status**: ❌ Backend crashes on startup due to sentence-transformers + torch requiring >512MB RAM

---

### 2. Frontend Access
1. Navigate to https://intelli-doc-dusky.vercel.app
2. Verify landing page loads with upload interface
3. Check browser console for errors (should be none if backend is online)

**Current Status**: ✅ Frontend deployed successfully, but shows connection errors when backend is down

---

### 3. End-to-End Flow Test (Requires Backend Online)

#### Step 1: Upload Document
1. Go to https://intelli-doc-dusky.vercel.app
2. Click "Upload Document"
3. Select test file (rag_test_document.txt or any PDF)
4. Click "Upload"

**Expected**: Success message + redirect to Dashboard

#### Step 2: Verify Dashboard
1. Check summary appears (3-4 sentences)
2. Verify 5 insights displayed
3. Confirm mindmap renders with central node + branches
4. Check 4 suggested questions appear

**Expected**: All dashboard components load within 5-8 seconds

#### Step 3: Chat Tab
1. Click "Chat" tab on Dashboard
2. Ask a suggested question
3. Verify response appears (simple Q&A, not 4-agent format)

**Expected**: Response within 2-3 seconds

#### Step 4: Debate Feature
1. Click "Start Debate" button
2. Type question: "What are the main challenges discussed?"
3. Wait for all 4 agents to respond

**Expected**:
- Summarizer (blue) → Critic (red) → Devil's Advocate (amber) → Moderator (green)
- Each response 3-5 sentences
- Markdown formatting renders correctly
- Session appears in left sidebar

#### Step 5: Session History
1. Click "New Session" in sidebar
2. Ask another question
3. Verify can switch between sessions
4. Upload different document
5. Click "All" tab in sidebar → verify cross-document sessions show "VIEW" badge

**Expected**: Sessions persist, read-only mode works for other documents

#### Step 6: Document History
1. Click "History" in navbar
2. Verify uploaded documents listed with metadata
3. Click "Analyze" button → verify navigates back to dashboard

**Expected**: All uploads tracked with timestamp, chunk count, strategy

#### Step 7: Export Feature
1. Go to active debate session
2. Click download icon in top bar
3. Verify markdown file downloads with full conversation

**Expected**: `.md` file with all 4 agent responses formatted

---

## Known Deployment Issues

### Backend (Render Free Tier)
**Issue**: sentence-transformers + PyTorch require ~450MB RAM minimum  
**Render Free Tier Limit**: 512MB total (including OS overhead)  
**Result**: OOM (Out of Memory) crash during model loading at startup

**Attempted Solutions (All Failed on Free Tier)**:
1. ❌ CPU-only torch (still 400MB+)
2. ❌ HuggingFace Inference API (DNS blocked on Render free tier)
3. ❌ fastembed with ONNX (still OOM)
4. ❌ Model quantization (insufficient memory even for quantized models)

**Working Solutions**:
- ✅ **Option 1**: Upgrade to Render Starter Plan ($7/month, 1GB RAM)
- ✅ **Option 2**: Deploy to Railway (more generous free tier: ~1GB RAM)
- ✅ **Option 3**: Use local deployment for demo (works perfectly)

### Frontend (Vercel)
**Status**: ✅ No issues  
**Build Time**: ~45 seconds  
**Environment Variables**: `VITE_API_URL` set correctly

---

## Local Verification (Fully Working)

### Prerequisites
- Backend running: `python start_server.py` (port 8000)
- Frontend running: `npm run dev` (port 5173)
- Database initialized: `app.db` created
- All API keys in `.env`

### Test Commands

**Run Integration Tests**:
```bash
python -m pytest tests/test_endpoints.py -v
```
**Expected**: 10/10 tests pass in ~60 seconds

**Run Evaluation**:
```bash
python eval/run_eval.py
```
**Expected**: 5 documents processed, average score ~3.5/5

**Manual E2E Test**:
1. Open http://localhost:5173
2. Upload `tests/fixtures/ai_healthcare.txt`
3. Verify dashboard loads
4. Start debate with question
5. Test all features listed above

---

## Recommended Deployment Strategy

### For Portfolio/Demo
**Current State**: Local deployment fully functional, remote blocked by hosting constraints

**Recommendation**:
1. **Demo Video**: Record 3-5 minute walkthrough showing all features
2. **Screenshots**: Add to README showing dashboard, debate, session history
3. **Local Setup Instructions**: Emphasize easy local setup (documented in README)
4. **Vercel Frontend Only**: Keep deployed as static demo (shows UI/UX quality)

### For Production
**If upgrading backend hosting**:
1. Deploy to Render Starter ($7/month) or Railway
2. Update `VITE_API_URL` in Vercel environment variables
3. Redeploy frontend
4. Run full verification checklist above

---

## Verification Timestamp
**Last Verified**: June 30, 2026  
**Backend Status**: ⚠️ OOM on Render free tier  
**Frontend Status**: ✅ Live at https://intelli-doc-dusky.vercel.app  
**Local Status**: ✅ Fully functional  
**Tests Status**: ✅ 10/10 passing  
**Eval Status**: ✅ 4/5 documents pass (avg 3.5/5)
