# DevPilot repository

This repo is a Claude Code plugin marketplace containing one plugin, `plugins/devpilot`.

- Agents, commands and skills are Markdown with YAML frontmatter. Keep each one focused
  and give it a clear process plus an output format.
- `plugins/devpilot/hooks/guard.js` must stay dependency-free and Node 16 compatible.
  Every rule change needs matching cases in `tests/guard.test.js` (risky + safe lookalike).
- Run `npm test` and `claude plugin validate ./plugins/devpilot` after changes.
- Bump `version` in both `plugins/devpilot/.claude-plugin/plugin.json` and
  `.claude-plugin/marketplace.json` together, and add a CHANGELOG entry.
