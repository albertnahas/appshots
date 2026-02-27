# appshots

Generate App Store-ready screenshots from your web app. Capture, frame, and validate — all from the CLI.

- **Capture** screenshots from any running web app with Playwright
- **Frame** raw screenshots with backgrounds, rounded corners, and promotional text
- **Validate** screenshots against App Store / Play Store dimension requirements
- **26 device presets** built in — iPhone, iPad, Android, Mac, Apple Watch, Apple TV, Vision Pro

## Quick Start

```bash
# Frame existing screenshots for iPhone 6.9"
npx appshots frame ./raw-screenshots --device iphone-6.9

# With promotional background and text
npx appshots frame ./raw-screenshots \
  --device iphone-6.9 \
  --background "linear-gradient(135deg, #667eea, #764ba2)" \
  --title "Your App Name" \
  --subtitle "Tagline goes here"

# Capture from a running web app
npx appshots capture --url http://localhost:3000 --device iphone-6.9 --path /home /features /pricing

# Validate dimensions
npx appshots validate ./screenshots

# List all device presets
npx appshots devices
```

## Install

```bash
npm install -g appshots

# Or use directly with npx
npx appshots --help
```

For the `capture` command, you also need Playwright:

```bash
npm install -D playwright
```

## Commands

### `appshots frame <input>`

Frame raw screenshots with backgrounds, rounded corners, and promotional text. Input can be a single file or a directory of images.

```bash
appshots frame ./screenshots --device iphone-6.9
appshots frame screenshot.png --device ipad-13 --background "#1a1a2e" --title "Welcome"
appshots frame ./raw --device android-phone --background "linear-gradient(45deg, #ff6b6b, #feca57)"
```

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
| `-c, --config <path>` | Config file path | — |

### `appshots capture`

Capture screenshots from a running web app using headless Playwright.

```bash
appshots capture --url http://localhost:3000 --device iphone-6.9 --path / /about /pricing
appshots capture --config appshots.config.ts
```

| Option | Description | Default |
|--------|-------------|---------|
| `-u, --url <url>` | Base URL of the running app | `http://localhost:3000` |
| `-d, --device <slug>` | Target device preset | `iphone-6.9` |
| `-p, --path <paths...>` | URL paths to capture | — |
| `-o, --output <dir>` | Output directory | `./screenshots` |
| `--landscape` | Landscape orientation | — |
| `-c, --config <path>` | Config file path | — |

### `appshots validate <dir>`

Check screenshots against App Store and Play Store requirements (dimensions, format, file size, color space, transparency).

```bash
appshots validate ./screenshots
#   ✓ home.png 1320x2868 (iPhone 6.9")
#   ✗ feed.png 1080x1920 (Standard Android phone)
#     → PNG has transparency. App Store requires no transparency.
```

### `appshots devices`

List all built-in device presets with dimensions.

```bash
appshots devices
appshots devices --platform ios
appshots devices --category tablet
```

### `appshots init`

Generate an `appshots.config.ts` config file in the current directory.

## Config File

Create an `appshots.config.ts` for reusable settings:

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
    shadow: true,
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
  },
});

// Get device specs
const spec = getDevice('iphone-6.9');
// { name: 'iPhone 6.9"', width: 1320, height: 2868, ... }

// Validate screenshots
const results = await validateScreenshots('./screenshots');
```

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
| `ipad-13-alt` | 2048 x 2732 | iPad Pro 12.9" (6th–1st gen) |
| `ipad-11` | 1668 x 2388 | iPad Pro 11", iPad Air |
| `android-phone` | 1080 x 1920 | Standard Android (16:9) |
| `android-phone-tall` | 1080 x 2400 | Modern Android (20:9) |
| `android-tablet-7` | 1200 x 1920 | 7" Android tablet |
| `android-tablet-10` | 1600 x 2560 | 10" Android tablet |
| `mac` | 2880 x 1800 | MacBook Pro |

Run `appshots devices` for the full list of 26 presets.

## License

MIT
