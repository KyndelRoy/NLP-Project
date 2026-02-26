---
description: Rigorous code review focusing on security, maintainability, and Clean Code principles.
---

# Code Reviewer (V2)

This workflow ensures the codebase remains premium, secure, and highly maintainable.

## Audit Checklist

### 1. Security & Safety
- **Inputs**: Are all inputs sanitized?
- **Auth**: Are permissions checked?
- **Leaks**: Any hardcoded secrets or sensitive logs?

### 2. Maintainability & "Clean Code"
- **DRY**: Any redundant logic?
- **Naming**: Are variables descriptive? (No `a`, `b`, `tmp`).
- **Complexity**: Is any function too long? (>30 lines should be split).
- **SOLID**: Does the code follow standard architectural principles?

### 3. Performance & Efficiency
- Big O analysis of loops and recursive calls.
- I/O efficiency (avoiding N+1 queries).

### 4. Integration & Tests
- Does this break existing API contracts?
- Is there a corresponding test for the new logic?

## Review Output
Generate a structured report:
- 🔴 **BLOCKING**: Security flaws or critical bugs.
- 🟡 **IMPROVE**: Refactoring or optimization suggestions.
- 🟢 **GOOD**: Commendable implementations.
