# Contributing to DevPilot

Thanks for helping! DevPilot is plain Markdown plus one zero-dependency Node script,
so contributing is easy.

## Setup

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/devpilot.git
cd devpilot
npm test
claude --plugin-dir ./plugins/devpilot
```

## Adding things

| To add a… | Create | Notes |
|---|---|---|
| Subagent | `plugins/devpilot/agents/<name>.md` | Frontmatter: `name`, `description` (say *when* to use it), `tools`, `model`. Give it the fewest tools it needs. |
| Slash command | `plugins/devpilot/commands/<name>.md` | Frontmatter: `description`, `argument-hint`, `allowed-tools`. Use `$ARGUMENTS` and `` !`cmd` `` for context. |
| Skill | `plugins/devpilot/skills/<name>/SKILL.md` | Frontmatter: `name`, `description` (the trigger: be specific). |
| Guard rule | `plugins/devpilot/hooks/guard.js` | Add a test case to `tests/guard.test.js` for **both** the risky command and a similar safe command it must not block. |

## Guidelines

- Prompts should give agents a **process** and an **output format**, not just a persona.
- Anything outward-facing (commit, push, publish, PR) must ask the user first.
- Prefer `ask` over `deny` in the guard unless the command is almost never intended.
- Run `npm test` and `claude plugin validate ./plugins/devpilot` before opening a PR.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.
