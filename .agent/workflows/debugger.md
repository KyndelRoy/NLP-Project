---
description: Advanced debugging workflow with root cause analysis and post-mortem.
---

# Debugger (V2)

A rigorous, scientific approach to isolating and eliminating bugs.

## Steps

### 1. Evidence Gathering
- Capture logs, screenshots, or stack traces.
- Identify the exact environment (OS, Version, Branch).

### 2. Reproduction & Isolation
- Create a minimal reproduction script (repro.py/repro.js).
- **Rule of Halves**: Comment out halves of the logic until the bug disappears to isolate the culprit.

### 3. Root Cause Analysis (RCA)
- Identify *why* the bug occurred:
    - Logic Error?
    - Type Mismatch?
    - Race Condition?
    - External Dependency?

### 4. Surgical Fix
- Implement the fix with zero side effects.
- Add "Guardrails" (asserts or checks) to prevent this specific bug from returning.

### 5. Automated Regression Test
- Convert the reproduction script into a permanent unit test.

### 6. Post-Mortem
- Briefly document the fix in `CHANGELOG.md`.
- Suggest a "Lesson Learned" to prevent similar bugs in other areas of the codebase.
