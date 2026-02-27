import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import { frameScreenshot } from '../core/framer.js';
import { getDevice } from '../devices.js';
import { loadConfig } from '../config.js';
import type { FrameOptions } from '../types.js';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

interface FrameCommandOptions {
  device: string;
  output?: string;
  background?: string;
  title?: string;
  subtitle?: string;
  padding?: string;
  borderRadius?: string;
  landscape?: boolean;
  config?: string;
  shadow?: boolean;
}

export async function frameCommand(
  input: string,
  opts: FrameCommandOptions
): Promise<void> {
  const config = opts.config ? await loadConfig(opts.config) : null;
  const deviceSlug = opts.device ?? config?.devices?.[0] ?? 'iphone-6.9';
  const device = getDevice(deviceSlug);

  if (!device) {
    console.error(chalk.red(`Unknown device: ${deviceSlug}`));
    console.error(`Run ${chalk.cyan('appshots devices')} to see available devices.`);
    process.exit(1);
  }

  const orientation = opts.landscape ? 'landscape' : 'portrait';
  const outputDir = opts.output ?? config?.output ?? './screenshots/framed';
  mkdirSync(outputDir, { recursive: true });

  // Collect input files
  const files = collectInputFiles(input);
  if (files.length === 0) {
    console.error(chalk.red('No image files found in the input path.'));
    process.exit(1);
  }

  const frameOpts: Partial<FrameOptions> = {
    ...config?.frame,
    ...(opts.background && { background: opts.background }),
    ...(opts.padding && { padding: parseFloat(opts.padding) }),
    ...(opts.borderRadius && { borderRadius: parseFloat(opts.borderRadius) }),
    ...(opts.shadow !== undefined && { shadow: opts.shadow }),
  };

  // Get per-screen titles from config
  const screenTitles = new Map<string, { title?: string; subtitle?: string }>();
  if (config?.capture?.screens) {
    for (const screen of config.capture.screens) {
      screenTitles.set(screen.name, {
        title: screen.title,
        subtitle: screen.subtitle,
      });
    }
  }

  const spinner = ora(
    `Framing ${files.length} screenshot${files.length > 1 ? 's' : ''} for ${device.name}`
  ).start();

  let processed = 0;
  for (const file of files) {
    const name = basename(file, extname(file));
    const screenMeta = screenTitles.get(name);
    const title = opts.title ?? screenMeta?.title;
    const subtitle = opts.subtitle ?? screenMeta?.subtitle;
    const outPath = join(outputDir, `${name}-${deviceSlug}.png`);

    try {
      const buffer = await frameScreenshot({
        input: file,
        device: deviceSlug,
        options: frameOpts,
        title,
        subtitle,
        orientation,
      });

      await writeFile(outPath, buffer);
      processed++;
      spinner.text = `Framing screenshots... (${processed}/${files.length})`;
    } catch (err) {
      spinner.fail(`Failed to frame ${basename(file)}`);
      console.error(chalk.red(`  ${(err as Error).message}`));
    }
  }

  spinner.succeed(
    `Framed ${processed} screenshot${processed > 1 ? 's' : ''} → ${chalk.cyan(outputDir)}`
  );

  console.log(
    chalk.dim(
      `  Device: ${device.name} (${orientation === 'portrait' ? `${device.width}x${device.height}` : `${device.height}x${device.width}`})`
    )
  );
}

function collectInputFiles(input: string): string[] {
  const stat = statSync(input, { throwIfNoEntry: false });

  if (!stat) {
    console.error(chalk.red(`Path not found: ${input}`));
    process.exit(1);
  }

  if (stat.isFile()) {
    if (IMAGE_EXTENSIONS.has(extname(input).toLowerCase())) {
      return [input];
    }
    console.error(chalk.red(`Not an image file: ${input}`));
    process.exit(1);
  }

  if (stat.isDirectory()) {
    return readdirSync(input)
      .filter((f) => IMAGE_EXTENSIONS.has(extname(f).toLowerCase()))
      .sort()
      .map((f) => join(input, f));
  }

  return [];
}
