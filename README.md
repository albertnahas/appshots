# appshots

Turn raw app screenshots into App Store-ready promotional images — from the CLI.

<p align="center">
  <img src="examples/hero.png" alt="appshots example output" width="100%" />
</p>

## What it does

Take any screenshot from your app and turn it into a polished, store-ready image with one command:

<p align="center">
  <img src="examples/before-after.png" alt="Before and after framing" width="600" />
</p>

```bash
npx appshots frame screenshot.png \
  --device iphone-6.9 \
  --background "linear-gradient(135deg, #667eea, #764ba2)" \
  --title "AI Menu Analysis" \
  --subtitle "Ranked by your goals"
```

**appshots** handles three things:

1. **Frame** — wrap raw screenshots in realistic device frames with backgrounds, shadows, and text
2. **Capture** — screenshot a running web app at exact device pixel ratios
3. **Validate** — check dimensions, format, and file size against store requirements

26 built-in device presets: iPhone, iPad, Android, Mac, Apple Watch, Apple TV, Vision Pro.

## Install

```bash
npm install -g appshots
```

Or run directly without installing:

```bash
npx appshots frame ./my-screenshots --device iphone-6.9
```

> **Note:** The `capture` command requires Playwright (`npm i -D playwright`). The `frame` and `validate` commands work without it.

## Quick Start

### 1. Frame existing screenshots

You already have screenshots from your simulator, phone, or browser. Make them store-ready:

```bash
# Simple — just resize to exact App Store dimensions
appshots frame ./screenshots --device iphone-6.9

# Promotional — add background gradient and text
appshots frame ./screenshots \
  --device iphone-6.9 \
  --background "linear-gradient(135deg, #667eea, #764ba2)" \
  --title "Your App Name" \
  --subtitle "Your tagline here"

# Alternate text position (text on top, phone from bottom)
appshots frame ./screenshots --device iphone-6.9 \
  --background "linear-gradient(170deg, #134E4A, #14B8A6)" \
  --title "Scan Any Menu" --subtitle "Photo, URL, or PDF" \
  --text-position top

# Silver device frame
appshots frame ./screenshots --device iphone-6.9 \
  --background "linear-gradient(135deg, #f093fb, #f5576c)" \
  --frame-color silver --title "Premium Look"

# Pattern background
appshots frame ./screenshots --device iphone-6.9 \
  --background "#1a1a2e" --pattern dots --title "Dashboard"

# Custom typography — lighter weight, larger size, auto-fit long titles
appshots frame ./screenshots --device iphone-6.9 \
  --background "linear-gradient(180deg, #1a1a2e, #16213e)" \
  --title "Complete Operation History" \
  --title-weight 700 --title-size 0.075 --auto-fit-title \
  --text-position top

# Multi-line title (use literal \n in the shell)
appshots frame ./screenshots --device iphone-6.9 \
  --background "#0f3460" \
  --title "Track Your\nProgress"

# Process a single file
appshots frame home.png --device iphone-6.9 -o ./store-ready
```

### 2. Capture from a running web app

Point appshots at your running app and it captures pixel-perfect screenshots:

```bash
# Capture specific pages
appshots capture --url http://localhost:3000 --device iphone-6.9 --path / /features /pricing

# Use a config file for repeatable captures
appshots capture --config appshots.config.ts
```

### 3. Validate before uploading

Check that your screenshots meet App Store / Play Store requirements:

```bash
appshots validate ./screenshots
#   ✓ home.png         1320x2868  (iPhone 6.9")
#   ✓ results.png      1320x2868  (iPhone 6.9")
#   ✗ old-screen.png   1080x1920  → PNG has transparency. App Store requires no transparency.
```

### 4. List device presets

```bash
appshots devices
appshots devices --platform ios
appshots devices --category tablet
```

### 5. Generate a config file

```bash
appshots init
# Creates appshots.config.ts in the current directory
```

## Config File

For repeatable workflows, create an `appshots.config.ts`:

```typescript
import { defineConfig } from 'appshots';

export default defineConfig({
  devices: ['iphone-6.9', 'ipad-13'],

  frame: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: 0.08,
    borderRadius: 0.04,
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255,255,255,0.7)',
    titleSize: 0.075,
    subtitleSize: 0.043,
    titleWeight: 700,
    subtitleWeight: 500,
    titleSpacing: 0,
    titleLineHeight: 1.15,
    fontFamily: "'Inter', system-ui, sans-serif",
    autoFitTitle: true,
    shadow: true,
    frameColor: 'black',
    textPosition: 'bottom',
    pattern: 'dots',
    patternOpacity: 0.1,
  },

  capture: {
    baseUrl: 'http://localhost:3000',
    screens: [
      {
        name: 'home',
        path: '/',
        title: 'Welcome Home',
        subtitle: 'Everything you need',
        waitFor: 'Welcome',
      },
      {
        name: 'features',
        path: '/features',
        title: 'Powerful Features',
        delay: 2000,
      },
    ],
  },

  output: './screenshots',
});
```

Also supports `.js`, `.mjs`, and `.json` formats.

## CLI Reference

### `appshots frame <input>`

| Option | Description | Default |
|--------|-------------|---------|
| `-d, --device <slug>` | Target device preset | `iphone-6.9` |
| `-o, --output <dir>` | Output directory | `./screenshots/framed` |
| `-b, --background <value>` | Solid color or CSS gradient | `#000000` |
| `-t, --title <text>` | Title text overlay | — |
| `-s, --subtitle <text>` | Subtitle text overlay | — |
| `--padding <ratio>` | Padding ratio (0–0.4) | `0.08` |
| `--border-radius <ratio>` | Corner radius ratio (0–0.2) | `0.04` |
| `--landscape` | Landscape orientation | — |
| `--no-shadow` | Disable drop shadow | — |
| `--no-device-frame` | Disable device frame bezel | — |
| `--frame-color <color>` | Frame color: `black`, `silver`, `gold`, `blue`, `red`, `white`, or hex | `black` |
| `--pattern <name>` | Background pattern: `dots`, `grid`, `diagonal`, `waves`, `diamonds`, `cross-dots` | — |
| `--pattern-opacity <ratio>` | Pattern opacity (0–1) | `0.1` |
| `--text-position <pos>` | Text position: `top` or `bottom` | `bottom` |
| `--title-size <ratio>` | Title font size as ratio of canvas width (0–0.2) | `0.087` |
| `--subtitle-size <ratio>` | Subtitle font size as ratio of canvas width (0–0.1) | `0.043` |
| `--title-weight <weight>` | Title font weight (100–900) | `800` |
| `--subtitle-weight <weight>` | Subtitle font weight (100–900) | `500` |
| `--title-spacing <ratio>` | Title letter-spacing as ratio of font size | `0` |
| `--subtitle-spacing <ratio>` | Subtitle letter-spacing as ratio of font size | `0` |
| `--title-color <color>` | Title text color (CSS color) | `#ffffff` |
| `--subtitle-color <color>` | Subtitle text color (CSS color) | `rgba(255,255,255,0.7)` |
| `--font-family <stack>` | CSS font-family stack | `'Inter', system-ui, …` |
| `--title-line-height <number>` | Title line height | `1.15` |
| `--auto-fit-title` | Shrink and word-wrap title to fit canvas width | — |
| `-c, --config <path>` | Config file path | — |

### `appshots capture`

| Option | Description | Default |
|--------|-------------|---------|
| `-u, --url <url>` | Base URL of the running app | `http://localhost:3000` |
| `-d, --device <slug>` | Target device preset | `iphone-6.9` |
| `-p, --path <paths...>` | URL paths to capture | — |
| `-o, --output <dir>` | Output directory | `./screenshots` |
| `--landscape` | Landscape orientation | — |
| `-c, --config <path>` | Config file path | — |

### `appshots validate <dir>`

Checks: dimensions, format (PNG/JPEG), transparency, file size (< 10 MB), color space (sRGB).

### `appshots devices`

| Option | Description |
|--------|-------------|
| `--platform <name>` | Filter by platform (`ios`, `android`, `macos`, `watchos`, `tvos`, `visionos`) |
| `--category <name>` | Filter by category (`phone`, `tablet`, `desktop`, `watch`, `tv`, `headset`) |

## Typography

### Multi-line titles

Pass a literal `\n` (backslash-n) in the title to force a line break:

```bash
appshots frame screenshot.png --device iphone-6.9 \
  --title "Scan Your\nProgress"
```

In a shell script, use double quotes — bash passes `\n` as two characters (backslash + n) rather than a newline, which is exactly what appshots expects.

### Auto-fit

`--auto-fit-title` prevents captions from overflowing the canvas when titles are long:

1. Estimates the rendered width using a per-character heuristic calibrated to the current font weight
2. Shrinks `--title-size` in 0.005 steps until the title fits within the padded canvas area
3. If it still overflows at the minimum size (0.04), splits on the nearest balanced word boundary

```bash
appshots frame screenshot.png --device iphone-6.9 \
  --title "Complete Operation History" \
  --title-size 0.075 --title-weight 700 --auto-fit-title
```

### Font requirements

appshots renders text via SVG, so the font must be installed on the host system. The default stack tries `Inter` first, then falls back to `system-ui` and platform fonts. To use a specific font:

```bash
appshots frame screenshot.png --font-family "'SF Pro Display', sans-serif"
```

If the requested font isn't installed, appshots warns once per batch (or throws if you passed `--font-family` explicitly). Install [Inter](https://rsms.me/inter/) for the sharpest results at the default settings.

## Device Presets

| Slug | Dimensions | Devices |
|------|-----------|---------|
| `iphone-6.9` | 1320 x 2868 | iPhone Air, 17 Pro Max, 16 Pro Max |
| `iphone-6.9-alt` | 1290 x 2796 | iPhone 16 Plus, 15 Pro Max |
| `iphone-6.5` | 1284 x 2778 | iPhone 14 Plus, 13 Pro Max |
| `iphone-6.3` | 1206 x 2622 | iPhone 17 Pro, 17 |
| `iphone-6.3-alt` | 1179 x 2556 | iPhone 16 Pro, 16, 15 Pro |
| `iphone-6.1` | 1170 x 2532 | iPhone 14, 13, 12 |
| `iphone-5.5` | 1242 x 2208 | iPhone 8 Plus, 7 Plus |
| `ipad-13` | 2064 x 2752 | iPad Pro M5/M4, iPad Air M3 |
| `ipad-11` | 1668 x 2388 | iPad Pro 11", iPad Air |
| `android-phone` | 1080 x 1920 | Standard Android (16:9) |
| `android-phone-tall` | 1080 x 2400 | Modern Android (20:9) |
| `android-tablet-10` | 1600 x 2560 | 10" Android tablet |
| `mac` | 2880 x 1800 | MacBook Pro |

Run `appshots devices` for all 26 presets including Apple Watch, Apple TV, and Vision Pro.

## Programmatic API

```typescript
import { frameScreenshot, captureScreenshots, validateScreenshots, getDevice } from 'appshots';

// Frame a screenshot
const buffer = await frameScreenshot({
  input: './screenshot.png',
  device: 'iphone-6.9',
  title: 'Welcome',
  options: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    titleWeight: 700,
    titleSize: 0.075,
    autoFitTitle: true,
  },
});

// Get device specs
const spec = getDevice('iphone-6.9');
// { name: 'iPhone 6.9"', width: 1320, height: 2868, dpr: 3, ... }

// Validate a directory
const results = await validateScreenshots('./screenshots');
```

## License

MIT
