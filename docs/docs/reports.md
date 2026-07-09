---
id: reports
title: Reports
sidebar_position: 5
---

# Reports

REeve's report generator writes a structured Markdown analysis report on Opus, covering as much of the following as applies to the binary:

| Section | Content |
|---------|---------|
| 1. Overview | Binary type, format, architecture, and overall purpose |
| 2. Key Functions | Table of the most important functions, addresses, and roles |
| 3. Program Behavior | Walkthrough of the execution flow |
| 4. Flag / Objective (CTF) | How the flag or objective is reached, for CTF binaries |
| 5. Vulnerability / Mechanism | Root cause and why it's exploitable |
| 6. Exploitation Path | Step-by-step exploit procedure |
| 7. Conclusion | Summary of the binary and the finding |

## Auto-Save

Every `reeve analyze` run that produces a report saves it to `<binary>.report.md` automatically.

## Re-Exporting From a Saved Session

`reeve report` re-renders the report already stored in a session JSON, in a different format:

```bash
reeve report ./binary.reeve.json --format html --output ./binary.report.html
reeve report ./binary.reeve.json --format json
reeve report ./binary.reeve.json --format txt
```

## Format Options

### Markdown (`md`)

The report as generated — headers, tables, and code blocks intact. Suitable for direct reading, GitHub rendering, or Obsidian.

### HTML (`html`)

Headings and inline formatting converted to HTML tags for sharing without a Markdown renderer.

### JSON (`json`)

One key per section, keyed by heading — suitable for piping into other tools.

### Plain text (`txt`)

Markup stripped down to visible text, for terminals or tools that don't render Markdown.

## Report Quality

Report quality tracks analysis depth: the more of the binary's functions are named and the more components and hypotheses are formed, the more the report has to draw on. Goals phrased around understanding or attacking the binary as a whole exercise the fullest pipeline — see [Goals](./goals.md).
