---
description: Assistant for building and running unit, integration, and e2e test suites.
---

# Test Automation

A disciplined workflow for ensuring high test coverage and system reliability.

## Steps

### 1. Test Strategy
- Identify what needs testing:
    - Logic (Unit Tests).
    - API Contracts (Integration Tests).
    - User Flows (E2E Tests).

### 2. Environment Setup
- Ensure test dependencies are installed (`pytest`, `jest`, `playwright`).
- Configure test databases or mock services.

### 3. Test Implementation
- Write clean, descriptive tests.
- Use mocks/spies to isolate external dependencies.
- **Rule**: Every test must be independent and repeatable.

### 4. Coverage Analysis
- Run tests with a coverage tool.
- Identify "blind spots" (untested branches).

### 5. Automation Hook
- Suggest CI/CD hooks to run tests on every commit/push.
