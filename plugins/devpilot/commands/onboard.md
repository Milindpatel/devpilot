---
description: Generate an onboarding guide (architecture, key files, how to run, conventions) for the current repository
argument-hint: "[optional focus area or question, e.g. 'auth flow']"
allowed-tools: Bash(git log:*), Bash(git ls-files:*), Bash(git ls-tree:*), Bash(ls:*), Read, Grep, Glob, Write, Agent
---

## Context

- Top-level files: !`git ls-tree --name-only HEAD`
- Recent activity: !`git log --oneline -n 15`

## Task

Create an onboarding guide for a new engineer joining this repository. Focus: $ARGUMENTS

1. Launch the **codebase-explorer** agent. If the repo has several clearly separate areas (for example `frontend/`, `backend/`, `infra/`), launch one explorer per area in parallel and merge their maps.
2. Check the run, test and build commands it reports against the actual manifests and scripts.
3. Write the result to `ONBOARDING.md` at the repo root (ask before overwriting an existing file) with these sections:
   - Overview · Tech stack · Architecture (Mermaid diagram) · Key files · Getting started · Common tasks · Conventions & gotchas · Glossary · Where to ask for help (left as a TODO for the team).
4. If a focus area or question was given, add a deep-dive section answering it, with `file:line` references.
5. Reply with a five-bullet summary and the path to the guide.
