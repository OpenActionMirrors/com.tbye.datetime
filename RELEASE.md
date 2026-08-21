# Building & releasing DateTime Segments

This guide covers packaging a `.streamDeckPlugin` on **Linux** (or any machine with Node), publishing a **GitHub release**, and submitting to **Elgato Marketplace**.

The Marketplace product is **[DateTime Segments](https://marketplace.elgato.com/product/datetime-segments-b89cfa09-bff1-4aa4-b782-6db7672b536a)**. Keep `manifest.json` `Name` / `Category` as **DateTime Segments** — Maker Console rejects a version whose name does not match the existing product.

Current `manifest.json` is **1.1.0.0**. The plugin is a **Node.js SDK 3** plugin (`CodePath: bin/plugin.js`) so Marketplace can DRM-protect the upload.

---

## What changed since the old days

| Then (≈2024) | Now |
|--------------|-----|
| Elgato **DistributionTool** (Windows/Mac only), lived under `src/DistributionTool` (gitignored) | Official **Stream Deck CLI**: `npm i -g @elgato/cli` → `streamdeck pack` (**works on Linux**) |
| HTML plugin (`app.html`, `SDKVersion` 2, Stream Deck 6.4) | Node plugin (`bin/plugin.js`, `SDKVersion` 3, Stream Deck **6.9+**) — required for Marketplace DRM |
| Manual zip / tool quirks | `./scripts/build-release.sh` installs, bundles, tests, validates, and packs into `dist/` |
| Marketplace via Maker Console | Still [Maker Console](https://maker.elgato.com) — upload the same package |

The `.streamDeckPlugin` file is a **zip** whose top-level folder is `com.tbye.datetime.sdPlugin/`.

---

## One-time setup (Linux)

### 1. Node.js

Need Node **20+** (Elgato recommends **24+**):

```bash
node -v
```

### 2. Stream Deck CLI

```bash
npm install -g @elgato/cli@latest
streamdeck -v          # e.g. 1.7.x
```

### 3. Plugin dependencies

From the repo root (once):

```bash
npm install
```

This installs `@elgato/streamdeck` and Rollup. `./scripts/build-release.sh` will `npm install` if `node_modules` is missing, then bundle `src/plugin.ts` → `src/com.tbye.datetime.sdPlugin/bin/plugin.js`.

### 4. Optional: `gh` for GitHub releases

```bash
gh auth status
```

---

## Build a release package

From the repo root:

```bash
# Use Version currently in manifest.json
./scripts/build-release.sh

# Or pack with a new version (does not rewrite the file on disk unless you use set-version.sh)
./scripts/build-release.sh 1.1.0

# Validate only
./scripts/build-release.sh --validate-only
```

What the script does:

1. `npm install` if needed, then `npm run build` (Rollup → `bin/plugin.js`)
2. Runs `node test.js`
3. Runs `streamdeck validate`
4. Runs `streamdeck pack` → **`dist/com.tbye.datetime.streamDeckPlugin`**

Ignore list for the package lives in:

`src/com.tbye.datetime.sdPlugin/.sdignore`  
(excludes `test.js`, `.sketch` sources, SDK repo metadata)

### Bump version in git

Stream Deck versions are typically **four** parts: `major.minor.patch.build`.

```bash
./scripts/set-version.sh 1.1.0      # writes 1.1.0.0 into manifest.json
# edit README release notes if you want
git add src/com.tbye.datetime.sdPlugin/manifest.json README.md
git commit -m "chore: bump version to 1.1.0.0"
./scripts/build-release.sh          # pack the committed version
```

---

## Smoke-test before publishing

This plugin targets the **Elgato Stream Deck app** on **Windows / macOS**. Linux can **build** the package; install/runtime still needs a machine with Stream Deck software (or a colleague’s box).

1. Copy `dist/com.tbye.datetime.streamDeckPlugin` to a Mac or Windows PC with Stream Deck installed.  
2. Double-click the file (or open it with Stream Deck).  
3. Confirm actions load, titles update, language/date formats, copy-on-press, multi-tile clock sync.  
4. Remove any old linked/dev copy of the plugin first if versions fight each other.

Dev link (only on a machine with Stream Deck app + CLI):

```bash
streamdeck link src/com.tbye.datetime.sdPlugin
streamdeck restart com.tbye.datetime
```

---

## GitHub release

```bash
VERSION=1.1.0
./scripts/set-version.sh "$VERSION"
# commit manifest bump, then:
./scripts/build-release.sh

gh release create "$VERSION" \
  dist/com.tbye.datetime.streamDeckPlugin \
  --title "DateTime Segments Plugin - $VERSION" \
  --notes "$(cat <<'EOF'
### Changes
- …
EOF
)"
```

Update README “Releases” section to point at the new asset URL.

---

## Elgato Marketplace / Maker Console

1. Log in to **[Maker Console](https://maker.elgato.com)** (same Maker account as last time).  
2. Open the existing **DateTime Segments** product (or create one if needed).  
3. Upload **`com.tbye.datetime.streamDeckPlugin`** as a new version.  
4. Fill version notes, gallery/screenshots if anything user-facing changed.  
5. Submit for review (or upload without auto-publish for a private DRM test build).  
6. After approval, Marketplace users get the update.

Returning makers: if products are missing after login, email **maker@elgato.com**.

### Guidelines checklist (high level)

- [ ] Manifest validates (`streamdeck validate`)  
- [ ] Icons/previews present (plugin icon, category, key, preview assets)  
- [ ] Version number increased from last Marketplace submission  
- [ ] Description / support URL still accurate  
- [ ] No test-only junk in the package (handled by `.sdignore`)  

Official docs:

- [Distribution](https://docs.elgato.com/streamdeck/sdk/introduction/distribution)  
- [`streamdeck pack`](https://docs.elgato.com/streamdeck/cli/commands/pack)  
- [Plugin guidelines](https://docs.elgato.com/guidelines/stream-deck/plugins)  
- [Become a Maker](https://docs.elgato.com/marketplace/become-a-maker)

### DRM / Maker Console checklist

Marketplace now requires DRM for new versions. The plugin is set up for that:

- `Name` / `Category`: **DateTime Segments** (must match the live product)
- `SDKVersion`: **3**
- `Software.MinimumVersion`: **6.9**
- `CodePath`: `bin/plugin.js` with `"Nodejs": { "Version": "20" }`

Maker Console infers **DRM protection: Yes** from those fields. After upload, Elgato wraps the package; download the DRM build from the Versions tab if you need to smoke-test the protected copy.

A 288×288 Marketplace app icon (listing only, not the plugin `Icon`) lives at `marketplace/app-icon-288.png`.

---

## Quick reference

```bash
# Install tooling once
npm install
npm install -g @elgato/cli@latest

# Everyday release cut
./scripts/set-version.sh 1.1.0
git add -u && git commit -m "chore: bump version to 1.1.0.0"
./scripts/build-release.sh
# → dist/com.tbye.datetime.streamDeckPlugin

# Ship
gh release create 1.1.0 dist/com.tbye.datetime.streamDeckPlugin --title "DateTime Segments Plugin - 1.1.0" --notes "…"
# then upload the same file at https://maker.elgato.com
# (product name DateTime Segments; leave auto-publish off until the DRM build is smoke-tested)
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `streamdeck: command not found` | `npm install -g @elgato/cli@latest` and ensure npm global bin is on `PATH` |
| Validation fails on missing `bin/plugin.js` | `npm install && npm run build` |
| Package missing PI styles | Confirm `libs/css/sdpi.css` is in the pack listing |
| Old plugin still running | Uninstall old version in Stream Deck, or `streamdeck stop com.tbye.datetime` / remove plugin folder |
| Want to inspect the package | `unzip -l dist/com.tbye.datetime.streamDeckPlugin` |
