---
id: knowledge-graph
title: KnowledgeGraph
sidebar_position: 8
---

# KnowledgeGraph

`KnowledgeGraph` (`reeve/core/knowledge_graph.py`) is the central store for everything known about a binary. Internally it's a `networkx.DiGraph` for call/reference edges plus six plain dicts for the actual node data — functions, types, strings, imports, components, and hypotheses.

## Fact

Every mutable field on a function (its name, its prototype) isn't a raw value — it's wrapped in a `Fact`:

```python
@dataclass
class Fact:
    value: Any
    confidence: float
    source: FactSource       # STATIC_ANALYSIS, SIGNATURE_MATCH, LLM, ANALYST
    evidence: list[str] = field(default_factory=list)
    dirty: bool = False
```

`Fact.update(value, confidence, source, evidence)` only accepts the new value if `source == FactSource.ANALYST` **or** the new confidence is strictly higher than the current one — an analyst override always wins, an LLM guess only overwrites a weaker LLM guess.

## Node Types

```python
@dataclass
class FunctionNode:
    address: int
    raw_name: str                     # Ghidra default, e.g. "FUN_00101a3f"
    name: Fact
    prototype: Fact
    size_class: SizeClass = SizeClass.SMALL
    source_lang: SourceLang = SourceLang.UNKNOWN
    component_id: Optional[str] = None
    obfuscated: bool = False
    obfuscation_patterns: list[str] = field(default_factory=list)
    is_resolved: bool = False         # auto-resolved via signature match or analyst
    comment: Optional[str] = None
```

`SizeClass` is `TRIVIAL` (≤5 basic blocks) / `SMALL` (6–20) / `MEDIUM` (21–100) / `LARGE` (100+) per its own docstring — though the code path that actually assigns it (in the call-graph handler) uses slightly different cutoffs (≤5/≤20/≤100) than a separate, unused `CallGraphBuilder` class (≤3/≤15/≤60). Treat the exact boundary as approximate.

```python
@dataclass
class TypeNode:
    name: str
    kind: str                         # struct / enum / typedef / pointer
    fields: list[dict] = field(default_factory=list)
    size: Optional[int] = None
    confidence: float = 0.0
    source: FactSource = FactSource.LLM

@dataclass
class StringNode:
    address: int
    value: str
    encoding: str = "utf-8"
    category: str = "unknown"         # url/path/error/format/uuid/crypto/unknown

@dataclass
class ImportNode:
    name: str
    library: str = ""
    resolved_address: Optional[int] = None
    categories: list[str] = field(default_factory=list)

@dataclass
class ComponentNode:
    id: str
    name: Optional[str] = None
    purpose: Optional[str] = None
    confidence: float = 0.0

@dataclass
class HypothesisNode:
    id: str
    claim: str
    confidence: float = 0.0
    status: HypothesisStatus = HypothesisStatus.OPEN   # OPEN, CONFIRMED, REFUTED, DEFERRED
    evidence_for: list[str] = field(default_factory=list)
    evidence_against: list[str] = field(default_factory=list)
    verification_task_ids: list[str] = field(default_factory=list)
```

`HypothesisNode.add_evidence_for(evidence, weight=0.1)` adds `weight` to confidence and flips status to `CONFIRMED` at ≥0.85; `add_evidence_against` subtracts and flips to `REFUTED` at ≤0.15.

## Dirty Propagation

When `graph.update_function_name()` accepts a new name for a function, `_dirty_mark_callers()` marks that function's **callers** (their `name` and `prototype` Facts) dirty — the idea being a callee's new name might change what its caller should be called. Nothing re-analyzes dirty functions automatically; the `PROPAGATE_NAMES` task explicitly collects `graph.dirty_functions()`, clears their dirty flag, and spawns one new `ANALYZE_FUNCTION` task per dirty function via `TaskResult.spawned_tasks`. If a plan doesn't include `PROPAGATE_NAMES` (the single-function and malware/vulnerability plans don't), dirty flags are simply never consumed.

## Querying

Selected real methods (not exhaustive):

```python
graph.get_function(address: int) -> FunctionNode | None
graph.get_function_by_name(name: str) -> FunctionNode | None
graph.all_functions() -> list[FunctionNode]
graph.find_functions(calls=..., called_by=..., component_id=..., size_class=...,
                      min_confidence=..., unresolved_only=..., obfuscated_only=...) -> list[FunctionNode]
graph.callers_of(address) / graph.callees_of(address) -> list[FunctionNode]
graph.bfs_bottom_up() -> Iterator[FunctionNode]   # leaves first, for call-graph-ordered analysis
graph.dirty_functions() -> list[FunctionNode]
graph.imports_by_category(category) -> list[ImportNode]
graph.strings_by_category(category) -> list[StringNode]
graph.functions_in_component(component_id) -> list[FunctionNode]
graph.open_hypotheses() / graph.confirmed_hypotheses() -> list[HypothesisNode]
graph.stats -> dict   # functions, resolved, named, dirty, imports, strings, types, components, hypotheses, call_edges
graph.top_functions_by_centrality(n=50) -> list[FunctionNode]
graph.serialize_context_block(max_functions=100) -> str
```

`top_functions_by_centrality` ranks purely by call-graph **in-degree** (most-called-by-others) — it is not betweenness centrality or any graph-theoretic centrality measure, despite the name. `serialize_context_block` is what gets handed to the LLM as a compact summary (used by `reeve chat`'s `answer_question` calls, among others) — it lists the top functions by that in-degree ranking plus a one-line-per-component summary.

## Serialization

`Session.save()` writes a flat, deliberately reduced JSON — not a full dump of the graph. Only these fields survive round-tripping through `<binary>.reeve.json`:

```json
{
  "functions": [{"address": "0x101a3f", "raw_name": "...", "name": "...", "confidence": 0.85, "prototype": "...", "comment": "...", "component_id": "..."}],
  "components": [{"id": "...", "name": "...", "purpose": "...", "confidence": 0.8}],
  "hypotheses": [{"id": "...", "claim": "...", "confidence": 0.9, "status": "confirmed"}]
}
```

Notably absent: call-graph edges, strings, imports, types, and decompilation. `reeve kb` and `reeve eval` reconstruct a `KnowledgeGraph` from just this — which is why a standalone `reeve kb` vault has no call-graph-derived "Calls"/"Called by" sections and no decompilation.
