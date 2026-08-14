# Security Policy

## Reporting a vulnerability

Use GitHub's private vulnerability reporting: open the
[Security tab](https://github.com/thiqwave-com/thiqwave-app/security/advisories/new)
and submit a draft advisory. The report stays private between you and the
maintainers until a fix ships.

Please do not open a public issue for a security report.

Include enough detail to reproduce: affected file or endpoint, the steps you
took, and what you observed.

## Scope

This repository is a **reference integration** — a demonstration client for the
Thiqwave API. It currently runs entirely on mocked, in-browser data.

**In scope:** anything here that could harm someone running it — a dependency
vulnerability, a code path that leaks a developer's own credentials, an
injection flaw, an unsafe default in the Docker or deploy configuration.

**Not in scope:**

- The demo sign-in. It is a client-side gate with published credentials and no
  server-side verification. This is intentional and documented; it is not
  authentication and is not meant to be.
- Seeded demo data. Balances, transfers, recipients and organisation details in
  this repo are fictional.
- The absence of features the real product has. This app demonstrates an
  integration surface, not the full platform.

For vulnerabilities in the Thiqwave API itself rather than this client, say so
in the report — it reaches the same team.
