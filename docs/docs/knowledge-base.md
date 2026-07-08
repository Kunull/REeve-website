---
id: knowledge-base
title: Knowledge Base
sidebar_position: 6
---

# Knowledge Base

`KnowledgeBaseBuilder` turns a `Session`'s graph into an Obsidian-compatible vault: one note per function, component, and hypothesis, plus a strings index, an imports index, an overview, and an index/MOC note.

## Generating a Vault

During analysis, with decompilation embedded (a live Ghidra host is available):

```bash
reeve analyze ./binary --kb
```

From a saved session, without Ghidra — no decompilation, since it isn't stored in the session JSON:

```bash
reeve kb ./binary.reeve.json --output ./binary_kb/
```

## Vault Structure

```
<binary>_kb/
  index.md              MOC: stats, navigation, components, hypotheses, key functions, notable imports
  overview.md            the full generated report (or "*Report not yet generated.*")
  strings.md             extracted strings grouped by category
  imports.md             resolved imports grouped by category
  functions/
    <slug>.md            one note per function
  components/
    <slug>.md            one note per component
  hypotheses/
    <slug>.md            one note per hypothesis
```

Filenames come from a `_slug()` helper: lowercase, strip everything but word characters/spaces/hyphens, collapse whitespace/underscores to a single `_`, truncate to 80 characters.

## Function Notes

Frontmatter and body are built directly from the graph — no field is invented if the graph doesn't have it:

```markdown
---
tags:
  - function
  - size/small
  - resolved
  - component/allocator
  - heap
address: "0x101a3f"
confidence: 0.85
size: small
resolved: true
obfuscated: false
component: "allocator"
---

# parse_chunk

```c
void *parse_chunk(size_t size)
```

**Confidence:** ████████░░ 85%

**Component:** [[components/allocator]]

## Calls
- [[functions/malloc|malloc]]

## Called by
- [[functions/main|main]]

## Referenced strings
- `tcache poisoning` `#unknown`

## Decompilation

```c
void * parse_chunk(size_t size) {
  ...
}
```
```

The `## Decompilation` section only appears when the builder was given a `decompile_fn` (i.e. `reeve analyze --kb`). `reeve kb` on a saved session never includes it.

## Component Notes

```markdown
---
tags:
  - component
component_id: "allocator"
confidence: 0.80
functions: 6
---

# Component: allocator

> Custom tcache-style allocator subsystem

## Functions
- [[functions/parse_chunk|parse_chunk]] —
```

## Hypothesis Notes

```markdown
---
tags:
  - hypothesis
  - hypothesis/confirmed
hypothesis_id: "a1b2c3d4"
confidence: 0.90
status: "confirmed"
---

# An attacker can forge a tcache freelist entry to redirect the next allocation

**Confidence:** █████████░ 90%

## Evidence for
- parse_chunk does not validate the fd pointer
```

There is no separate "Falsification Conditions" section in the actual note — `HypothesisNode` tracks `evidence_for`/`evidence_against` lists and a status (`open`/`confirmed`/`refuted`/`deferred`) derived from confidence crossing 0.85 or 0.15. See [KnowledgeGraph](./knowledge-graph.md#node-types).

## Using the Vault in Obsidian

1. Open Obsidian
2. File → Open Vault → select the `_kb/` directory
3. Open `index.md` to start

## Function Tags

Beyond structural tags (`function`, `size/<class>`, `resolved`, `obfuscated`, `lang/<lang>`, `component/<slug>`), tags are inferred from a keyword-in-name check, in this order, all matches applied (a function can get several):

| Tag | Applied when the name contains |
|-----|-------------|
| `ctf/target` | `win` |
| `ctf/flag` | `flag` |
| `vulnerability` | `vuln` |
| `heap` | `heap`, `malloc`, `free` |
| `stack` | `stack` |
| `vulnerability/overflow` | `overflow` |
| `crypto` | `encrypt`, `decrypt`, `hash` |
| `network` | `socket`, `recv`, `send` |
| `code-exec` | `exec`, `shell`, `system` |
| `parser` | `parse` |
| `io` | `read`, `write` |

This is a plain substring check on the (LLM-assigned or raw) function name — a function named `parse_and_free_chunk` picks up both `parser` and `heap`.
