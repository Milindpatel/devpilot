---
description: Multi-agent code review of your changes (correctness + security), merged into one ranked report
argument-hint: "[path | branch | PR number]  (default: uncommitted changes)"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(gh pr view:*), Bash(gh pr diff:*), Read, Grep, Glob, Agent
---

## Context

- Branch: !`git branch --show-current`
- Status: !`git status --short`
- Changed files (staged + unstaged): !`git diff HEAD --stat`

## Task

Review target: **$ARGUMENTS** (if empty, review the uncommitted changes shown above; if there are none, review the current branch against its base, `git diff main...HEAD`).

If the target is a PR number, fetch it with `gh pr view <n>` and `gh pr diff <n>`.

1. Launch the **code-reviewer** and **security-auditor** subagents **in parallel** on the same target. Give each the exact list of files or the diff command to use.
2. When both return, **merge** their findings:
   - De-duplicate overlapping findings, keeping the clearer one.
   - Re-check any Critical/High finding yourself by reading the cited lines. Drop findings you cannot confirm.
   - Rank by severity: 🔴 Critical → 🟠 High → 🟡 Medium → 🔵 Low.
3. Present a single report:
   - **Verdict**: APPROVE / APPROVE WITH NITS / REQUEST CHANGES.
   - **Findings table**: `# | Severity | Location | Problem | Fix`.
   - **Details** for Critical/High items, with a failure scenario and a suggested patch.
   - **What's good** and **Not reviewed**.
4. Do not edit any files. End by asking whether to apply the fixes, and which ones.
