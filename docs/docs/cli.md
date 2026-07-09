---
id: cli
title: CLI Reference
sidebar_position: 3
---

# CLI Reference

The installed command is `reeve`. Every subcommand accepts the group-level `-v`/`--verbose` flag for debug logging.

## reeve analyze

Run autonomous analysis on a binary.

```bash
reeve analyze BINARY [OPTIONS]
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--goal`, `-g TEXT` | `"full analysis"` | Plain-English objective that drives task selection — see [Goals](./goals.md). |
| `--budget`, `-b FLOAT` | unlimited | Cost ceiling in USD for the run. |
| `--tui` / `--no-tui` | `--no-tui` | Launch the Textual TUI instead of a plain progress spinner. |
| `--kb` / `--no-kb` | `--no-kb` | Build an Obsidian vault after analysis completes. |

The session JSON and Markdown report are saved to `<binary>.reeve.json` and `<binary>.report.md` next to the binary.

### Example

```bash
reeve analyze ./challenge --goal "identify heap or stack vulnerabilities" --kb
```

---

## reeve chat

Interactive chat over a binary.

```bash
reeve chat BINARY
```

Runs the static-analysis foundation, then drops into a `question > ` prompt loop for asking questions about the binary against the knowledge graph. Type `quit`, `exit`, or `q` to leave.

---

## reeve ask

Ask a single question about a binary, non-interactively.

```bash
reeve ask BINARY "QUESTION"
```

Plans and runs the analysis needed to answer the question, then prints the answer.

---

## reeve report

Export or re-render the report saved inside a session JSON.

```bash
reeve report SESSION_JSON [OPTIONS]
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--format`, `-f [md\|txt\|html\|json]` | `md` | Output format. |
| `--output`, `-o PATH` | stdout | Write to a file instead of printing. |

See [Reports](./reports.md) for what each format contains.

### Example

```bash
reeve report ./challenge.reeve.json --format html --output ./challenge.report.html
```

---

## reeve kb

Build an Obsidian vault from a saved session, without touching Ghidra.

```bash
reeve kb SESSION_JSON [OPTIONS]
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--output`, `-o PATH` | `<binary>_kb/` | Vault output directory. |

Useful for regenerating or sharing a knowledge base from a previous run without needing Ghidra or an API key again.

### Example

```bash
reeve kb ./challenge.reeve.json --output ./challenge_vault/
```

---

## reeve eval

Score a saved analysis against a ground-truth JSON file.

```bash
reeve eval ANALYSIS_JSON GROUND_TRUTH_JSON
```

Reports symbol-naming and type-recovery accuracy against known-correct answers — useful for benchmarking REeve's output on binaries where the ground truth is known.

---

## Exit Codes

`0` on success, `1` on an analysis or Ghidra error, `2` on a usage error (bad arguments, unknown option).
