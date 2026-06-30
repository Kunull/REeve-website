---
id: goals
title: Goals
sidebar_position: 4
---

# Goals

The `--goal` flag is the primary way to tell REeve what to focus on. It is a plain-English string. REeve parses it to select which analysis tasks to run and in what order.

## How Goals Work

REeve maps your goal to a task dependency graph (DAG). Different goals enable different task sets:

| Goal keyword | Tasks enabled |
|-------------|---------------|
| `exploit`, `vulnerability`, `pwn` | import resolution, string categorization, type inference, component clustering, full function naming, hypothesis formation, global synthesis, report |
| `malware`, `C2`, `persistence` | import resolution, string categorization, component clustering, function naming, hypothesis formation, global synthesis, report |
| `understand`, `what does` | import resolution, call graph, function naming, component clustering, global synthesis, report |
| `find function`, `locate` | import resolution, call graph, signature matching, targeted function naming |

If no goal is provided, REeve defaults to `"understand what this binary does"` which runs the full pipeline.

## Writing Effective Goals

Be specific about what you want to find, not how to find it. REeve handles the how.

**Good goals:**

```
identify memory corruption vulnerabilities and their exploitation path
```

```
find what network calls this binary makes and what data it sends
```

```
determine if this binary has any anti-debugging or anti-analysis techniques
```

**Goals that are too vague:**

```
analyze the binary
```

```
reverse engineer it
```

Vague goals are treated as `"understand what this binary does"` and run the full pipeline.

## Goal Examples by Context

### CTF Pwn

```bash
reeve analyze ./challenge \
  --goal "identify heap or stack vulnerabilities and how to reach them"
```

### Malware Triage

```bash
reeve analyze ./sample.exe \
  --goal "identify C2 domains, persistence mechanisms, and what data the binary exfiltrates"
```

### Cryptography Analysis

```bash
reeve analyze ./crackme \
  --goal "identify the key validation routine and reverse the algorithm"
```

### General Recon

```bash
reeve analyze ./target \
  --goal "build a high-level map of what this binary does and identify interesting entry points"
```
