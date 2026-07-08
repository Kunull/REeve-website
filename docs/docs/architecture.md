---
id: architecture
title: Architecture
sidebar_position: 7
---

# Architecture

## Module Map

This is the real package layout — not an idealized one. `PLAN.md` in the repo root describes a much larger, aspirational system (deobfuscation package, IDA/Binary Ninja hosts, an MCP server, a Qt plugin, Neo4j); none of that exists. This is what's actually there:

```
reeve/
  __main__.py            CLI (click): analyze, chat, ask, report, kb, eval
  host/
    base.py               HostBridge ABC — 19 abstract methods
    ghidra.py              GhidraHost — the only implementation, via PyGhidra
  core/
    session.py             Session: goal, graph, cost tracker, mutation log
    knowledge_graph.py      KnowledgeGraph + all node/fact types
    hypothesis.py           HypothesisEngine: confirm/refute thresholds
    events.py               EventBus + EventKind enum
  planning/
    planner.py              GoalPlanner: keyword match → task list
    tasks.py                Task, TaskKind, TaskResult, TaskStatus
    executor.py             TaskExecutor: thread-pool DAG runner
    handlers.py             one function per TaskKind, via @register_handler
  llm/
    base.py                 LLMClient ABC, Message, TokenUsage, ChatResponse
    anthropic_client.py     AnthropicClient — the only LLMClient implementation
    reasoner.py             LLMReasoner: analyze_function, form_hypothesis, ...
    router.py               model_for_task() — static task→model dict
    usage.py                CostTracker — per-model token accounting, USD pricing
  analysis/
    imports.py              ImportResolver — static category map
    strings.py               StringAnalyzer
    signatures.py            SignatureMatcher — loads stdlib.json + crypto.json
    types.py                 TypeInferencer
    components.py            ComponentClusterer — networkx weakly-connected-components
    cfg.py                   ObfuscationDetector (regex heuristics); unused CallGraphBuilder
    normalizer.py            dead code — not imported anywhere
  tools/
    base.py, gateway.py, navigation.py, functions.py,
    decompiler.py, xrefs.py, strings.py, database.py, annotations.py
  knowledge_base/
    builder.py               KnowledgeBaseBuilder — Obsidian vault generator
  evals/
    harness.py, metrics.py   EvalHarness — 2 metrics against ground truth JSON
  ui/tui/
    app.py                   AnalysisApp — Textual TUI
signatures/
  stdlib.json, crypto.json   loaded by SignatureMatcher
  protocols.json              exists on disk, never loaded by any code
```

## Request Flow

A `reeve analyze` call:

1. CLI opens a `GhidraHost` context (`_open_host`), creates a `Session(goal, binary_path, host, budget_usd)`.
2. `GoalPlanner().decompose(goal, binary_path)` returns a fixed `list[Task]` — see [Goals](./goals.md) for which of the five plan shapes it picks.
3. `TaskExecutor(session, max_workers=4).submit_all(tasks)` then `.run()` — a thread pool that respects `depends_on`, skips tasks whose dependencies failed, and checks `cost_tracker.over_budget()` before starting each task (hard skip, no downgrade).
4. Each task kind has exactly one registered handler function (`planning/handlers.py`). Static handlers write directly into `session.graph`; LLM handlers build a request from graph facts, call `LLMReasoner`, and write the response back into the graph.
5. Handlers can spawn new tasks at runtime via `TaskResult.spawned_tasks` — this is how `PROPAGATE_NAMES` re-queues dirty functions for re-analysis (see [KnowledgeGraph](./knowledge-graph.md#dirty-propagation)).
6. `session.save()` writes `<binary>.reeve.json` unconditionally; if `generate_report` ran, `session.save_report()` writes `<binary>.report.md`.
7. If `--kb` was passed, `KnowledgeBaseBuilder().build(session, decompile_fn=host.decompile)` writes the vault.

With `--tui`, the executor runs on a background thread while `AnalysisApp` renders in the foreground; without it, a Rich `Progress` spinner subscribes to `TASK_STARTED` events on the global event bus.

## HostBridge

```python
class HostBridge(ABC):
    def capabilities(self) -> Capabilities: ...
    def list_functions(self) -> List[FunctionInfo]: ...
    def decompile(self, address: int) -> str: ...
    def get_disassembly(self, address: int, max_lines: int = 50) -> str: ...
    def xrefs_to(self, address: int) -> List[XRef]: ...
    def xrefs_from(self, address: int) -> List[XRef]: ...
    def list_imports(self) -> List[dict]: ...
    def list_exports(self) -> List[dict]: ...
    def list_strings(self) -> List[dict]: ...
    def read_bytes(self, address: int, count: int) -> bytes: ...
    def rename_function(self, address: int, name: str) -> None: ...
    def set_comment(self, address: int, comment: str) -> None: ...
    def get_comment(self, address: int) -> str: ...
    def set_function_prototype(self, address: int, prototype: str) -> None: ...
    def get_function_prototype(self, address: int) -> str: ...
    def write_bytes(self, address: int, data: bytes) -> None: ...
    def get_entry_point(self) -> int: ...
    def get_binary_path(self) -> str: ...
    def get_arch(self) -> str: ...
    def get_format(self) -> str: ...
```

`GhidraHost` is the only concrete `HostBridge`. It runs Ghidra **in-process** via PyGhidra/JPype — same JVM, same Python process, no subprocess and no RPC — so `decompile()` calls are synchronous function calls, not IPC round-trips. Inferred function prototypes are currently stored only as a Ghidra plate comment, not pushed into Ghidra's real type system.

## Tools

`reeve/tools/` implements a full tool-calling stack: a `@tool` decorator (`tools/base.py`) that auto-generates an Anthropic-compatible JSON schema from Python type hints and docstrings, and a `ToolGateway` (`tools/gateway.py`) that executes tools, captures pre/post state for mutating ones, and records `MutationRecord`s on the session for undo.

17 tools exist across the package: navigation (`get_entry_point`, `get_binary_info`, `read_bytes`), function listing/search, decompilation, xrefs, strings, imports/exports/graph-stats, and three mutating annotation tools (`rename_function`, `set_comment`, `set_prototype`).

**None of this runs live today.** Every `LLMReasoner` call site in the current codebase passes `tools=[]` — no CLI command constructs a `ToolGateway` or hands tool schemas to a real Anthropic call. `reeve chat`'s docstring claims it can "rename functions," but the chat loop never wires tools in. `ToolGateway.undo_last()` also references tool names `write_bytes` and `patch_branch` that don't exist as registered `@tool` functions anywhere (only `HostBridge` has a `write_bytes` primitive; no tool exposes it to the LLM) — that logic is forward-looking dead code.

## Evals

`EvalHarness.run(graph, ground_truth_path)` computes exactly two metrics, defined in `evals/metrics.py`:

- **`symbol_accuracy`** — lenient fuzzy match: exact match, or one name being a substring of the other (case-insensitive), over all functions with a ground-truth name.
- **`type_accuracy`** — exact string match on the prototype, only over entries with a non-empty ground-truth prototype.

There's no benchmark suite, no shipped ground-truth corpus, and no case studies bundled with the project — this harness is the entire eval system, invoked via `reeve eval ANALYSIS_JSON GROUND_TRUTH_JSON`.

## TUI

`reeve analyze --tui` launches `AnalysisApp` (`ui/tui/app.py`), a [Textual](https://textual.textualize.io/) app: a task-feed log panel, a stats panel, and a running cost label, in a grid layout. Keybindings: `q` quit, `p` pause/resume, `s` save. It subscribes to five event kinds on the global bus; one of them (`FUNCTION_ANALYZED`) is never actually emitted anywhere in the codebase, so that particular handler is currently dead. The window title string is a leftover `"ai-re | ..."` from the project's earlier `PLAN.md`-era naming, not `"reeve"`.

## Events

`core/events.py` defines 19 `EventKind` members, but only 7 are ever emitted in practice: `TASK_STARTED`, `TASK_COMPLETED`, `TASK_FAILED`, `HYPOTHESIS_UPDATED`, `TOOL_CALL_START`, `TOOL_CALL_RESULT`, `MUTATION_RECORDED`. The rest — including `FUNCTION_ANALYZED`, `LLM_USAGE`, and `SESSION_STARTED` — are defined but unwired. There is one process-global `bus` singleton; `Session.bus` is just a reference to it, not a per-session instance.

## Known Gaps

Things that are declared, scaffolded, or referenced but don't do anything yet:

- `DEOBFUSCATE_FUNCTION` is a real `TaskKind` with a model mapped to it in `llm/router.py`, but has no registered handler — nothing schedules it, and nothing would run it if scheduled.
- `ObfuscationDetector` only **flags** suspected obfuscation via regex heuristics; there's no deobfuscation, and `z3-solver` (a listed dependency) isn't imported anywhere.
- `openai` is a listed dependency with no client code anywhere in the source.
- `signatures/protocols.json` exists on disk but is never loaded — only `stdlib.json` and `crypto.json` are read by `SignatureMatcher`.
- `analysis/normalizer.py` and the `CallGraphBuilder` class in `analysis/cfg.py` are dead code, never imported by anything that runs.
- Size-class thresholds are defined three slightly different ways across `SizeClass`'s docstring, the unused `CallGraphBuilder`, and the actual call-graph handler — see [KnowledgeGraph](./knowledge-graph.md).
