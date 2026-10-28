# Native Shell Showcases

Submit your Native Shell app through a pull request to appear in [App Stories](https://nsh.dev/apps).

**Every merged app PR is listed. Featured placement is not guaranteed.** Maintainers select Featured apps based on project history, implementation, completeness and quality, and revisit the selection as apps evolve to highlight complete, representative examples.

Native Shell (NSH) builds native UI for iOS, Android, macOS, Windows, Linux and the web. App Stories lists standalone NSH apps and native apps that embed NSH modules, on any of those platforms.

## Submit an app

1. Read [CONTRIBUTING.md](CONTRIBUTING.md), including the screenshot requirements for desktop windows, phone screens and the web.
2. Fork this repository and create `apps/<app-id>/`. Use lowercase kebab-case, such as `nsh-gallery` or `longbridge-lite`. No uppercase letters, spaces, underscores, or leading/trailing hyphens.
3. Add your screenshots directly to that folder. `previews` only accepts local filenames; external URLs and paths are forbidden.
4. Add `manifest.json` using the example below. Optionally add a product-only `README.md` of at most 10 KB (10,240 UTF-8 bytes) to enable an App Stories detail page.
5. Open a PR. Maintainers review the content, confirm the first inclusion timestamp and decide Featured placement. After merging, automation updates GitHub Stars and publishes the app.

```text
apps/
  nsh-gallery/
    preview0.png
    preview1.png
    manifest.json
    README.md
```

```json
{
  "id": "my-app",
  "name": "My App",
  "author": "Author or organization",
  "description": "A short English description of what the app does.",
  "category": "work",
  "platforms": ["iOS", "Android", "macOS"],
  "website": "https://example.com",
  "source": "https://github.com/owner/my-app",
  "building": true,
  "publishedAt": "2026-10-28T00:00:00Z",
  "previews": ["preview0.png", "preview1.png"]
}
```

## Manifest fields

| Field | Requirement |
| --- | --- |
| `id` | Required; matches the folder exactly. Lowercase letters/digits with single hyphens between words. |
| `name` | Required display name; preserve brand capitalization. |
| `author` | Required author or maintaining organization; displayed on the card and searchable. |
| `description` | Required English string, at most 280 weighted characters using Twitter's standard `twitter-text` counting. No translated objects. |
| `category` | `dev` (developer tools), `finance` (finance and trading), `work` (productivity and business), `media` (media and lifestyle) or `utility` (utilities and system). |
| `platforms` | Nonempty list of supported platforms, each one of `iOS`, `Android`, `macOS`, `Windows`, `Linux`, `Web`, spelled exactly so. |
| `website` | Official app website or `null`. |
| `source` | Public source repository or `null`; at least one of `website` or `source` is required. |
| `building` | Optional boolean; `true` for apps still in development. |
| `publishedAt` | ISO 8601 timestamp with timezone for first inclusion in App Stories; confirmed by maintainers. Preserve it for later updates. |
| `previews` | Nonempty list of local image filenames in display order, such as `preview0.png`. The first is the cover. Only PNG images are allowed. |
| `stars`, `starsUpdatedAt` | Automation-owned cached GitHub Stars and the time the count was first recorded or last changed. Do not edit manually. |

Featured apps appear first, following maintainer-managed `featured.json`. Other apps form a separate group with newest-first and GitHub Stars sorting. Search includes names, authors, descriptions and platforms.

The root `featured.json` is an ordered array of app IDs, for example `["nsh-gallery"]`. It is the single source for Featured membership and order. IDs must be unique and refer to existing apps; an empty array is allowed. Do not add a `featured` field to `manifest.json`.

## Optional product README

`apps/<app-id>/README.md` enables a detail page for that app. It must contain product information only: purpose, features, supported workflows, and representative use cases.

- Maximum file size: **10 KB (10,240 UTF-8 bytes)**.
- Links and plain URLs may only point to the **exact official `website` or GitHub `source` URL** in the manifest. Other hyperlink destinations, tracking links, email links and redirects are forbidden.
- No installation/download links, installation instructions, Bash/shell scripts, commands, code blocks or raw HTML other than the allowed media tags.
- CI checks Markdown links, reference links, autolinks, plain URLs, encoded links, file size, and command patterns. Maintainers also review whether the content is strictly a product introduction. Violations must be resolved before merging.
- Product images and videos are allowed: Markdown images and HTML `img`, `video`, `source` tags with safe attributes. Media must be committed in the same app folder and referenced by local filename. No external media URLs, event handlers or styles. Videos must have controls. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Automated updates and publication

On merges to `main`, the workflow validates the catalog, refreshes GitHub Stars, commits updated manifests, and dispatches `website.yml` in `longbridge/nsh`. The same refresh runs every **Monday at 00:00 UTC (08:00 Singapore time)**, and can be run manually.

The Website workflow checks out the latest Showcase `main`, validates it with this repository's own scripts, reads the manifests, cached stars and optional READMEs, then publishes nsh.dev. The site serves each app's screenshots and README media from its own build, so App Stories publishes the reviewed files exactly as merged. There is no manual metadata copy into the NSH repository.

Only changed star counts update the manifest and `starsUpdatedAt`. Unchanged counts leave files and timestamps untouched, so a refresh with no changes creates no bot commit. Failed star requests preserve the last successful count and timestamp. Apps without a GitHub source repository have unknown counts. Bot commits made with `GITHUB_TOKEN` do not recursively trigger the workflow.

## Local checks

All scripts run with Bun:

```bash
bun install --frozen-lockfile
bun test
bun run validate
bun run update-stars
```

`update-stars` optionally reads `GITHUB_TOKEN` to increase GitHub API limits.

To preview App Stories, clone this repository next to the NSH checkout (`../nsh-showcases` from the `nsh` repository root) and run `bun run dev` in `nsh/website`; see "App Stories" in its README.

## One-time automation setup

Add a `DOCS_DISPATCH_TOKEN` Actions secret to this repository: a dedicated fine-grained token scoped only to `longbridge/nsh` with **Actions: write**. The default `GITHUB_TOKEN` cannot dispatch workflows in another repository. See [GitHub's dispatch permissions](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event).

Until the dispatch secret is configured, catalog checks and Stars updates can run, but dispatch fails with an actionable error. Rerun after setup. Allow the automation bot to commit star metadata on `main` if branch rules are enabled.

## Attribution

Screenshots belong to their respective projects. Archiving them does not change ownership or grant a new license.
