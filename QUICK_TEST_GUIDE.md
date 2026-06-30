# IntelliDoc - Quick Testing Guide

## Run Everything in 3 Minutes

### 1. Integration Tests (1 minute)
```bash
python -m pytest tests/test_endpoints.py -v
```
**Expected Output**: `10 passed in ~60 seconds`

### 2. Evaluation (2 minutes)
```bash
python eval/run_eval.py
```
**Expected Output**: 
```
AVERAGE: 3.5/5
Pass rate: 4/5 (80%)
```

### 3. Manual Smoke Test (30 seconds)
```bash
# Backend must be running: python start_server.py
curl http://localhost:8000/
```
**Expected**: `{"status":"online",...}`

---

## What Each Test Does

### Integration Tests (`tests/test_endpoints.py`)
| Test | What It Checks | Why It Matters |
|------|----------------|----------------|
| `test_ingest_successful` | Upload works, returns document_id | Core feature |
| `test_analyze_structure_and_values` | Dashboard has summary/insights/mindmap | Core feature |
| `test_debate_agent_sequence` | 4 agents run in order and reference each other | Core feature |
| `test_invalid_file_type` | Rejects .png files gracefully | Error handling |
| `test_oversized_file` | Handles 11MB file without crashing | Robustness |
| `test_analyze_missing_document` | Returns 404 for bad document_id | Error handling |
| `test_debate_missing_document` | Returns 404 for bad document_id | **Bug we fixed** |
| `test_malformed_pdf` | Corrupt PDF doesn't crash server | Robustness |
| `test_malformed_request_body` | Returns 422 for bad JSON | Validation |
| `test_health_check` | Root endpoint responds | Monitoring |

### Evaluation (`eval/run_eval.py`)
| Document | Topic | Length | Why Included |
|----------|-------|--------|--------------|
| doc1_short_tech.txt | Quantum computing | 60 words | Short technical |
| doc2_medium_science.txt | Microbiome | 120 words | Medium scientific |
| doc3_long_policy.txt | Universal Basic Income | 250 words | Long policy |
| doc4_business.txt | Remote work | 150 words | Business analysis |
| doc5_social.txt | Social media & mental health | 180 words | Social issues |

**Scoring**: LLM-as-judge (Groq scores 1-5) + basic rubric (length, keywords) = final score

---

## If Tests Fail

### Test Failures
```bash
# See detailed errors
python -m pytest tests/test_endpoints.py -v --tb=short

# Run single test
python -m pytest tests/test_endpoints.py::test_name -v
```

### Common Issues
| Error | Cause | Fix |
|-------|-------|-----|
| `ModuleNotFoundError: No module named 'pytest'` | pytest not installed | `pip install pytest httpx` |
| `no such table: documents` | Database not initialized | Tests auto-initialize, but check `app.db` exists |
| `404 Not Found` for analyze/debate | Pinecone empty | Run cleanup: `python cleanup_db.py` then retest |
| `Connection refused` | Backend not running | Tests use `TestClient`, don't need running server |
| Evaluation fails all docs | Database needs init | Script auto-initializes, check `.env` has valid API keys |

---

## Key Files

```
IntelliDoc/
├── tests/
│   ├── test_endpoints.py          ← 10 integration tests
│   └── fixtures/
│       ├── ai_healthcare.txt      ← Test document for ingestion
│       └── sample.txt             ← Climate change doc
├── eval/
│   ├── run_eval.py                ← Evaluation script
│   ├── documents/                 ← 5 test documents
│   │   ├── doc1_short_tech.txt
│   │   ├── doc2_medium_science.txt
│   │   ├── doc3_long_policy.txt
│   │   ├── doc4_business.txt
│   │   └── doc5_social.txt
│   └── references/                ← Human-written summaries
│       ├── doc1_short_tech_reference.txt
│       └── ...
├── TESTING_SUMMARY.md             ← Full testing report
├── DEPLOYMENT_VERIFICATION.md     ← Live demo checklist
└── QUICK_TEST_GUIDE.md            ← This file
```

---

## For Portfolio/Interviews

### What to Say
> "IntelliDoc has 10 integration tests covering document ingestion, multi-agent debate, and error handling — all passing at 100%. I also built an evaluation system that scores summarization quality across 5 diverse documents using LLM-as-judge methodology, achieving 3.5/5 average with 80% pass rate. During testing, I found and fixed a bug where the debate endpoint didn't validate document existence."

### What to Show
1. Run `python -m pytest tests/test_endpoints.py -v` live
2. Show `TESTING_SUMMARY.md` for full report
3. Point to "Known Limitations" in README (shows honesty)
4. Explain the bug you found (debate validation)

### If Asked About Low Score (2.8/5 for doc4)
> "One document scored 2.8 due to the LLM slightly hallucinating 'burnout' and exceeding the length target by 20 characters. This is expected LLM variability — the 80% pass rate at 3.5/5 average shows the system is generally reliable. For production, I'd add post-processing to enforce strict length limits and fact-check against source text."

---

## Quick Stats (For Resume/LinkedIn)

- ✅ 10/10 integration tests passing
- ✅ 80% evaluation pass rate (4/5 documents)
- ✅ 3.5/5 average summary quality score
- ✅ 1 production bug found and fixed during testing
- ✅ 5 diverse test documents (tech, science, policy, business, social)
- ✅ LLM-as-judge + rubric-based evaluation methodology
- ✅ Comprehensive error handling (invalid files, missing data, malformed input)

---

**Last Updated**: June 30, 2026  
**Test Run Time**: ~3 minutes total  
**Pass Criteria**: All integration tests pass, eval average ≥ 3.0/5
