---
id: reports
title: Reports
sidebar_position: 5
---

# Reports

If a plan reaches `generate_report`, that task calls `LLMReasoner.generate_report()` on Opus, which is given a system prompt describing a seven-section Markdown structure and told to **omit sections that don't apply**. It isn't a rigid schema enforced in code — it's an instruction the model can and does skip parts of.

## Requested Sections

| Section | Content |
|---------|---------|
| 1. Overview | One paragraph: binary type, format, architecture, overall purpose |
| 2. Key Functions | Markdown table: Function \| Address \| Role |
| 3. Program Behavior | Numbered walkthrough of the execution flow |
| 4. Flag / Objective (CTF) | How the flag/objective is reached, if this is a CTF binary |
| 5. Vulnerability / Mechanism | Root cause and why it's exploitable |
| 6. Exploitation Path | Numbered step-by-step exploit procedure |
| 7. Conclusion | Two-sentence summary of the binary and the finding |

Whether hypothesis-related sections (4–6) actually appear depends on which plan ran — see [Goals](./goals.md). The full symbol-recovery plan, which is what `reeve analyze`'s own default goal triggers, skips `form_hypothesis` entirely, so a report from that run has little to say in sections 4–6 beyond what Opus can infer from function names and strings alone.

## Auto-Save

Every `reeve analyze` run that reaches `generate_report` unconditionally saves the report to `<binary>.report.md`. There's no flag to change this path — see [CLI Reference](./cli.md#reeve-analyze).

## Re-Exporting From a Saved Session

`reeve report` re-renders the report already stored in a session JSON — it does not call the LLM again:

```bash
reeve report ./binary.reeve.json --format html --output ./binary.report.html
reeve report ./binary.reeve.json --format json
reeve report ./binary.reeve.json --format txt
```

If no report was generated during the run (e.g. a plan that never reaches `generate_report`), the session JSON's `report` field is empty and `reeve report` exits with an error.

## Format Conversion

Conversion from the stored Markdown is regex-based, not a full Markdown parser:

### Markdown (`md`)

Passed through unchanged.

### HTML (`html`)

`#`/`##`/`###` headings become `<h1>`/`<h2>`/`<h3>`, `**bold**`/`*italic*`/`` `code` `` become their inline tags, and everything else is wrapped in `<p>` tags line by line. Lists, tables, and fenced code blocks are **not** converted — a Markdown table in the Key Functions section stays as literal pipe-and-dash text inside a `<p>`.

### JSON (`json`)

Splits the text on every `#`/`##`/`###` heading it finds and uses the slugified heading text as the key, in whatever order the headings actually appear. Because sections are optional, the key set varies run to run — don't hardcode a fixed schema like `{summary, architecture, vulnerability, ...}` when consuming this.

### Plain text (`txt`)

Strips heading markers, bold/italic markers, inline code backticks, and Markdown link syntax down to their visible text.

## Report Quality

Report quality depends on how much of the graph got named and how far the goal's plan reaches. A goal that falls through to the full-analysis plan (rule 5 in [Goals](./goals.md)) exercises hypothesis formation and per-component synthesis before the report is written; a goal that lands in the full symbol-recovery plan (rule 4, which includes the CLI's own literal default) does not.
