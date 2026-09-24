# Putting it online

The toolkit is one static file, so hosting it is genuinely a five-minute job.
These steps assume the domain's DNS is already at Cloudflare.

## 1. Push the repository

```bash
git init
git add .
git commit -m "Deskside 1.0.0"
git branch -M main
git remote add origin git@github.com:<you>/deskside.git
git push -u origin main
```

Check the Actions tab. The test suite should go green within a couple of minutes.

## 2. Protect `main`

Settings → Branches → Add rule for `main`:

- Require a pull request before merging
- Require status checks to pass, and select **tests**

This is the control from SECURITY.md. It is what stops a change to this file
reaching an engineer's elevated PowerShell without anyone looking at it.

## 3. Publish it

**Cloudflare Pages** is the better fit when the DNS is already there.

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Pick the repository. Leave the build command empty and set the output
   directory to `/`. There is no build step; the file is the product.
3. Deploy. You get a `*.pages.dev` URL straight away.
4. Custom domains → add `toolkit.<yourdomain>`. Because Cloudflare holds the
   DNS, the CNAME is created for you and the certificate is issued
   automatically.

**GitHub Pages** works just as well if you would rather not add a service:
Settings → Pages → Deploy from a branch → `main` / root. For a custom domain,
add a `CNAME` file containing the hostname and point a CNAME record at
`<you>.github.io`.

## 4. Tag a release

```bash
git tag -a v1.0.0 -m "Deskside 1.0.0"
git push origin v1.0.0
```

Then draft a release on GitHub and attach `index.html` to it. That gives people
a single file to download and keep locally, which matters: the guide they will
want most is the one about the network being down, and a hosted page is exactly
what is missing at that moment.

## 5. Tell people

Share the URL, and tell them to save a copy of `index.html` as well. Online for
convenience, on disk for when it counts.
