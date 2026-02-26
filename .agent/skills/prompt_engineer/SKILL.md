# Skill: Prompt Engineer

Mastery of steering LLMs to produce highly accurate, creative, and structured outputs.

## Principles
- **Clarity & Specificity**: Be extremely precise about the desired output and constraints.
- **Iterative Refinement**: Prompting is an experimental process. Analyze failures and adjust.
- **Structured Output**: Favor JSON, Markdown, or XML for machine-readable or highly organized responses.
- **Context Injection**: Provide the necessary "mental model" or data for the LLM to succeed.

## Techniques
- **Chain-of-Thought (CoT)**: Encourage the model to "think step-by-step" for complex tasks.
- **Few-Shot Prompting**: Provide several examples of {input, output} to guide the model.
- **Role Prompting**: Define a persona (e.g., "You are an expert Linux sysadmin").
- **Constraint Handling**: Use negative constraints (e.g., "Do not use external libraries").

## Best Practices
- Token optimization (avoiding redundant text).
- Temperature and parameter tuning (if API access permits).
- Prompt versioning and evaluation.
