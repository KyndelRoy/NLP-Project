---
description: Procedure for systematic vulnerability assessment and remediation.
---

# Security Audit

A defensive workflow to identify and neutralize security threats.

## Steps

### 1. Landscape Analysis
- Identify entry points for user data (APIs, UI inputs).
- List external dependencies and their versions.

### 2. Vulnerability Scanning
- Check for common OWASP Top 10 issues:
    - Injection (SQL, Command).
    - Broken Authentication.
    - Sensitive Data Exposure.
    - Broken Access Control.

### 3. Dependency Audit
- Scan `package.json`, `requirements.txt`, etc., for known CVEs (Common Vulnerabilities and Exposures).

### 4. Remediation Plan
- Prioritize vulnerabilities by severity (Low, Medium, High, Critical).
- Propose surgical fixes that neutralize the threat without breaking features.

### 5. Verification
- Confirm that the fix successfully blocks the attack vector.
- Ensure no "leaky" logs were added during development.
