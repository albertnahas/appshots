import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getDevice } from '../devices.js';
import type { ScreenConfig } from '../types.js';

interface CaptureOptions {
  baseUrl: string;
  screens: ScreenConfig[];
  device: string;
  outputDir: string;
  orientation?: 'portrait' | 'landscape';
}

export async function captureScreenshots(
  options: CaptureOptions
): Promise<string[]> {
  const { baseUrl, screens, device, outputDir, orientation = 'portrait' } = options;

  // Dynamic import — playwright is an optional peer dependency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pw: any;
  try {
    const mod = 'playwright';
    pw = await import(mod);
  } catch {
    throw new Error(
      'Playwright is required for the capture command.\n' +
        'Install it with: npm i -D playwright'
    );
  }

  const spec = getDevice(device);
  if (!spec) throw new Error(`Unknown device: ${device}`);

  const viewportW =
    orientation === 'portrait'
      ? Math.round(spec.width / spec.dpr)
      : Math.round(spec.height / spec.dpr);
  const viewportH =
    orientation === 'portrait'
      ? Math.round(spec.height / spec.dpr)
      : Math.round(spec.width / spec.dpr);

  const deviceDir = join(outputDir, spec.slug, orientation);
  mkdirSync(deviceDir, { recursive: true });

  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: viewportW, height: viewportH },
    deviceScaleFactor: spec.dpr,
  });

  const page = await context.newPage();
  const outputFiles: string[] = [];

  try {
    for (let i = 0; i < screens.length; i++) {
      const screen = screens[i];
      const url = new URL(screen.path, baseUrl).href;
      const fileName = `${String(i + 1).padStart(2, '0')}-${screen.name}.png`;
      const filePath = join(deviceDir, fileName);

      await page.goto(url, { waitUntil: 'networkidle' });

      if (screen.waitFor) {
        await page.waitForSelector(`text=${screen.waitFor}`, {
          timeout: 10_000,
        });
      }

      if (screen.delay) {
        await page.waitForTimeout(screen.delay);
      }

      await page.screenshot({ path: filePath, type: 'png', fullPage: false });
      outputFiles.push(filePath);
    }
  } finally {
    await browser.close();
  }

  return outputFiles;
}
