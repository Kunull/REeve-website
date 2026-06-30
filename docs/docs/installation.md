---
id: installation
title: Installation
sidebar_position: 2
---

# Installation

## Prerequisites

REeve requires Java, Ghidra, and an Anthropic API key.

### Java 21+

```bash
java -version
```

Set `JAVA_HOME` if it is not already set:

```bash
export JAVA_HOME=/path/to/jdk-21
```

### Ghidra

Download a PUBLIC release from [github.com/NationalSecurityAgency/ghidra/releases](https://github.com/NationalSecurityAgency/ghidra/releases) and extract it. REeve does not require Ghidra to be installed -- just extracted.

```bash
export GHIDRA_INSTALL_DIR=/path/to/ghidra_PUBLIC
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

The `setup.sh` script checks all three prerequisites and runs the install:

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

Options:
  --help  Show this message and exit.

Commands:
  analyze  Analyze a binary with a goal.
  report   Generate a report from a saved session.
  kb       Build an Obsidian knowledge base from a saved session.
```

## Persisting Environment Variables

Add the three exports to your shell profile (`~/.zshrc`, `~/.bashrc`, or equivalent):

```bash
export JAVA_HOME=/path/to/jdk-21
export GHIDRA_INSTALL_DIR=/path/to/ghidra_PUBLIC
export ANTHROPIC_API_KEY=sk-ant-...
```

## Python Version

REeve requires Python 3.10 or later. PyGhidra may require a specific minor version depending on the Ghidra release. Check the PyGhidra release notes if you encounter import errors.
