---
name: conventional-commits
description: Write git commit messages that follow the Conventional Commits 1.0 spec and the repository's existing style. Use whenever drafting a commit message, squash message or changelog entry.
---

# Conventional Commits

## Format

```
<type>(<optional scope>)<optional !>: <summary>

<body: what changed and WHY, wrapped at 72 columns>

<footers: BREAKING CHANGE: ..., Closes #123, Co-Authored-By: ...>
```

## Types

| Type | Use for |
|------|---------|
| `feat` | A new user-facing capability |
| `fix` | A bug fix |
| `perf` | A performance improvement with no behaviour change |
| `refactor` | A code change that neither fixes a bug nor adds a feature |
| `test` | Adding or correcting tests only |
| `docs` | Documentation only |
| `build` | Build system, dependencies, packaging |
| `ci` | CI configuration and scripts |
| `chore` | Maintenance that doesn't touch src or tests |
| `revert` | Reverts a previous commit (body: `This reverts commit <sha>.`) |

## Rules

1. **Summary**: imperative mood ("add", not "added" or "adds"), lower case after the colon, no trailing period, 72 characters at most (aim for 50).
2. **Scope**: the module, package or area, taken from paths in the diff (`auth`, `api`, `ui`). Leave it out if the change spans the whole repo.
3. **Breaking changes**: add `!` after the type or scope **and** a `BREAKING CHANGE:` footer describing the migration.
4. **Body**: explain the motivation and the contrast with the previous behaviour. The diff already shows *what*; the body says *why*.
5. **One logical change per commit.** If the diff mixes unrelated changes, suggest splitting it and say how.
6. **Match the repo.** Check `git log --oneline -n 20` first. If the project doesn't use Conventional Commits, follow its own convention instead.

## Examples

```
feat(auth): add passwordless login via magic link

Users frequently abandon sign-up at the password step. Magic links
remove that step while keeping sessions short-lived (15 min token TTL).

Closes #412
```

```
fix(api)!: return 404 instead of 200 with null for missing users

Clients could not distinguish "not found" from "empty profile".

BREAKING CHANGE: GET /users/:id now returns 404 when the user does not
exist. Update clients that relied on a null body.
```
