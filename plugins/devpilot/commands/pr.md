---
description: Write a reviewer-friendly pull request title and description from the current branch
argument-hint: "[base branch]  (default: main)"
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(gh pr create:*), Read, Grep, Glob
---

## Context

- Current branch: !`git branch --show-current`

## Task

Base branch: **$ARGUMENTS** (default `main`; fall back to `master` if `main` doesn't exist).

1. Collect `git log --oneline <base>..HEAD` and `git diff <base>...HEAD --stat`, then read the important hunks.
2. Write a PR in this format:

```markdown
## <Conventional-style title, at most 72 characters>

### What
<2–4 bullets: the user-visible or API-visible change>

### Why
<The problem or motivation; link issues with "Closes #n" if branch or commit names reference them>

### How
<Key implementation decisions and trade-offs; call out anything non-obvious>

### Testing
<How it was verified: tests added or updated, manual steps, screenshots placeholder for UI changes>

### Risk & rollout
<Breaking changes, migrations, feature flags, rollback plan; "Low risk" if trivial>

### Reviewer notes
<Where to start reading; files that can be skimmed>
```

3. Output the PR text. **Ask before** running `gh pr create`. Never push the branch without explicit approval.
