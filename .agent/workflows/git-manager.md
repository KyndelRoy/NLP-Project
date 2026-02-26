---
description: Procedures for standardized branching, commit messaging, and release tagging.
---

# Git & Release Manager

Maintaining a clean, professional, and version-controlled codebase history.

## Steps

### 1. Branch Strategy
- Recommend a branching model (GitFlow, Trunk-based).
- Name the current feature branch appropriately (`feat/keyword`, `fix/keyword`).

### 2. Commit Hygiene
- Suggest a commit message following Conventional Commits format:
    - `feat: add AI engineer skill`
    - `fix: resolve auth timeout bug`

### 3. Pull Request (PR) Prep
- Final check of the code for "noise" (debug statements, unused imports).
- Draft a PR summary with "Description" and "How to Test."

### 4. Tagging & Releases
- Propose a Semantic Versioning (SemVer) tag for the release (e.g., `v1.2.0`).
- Generate basic Release Notes summarizing the changes.

### 5. Cleanup
- Verify that merged branches are deleted and the history is linear.
