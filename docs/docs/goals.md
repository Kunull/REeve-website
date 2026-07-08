---
id: goals
title: Goals
sidebar_position: 4
---

# Goals

The `--goal` flag tells REeve what to focus on. It looks like natural language, but `GoalPlanner.decompose()` is **keyword matching, not an LLM call** — the goal string is lowercased and checked against five fixed patterns, in order, and the first match wins.

## Matching Order

```
1. Function question?           → single-function plan
   (matches "0x...", "sub_...", "analyze function",
    "what is/does ... function/sub_/0x", or the broad "what does ... do")

2. contains "malware" / "threat" / "c2" / "persistence" / "inject"
                                 → malware analysis plan

3. contains "vulnerability" / "vuln" / "overflow" / "uaf" / "exploit"
                                 → vulnerability plan

4. contains "symbol" / "name" / "recover" / "rename" / "full"
                                 → full symbol-recovery plan

5. (no match)                   → full analysis plan
```

Each branch returns a fixed, hardcoded list of `Task` objects — the plan shape doesn't otherwise adapt to your wording, only to which bucket it lands in.

:::warning The CLI's own default goal doesn't hit "full analysis"
`reeve analyze` defaults to `--goal "full analysis"`. That string contains `"full"`, which matches **rule 4** (full symbol-recovery), not rule 5. So the out-of-the-box default plan is: static foundation → `analyze_function` → `propagate_names` → `global_synthesis` → `generate_report`. It **skips `form_hypothesis` and `synthesize_component` entirely** — no hypotheses get formed unless your goal happens to fall through to rule 5, e.g. by avoiding every listed keyword.
:::

## Plan Contents

All plans start from the same static foundation (`resolve_imports`, `analyze_strings`, `build_call_graph`, `match_signatures`, `classify_functions`, `analyze_cfg`, `infer_types`, `cluster_components`), then diverge:

| Plan | Extra tasks after the static foundation |
|------|------------------------------------------|
| Single function | `analyze_function` (scope: single, address if found) → `answer_question` |
| Malware analysis | `analyze_function` (focus: malware) → `propagate_names` → two `form_hypothesis` (C2 comms, persistence) → two `test_hypothesis` → `generate_report` (focus: malware) |
| Vulnerability | `analyze_function` (focus: vulnerability) → `propagate_names` → `form_hypothesis` (input validation weakness) → `test_hypothesis` → `generate_report` (focus: vulnerability) |
| Full symbol recovery | `analyze_function` (scope: all) → `propagate_names` → `global_synthesis` → `generate_report` |
| Full analysis | `analyze_function` (scope: all) → `propagate_names` → `form_hypothesis` → `synthesize_component` → `global_synthesis` → `generate_report` |

`form_hypothesis`/`test_hypothesis` calls seed a `claim_template` string (e.g. `"C2 communication mechanism"`) — the LLM is asked to turn that into a specific, falsifiable claim, not to invent the topic itself.

## Writing Goals

Since matching is substring-based, the practical guidance is narrower than "be specific":

- Rules are checked in the order above and the first match wins. A goal containing both `"overflow"` and `"full"` hits rule 3 (vulnerability), not rule 4, because vulnerability is checked first.
- If you want `form_hypothesis`/`test_hypothesis` to run on a general goal, avoid every keyword in rules 1–4 (including `full`) so the goal falls through to rule 5. `"identify how this could be attacked"` works; `"full analysis"` does not.
- Avoid phrasing your goal as "what does ... do" or mentioning a `0x` address or `sub_` name unless you actually want the narrow single-function plan — those patterns route there regardless of what else the goal says.

### Examples

```bash
# Falls through to rule 5 (full analysis, includes hypothesis formation)
reeve analyze ./challenge --goal "identify how this could be attacked"

# Rule 3 (vulnerability plan) via "overflow"
reeve analyze ./pwnable --goal "look for a stack overflow"

# Rule 2 (malware plan) via "c2"
reeve analyze ./sample.exe --goal "identify c2 behavior"

# Rule 1 (single-function plan) via the address pattern
reeve analyze ./binary --goal "what does the function at 0x401234 do?"
```
