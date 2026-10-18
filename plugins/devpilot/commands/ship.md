---
description: Pre-flight check before committing — tests, lint, review, then a Conventional Commit (asks before committing)
argument-hint: "[optional note about the change]"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Read, Grep, Glob, Agent
---

## Context

- Branch: !`git branch --show-current`
- Status: !`git status --short`
- Diff summary: !`git diff HEAD --stat`
- Recent commits (for message style): !`git log --oneline -n 8`

## Task

Get the current changes ready to commit. Note from the user: $ARGUMENTS

Run this checklist and keep a visible ✅ / ❌ / ⚠️ status for each step:

1. **Sanity.** Refuse to continue if the branch is `main`/`master` and the repo looks shared. Suggest creating a branch instead. Flag any staged files that look like secrets (`.env`, `*.pem`, `id_rsa`, credentials JSON) or build artifacts.
2. **Tests.** Find the project's test command (package scripts, Makefile, CI config) and run it. If tests fail, stop and summarise the failures. Offer to hand them to the **debugger** agent.
3. **Lint and types.** Run the project's linter and type checker if configured. Report errors, and don't auto-fix unless asked.
4. **Review.** Run the **code-reviewer** agent on the diff. Any 🔴 Critical or 🟠 High finding blocks the commit.
5. **Commit message.** Using the `conventional-commits` skill, draft a message in the repo's existing style: `type(scope): summary` (72 characters at most), a body explaining *why*, and `BREAKING CHANGE:` / `Closes #n` footers when relevant.
6. **Confirm.** Show the checklist, the files to be committed and the drafted message. **Ask the user for approval before running `git add` / `git commit`.** Never push.
