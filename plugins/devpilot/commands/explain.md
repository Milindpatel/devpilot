---
description: Explain a file, function, error or concept in this codebase at the level you choose
argument-hint: "<file | symbol | error> [beginner|expert]"
allowed-tools: Read, Grep, Glob, Bash(git log:*), Bash(git blame:*)
---

## Task

Explain: **$ARGUMENTS**

1. Locate the subject. Use Grep/Glob for symbols, and read the full definition plus its main callers and callees.
2. Pick the depth: use `beginner` or `expert` if given; otherwise assume an experienced developer who is new to this codebase.
3. Structure the answer as:
   - **TL;DR** — one sentence.
   - **What it does** — inputs, outputs, side effects.
   - **How it works** — step by step, with `file:line` references. Add a small Mermaid sequence diagram if more than three components are involved.
   - **Why it's like this** — use `git log -L` or `git blame` on key lines when the history explains a non-obvious decision.
   - **Gotchas** — edge cases, performance traps, places that are easy to break.
4. Don't modify anything.
