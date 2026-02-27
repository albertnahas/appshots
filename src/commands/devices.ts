import chalk from 'chalk';
import { listDevices } from '../devices.js';

export function devicesCommand(opts: {
  platform?: string;
  category?: string;
}): void {
  const filter: Record<string, string> = {};
  if (opts.platform) filter.platform = opts.platform;
  if (opts.category) filter.category = opts.category;

  const all = listDevices(Object.keys(filter).length > 0 ? filter : undefined);

  // Group by platform
  const grouped = new Map<string, typeof all>();
  for (const d of all) {
    const key = d.platform;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(d);
  }

  const platformLabels: Record<string, string> = {
    ios: 'Apple iOS',
    android: 'Google Play',
    macos: 'Mac App Store',
    watchos: 'Apple Watch',
    tvos: 'Apple TV',
    visionos: 'Apple Vision',
  };

  for (const [platform, devices] of grouped) {
    console.log();
    console.log(
      chalk.bold(platformLabels[platform] ?? platform)
    );
    console.log(chalk.dim('─'.repeat(60)));

    for (const d of devices) {
      const slug = chalk.cyan(d.slug.padEnd(22));
      const dims = chalk.white(`${d.width} x ${d.height}`.padEnd(14));
      const examples = chalk.dim(d.devices.slice(0, 2).join(', '));
      console.log(`  ${slug} ${dims} ${examples}`);
    }
  }

  console.log();
  console.log(
    chalk.dim(`  ${all.length} device presets available`)
  );
}
