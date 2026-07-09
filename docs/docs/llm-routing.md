---
id: llm-routing
title: LLM Routing
sidebar_position: 9
---

# LLM Routing

`reeve/llm/router.py` routes each task kind to a model tier via a fixed lookup table:

```python
HAIKU  = "claude-haiku-4-5-20251001"
SONNET = "claude-sonnet-4-6"
OPUS   = "claude-opus-4-8"

_TASK_MODEL: dict[TaskKind, str] = {
    TaskKind.CLASSIFY_FUNCTIONS:   HAIKU,
    TaskKind.ANALYZE_FUNCTION:     SONNET,
    TaskKind.FORM_HYPOTHESIS:      SONNET,
    TaskKind.TEST_HYPOTHESIS:      SONNET,
    TaskKind.SYNTHESIZE_COMPONENT: SONNET,
    TaskKind.DEOBFUSCATE_FUNCTION: SONNET,
    TaskKind.GLOBAL_SYNTHESIS:     OPUS,
    TaskKind.GENERATE_REPORT:      OPUS,
    TaskKind.ANSWER_QUESTION:      SONNET,
}

def model_for_task(kind: TaskKind) -> str:
    return _TASK_MODEL.get(kind, SONNET)
```

Haiku handles cheap classification, Sonnet handles per-function and per-component reasoning, and Opus handles whole-binary synthesis and the final report.

## What Each Model Handles

| Task kind | Model | What it does |
|-----------|-------|-------------------|
| `classify_functions` | Haiku | Lightweight per-function classification. |
| `analyze_function` | Sonnet | Per-function naming and typing — see below. |
| `form_hypothesis`, `test_hypothesis` | Sonnet | Turns a claim template into a specific, falsifiable claim, then tests it. |
| `synthesize_component` | Sonnet | Per-component summary. |
| `answer_question` | Sonnet | `reeve chat`/`reeve ask` answers. |
| `global_synthesis`, `generate_report` | Opus | Whole-binary synthesis and the final report. |

## The `analyze_function` Prompt

`LLMReasoner.analyze_function()` sends a system prompt that requires a strict JSON response (name, confidence, prototype, params, comment, struct_proposals, evidence_summary) and a user message built from already-computed graph facts: known callee names, import categories, type inferences, clustered string samples, the component hypothesis, obfuscation notes, and the decompiled body.

Response parsing extracts the JSON object from the response text and validates it against the expected fields. A malformed response degrades to a placeholder name with confidence 0.0 rather than raising.

## Cost Tracking

`CostTracker` accumulates token usage per model and prices it from a per-1M-token table (`llm/usage.py`), separately tracking cache writes and cache reads:

```python
_PRICING = {
    "claude-haiku-4-5-20251001":  {"input": 0.80,  "output": 4.00,  "cache_write": 1.00,  "cache_read": 0.08},
    "claude-sonnet-4-6":          {"input": 3.00,  "output": 15.00, "cache_write": 3.75,  "cache_read": 0.30},
    "claude-opus-4-8":            {"input": 15.00, "output": 75.00, "cache_write": 18.75, "cache_read": 1.50},
}
```

`session.print_status()` prints total cost; `cost_tracker.summary()` breaks it down per model with input/output/cache-read/cache-write token counts. `--budget`/`-b` sets a hard cost ceiling for the run — the executor checks it before starting each task and stops scheduling new LLM tasks once it's reached.

## Prompt Caching

`AnthropicClient` caches the system prompt block via `cache_control: {"type": "ephemeral"}`. Since every function-analysis call in a run shares the same system prompt string, this caches well across a single session.
