# Putting it online

The toolkit is one static file, so hosting it really is a short job. What follows
is the route that worked, including the two places it goes wrong.

## 1. Push the repository

```bash
git init
git add .
git commit -m "Deskside"
git branch -M main
git remote add origin git@github.com:<you>/deskside.git
git push -u origin main
```

Check the Actions tab. The suite should go green in about a minute.

If CI fails immediately with a message about `package-lock.json`, you have not
committed the lockfile. `npm ci` refuses to run without one, deliberately.

## 2. Protect `main`

Settings → Rules → Rulesets → New branch ruleset. Target the default branch and
tick **exactly two** things:

- **Restrict deletions**
- **Block force pushes**

**Do not require a pull request** if you are the only person working on this.
It sounds like the responsible choice and it is the wrong one: you cannot then
push to your own repository without opening a PR against yourself, and you will
turn it off within a week. The two rules above cost you nothing day to day and
prevent the only two things that actually destroy work.

If other people start contributing, that changes. Required review on a file whose
contents get pasted into elevated shells is worth a great deal — see SECURITY.md.
Turn it on when there is somebody to do the reviewing.

## 3. Publish it

**GitHub Pages**, and there is no build step to configure.

1. Settings → Pages → Source → **Deploy from a branch** → `main` / `/ (root)`
2. Wait a minute. The site is live at `https://<you>.github.io/deskside/`
3. Check it loads before going near a custom domain.

Add an empty `.nojekyll` file at the root first. Without it, Pages runs
everything through Jekyll, which silently ignores files and folders beginning
with an underscore.

### A custom domain

1. Settings → Pages → Custom domain → `toolkit.<yourdomain>` → Save.
   It will say *DNS check unsuccessful*. That is expected at this point.
2. At your DNS provider, add a **CNAME** record: name `toolkit`, target
   `<you>.github.io`.
3. **If your DNS is at Cloudflare, set that record to DNS only — the grey
   cloud, not the orange one.** This is the step everyone gets wrong. GitHub
   issues its certificate by answering a challenge over plain HTTP on your
   domain. With Cloudflare's proxy on, Cloudflare answers that request instead
   of GitHub, the certificate never issues, and you get an SSL error loop that
   looks like a GitHub fault. It is not.
4. Back on the Pages settings, click **Check again**. It can take a couple of
   tries — GitHub caches a failed lookup. Then wait for the certificate, and
   tick **Enforce HTTPS** once it becomes available.

If you later want Cloudflare's proxy in front of it, set SSL/TLS mode to
**Full (strict)** *before* turning the orange cloud on, and not while the
certificate is still being issued.

### Not Cloudflare Pages

Older instructions, including an earlier version of this file, pointed at
Cloudflare Pages. Cloudflare has since folded Pages into Workers, and a new
project now lands in a Workers setup flow that asks for `npx wrangler deploy`.
That will fail, because there is no wrangler config here and nothing for it to
deploy. It is possible to host this on Workers Static Assets by adding a
`wrangler.jsonc`, but that is a config file to maintain for a site that is one
HTML file. GitHub Pages needs nothing.

## 4. Tag a release

```bash
git tag -a v1.4.0 -m "Deskside 1.4.0"
git push origin v1.4.0
```

Then draft a release on GitHub and attach `index.html` to it. That gives people
one file to download and keep, which matters more than it sounds: the guide they
will want most is the one about the network being down, and a hosted page is
precisely what is missing at that moment.

## 5. Tell people

Share the URL, and tell them to press Ctrl+S on it as well. Online for
convenience, on disk for when it counts.
