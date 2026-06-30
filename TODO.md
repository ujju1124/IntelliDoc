# IntelliDoc TODO & Known Issues

## Open Issues

### Issue #1: Fix summarizer hallucination on business/policy documents
**Priority**: Medium  
**Status**: Open  
**Labels**: bug, quality, llm-output

#### Description
The summarization pipeline occasionally introduces plausible-sounding claims that are not grounded in the source document. This was discovered during systematic evaluation testing using `eval/run_eval.py`.

**Specific Failing Case**:
- **Document**: `doc4_business.txt` (The Rise of Remote Work)
- **Score**: 2.8/5 (below 3.0 threshold)
- **Hallucination Detected**: Summary stated "increased burnout" as a drawback of hybrid work, but the source document only mentions "burnout concerns" without claiming burnout has increased
- **LLM Judge Feedback**: "The summary captures the main points of the document, is generally free of hallucinated facts, but includes a minor inaccuracy about burnout, which is not mentioned in the source document."
- **Full Details**: See `eval/eval_results.json`

**Impact**:
- Not blocking for demo/portfolio use (80% pass rate overall)
- Relevant for production deployment where factual accuracy is critical
- Most noticeable on business/policy documents with nuanced claims

#### Proposed Fix

**Option 1: Constrained Extraction Prompting** (Recommended)
- Modify the summarization prompt in `app/routers/analyze.py` to explicitly instruct the LLM to only include claims directly supported by extracted source sentences
- Add explicit instruction: "Do not infer or extrapolate beyond what is explicitly stated in the text"
- Example prompt addition:
  ```
  IMPORTANT: Only include claims that are DIRECTLY stated in the source text.
  Do not extrapolate, infer, or add context not explicitly present.
  If uncertain about a claim, omit it rather than risk including unsupported information.
  ```

**Option 2: Post-hoc Fact Verification Pass** (More thorough but slower)
- After generating summary, run a second LLM call to verify each claim against source chunks
- Prompt: "For each sentence in this summary, identify if it is directly supported by the source document"
- Filter or flag sentences that cannot be verified
- Trade-off: Adds latency (~2-3 seconds) and doubles LLM API calls

**Option 3: Extractive Summarization First** (Hybrid approach)
- First pass: Extract key sentences directly from source (no generation)
- Second pass: Paraphrase and condense extracted sentences only
- Reduces hallucination by grounding generation in exact source quotes

#### Acceptance Criteria
- [ ] Re-run `eval/run_eval.py` and achieve 5/5 pass rate (all documents ≥ 3.0/5)
- [ ] No hallucinations detected by LLM-as-judge on business/policy documents
- [ ] Summary length still within 50-300 character range
- [ ] No significant latency increase (< 1 second additional processing time)

#### References
- Evaluation script: `eval/run_eval.py`
- Failed case details: `eval/eval_results.json`
- Summarization code: `app/routers/analyze.py` (lines ~70-85)
- Test documents: `eval/documents/doc4_business.txt`

---

## Future Enhancements

### Testing & Quality
- [ ] Add load testing with Locust (concurrent request handling)
- [ ] Implement rate limiting per session/user
- [ ] Add frontend E2E tests with Playwright
- [ ] Security audit (OWASP Top 10)
- [ ] Evaluate debate quality (not just summarization)
- [ ] Evaluate mindmap accuracy against document structure

### Production Readiness
- [ ] Add authentication (JWT or OAuth)
- [ ] Implement proper logging with structured output
- [ ] Add monitoring/observability (Sentry, Datadog)
- [ ] Handle large files (>100MB) with streaming upload
- [ ] Multi-user session isolation with user IDs
- [ ] Network failure recovery with retries/fallbacks
- [ ] Deploy backend to hosting with sufficient RAM (Render Starter or Railway)

### Features
- [ ] Export debate as PDF (currently markdown only)
- [ ] Voice input for questions (speech-to-text)
- [ ] Multi-document comparison debates
- [ ] Custom agent personas (user-defined debate styles)
- [ ] Annotation/highlighting in original documents

---

**Last Updated**: June 30, 2026  
**Issue Count**: 1 open, 0 closed
