---
id: cli
title: CLI Reference
sidebar_position: 3
---

# CLI Reference

## reeve analyze

Run a full analysis on a binary.

```bash
reeve analyze BINARY [OPTIONS]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `BINARY` | Path to the binary to analyze |

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--goal TEXT` | `"understand what this binary does"` | Plain-English goal that drives task selection |
| `--output TEXT` | `<binary>.reeve.json` | Path to save the session JSON |
| `--report TEXT` | `<binary>.report.md` | Path to auto-save the Markdown report |
| `--kb` | Off | Build an Obsidian knowledge base after analysis |
| `--kb-output TEXT` | `<binary>_kb/` | Directory for the knowledge base |

### Examples

Minimal invocation:

```bash
reeve analyze ./challenge
```

With an exploitation goal:

```bash
reeve analyze ./pwnable \
  --goal "identify memory corruption vulnerabilities and their exploitation path" \
  --kb
```

Malware triage:

```bash
reeve analyze ./suspicious.exe \
  --goal "identify C2 communication patterns and persistence mechanisms" \
  --output ./session.json \
  --report ./triage.md
```

---

## reeve report

Generate or re-generate a report from a saved session.

```bash
reeve report SESSION [OPTIONS]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `SESSION` | Path to a `.reeve.json` session file |

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--format TEXT` | `md` | Output format: `md`, `html`, `json`, `txt` |
| `--output TEXT` | `<session>.report.<ext>` | Path to write the report |

### Examples

Generate an HTML report:

```bash
reeve report ./challenge.reeve.json --format html --output ./challenge.report.html
```

Generate a JSON report (one key per section):

```bash
reeve report ./challenge.reeve.json --format json
```

---

## reeve kb

Build an Obsidian knowledge base from a saved session without re-running Ghidra.

```bash
reeve kb SESSION [OPTIONS]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `SESSION` | Path to a `.reeve.json` session file |

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--output TEXT` | `<session>_kb/` | Directory for the vault |

### Notes

`reeve kb` reconstructs the knowledge graph from the session JSON and does not require Ghidra or an API key. It does not include decompilation in function notes because decompilation is not stored in the session file. Use `--kb` on `reeve analyze` to include decompilation.

### Example

```bash
reeve kb ./challenge.reeve.json --output ./challenge_vault/
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Ghidra or analysis error |
| 2 | Bad arguments |
