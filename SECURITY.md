# Security Policy

## Scope

PrivacyQuant is a static knowledge corpus and MCP server. It does not collect user data,
operate network services, store credentials, or process personal information at runtime.
Sixteen of eighteen tools are fully deterministic and make no external API calls.

That said, two surfaces warrant responsible disclosure:

- **MCP server code** (`mcp-server/`) — TypeScript that runs locally on a user’s machine
- **Dependency chain** — npm packages that could introduce vulnerabilities
- **Data integrity** — YAML nodes or the enforcement corpus that contain materially
  incorrect statutory citations, thresholds, or deadlines in a way that could mislead
  legal workflows

Statutory inaccuracies (wrong section numbers, stale effective dates, missing amendments)
are treated as security-adjacent issues because downstream consumers may rely on this
corpus for compliance decisions. Report them through the same channel.

## Supported versions

Only the current `main` branch is actively maintained. There are no versioned releases
with independent support windows at this time.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report privately via GitHub’s built-in security advisory mechanism:

1. Go to https://github.com/foolish-bandit/privacyquant/security/advisories
1. Click **New draft security advisory**
1. Describe the issue, affected file(s), and reproduction steps if applicable

Alternatively, email: **zgbrenner@gmail.com**

Include in your report:

- Nature of the issue (code vulnerability, dependency, data integrity)
- Affected file(s) or tool(s)
- Steps to reproduce or a proof of concept
- Your assessment of severity and exploitability

## Response timeline

|Milestone        |Target                                                    |
|-----------------|----------------------------------------------------------|
|Acknowledgment   |72 hours                                                  |
|Initial triage   |7 days                                                    |
|Fix or mitigation|30 days for code issues; 14 days for data integrity issues|
|Public disclosure|Coordinated with reporter after fix is merged             |

For statutory accuracy issues (wrong thresholds, stale deadlines), the fix timeline
is 14 days and will include a commit with the corrected node, updated `git_hash`,
and a source URL pointing to the controlling statutory text.

## Out of scope

- Vulnerabilities in tools that PrivacyQuant pairs with (Claude Code, CourtListener,
  Ansvar, OpenStates) — report those to their respective maintainers
- Issues requiring physical access to a user’s machine
- Social engineering
- Spam or denial-of-service against GitHub Pages

## Data integrity issues

If you find a statutory node that is materially wrong — wrong deadline, wrong threshold,
missing exception, stale effective date — you can either:

- File a private advisory as above, or
- Open a public issue labeled `data-integrity` if the error is non-sensitive (i.e.,
  it does not create an exploitable attack surface, just a legal inaccuracy)

Include the node ID (e.g., `ccpa.rights.deletion`), the incorrect field, the correct
value, and a link to the controlling statutory source.

## Attribution

Reporters who identify valid vulnerabilities or material data integrity issues will be
credited in the fix commit message and release notes unless they request anonymity.
