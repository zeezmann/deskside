# Changelog

All notable changes to this project are recorded here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.4.1] — 2026-09-25

A housekeeping pass after 1.4. Nothing here changes what the toolkit does; it
changes what it claims, and who can read it.

### Fixed - accessibility
- `--muted`, which carries every piece of secondary text on the page, sat at
  4.34:1 on the palest surface. AA wants 4.5 and 11px text is exactly where it
  matters. Now #686874, worst case 4.74:1.
- The sidebar count badges used `--muted` on `--surface2`, the worst pairing in
  the file. They use `--ink2` now.
- The 01-06 numbers on the front-page tiles were drawn in `--line`, a border
  colour. In dark mode that was 1.23:1, which is not subtle, it is absent.
- **Added a skip link.** With twenty items in the sidebar, reaching the content
  by keyboard meant twenty tab presses.
- The toast is `aria-live="polite"`, so "Copied to clipboard" is announced
  rather than only shown.
- The search box and the palette input have real labels. A placeholder is not
  a label; it disappears the moment you type.

### Fixed - documentation that had drifted
- The README still advertised six utilities and a Secret handover tool that was
  removed in 1.4, with a screenshot of it. It also described 25 tests covering
  encryption that no longer exists.
- All four repository screenshots were of the old green design, including the
  one used as the link preview image.
- **docs/DEPLOY.md was actively misleading.** It recommended requiring a pull
  request on `main`, which is the wrong call for one person and gets turned off
  within a week; and it pointed at Cloudflare Pages, which no longer exists as
  described - a new project now lands in a Workers flow that asks for
  `wrangler deploy` and fails. Rewritten around GitHub Pages, including the
  Cloudflare grey-cloud step that silently prevents the certificate issuing.
- `package.json` still said 1.0.0.

### Checked and found correct
- 158 scripts and 24 guides, which the README already said. Worth stating
  because the temptation was to "fix" numbers that were right.

## [1.4.0] — 2026-09-25

### Changed
- **New accent: azure into cyan.** The gradient is the point - a flat colour
  looks like a choice, a gradient that shifts hue looks like a decision. It runs
  through the logo, the primary button, the tile icons on hover and the hero
  wash. `--accent-grad` is a separate token from `--accent2` because the far end
  of a gradient and a solid hover fill have very different contrast needs.
  5.23:1 against white, so it passes AA for text.
- Favicon and theme-colour follow the accent, with a separate dark-mode
  theme-colour so the phone browser chrome matches the page.

### Removed
- Secret handover, email header analyser, certificate reader, encoded-command
  decoder and the path checker. Nine utilities left. The implementations are
  gone rather than hidden, so the file is about 60 KB lighter.

### Fixed - mobile, and it was bad
- **Every script view scrolled sideways by up to 720px on a phone.** A grid item
  defaults to `min-width:auto`, so one wide line of PowerShell stretched the
  content column to main's 1080px max-width and dragged the sticky top bar with
  it. Invisible on a laptop. Now `minmax(0,1fr)` on the track and `min-width:0`
  on the column.
- The run-box table had no scroll container, adding another 150px of drag.
- Touch targets: the Copy button was 26px tall, the star 22px, the nav buttons
  32px. All now clear 38px under `pointer:coarse`.
- Those touch rules had no effect at first because the block sat above the
  utility CSS and later rules of equal specificity won. It is now last in the
  stylesheet, and a test asserts the media query still matches.
- Code is 13px on small screens with momentum scrolling, and the horizontal
  rail snaps so it stops half way through a label.

### Tests
- 51. Nine of them walk seven device sizes across nine views asserting zero
  horizontal overflow, because this is the class of bug nobody sees until a
  colleague messages about it.

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
