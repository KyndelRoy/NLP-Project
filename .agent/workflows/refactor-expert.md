---
description: Assistant for systematic code refactoring to improve maintainability without changing behavior.
---

# Refactor Expert

A safe, systematic process for improving code design and reducing technical debt.

## Steps

### 1. Goal Identification
- Identify the specific target for refactoring (e.g., "Extract Class," "Simplify Conditional," "Reduce Cognitive Complexity").
- Ensure a baseline test suite exists and is passing.

### 2. Small Steps (The Mikado Method)
- Break the refactor into the smallest possible non-breaking changes.
- **Rule**: If a change takes more than 5 minutes to commit, it's too big.

### 3. Transformation
- Apply the refactoring pattern (e.g., Rename, Extract Method, Invert If).
- Use `view_file` constantly to ensure context isn't lost.

### 4. Verification
- Run the test suite after *every* small change.
- Perform a manual check of the affected functionality.

### 5. Review & Cleanup
- Check for any leftover dead code or comments.
- Verify that the new code structure is indeed "cleaner" and easier to read.
