---
description: Generate meaningful tests for a file, function or your current changes, in the project's own framework, and run them
argument-hint: "[file | function | 'changed']  (default: changed files)"
allowed-tools: Bash, Read, Grep, Glob, Edit, Write, Agent
---

## Context

- Changed files: !`git diff HEAD --name-only`

## Task

Target: **$ARGUMENTS** (if empty or `changed`, use the changed source files listed above, excluding existing tests, docs and config).

1. For each target, find any existing tests and the gaps in what they cover.
2. Delegate to the **test-engineer** agent with the targets, the existing test locations and the behaviours that are not yet covered. If there are several independent targets, run one agent per target in parallel.
3. Make sure the new tests were actually run. Report:
   - A table of `target | test file | tests added | result`.
   - Any bugs the new tests exposed. These are bugs to fix, not tests to delete.
   - The command to run the tests again.
