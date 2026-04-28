/**
 * Golden image tests — render known inputs, compare pixel-by-pixel to saved PNGs.
 *
 * Run normally:  npx vitest run tests/golden.test.ts
 * Regenerate:    UPDATE_GOLDENS=1 npx vitest run tests/golden.test.ts
 *
 * Goldens live in tests/goldens/ and should be committed.
 * Regenerate them intentionally after any deliberate visual change.
 */
import { describe, it, expect } from 'vitest';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { frameScreenshot } from '../src/core/framer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOLDEN_DIR = join(__dirname, 'goldens');
const RAW_DIR = join(__dirname, '../examples/raw');
const UPDATE_GOLDENS = process.env.UPDATE_GOLDENS === '1';

// Tolerate up to 0.05% of pixels differing — catches real regressions while
// allowing for sub-pixel anti-aliasing differences across OS/library versions.
const DIFF_THRESHOLD = 0.0005;

async function compareToGolden(result: Buffer, name: string): Promise<void> {
  const goldenPath = join(GOLDEN_DIR, name);

  if (UPDATE_GOLDENS) {
    await mkdir(GOLDEN_DIR, { recursive: true });
    await writeFile(goldenPath, result);
    console.log(`  ✓ wrote golden: ${name}`);
    return;
  }

  if (!existsSync(goldenPath)) {
    throw new Error(
      `Golden not found: ${name}\nRun: UPDATE_GOLDENS=1 npx vitest run tests/golden.test.ts`
    );
  }

  const golden = await readFile(goldenPath);

  const { data: gData, info: gInfo } = await sharp(golden)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: rData, info: rInfo } = await sharp(result)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  expect(rInfo.width).toBe(gInfo.width);
  expect(rInfo.height).toBe(gInfo.height);

  const numDiff = pixelmatch(gData, rData, null, gInfo.width, gInfo.height, {
    threshold: 0.1, // per-pixel color tolerance (0–1)
  });

  const diffRatio = numDiff / (gInfo.width * gInfo.height);
  expect(diffRatio, `pixel diff ratio for ${name}`).toBeLessThanOrEqual(DIFF_THRESHOLD);
}

describe('golden: frameScreenshot renders', () => {
  // ── 1. Standard device frame, title + subtitle at bottom ─────────────────
  // Covers: buildDeviceTextSvg, letter-spacing=0, font-kerning, Phase 1+2 baseline
  it('device frame · title+subtitle · bottom', async () => {
    const result = await frameScreenshot({
      input: join(RAW_DIR, 'dish-details.png'),
      device: 'iphone-6.9',
      title: 'Dish Details',
      subtitle: 'Powered by AI',
      options: { background: 'linear-gradient(180deg, #1a1a2e, #16213e)' },
    });
    await compareToGolden(result, 'dish-details-bottom.png');
  });

  // ── 2. Auto-fit with a long title, text at top ────────────────────────────
  // Covers: computeAutoFit shrink path, textPosition=top
  it('device frame · auto-fit long title · top', async () => {
    const result = await frameScreenshot({
      input: join(RAW_DIR, 'results.png'),
      device: 'iphone-6.9',
      title: 'Complete Operation History',
      options: {
        background: 'linear-gradient(135deg, #0f3460, #533483)',
        textPosition: 'top',
        autoFitTitle: true,
      },
    });
    await compareToGolden(result, 'results-autofittop.png');
  });

  // ── 3. Multi-line title via literal \n ────────────────────────────────────
  // Covers: Phase 3a titleH fix — device must not be pushed off-canvas
  it('device frame · multi-line title (\\n)', async () => {
    const result = await frameScreenshot({
      input: join(RAW_DIR, 'scan.png'),
      device: 'iphone-6.9',
      title: 'Scan Your\\nProgress', // literal \n, same as CLI --title "Scan Your\nBar"
      options: { background: '#1a1a2e' },
    });
    await compareToGolden(result, 'scan-multiline.png');
  });

  // ── 4. No device frame (buildTextSvg path) ────────────────────────────────
  // Covers: non-device path, multi-line-aware titleH, buildTextSvg Phase 1+2
  it('no device frame · title · multi-line titleH', async () => {
    const result = await frameScreenshot({
      input: join(RAW_DIR, 'dish-details.png'),
      device: 'iphone-6.9',
      title: 'Easy to Use',
      options: {
        background: '#2d2d2d',
        deviceFrame: false,
      },
    });
    await compareToGolden(result, 'dish-details-noframe.png');
  });

  // ── 5. Multi-line subtitle (literal \n) at bottom ─────────────────────────
  // Covers: subtitle splitLines + multi-line tspan rendering, bottom-position
  // upward flow so device frame is not clipped
  it('device frame · multi-line subtitle (\\n) · bottom', async () => {
    const result = await frameScreenshot({
      input: join(RAW_DIR, 'dish-details.png'),
      device: 'iphone-6.9',
      title: 'Scan Any Menu',
      subtitle: 'Photo, URL,\\nor PDF',
      options: { background: '#1a1a2e' },
    });
    await compareToGolden(result, 'dish-details-multiline-subtitle.png');
  });

  // ── 6. Multi-line title + multi-line subtitle at top ──────────────────────
  // Covers: real-newline parsing, top-position downward flow for both
  it('device frame · multi-line title + subtitle · top (real \\n)', async () => {
    const result = await frameScreenshot({
      input: join(RAW_DIR, 'scan.png'),
      device: 'iphone-6.9',
      title: 'Track Your\nProgress',         // real newline char
      subtitle: 'Across all\nyour devices',  // real newline char
      options: {
        background: '#1a2f4f',
        textPosition: 'top',
      },
    });
    await compareToGolden(result, 'scan-multiline-both-top.png');
  });

  // ── 7. No device frame · multi-line subtitle ──────────────────────────────
  // Covers: buildTextSvg multi-line subtitle path + subtitleH layout math
  it('no device frame · multi-line subtitle', async () => {
    const result = await frameScreenshot({
      input: join(RAW_DIR, 'results.png'),
      device: 'iphone-6.9',
      title: 'Results',
      subtitle: 'Line one\\nLine two',
      options: {
        background: '#2d2d2d',
        deviceFrame: false,
      },
    });
    await compareToGolden(result, 'results-noframe-multiline-subtitle.png');
  });

  // ── 8. Custom typography flags (Phase 2) ──────────────────────────────────
  // Covers: titleWeight, titleSize, titleSpacing, titleLineHeight options
  it('device frame · custom typography flags', async () => {
    const result = await frameScreenshot({
      input: join(RAW_DIR, 'results.png'),
      device: 'iphone-6.9',
      title: 'Track Everything',
      options: {
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        titleWeight: 700,
        titleSize: 0.075,
        titleSpacing: 0.02,
        titleLineHeight: 1.2,
      },
    });
    await compareToGolden(result, 'results-custom-typo.png');
  });
});
