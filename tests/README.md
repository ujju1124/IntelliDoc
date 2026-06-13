# Tests

Manual backend test scripts used during development.

## Running Tests

Make sure the backend server is running first:
```bash
python start_server.py
```

Then run any test script:
```bash
python tests/test_new_endpoints.py
python tests/test_analyze_fixed.py
```

## Test Files

| File | Purpose |
|---|---|
| `test_new_endpoints.py` | Tests /analyze and /debate endpoints end-to-end |
| `test_analyze_fixed.py` | Verifies insights JSON parsing with robust fallbacks |
| `test_insights_debug.py` | Debug script for insights LLM response inspection |
| `test_generic_fallback.py` | Tests fallback insight generation |
| `final_backend_demo.py` | Full demo script showcasing all endpoints |
