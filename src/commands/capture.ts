import chalk from 'chalk';
import ora from 'ora';
import { captureScreenshots } from '../core/capturer.js';
import { getDevice } from '../devices.js';
import { loadConfig } from '../config.js';

interface CaptureCommandOptions {
  url?: string;
  device?: string;
  output?: string;
  landscape?: boolean;
  config?: string;
  path?: string[];
}

export async function captureCommand(
  opts: CaptureCommandOptions
): Promise<void> {
  const config = opts.config ? await loadConfig(opts.config) : await loadConfig();
  const baseUrl =
    opts.url ?? config?.capture?.baseUrl ?? 'http://localhost:3000';
  const deviceSlug = opts.device ?? config?.devices?.[0] ?? 'iphone-6.9';
  const device = getDevice(deviceSlug);

  if (!device) {
    console.error(chalk.red(`Unknown device: ${deviceSlug}`));
    console.error(`Run ${chalk.cyan('appshots devices')} to see available devices.`);
    process.exit(1);
  }

  // Build screens list from CLI args or config
  const screens =
    opts.path && opts.path.length > 0
      ? opts.path.map((p, i) => ({ name: `screen-${i + 1}`, path: p }))
      : config?.capture?.screens;

  if (!screens || screens.length === 0) {
    console.error(
      chalk.red(
        'No screens defined. Use --path /home,/about or define screens in config file.'
      )
    );
    process.exit(1);
  }

  const orientation = opts.landscape ? 'landscape' : 'portrait';
  const outputDir = opts.output ?? config?.output ?? './screenshots';

  const spinner = ora(
    `Capturing ${screens.length} screen${screens.length > 1 ? 's' : ''} on ${device.name}...`
  ).start();

  try {
    const files = await captureScreenshots({
      baseUrl,
      screens,
      device: deviceSlug,
      outputDir,
      orientation,
    });

    spinner.succeed(
      `Captured ${files.length} screenshot${files.length > 1 ? 's' : ''} → ${chalk.cyan(outputDir + '/' + device.slug)}`
    );

    for (const f of files) {
      console.log(chalk.dim(`  ${f}`));
    }
  } catch (err) {
    spinner.fail('Capture failed');
    console.error(chalk.red(`  ${(err as Error).message}`));
    process.exit(1);
  }
}
