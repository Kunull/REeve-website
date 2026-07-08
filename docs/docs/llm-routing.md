---
id: llm-routing
title: LLM Routing
sidebar_position: 9
---

# LLM Routing

`reeve/llm/router.py` defines three model constants and a static, hardcoded lookup table from task kind to model. This is not adaptive — it's a fixed dict, checked once per task:

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

These three ID strings are the only model identifiers anywhere in the codebase — they are constants this project defines, not a claim about what Anthropic has actually released.

`global_synthesis` and `generate_report`'s handlers hardcode `OPUS` directly instead of calling `model_for_task()` — same result as the table, just written two different ways in different call sites. `DEOBFUSCATE_FUNCTION` has a model mapped to it but no registered task handler, so it never actually runs.

## Downgrading Is Dead Code

```python
def downgrade(model_id: str) -> str:
    """Return the next cheaper model tier."""
    if model_id == OPUS:
        return SONNET
    if model_id == SONNET:
        return HAIKU
    return HAIKU
```

`downgrade()` is defined but never called anywhere. Budget enforcement (`--budget`/`-b`) doesn't step tasks down to a cheaper model — `TaskExecutor` just checks `cost_tracker.over_budget()` before starting each task and hard-skips it if the ceiling is already hit. Once budget runs out, remaining LLM tasks stop; they don't run cheaper.

## What Each Model Actually Handles

| Task kind | Model | Handler behavior |
|-----------|-------|-------------------|
| `classify_functions` | Haiku | Static-analysis handler — despite the name this task doesn't currently call the LLM in `handlers.py`'s registered implementation; it's classified as cheap in the table for when/if that changes. |
| `analyze_function` | Sonnet | Per-function naming/typing — see below. |
| `form_hypothesis`, `test_hypothesis` | Sonnet | Turns a `claim_template` into a specific claim; tests it. |
| `synthesize_component` | Sonnet | Per-component summary. |
| `answer_question` | Sonnet | `reeve chat`/`reeve ask` answers. |
| `global_synthesis`, `generate_report` | Opus | Whole-binary synthesis and the final report. |

## The `analyze_function` Prompt

`LLMReasoner.analyze_function()` sends a system prompt that demands a strict JSON response (name, confidence, prototype, params, comment, struct_proposals, evidence_summary) and a user message built from already-computed graph facts — known callee names, import categories, type inferences, clustered string samples, the component hypothesis, obfuscation notes, and the decompiled body. `tools=[]` is passed on every call site currently in the codebase — see [Architecture](./architecture.md#tools) for why the tool-calling infrastructure exists but isn't wired up live.

Response parsing (`_parse_response`) is a plain `content.find("{")` / `rfind("}")` slice fed to `json.loads` — not the Anthropic SDK's structured-output/tool-forcing features. A malformed response degrades to `unknown_<address>` with confidence 0.0 rather than raising.

## Cost Tracking

`CostTracker` accumulates `TokenUsage` per model and prices it from a hardcoded per-1M-token table (`llm/usage.py`), separately tracking cache writes and cache reads:

```python
_PRICING = {
    "claude-haiku-4-5-20251001":  {"input": 0.80,  "output": 4.00,  "cache_write": 1.00,  "cache_read": 0.08},
    "claude-sonnet-4-6":          {"input": 3.00,  "output": 15.00, "cache_write": 3.75,  "cache_read": 0.30},
    "claude-opus-4-8":            {"input": 15.00, "output": 75.00, "cache_write": 18.75, "cache_read": 1.50},
}
```

`session.print_status()` prints total cost; `cost_tracker.summary()` breaks it down per model with input/output/cache-read/cache-write token counts.

## Prompt Caching

`AnthropicClient` caches exactly one thing: the **system prompt block**, via `cache_control: {"type": "ephemeral"}` on that block. There is no separately cached "binary context" block — every call sends its full user message fresh. Cache effectiveness therefore depends on how often the same system prompt (e.g. the fixed `analyze_function` system prompt) repeats across calls within the cache TTL, which happens naturally since every function-analysis call in a run shares the same system prompt string.
