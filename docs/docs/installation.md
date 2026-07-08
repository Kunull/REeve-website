---
id: installation
title: Installation
sidebar_position: 2
---

# Installation

## Prerequisites

REeve requires Python, Java, Ghidra, and an Anthropic API key.

### Python 3.11+

```bash
python3 --version
```

### Java 21+

```bash
java -version
```

Set `JAVA_HOME` if it is not already set. On macOS, a Temurin build can be extracted without `sudo`:

```bash
export JAVA_HOME=~/java/<extracted-dir>/Contents/Home
```

### Ghidra

Download a PUBLIC release from [github.com/NationalSecurityAgency/ghidra/releases](https://github.com/NationalSecurityAgency/ghidra/releases) and extract it. REeve does not require Ghidra to be installed — just extracted, since [PyGhidra](https://github.com/NationalSecurityAgency/ghidra/tree/master/Ghidra/Features/PyGhidra) runs it in-process.

```bash
export GHIDRA_INSTALL_DIR=/path/to/ghidra_<version>_PUBLIC
```

### Anthropic API Key

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Install REeve

```bash
git clone https://github.com/Kunull/REeve
cd REeve
pip install -e .
```

Or run `setup.sh`, which checks all three prerequisites in order (Python, `JAVA_HOME`, `GHIDRA_INSTALL_DIR`, `ANTHROPIC_API_KEY`), installs the package, and initializes PyGhidra against your Ghidra install:

```bash
bash setup.sh
```

## Verify Installation

```bash
reeve --help
```

Expected output:

```
Usage: reeve [OPTIONS] COMMAND [ARGS]...

  AI-powered binary reverse engineering engine.

Options:
  -v, --verbose  Enable debug logging
  --help         Show this message and exit.

Commands:
  analyze  Run autonomous analysis on a binary.
  ask      Ask a single question about a binary.
  chat     Interactive chat over a binary — ask questions, rename functions.
  eval     Evaluate analysis output against a ground truth JSON file.
  kb       Build an Obsidian knowledge base from a saved session JSON.
  report   Export or display the analysis report from a saved session JSON.
```

See [CLI Reference](./cli.md) for what each command actually does.

## Persisting Environment Variables

Add the three exports to your shell profile (`~/.zshrc`, `~/.bashrc`, or equivalent):

```bash
export JAVA_HOME=/path/to/jdk-21
export GHIDRA_INSTALL_DIR=/path/to/ghidra_PUBLIC
export ANTHROPIC_API_KEY=sk-ant-...
```

## Notes on Dependencies

`pyproject.toml` also lists `openai` and `z3-solver` as dependencies. Neither is currently wired into any code path — there is no OpenAI client and no Z3-based analysis anywhere in the source. Obfuscation detection is regex-based heuristics only. Don't expect either package to do anything yet.
