---
id: llm-routing
title: LLM Routing
sidebar_position: 9
---

# LLM Routing

REeve uses three Claude models and routes each task to the cheapest model capable of handling it. This keeps the cost of a full analysis under $0.05 for most CTF-scale binaries.

## Model Tiers

| Model | Tasks | Why |
|-------|-------|-----|
| Claude Haiku | String classification, import categorization, tag inference | Fast, cheap; classification is low-complexity |
| Claude Sonnet | Function naming, hypothesis formation, component clustering | Needs instruction-following and code reasoning |
| Claude Opus | Global synthesis, report generation | Needs long-context coherence and structured output |

## Routing Logic

Routing is handled by `LLMReasoner`. Each public method instantiates the appropriate model:

```python
# reeve/llm/reasoner.py

def analyze_function(self, fn: Function) -> FunctionAnalysis:
    client = AnthropicClient(model="claude-sonnet-4-6")
    ...

def generate_report(self, session: Session) -> str:
    client = AnthropicClient(model="claude-opus-4-8")
    ...
```

## Cost Tracking

`CostTracker` tracks input and output tokens per model and converts to USD:

```
Session b29c1b20
  Cost: $0.041
    claude-haiku-4-5   :  8,420 in /  1,203 out  ->  $0.003
    claude-sonnet-4-6  : 61,200 in / 18,900 out  ->  $0.031
    claude-opus-4-8    :  2,100 in /    847 out  ->  $0.007
```

## Prompt Structure

Each model receives only the information it needs. Function-level prompts include:

- The decompiled function body
- The raw name and address
- Callee and caller names (already resolved by prior tasks)
- Strings referenced by the function
- Imports called

Report prompts include:

- A summary of all named functions with confidence scores
- All components with purposes
- All hypotheses with evidence
- The original goal

No prompt includes the full decompiled binary. This keeps context windows small and reduces hallucination risk.

## System Prompt Enforcement

The report generator uses a structured system prompt that enforces the seven-section schema:

```
You are a binary analysis expert. Produce a report with exactly these sections:
## Summary
## Architecture
## Vulnerability
## Exploitation Path
## Key Functions
## Indicators
## Recommendations

Do not add sections. Do not omit sections.
Base all claims on the provided analysis data. Do not invent addresses or function names.
```

## Cache Tokens

REeve uses prompt caching where supported. Long system prompts (report generation) are cached on the first request and reused on subsequent calls in the same session. Cache hits show as `cache_read_tokens` in the cost summary.
