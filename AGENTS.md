# Antigravity Specialized Agents

This directory contains specialized configurations and procedures to transform Antigravity into specific "agent" personas.

## Available Agents (Workflows)
Trigger these using Slash Commands (e.g., `/prd-maker`).

### 1. PRD Maker (V2)
- **Purpose**: Tech-focused requirement gathering and spec generation.
- **Command**: `/prd-maker`

### 2. Debugger (V2)
- **Purpose**: Scientific root-cause analysis and reproduction.
- **Command**: `/debugger`

### 3. Code Reviewer (V2)
- **Purpose**: Rigorous audit for Clean Code and security.
- **Command**: `/code-reviewer`

### 4. Refactor Expert
- **Purpose**: Systematic technical debt reduction.
- **Command**: `/refactor-expert`

### 5. Security Audit
- **Purpose**: Vulnerability scanning and remediation.
- **Command**: `/security-audit`

### 6. Documentation Architect
- **Purpose**: Generation of READMEs and technical maps.
- **Command**: `/documentation-gen`

### 7. Test Automation
- **Purpose**: Building unit, integration, and e2e test suites.
- **Command**: `/test-automation`

### 8. DevOps & Deployment
- **Purpose**: Dockerization, CI/CD, and cloud scaling.
- **Command**: `/devops-deploy`

### 9. Codebase Onboarding
- **Purpose**: Helping new contributors navigate the project.
- **Command**: `/onboarding`

### 10. Task Planner
- **Purpose**: Breaking complex goals into granular task lists.
- **Command**: `/task-planner`

### 11. Git & Release Manager
- **Purpose**: Branching, commits, and SemVer orchestration.
- **Command**: `/git-manager`

---

## Available Agents (Skills)
These are "automatic mindsets" that Antigravity uses based on context.

1. **Front End Engineer**: Visual excellence and modern CSS.
2. **Back End Architect**: Scalable server-side design.
3. **UI/UX Designer**: User-centric behavior and accessibility.
4. **Prompt Engineer**: Expert LLM steering.
5. **Full Stack Developer**: End-to-end integration.
6. **Python Pro**: Idiomatic and performant code.
7. **AI Engineer**: LLM applications, RAG, and agentic flows.
8. **Machine Learning Engineer**: Model training and data pipelines.

---

### 11. Pro Flet (Skill)
- **Purpose**: Specialized expertise in building multi-platform apps using the Flet framework.
- **Location**: [.agent/skills/pro_flet/SKILL.md](file:///home/roy/Documents/Project NLP/.agent/skills/pro_flet/SKILL.md)

## How to Add New Agents
1. **Workflows**: Add a markdown file to `/.agent/workflows/`.
2. **Skills**: Add a named folder with a `SKILL.md` to `/.agent/skills/`.
