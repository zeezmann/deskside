# Security

## What this tool is

A reference of commands that engineers copy and run, often elevated. That makes
the file itself a supply chain. Everything below follows from that.

## If you host it or share it

**Write access is the control that matters.** Anyone who can edit the file can
get arbitrary code run as administrator on any machine, at a time of an
engineer's choosing, by changing one line and waiting. Read access for the whole
company is harmless. Write access belongs to two or three named people.

On a file share that means read-only for everyone and Modify for a small group,
with file auditing on. In a repository it means branch protection and required
review, which is strictly better because every change is attributable.

**Pin a version.** Use a tagged release rather than tracking `main`, so a change
upstream cannot alter what your team pastes tomorrow.

## What it does not do

- Nothing leaves the browser. No analytics, no telemetry, no external requests
  of any kind. There is a test that fails the build if one appears.
- No credentials are stored in the file, and none should ever be added to it.
- Favourites, notes and fill-in values live in browser local storage on that
  machine only.

## Secret handover

AES-256-GCM, key derived with PBKDF2-SHA256 at 600,000 iterations, fresh 16-byte
salt and 12-byte IV per seal, all performed with the Web Crypto API in the page.

It is **not** a self-destructing note. There is no server, so a sealed blob can
be opened as many times as someone likes. Send the passphrase by a different
route than the blob, delete both copies after handover, and rotate the
credential anyway.

The downloadable opener file is a small HTML page containing the ciphertext and
a decrypt form. It makes no network requests. Be aware that an HTML attachment
asking for a passphrase looks exactly like a credential-harvesting page, because
structurally it is the same shape: tell the recipient it is coming, and tell
your security team the tool exists.

## Reporting something

Open an issue. If it is sensitive, say so in the title and leave out the detail
until someone comes back to you.
