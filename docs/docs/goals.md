---
id: goals
title: Goals
sidebar_position: 4
---

# Goals

The `--goal` flag tells REeve what to focus on, in plain English. `GoalPlanner` reads the goal and selects one of five task plans based on the intent it detects:

```
Function-specific question   → single-function plan
Malware / threat indicators  → malware analysis plan
Vulnerability / exploitation → vulnerability plan
Symbol recovery              → full symbol-recovery plan
General analysis             → full analysis plan
```

Each plan is a purpose-built task sequence — not a generic pipeline reused for every goal.

## Plan Contents

Every plan starts from the same static foundation (`resolve_imports`, `analyze_strings`, `build_call_graph`, `match_signatures`, `classify_functions`, `analyze_cfg`, `infer_types`, `cluster_components`), then diverges based on the goal:

| Plan | Focus |
|------|-------|
| Single function | Answers a targeted question about one function — by address, name, or description. |
| Malware analysis | Names functions with a malware lens, then forms and tests hypotheses about C2 communication and persistence mechanisms. |
| Vulnerability | Names functions with a vulnerability lens, then forms and tests a hypothesis about the input-validation weakness driving it. |
| Full symbol recovery | Names every function and produces a synthesized report, prioritizing coverage. |
| Full analysis | Names every function, forms and clusters component-level hypotheses, then synthesizes and reports — the most complete pipeline. |

`form_hypothesis`/`test_hypothesis` seed a claim template (e.g. "C2 communication mechanism") and ask the LLM to turn it into a specific, falsifiable claim grounded in the analyzed functions.

## Writing Goals

Describe what you want to find, not how to find it:

```bash
# Vulnerability-focused
reeve analyze ./pwnable --goal "look for a stack overflow"

# Malware triage
reeve analyze ./sample.exe --goal "identify c2 behavior"

# Targeted function question
reeve analyze ./binary --goal "what does the function at 0x401234 do?"

# General, full-depth analysis
reeve analyze ./challenge --goal "identify how this could be attacked"
```

For the most complete pipeline — full function naming, component clustering, hypothesis formation, and global synthesis — phrase the goal around understanding or attacking the binary as a whole rather than around symbol recovery specifically.
