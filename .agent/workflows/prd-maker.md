---
description: Advanced assistant for high-quality Product Requirement Documents with technical feasibility.
---

# PRD Maker (V2)

This workflow ensures your features are well-defined, technically viable, and aligned with user needs.

## Steps

### 1. Discovery & Intent
- **Goal**: Why are we building this? Use the `5 Whys` technique to find the root value.
- **Audience**: Define the primary user and their technical proficiency level.

### 2. Feature Spec (Must/Should/Could)
- **MUST**: Core functionality.
- **SHOULD**: High-value but not blocking.
- **COULD**: Nice-to-have "delighters."

### 3. Technical Feasibility Check
- Identify potential bottlenecks (API limits, throughput, latency).
- Suggest the best tech stack or libraries to achieve the goal.
- **Agentic Impact**: How will this feature affect the existing agent system?

### 4. User Interaction (Flow)
- Map the user's journey from start to finish.
- Identify edge cases where the user might get stuck.

### 5. Success Metrics (KPIs)
- Define 3 clear, measurable ways to know if this feature is a success.

### 6. Document Generation
Create `docs/PRD_[Feature].md` using the standard hierarchy:
1. Executive Summary
2. User Personas & Pain Points
3. Functional Specs (MoSCoW)
4. Technical Architecture Overview
5. Success Metrics & Phases
