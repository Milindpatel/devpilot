# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-17

### Added

- Subagents: `code-reviewer`, `security-auditor`, `test-engineer`, `debugger`,
  `codebase-explorer`, `docs-writer`.
- Slash commands: `/devpilot:review`, `/devpilot:ship`, `/devpilot:fix`,
  `/devpilot:test`, `/devpilot:onboard`, `/devpilot:pr`, `/devpilot:explain`.
- Skills: `conventional-commits`, `secure-coding`.
- Safety guard PreToolUse hook (Bash, PowerShell, Read, Edit, Write) with 72 tests.
- Marketplace manifest so the repo can be installed with `/plugin marketplace add`.
- GitHub Actions CI running the guard tests and manifest checks.
