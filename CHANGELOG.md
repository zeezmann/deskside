# Changelog

All notable changes to this project are recorded here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.9.0] — 2026-09-25

A cull, prompted by going through the whole thing properly. 201 scripts down to
179, and the page is better for it.

### Removed - the entire Sysinternals section, 18 scripts
Every one of them needed binaries downloaded and a path configured, which had
not been done and was not going to be. A section that does not work is worse
than no section.

Checking what would actually be lost: **16 of the 18 were already covered by
native scripts in the toolkit.** `conn-owners` does what TCPView does.
`startup-items` plus `sched-tasks` plus `procs-userpaths` cover Autoruns.
`remote-snapshot` covers PsInfo. `unsigned-procs` covers sigcheck sweeps.
`big-folders` covers du.

The genuine gap was "what is holding this file open", which Windows has no
native command for. That is replaced by a new script that checks the three
places the answer usually is - open over a share, an Office lock file that names
the person, or a local process - and points at Resource Monitor for the last
case, which is on every machine.

The `sysint` category, the `Needs Sysinternals` badge and the **Sysinternals**
fill-in box go with it. The fill-in bar is one box shorter everywhere.

### Removed
- **How long since last reboot.** Task Manager shows it faster, and you are
  already in Task Manager on a slow-PC ticket.
- **Collect everything into one file for the ticket**, and its macOS twin. The
  Linux one stays: writing output to a file and scp-ing it off a server is the
  normal way to work there, which is not true of a desk-side Windows job.
- **Update the usual set in one pass.** A list of five applications that were
  not yours, which you would have had to edit before first use.

### Merged
- **Reclaim disk space** and **Actually clear the safe ones** were one job split
  across two scripts. Now one, reporting by default, with `-Clear` to act.

### Changed
- `g-suspicious` rewritten around the native scripts. It now ends by saying
  plainly that services, drivers, WMI subscriptions and logon scripts can hold
  persistence too, and that finding those properly is an incident response job
  rather than a desk-side one - which is more honest than implying a tool
  nobody has installed would have covered it.

## [1.8.3] — 2026-09-25

### Removed
- **"Old user profiles eating a shared machine".** It listed every profile and
  then told you *"never remove one that is Loaded, or one belonging to a service
  account"* - making the operator do by eye the exact safety check that
  `disk-profiles-clean` performs and proves, with a PROTECTED table giving the
  reason against each one.

  `-DryRun` on the interactive script already produces the read-only view, and a
  better one. So the pair was two scripts covering one job where the redundant
  half was also the less safe half, and the less safe half is the one somebody
  reaches for when they are in a hurry.

  Its guide step has been folded into the one below it rather than deleted.

## [1.8.2] — 2026-09-25

### Changed
- **Stripped the design rationale out of the profile cleaner.** Seventeen
  comment lines explaining why it was written that way, in a script whose whole
  purpose is being pasted into somebody else's console. That reasoning belongs
  in the description on the card - the part you read *before* you copy - and it
  was already there, said twice. The script is now 151 lines with no comments at
  all, and the structure those comments described is visible in what it prints
  as it runs.

### Not changed, deliberately
- The commented-out lines in `ol-safe`, `sys-sigcheck`, `sys-pslist`,
  `dns-lookup`, `bitlocker`, `secure-channel`, `mac-updates`, `mac-finder`,
  `sys-psexec-system`, `sys-accesschk` and `ms-leaver` stay. Those are not
  commentary: each is an alternative command with a one-line label saying when
  to reach for it. The label and the command together are the content.
- The line in `winget-ours` telling you to change the app list to your own stays
  for the same reason - an instruction, not an explanation.

Across all 202 scripts that leaves 34 comment lines in 1,593 lines of code, and
every one is either a command you might run or something you must do.

## [1.8.1] — 2026-09-25

### Fixed
- The README claimed 196 scripts when there were 202. Same drift as before: six
  added without the count following them.
- `LICENSE` was missing from the release archive. Already in the repository, but
  the archive is meant to be the complete thing.

## [1.8.0] — 2026-09-25

### Changed - the profile cleaner asks about presence, not age
Age was the wrong axis entirely. What decides whether a profile can go on a
hot-desk machine is whether its owner is sat there, not how many days have
passed. So that is now the rule, and age is shown as information that decides
nothing.

- **It identifies the console user separately from the account running the
  script.** These are not the same and confusing them is how you delete the
  profile of the person watching you do it: you elevate with your own admin
  credentials while they are signed in at the console.
- **Protects anything the machine depends on**, not just service accounts: the
  console user, disconnected sessions still holding files open, any account with
  a process running right now, any account a Windows service starts as, the
  built-in profiles, and you.
- **Prints what it protected and why, before anything else.** A thing silently
  withheld is worse than a thing refused out loud.
- **`-DryRun`, and it is the default on the last line.** Prints both tables and
  stops without asking anything. Removing `-DryRun` is a deliberate act.
- **[A]ll now needs typing YES**, and shows the count and total first.

### Fixed
- Service accounts are reported as `.\name`, `MACHINE\name` or `DOMAIN\name`
  depending on how the service was configured, while the profile resolves to one
  specific form. The comparison matched on the full string only, so a service
  account would have slipped through and been offered for deletion - breaking
  that service days later, with nobody connecting the two events. Both the full
  name and the bare name are compared now.

## [1.7.1] — 2026-09-25

### Changed - the profile cleaner stopped hiding things
The first version skipped any profile used in the last 30 days. That number was
arbitrary, and the approach was wrong twice over.

Wrong for the job: on a hot-desk pool people rotate, their files live in Drive,
and a profile untouched for three weeks is usually abandoned. Thirty days was a
dedicated-machine assumption applied to a shared one.

Wrong in principle: a filter that silently drops rows leaves you looking at a
full disk with no idea what it decided not to show you.

- Every deletable profile is now listed, whatever its age. The only exclusions
  left are the ones that would be unsafe or pointless - loaded, yours, or a
  service account.
- Age bands instead: **stale** over 90 days, **old** over the caution line,
  **RECENT** under it.
- RECENT profiles are always asked about one at a time and are **skipped by
  [A]ll**, so a careless "all" cannot take a profile somebody used yesterday.
- The caution line is 14 days by default, which suits hot-desking. Dedicated
  machines want `-CautionDays 60`, because somebody on long leave still wants
  their desktop back.

### Fixed
- **The last-used date was trusting one unreliable source.** Windows updates
  `LastUseTime` inconsistently and background work on a profile nobody has
  signed into can move it. It now reads the last write to NTUSER.DAT as well and
  trusts whichever is *more recent*, so the error always falls towards "still in
  use". Where the two disagree by more than a week it shows both and says which
  it used.

## [1.7.0] — 2026-09-25

### Added - clearing disk space, not just finding it
Every disk script before this one measured. None of them cleared, which meant
the toolkit could tell you the machine was full and then leave you to it.

- **Reclaim disk space (Windows)** - every candidate with a size against it and
  the command beside it, nothing deleted. Component store, Windows Update
  downloads, Delivery Optimization, Windows.old, error reports, Recycle Bin,
  hibernation file.
- **Actually clear the safe ones (Windows)** - does the four that need nobody's
  permission, and reports what each freed.
- **Delete old profiles, asking about each one (Windows)** - the hot-desking
  ticket. Elevated PowerShell, paste, and it walks every stale profile one at a
  time with size and last-used date. Y deletes, N keeps, A does the rest, Q
  stops, and Enter on its own means No because the safe answer should be the one
  you get by accident. Never offers a loaded profile, your own, or a service
  account, and ignores anything used in the last 30 days by default.
- **Old user profiles eating a shared machine (Windows)** - the read-only
  version, for when you only want to look.
- **Reclaim disk space on a Mac** - including purgeable space, which is nearly
  always Time Machine local snapshots and is why a Mac behaves as though it is
  full while Finder insists it is not.
- **Reclaim disk space (Linux)** - package caches, orphaned packages, old
  kernels, the journal, old snap revisions and Docker, measured with the command
  printed against each.

### Fixed
- **Guide steps were escaped while script descriptions were not**, so a `<b>` in
  a step rendered as the literal characters. One rule for both now: the content
  of this file is trusted, anything interpolated into it is not. A test asserts
  no stray tag reaches the page.
- The Windows disk guide told you to open Disk Cleanup by hand, in a toolkit
  whose entire point is copy-and-run.
- CI used actions pinned to Node 20, which GitHub has deprecated. Now on v5 of
  each action and Node 22.

### A note on how the 1.6 package broke CI
The 1.6 archive shipped `index.html` without the `tests/` folder. The page had
moved on and its test had not, so `winver.spec.js` was still asserting text
removed in 1.5 and the build went red on a change that was correct. Every
archive from here on contains the whole repository, because a partial one makes
the two halves drift and the failure looks like a bug in the code rather than in
the packaging.

## [1.6.0] — 2026-09-25

### Added - Linux
- **38 scripts and six guides.** Triage on a box you have just been given a
  shell on, disk and inodes, systemd units and their logs, networking, users and
  access, packages, and the desktop side.
- **Distribution detection rather than assumption.** Where a command forks the
  script works out what it is looking at first: apt or dnf, ufw or firewalld or
  nftables, NetworkManager or netplan or systemd-networkd, PipeWire or
  PulseAudio. A script that assumes wrong fails in a way that looks like the
  machine is broken, which is worse than no script.
- Linux is a category beside macOS, not a stack toggle. It is an operating
  system, not a vendor, so it shows whichever way the Google / Microsoft switch
  is set.
- A **Service** fill-in box, which appears on Linux views and nowhere else
  because the existing logic only shows a box something on screen actually uses.
- The front page goes from six tiles to **nine**, which fills the three-across
  grid exactly instead of leaving an orphan row. Linux triage, account lockout
  and disk full are the three added.

### Changed
- `isMac` became `isShell`. It drives the shell label on the card, the file
  extension on download and whether a shebang is prepended - all of which Linux
  needs too. Downloads now carry `#!/usr/bin/env bash` rather than `/bin/bash`.
- Title, description and link-preview text say Windows, macOS and Linux.
- The Linux badge is plum, not amber. Amber is already the sudo badge, and the
  leaver script carries both.

### Notes on writing these
- Three descriptions had an unescaped apostrophe and one script used a dollar
  sign followed by a brace - the two things the file warns about, both of which
  I did anyway. The syntax check caught them before they shipped, which is the
  argument for having one.

## [1.5.0] — 2026-09-25

### Removed - two things that would have rotted
- **The review date.** The sidebar said "Last reviewed September 2026". A date
  nobody moves is worse than no date at all: it either announces that the file
  is unmaintained, or people learn to ignore it. The sidebar now credits the
  author and says it is free to copy, which stays true without anyone doing
  anything.
- **The Windows table's compile date.** It said "compiled N days ago" and past
  240 days told you it was probably wrong - which ages whether or not anything
  actually is. Reframed as coverage: it now says which releases it knows about,
  which is a fixed fact. Microsoft's published end-of-support dates do not
  change after the fact; what goes missing is versions released later, and the
  not-found message already says exactly that.

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
