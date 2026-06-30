---
id: knowledge-graph
title: KnowledgeGraph
sidebar_position: 8
---

# KnowledgeGraph

The `KnowledgeGraph` is REeve's central data store. It holds everything extracted from the binary and everything inferred by the LLM in a single queryable structure.

## Data Model

### Function

```python
@dataclass
class Function:
    address: str           # hex string, e.g. "0x101a3f"
    name: str              # LLM-assigned human name
    raw_name: str          # original Ghidra name (e.g. "FUN_00101a3f")
    signature: str         # inferred signature
    decompiled: str        # Ghidra decompilation
    callers: list[str]     # addresses of callers
    callees: list[str]     # addresses of callees
    component_id: str      # which component this function belongs to
    confidence: float      # [0, 1] confidence in the LLM name
    strings: list[str]     # strings referenced by this function
    imports: list[str]     # imports called by this function
    tags: list[str]        # semantic tags (heap, crypto, net, ...)
```

### Component

```python
@dataclass
class Component:
    id: str
    name: str              # e.g. "allocator", "ui_layer"
    purpose: str           # one-sentence description
    functions: list[str]   # addresses of member functions
    confidence: float
```

### Hypothesis

```python
@dataclass
class Hypothesis:
    id: str
    claim: str             # one-sentence claim about the binary
    confidence: float
    status: HypothesisStatus   # TENTATIVE, SUPPORTED, REFUTED
    evidence: list[str]    # addresses of supporting functions
    falsification: str     # what would refute this hypothesis
```

## Evidence Scoring

Every field update carries an `Evidence` object:

```python
@dataclass
class Evidence:
    source: str       # e.g. "static:match_signatures", "llm:analyze_function"
    confidence: float
    value: Any        # the actual value being asserted
```

Multiple evidence objects can coexist for the same field. The graph takes the highest-confidence value as the canonical value and retains all evidence for audit.

## Dirty Propagation

When a static analysis pass updates a function field, the function is marked dirty. The LLM task scheduler re-processes dirty functions before using them in synthesis or report generation. This means a second static analysis pass (e.g. type inference) automatically triggers re-naming.

## Querying the Graph

The session and knowledge base builder access the graph through these methods:

```python
graph.get_function(address: str) -> Function | None
graph.all_functions() -> list[Function]
graph.get_component(component_id: str) -> Component | None
graph.all_components() -> list[Component]
graph.all_hypotheses() -> list[Hypothesis]
graph.functions_by_component(component_id: str) -> list[Function]
graph.callers(address: str) -> list[Function]
graph.callees(address: str) -> list[Function]
```

## Serialization

The graph serializes to a flat JSON structure inside the session file. `reeve kb` and `reeve report` reconstruct the graph from this JSON without re-running Ghidra:

```json
{
  "functions": { "0x101a3f": { ... } },
  "components": { "allocator": { ... } },
  "hypotheses": { "tcache_poisoning": { ... } }
}
```
