# Contributing to PrivacyQuant

Contributions are welcome.

**Statutory nodes** — include a bill citation, `effective_date`, and a `source_url`
to official statutory text. Run `git config core.hooksPath .githooks` after cloning
to auto-populate `git_hash`, or run `bash scripts/populate_git_hashes.sh` before pushing.

**Enforcement corpus** — entries go in `references/enforcement_actions.json`. Source URL
must point to an official AG press release or consent order. Violation theories must use
the existing 48-tag taxonomy.

**New tools** — open an issue before building. Default to deterministic.

**Reference docs** — PRs to `references/` are welcome, include a source citation.

Run `npm run validate` from `mcp-server/` before submitting. PRs that fail will not be merged.

By contributing, you agree your work will be licensed under MIT.
