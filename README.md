# Argus — marketing site

Single-page site for Argus, automated garment quality assurance at machine speed.

**Live:** [techargus.ai](https://techargus.ai)

## Stack

Static site, no build step and no package manager. Open the files, edit, reload.

Third-party libraries load from a CDN at runtime:

| Library | Version | Used for |
| --- | --- | --- |
| [Three.js](https://threejs.org/) | r128 | 3D point cloud viewer |
| [GSAP](https://gsap.com/) + ScrollTrigger | 3.12.5 | Hero intro and scroll reveals |
| Google Fonts | — | Space Grotesk, JetBrains Mono, Inter |

## Running locally

Serve over HTTP. **Opening `index.html` as a `file://` URL will not work** — Chrome
gives `file://` pages a null origin, so every `fetch()` is blocked by CORS and the
point cloud never loads:

```
Access to fetch at 'file:///…/data/cloud-meta.json' from origin 'null' has been
blocked by CORS policy: Cross origin requests are only supported for protocol
schemes: chrome, chrome-extension, chrome-untrusted, data, http, https…
```

Any static server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Layout

```
index.html            Every section; content is inline, not templated
styles.css            All styling, including the mobile refinements block
app.js                Preloader, cursor, nav, hero timeline, scroll reveals, counters
floor.js              Builds and animates the factory floor plan SVG
pointcloud.js         Three.js garment viewer — loading, camera, measurement labels
Gradient.js           Animated mesh gradient behind the page
argus_logo.svg        Master logo artwork (the site inlines its own copy)
data/                 Point cloud assets — see below
assets/logos/         Manufacturer logos for the traction carousel
assets/team/          Team headshots
tools/build_cloud.py  Rebuilds the deployed point cloud assets
CNAME                 Custom domain for GitHub Pages
.nojekyll             Serve files as-is; skip Jekyll processing
```

Page order: hero → problem → solution (animated floor plan) → live demo (3D viewer)
→ impact → traction → future → team → contact.

## Point cloud data

The viewer loads three files, all built from one scan:

```
XL250_*_export/  ──preprocess.py──▶  data/pointcloud.json  ──tools/build_cloud.py──▶  data/cloud-*
```

| File | Size | Loaded by |
| --- | --- | --- |
| `data/cloud-full.bin` | 4.2 MB | Desktop — 347,730 points |
| `data/cloud-lite.bin` | 1.0 MB | Phones and tablets — 86,933 points |
| `data/cloud-meta.json` | 25 KB | Both — measurements, paths, keypoints |

Geometry ships as raw little-endian Float32 rather than JSON. The original
`data/pointcloud.json` was 22 MB of text, which meant a long download on cellular
plus a multi-second `JSON.parse` blocking the main thread on a phone. The binary
goes straight into a `Float32Array` with no parse step.

`data/pointcloud.json` is an intermediate and is **not deployed** — it is
gitignored. It stays on disk to rebuild the binaries from:

```bash
python3 tools/build_cloud.py     # needs numpy
```

Regenerate the JSON itself with `preprocess.py` if it is missing. That script reads
the raw scan export, which is also gitignored.

Which build a visitor gets is decided at runtime by
`(max-width: 900px), (pointer: coarse)`. Touch devices additionally render without
MSAA and cap the pixel ratio at 1.5 — antialiasing several hundred thousand points
is the most expensive thing you can ask a mobile GPU to do.

## Mobile

Desktop and mobile share one stylesheet; phone corrections live in the
`MOBILE REFINEMENTS` block at the end of `styles.css`. A few decisions there are
deliberate and worth not undoing by accident:

- **The floor plan scales to fit rather than sitting behind a horizontal scroll.**
  SVG renders at device resolution, so at the 2–3× DPR of a real phone its labels
  stay readable at fit-to-width. A pannable region inside a vertically scrolling
  page mostly goes undiscovered, which would leave readers with what looks like a
  cropped diagram.
- **The hero uses `100svh` where supported.** `100vh` measures the viewport with the
  address bar retracted, so the hero runs taller than what is actually on screen.
- **`app.js` reveals the hero unconditionally after a grace period.** The hero's
  opening state is `opacity: 0` in CSS and only the GSAP timeline clears it, so a
  blocked CDN would otherwise leave the hero permanently blank.

Screenshots at 1× understate small type badly. Check phone rendering at a realistic
pixel ratio:

```bash
google-chrome --headless --force-device-scale-factor=3 \
  --window-size=390,844 --screenshot=out.png http://localhost:8000
```

## Deployment

GitHub Pages serves `main` at the repository root. Pushing to `main` deploys.

`CNAME` holds `techargus.ai`. DNS lives at Namecheap: four `A` records on `@`
pointing at GitHub's Pages addresses, plus a `CNAME` on `www` to
`argus-corp.github.io`. Enforce HTTPS is enabled.

Everything in the repository is published, so anything committed here is publicly
reachable.
