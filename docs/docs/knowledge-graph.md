---
id: knowledge-graph
title: KnowledgeGraph
sidebar_position: 8
---

# KnowledgeGraph

`KnowledgeGraph` (`reeve/core/knowledge_graph.py`) is the central store for everything known about a binary — functions, types, strings, imports, components, and hypotheses, plus the call/reference graph connecting them.

## Fact

Every derived field on a function — its name, its prototype — is wrapped in a `Fact`, which tracks not just the value but where it came from and how confident REeve is in it:

```python
@dataclass
class Fact:
    value: Any
    confidence: float
    source: FactSource       # STATIC_ANALYSIS, SIGNATURE_MATCH, LLM, ANALYST
    evidence: list[str] = field(default_factory=list)
    dirty: bool = False
```

An analyst override always takes precedence; otherwise a new value only replaces an existing one if it comes with higher confidence. This keeps a low-confidence early guess from being silently overwritten by an equally weak later one, while still letting stronger evidence win.

## Node Types

```python
@dataclass
class FunctionNode:
    address: int
    raw_name: str                     # disassembler default, e.g. "FUN_00101a3f"
    name: Fact
    prototype: Fact
    size_class: SizeClass             # TRIVIAL / SMALL / MEDIUM / LARGE
    source_lang: SourceLang            # C / CPP / GO / RUST / UNKNOWN
    component_id: Optional[str] = None
    obfuscated: bool = False
    obfuscation_patterns: list[str] = field(default_factory=list)
    is_resolved: bool = False          # auto-resolved via signature match or analyst
    comment: Optional[str] = None

@dataclass
class TypeNode:
    name: str
    kind: str                         # struct / enum / typedef / pointer
    fields: list[dict] = field(default_factory=list)
    size: Optional[int] = None
    confidence: float = 0.0

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
    status: HypothesisStatus          # OPEN / CONFIRMED / REFUTED / DEFERRED
    evidence_for: list[str] = field(default_factory=list)
    evidence_against: list[str] = field(default_factory=list)
```

Hypotheses accumulate evidence over the course of an analysis: each supporting fact nudges confidence up and each contradicting fact nudges it down, and crossing a high or low confidence threshold automatically confirms or refutes the hypothesis.

## Dirty Propagation

When a function's name is updated with higher confidence, its callers are marked dirty — a callee's new name can change what its caller should be called. The `PROPAGATE_NAMES` task collects dirty functions and re-queues them for another analysis pass, so naming quality compounds as more of the call graph resolves.

## Querying

A sample of the graph's query surface:

```python
graph.get_function(address) / graph.get_function_by_name(name)
graph.all_functions()
graph.find_functions(calls=..., called_by=..., component_id=..., size_class=...,
                      min_confidence=..., unresolved_only=..., obfuscated_only=...)
graph.callers_of(address) / graph.callees_of(address)
graph.bfs_bottom_up()                  # leaves first, for call-graph-ordered analysis
graph.imports_by_category(category)
graph.strings_by_category(category)
graph.functions_in_component(component_id)
graph.open_hypotheses() / graph.confirmed_hypotheses()
graph.top_functions_by_centrality(n=50)
graph.serialize_context_block(max_functions=100)
graph.stats
```

`serialize_context_block` produces the compact summary handed to the LLM for interactive question-answering — the most call-connected functions plus a one-line-per-component summary, so the model reasons from a concise, ranked view of the binary rather than the full graph.

## Serialization

`Session.save()` writes the graph's functions, components, and hypotheses to `<binary>.reeve.json` — the artifact that `reeve kb`, `reeve report`, and `reeve eval` all read back in for follow-up work without needing Ghidra again.
