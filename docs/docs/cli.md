---
id: cli
title: CLI Reference
sidebar_position: 3
---

# CLI Reference

The installed command is `reeve` (a Click group). Every subcommand accepts the group-level `-v`/`--verbose` flag for debug logging.

## reeve analyze

Run autonomous analysis on a binary.

```bash
reeve analyze BINARY [OPTIONS]
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--goal`, `-g TEXT` | `"full analysis"` | Plain-English objective. Matched against a small set of keywords to pick a task plan — see [Goals](./goals.md). |
| `--budget`, `-b FLOAT` | unlimited | Cost ceiling in USD. Once total cost reaches this, the executor skips remaining tasks — it does not downgrade to a cheaper model. |
| `--tui` / `--no-tui` | `--no-tui` | Launch the Textual TUI instead of a plain progress spinner. |
| `--kb` / `--no-kb` | `--no-kb` | Build an Obsidian vault after analysis completes. |

There is no flag to change where output is written: the session JSON and Markdown report are **always** saved, unconditionally, to `<binary>.reeve.json` and `<binary>.report.md` next to the binary.

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

Runs the static-analysis foundation once, then drops into a `question > ` prompt loop backed by a single Sonnet client (`answer_question`). Type `quit`, `exit`, or `q` to leave.

The command's own docstring says "ask questions, rename functions," but the chat loop does not currently wire up tool-calling — nothing gets renamed through it. It answers questions against the knowledge graph context and nothing else.

---

## reeve ask

Ask a single question about a binary, non-interactively.

```bash
reeve ask BINARY "QUESTION"
```

The question is passed straight into the same goal planner used by `analyze` (`GoalPlanner.decompose`), so it runs whatever static tasks that plan implies, then prints the first task result that contains an `"answer"` key. It always opens a Ghidra host — there's no string-search-only fast path despite what the docstring implies.

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

Conversion is done with regexes over the stored Markdown, not a real Markdown parser:

- `txt` strips heading markers, bold/italic markers, inline code backticks, and link syntax.
- `html` wraps `#`/`##`/`###` headings and paragraphs; lists, tables, and code fences are not converted.
- `json` splits the report on whatever `#`/`##`/`###` headings actually appear in it, one key per heading (slugified) — not a fixed schema. See [Reports](./reports.md).

If the session JSON has no `report` field, this command exits with an error asking you to re-run analysis.

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

This reconstructs a minimal `KnowledgeGraph` from the JSON (functions, components, hypotheses) — no Ghidra host, no API key needed. Because decompilation is never stored in the session JSON, function notes built this way have no `## Decompilation` section. Only `reeve analyze --kb` produces notes with embedded decompilation, since it has a live Ghidra host to pull it from.

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

Reconstructs a minimal graph from `ANALYSIS_JSON` and runs `EvalHarness`, which computes exactly two metrics — see [Architecture](./architecture.md#evals).

---

## Exit Codes

Standard Click behavior applies: `0` on success, `1` when a command raises `click.ClickException` (Ghidra failures, missing report, etc.), `2` on a usage error (bad arguments, unknown option). REeve does not define exit codes beyond these.
