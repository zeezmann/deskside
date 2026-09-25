# Changelog

All notable changes to this project are recorded here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.3.0] — 2026-09-25

### Added
- **Decode an encoded command.** Reads a PowerShell `-EncodedCommand` payload,
  ordinary base64, hex or percent-encoded text, working out which it is. Then
  flags the patterns worth noticing - Invoke-Expression, downloads, Run keys,
  Defender exclusions - with the caveat that they are patterns, not a verdict.
  Encodes in the other direction too.
- **Which Windows is this.** Build number to version, release date and end of
  support for each edition, including the LTSC and Server builds that share a
  number with a client release. The date the table was compiled is on screen and
  ages visibly, and past 240 days it says so in as many words.
- **Path and filename checker.** Over-length paths, illegal characters, trailing
  spaces and stops, a space before the extension, reserved DOS names, and
  invisible characters. Suggests a name that would actually work.
- **Paste cleaner.** Lists every odd character in pasted text with its count and
  code point, and hands back a clean version.

### Fixed
- The suggested filename turned `C:\Users` into `C-\Users`. The drive letter's
  colon is the one colon in a path that belongs there.

### Not built, deliberately
- Regex tester, JSON viewer and timestamp converter. All three are commodities
  that every engineer already has a better version of, and none of them would
  have earned their place here.

### Tests
- 64, up from 49.

## [1.2.0] — 2026-09-25

### Added
- **Command palette.** Ctrl+K, or Cmd+K on a Mac, from anywhere. Fuzzy search
  across every script, guide, utility, run-box shortcut and section, with
  keyboard navigation and Ctrl+Enter to copy a script's code without leaving it.
- **Email header analyser.** Who actually sent a message, whether SPF, DKIM and
  DMARC passed, every hop it took and how long it sat at each one. Catches
  display-name spoofing, redirected Reply-To and Return-Path mismatches.
- **Error code decoder.** HRESULTs, NTSTATUS values, Win32 errors, installer
  exit codes and the Windows Update range, in hex or decimal, signed or not.
- **Certificate reader.** A full X.509 parser: expiry, subject, every SAN, key
  and signature algorithms, key usage, and both fingerprints. Nothing uploaded.
- **Compare two outputs.** Line diff for the moment you have ipconfig /all from
  the machine that works and the one that does not.

### Changed
- **New visual identity.** Indigo accent on cool neutrals, replacing the teal.
  Tokens for every colour, including a proper --on-accent so the two themes stay
  in step. Refreshed shadows, scrollbars and focus rings.
- **Motion.** Views animate in, tiles stagger, the copy button and the star pop
  on success. All of it disabled under prefers-reduced-motion.
- The VPN guide and its three scripts no longer assume one particular client.
  They now detect AWS VPN Client, Cisco AnyConnect and Secure Client,
  GlobalProtect, FortiClient, OpenVPN, WireGuard, Zscaler and Tailscale, and say
  honestly whether a tunnel adapter is actually up.
- The bulk update script no longer ships one company's app list.

### Fixed
- The certificate parser counted DER's leading zero byte, and an earlier pass
  reported every RSA key as 0 bit.
- Palette matching required a tight subsequence, so "slack" no longer matches
  "Software instaLl or updAte request".

### Tests
- 49, up from 25.

## [1.1.0] — 2026-09-25

### Changed
- Front page redesigned: two-column hero with the counts as a stat panel, two
  real calls to action, and the six common jobs on a complete 3x2 grid instead
  of a 4-column grid with two orphans.
- Copy rewritten for people arriving by link rather than off a shared drive.

### Removed
- The "How to use" page. It was fourteen paragraphs on the one page nobody
  opens, and the parts that mattered were needed elsewhere. Each piece moved to
  where it is read at the moment it applies:
  - Badge meanings are now tooltips on the badges, plus a legend on All scripts.
  - The Windows "Unblock" explanation is on the .ps1 / .sh button itself.
  - The PsExec and security-software warning is at the top of Sysinternals.
  - "Favourites live only in this browser" is on the Favourites view.
  - Saving the page for offline use is a panel on the front page.

### Fixed
- The maintainer line rendered a placeholder ("set BRAND and MAINT at the top")
  instead of a name.
- Page title, description, favicon and link-preview tags were missing.
- The Sysinternals path example was a company file share; now a local folder.

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
