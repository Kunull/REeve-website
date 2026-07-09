---
id: architecture
title: Architecture
sidebar_position: 7
---

# Architecture

## Module Map

```
reeve/
  __main__.py            CLI (click): analyze, chat, ask, report, kb, eval
  host/
    base.py               HostBridge — disassembler abstraction
    ghidra.py              GhidraHost — Ghidra via PyGhidra, in-process
  core/
    session.py             Session: goal, graph, cost tracker, mutation log
    knowledge_graph.py      KnowledgeGraph + all node/fact types
    hypothesis.py           HypothesisEngine: confirm/refute thresholds
    events.py               EventBus + EventKind enum
  planning/
    planner.py              GoalPlanner: goal → task plan
    tasks.py                Task, TaskKind, TaskResult, TaskStatus
    executor.py             TaskExecutor: thread-pool DAG runner
    handlers.py             one handler per TaskKind
  llm/
    base.py                 LLMClient interface, Message, TokenUsage, ChatResponse
    anthropic_client.py     AnthropicClient — streaming, caching, retry
    reasoner.py             LLMReasoner: analyze_function, form_hypothesis, ...
    router.py               model_for_task() — tiered task→model routing
    usage.py                CostTracker — per-model token accounting, USD pricing
  analysis/
    imports.py              ImportResolver
    strings.py               StringAnalyzer
    signatures.py            SignatureMatcher — stdlib/crypto signature matching
    types.py                 TypeInferencer
    components.py            ComponentClusterer
    cfg.py                   ObfuscationDetector, call graph analysis
  tools/
    base.py, gateway.py, navigation.py, functions.py,
    decompiler.py, xrefs.py, strings.py, database.py, annotations.py
  knowledge_base/
    builder.py               KnowledgeBaseBuilder — Obsidian vault generator
  evals/
    harness.py, metrics.py   EvalHarness — scoring against ground truth
  ui/tui/
    app.py                   AnalysisApp — Textual TUI
signatures/
  stdlib.json, crypto.json, protocols.json
```

## Request Flow

A `reeve analyze` call:

1. The CLI opens a `GhidraHost` and creates a `Session(goal, binary_path, host, budget_usd)`.
2. `GoalPlanner().decompose(goal, binary_path)` builds a task plan tailored to the goal — see [Goals](./goals.md).
3. `TaskExecutor` runs the plan on a thread pool, respecting task dependencies and the cost budget.
4. Each task kind has a registered handler. Static handlers write directly into `session.graph`; LLM handlers build a request from graph facts, call `LLMReasoner`, and write the response back into the graph.
5. Handlers can spawn follow-up tasks at runtime — this is how `PROPAGATE_NAMES` re-queues functions for another analysis pass as naming quality improves (see [KnowledgeGraph](./knowledge-graph.md#dirty-propagation)).
6. The session is saved to `<binary>.reeve.json`, and the generated report to `<binary>.report.md`.
7. If `--kb` was passed, `KnowledgeBaseBuilder` writes an Obsidian vault alongside it.

With `--tui`, the executor runs on a background thread while the Textual UI renders live progress in the foreground; without it, a terminal spinner tracks task progress via the event bus.

## HostBridge

`HostBridge` is the disassembler abstraction every analysis pass is written against — function listing, decompilation, disassembly, cross-references, imports/exports, strings, byte-level reads and writes, and annotation (renaming, commenting, prototyping). `GhidraHost` implements it against Ghidra, running **in-process** via PyGhidra — same JVM, same Python process — so decompilation calls are synchronous, with no subprocess or RPC overhead.

## Tools

`reeve/tools/` is a tool-calling framework for LLM-directed binary interaction: a `@tool` decorator that auto-generates an Anthropic-compatible JSON schema from Python type hints and docstrings, and a `ToolGateway` that executes tools, tracks pre/post state for mutating calls, and records mutations for undo.

Tools span navigation, function listing and search, decompilation, cross-references, strings, imports/exports, and annotation — including `rename_function`, `set_comment`, and `set_prototype` for directly updating the binary and the knowledge graph together.

## Evals

`EvalHarness` scores a completed analysis against a ground-truth JSON file, computing symbol-naming accuracy and type-recovery accuracy — `reeve eval ANALYSIS_JSON GROUND_TRUTH_JSON`.

## TUI

`reeve analyze --tui` launches a [Textual](https://textual.textualize.io/)-based terminal UI: a live task-feed panel, a stats panel, and a running cost readout, with keybindings for quit, pause/resume, and save.

## Events

`core/events.py` defines the event vocabulary the rest of the system emits against — task lifecycle events, hypothesis updates, tool-call events, and mutation records — consumed by both the progress spinner and the TUI.
