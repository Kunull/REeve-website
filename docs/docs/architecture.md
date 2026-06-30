---
id: architecture
title: Architecture
sidebar_position: 7
---

# Architecture

## Module Map

```
reeve/
  __main__.py          CLI (click): analyze, report, kb
  core/
    session.py         Session: holds graph, runs tasks, saves/loads JSON
    task.py            Task dataclass + TaskDAG (dependency graph)
    planner.py         Maps a goal string to a set of Task objects
  analysis/
    ghidra_host.py     GhidraHost context manager (PyGhidra wrapper)
    static.py          All Ghidra analysis tasks (imports, call graph, ...)
  llm/
    base.py            LLMClient protocol, ChatResponse, TokenUsage dataclasses
    anthropic_client.py  AnthropicClient: wraps SDK, extracts usage
    reasoner.py        LLMReasoner: function naming, hypothesis formation,
                         component clustering, synthesis, report generation
    cost_tracker.py    CostTracker: per-model token accounting and USD cost
  knowledge/
    graph.py           KnowledgeGraph: functions, components, hypotheses
    evidence.py        Evidence dataclass with source and confidence
  knowledge_base/
    builder.py         KnowledgeBaseBuilder: generates Obsidian vault
```

## Request Flow

A typical `reeve analyze` call goes through these steps:

1. **CLI** parses arguments, creates a `Session`.
2. **Session** calls `Planner.plan(goal)` to get a `TaskDAG`.
3. **Session** opens a `GhidraHost` context (starts PyGhidra in-process).
4. For each task in topological order, **Session** calls the corresponding static analysis function in `static.py`. Results are written into the `KnowledgeGraph`.
5. After static analysis, **Session** calls `LLMReasoner` for each LLM task (naming, hypotheses, synthesis, report).
6. **Session** serializes itself to `<binary>.reeve.json`.
7. If `--kb` is set, `KnowledgeBaseBuilder.build()` walks the graph and writes the vault.

## GhidraHost

`GhidraHost` is a context manager that wraps PyGhidra:

```python
with GhidraHost(binary_path) as host:
    functions = host.get_functions()
    decompiled = host.decompile(fn)
```

Ghidra runs in-process (same JVM, same Python process). There is no subprocess overhead and no RPC. Decompilation is synchronous.

## KnowledgeGraph

The `KnowledgeGraph` holds three collections:

- `_functions`: `dict[str, Function]` keyed by address
- `_components`: `dict[str, Component]` keyed by ID
- `_hypotheses`: `dict[str, Hypothesis]` keyed by ID

Every field in these dataclasses has an associated `Evidence` object recording the source (static analysis pass or LLM call) and a confidence score. When a new analysis pass updates a field, it marks the function as dirty and stores the new evidence alongside the old evidence.

## Task DAG

The planner builds a DAG where each node is a `Task` and edges are dependencies. Tasks have four states: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`. The session executor uses topological sort to run tasks in dependency order, skipping tasks whose dependencies failed.

A minimal goal like `"find function main"` produces a 3-node DAG:

```
resolve_imports -> build_call_graph -> match_signatures
```

A full exploitation-analysis goal produces a 9-node DAG:

```
resolve_imports
  -> build_call_graph
    -> match_signatures
    -> analyze_strings
      -> infer_types
        -> cluster_components
          -> analyze_function (per function)
            -> form_hypothesis
              -> global_synthesis
                -> generate_report
```

## Cost Tracking

`CostTracker` maintains a per-model token count and converts to USD using hardcoded per-million-token prices. Every `LLMReasoner` method records usage after each API call:

```python
resp = self._client.chat(...)
self._cost_tracker.record(self._client.model_id, resp.usage)
```

The session prints a cost summary on completion.
