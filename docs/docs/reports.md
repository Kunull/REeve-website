---
id: reports
title: Reports
sidebar_position: 5
---

# Reports

REeve generates a structured report at the end of every analysis run. The report is written by Claude Opus using a fixed seven-section schema.

## Report Sections

| Section | Content |
|---------|---------|
| Summary | One-paragraph overview of the binary's purpose |
| Architecture | Component breakdown and call graph structure |
| Vulnerability | Identified vulnerabilities with location and mechanism |
| Exploitation Path | Step-by-step exploitation if vulnerabilities exist |
| Key Functions | Table of the most important functions with addresses |
| Indicators | Strings, imports, and patterns that characterize the binary |
| Recommendations | Mitigations or areas for deeper manual analysis |

## Auto-Save

Every `reeve analyze` run auto-saves a Markdown report to `<binary>.report.md`. To change the path:

```bash
reeve analyze ./binary --report ./my_report.md
```

## Generating Reports from Saved Sessions

To regenerate a report or export in a different format, use `reeve report`:

```bash
# Re-generate as HTML
reeve report ./binary.reeve.json --format html

# JSON format (one key per section)
reeve report ./binary.reeve.json --format json

# Plain text
reeve report ./binary.reeve.json --format txt
```

## Report Formats

### Markdown (`md`)

Human-readable with headers. Suitable for direct reading, GitHub rendering, or Obsidian.

### HTML (`html`)

Self-contained HTML file with embedded styles. Suitable for sharing without a Markdown renderer.

### JSON (`json`)

Machine-readable. One key per section. Suitable for downstream processing or piping into other tools.

```json
{
  "summary": "...",
  "architecture": "...",
  "vulnerability": "...",
  "exploitation_path": "...",
  "key_functions": "...",
  "indicators": "...",
  "recommendations": "..."
}
```

### Plain text (`txt`)

No markup. Suitable for terminals or tools that do not render Markdown.

## Report Quality

Report quality depends on analysis coverage. A binary with 80% of functions named produces a better report than one with 20%. For large binaries where budget is a concern, run with a focused goal to name only the functions that matter.
