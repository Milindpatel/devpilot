---
description: Diagnose and fix a bug from an error message, failing test or GitHub issue — root cause first, with a regression test
argument-hint: "<error text | failing test | issue number>"
allowed-tools: Bash, Read, Grep, Glob, Edit, Write, Agent
---

## Task

Problem to fix: **$ARGUMENTS**

1. If the argument is an issue number (for example `#123` or `123`) and `gh` is available, read it with `gh issue view <n> --comments` to get the report, reproduction steps and expected behaviour.
2. If no problem was given, ask the user for the error output or the failing command. Don't guess.
3. Delegate to the **debugger** agent with everything you know: the error text, reproduction steps, suspected files and recent related commits.
4. When it returns, check its evidence: the root cause must be backed by a reproduction or a log, and the regression test must have failed before the fix.
5. Run the relevant tests again yourself to confirm they pass.
6. Summarise using the debugger's format (Root cause / Evidence / Fix / Verified / Follow-ups) and show the final diff with `git diff`. Do not commit; suggest `/devpilot:ship` as the next step.
