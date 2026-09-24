# Changelog

All notable changes to this project are recorded here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] — 2026-09-24

First public release.

### Added
- 158 scripts across Windows, macOS, network and VPN, security triage,
  Sysinternals, software deployment, Microsoft 365 and Google Workspace.
- 24 fix-it guides. Every script is reachable from at least one of them.
- Six in-page utilities: subnet calculator, password generator, file checksum,
  CSV inspector, diagram viewer, and encrypted secret handover.
- A Google / Microsoft switch so only the stack you run is ever on screen.
- Fill-in boxes that substitute live into every script, showing only the fields
  the current view actually uses.
- Per-browser favourites, ticket notes and light/dark theme.
- 25 Playwright tests, run in CI on every push.

### Security notes
- Secret handover uses AES-256-GCM with PBKDF2-SHA256 at 600,000 iterations,
  a fresh 16-byte salt and 12-byte IV per seal. There is deliberately no
  burn-after-reading: with no server, it cannot be enforced, and the tool says
  so rather than implying otherwise.
- The BitLocker script reports encryption status only. Reading the recovery key
  is present but commented out, with a note to take it from the directory
  instead of the machine.
- `netsh wlan show profile key=clear` is deliberately absent.
- PsExec is included and badged, with a note to agree its use with whoever owns
  the EDR before it is needed rather than during an incident.
