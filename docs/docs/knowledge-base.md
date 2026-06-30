---
id: knowledge-base
title: Knowledge Base
sidebar_position: 6
---

# Knowledge Base

REeve can generate an Obsidian-compatible knowledge base from any analysis session. The vault contains one note per function, component, and hypothesis, with YAML frontmatter, wikilinks, tags, and embedded decompilation.

## Generating a Vault

During analysis:

```bash
reeve analyze ./binary --kb
```

From a saved session (no Ghidra required):

```bash
reeve kb ./binary.reeve.json --output ./binary_kb/
```

## Vault Structure

```
binary_kb/
  INDEX.md              <- MOC with stats, top functions, all hypotheses
  functions/
    main.md
    parse_input.md
    handle_request.md
    ...
  components/
    allocator.md
    ui_layer.md
  hypotheses/
    tcache_poisoning.md
    uaf_write_primitive.md
```

## Function Notes

Each function note contains:

```markdown
---
address: "0x101a3f"
confidence: 0.85
component: allocator
tags: [heap, free, tcache]
callers: ["[[main]]", "[[handle_request]]"]
callees: ["[[malloc]]", "[[free]]"]
---

# parse_chunk

**Confidence:** █████████░ 85%

Part of component: [[allocator]]

## Callers
- [[main]]
- [[handle_request]]

## Callees
- [[malloc]]
- [[free]]

## Decompilation

```c
void * parse_chunk(size_t size) {
  tcache_entry *entry;
  entry = tcache->entries[idx];
  if (entry == NULL) return malloc(size);
  tcache->entries[idx] = entry->next;
  return entry;
}
```

## LLM Analysis

This function implements a custom tcache-style allocator that bypasses
the standard glibc tcache. The fd pointer is not validated before use,
making it vulnerable to a forged freelist attack if an attacker controls
a freed chunk's fd field.
```

## Hypothesis Notes

Hypothesis notes link to the functions that provide supporting evidence:

```markdown
---
confidence: 0.90
status: tentative
---

# tcache_poisoning

**Confidence:** █████████░ 90%
**Status:** tentative

## Claim

An attacker can forge a tcache freelist entry to redirect the next
allocation to an arbitrary address.

## Supporting Evidence

- [[parse_chunk]] does not validate the fd pointer
- [[print_tcache]] exposes raw fd values (information leak)
- [[is_mapped]] validation is bypassable with a mapped target address

## Falsification Conditions

- If the allocator validates fd with a safe-linking scheme, exploitation
  requires a heap address leak to compute the correct mangled pointer
```

## Using the Vault in Obsidian

1. Open Obsidian
2. File > Open Vault > select the `_kb/` directory
3. Open `INDEX.md` to start

The graph view shows function call relationships as a visual network. Wikilinks between functions, components, and hypotheses are fully navigable.

## Tags

Function notes are tagged based on their name and role:

| Tag | Applied when |
|-----|-------------|
| `#heap` | Name contains alloc, free, malloc, chunk, tcache |
| `#code-exec` | Name contains exec, shell, system, spawn |
| `#crypto` | Name contains encrypt, decrypt, hash, cipher, aes |
| `#net` | Name contains socket, recv, send, connect |
| `#io` | Name contains read, write, open, close, file |
| `#ctf/target` | Function is named `win`, `flag`, `get_shell` |
| `#debug` | Name contains debug, log, print, trace |
