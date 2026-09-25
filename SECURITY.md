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
  machine only. They are not synchronised anywhere and clearing browsing data
  removes them.
- The utilities that read a file - the checksum tool, the CSV inspector, the
  diagram viewer - read it in the page. Nothing is uploaded.

## Reporting something

Open an issue. If it is sensitive, say so in the title and leave out the detail
until someone comes back to you.
