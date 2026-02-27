import chalk from 'chalk';
import { validateScreenshots } from '../core/validator.js';

export async function validateCommand(dir: string): Promise<void> {
  const results = await validateScreenshots(dir);

  if (results.length === 0) {
    console.log(chalk.yellow('No image files found in the directory.'));
    return;
  }

  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const sizeMB = (r.fileSize / 1024 / 1024).toFixed(1);
    const dims = `${r.width}x${r.height}`;

    if (r.valid) {
      const deviceNames = r.matches.map((m) => m.name).join(', ');
      console.log(
        `  ${chalk.green('✓')} ${chalk.white(r.file)} ${chalk.dim(dims)} ${chalk.dim(`(${deviceNames})`)}`
      );
      passed++;
    } else {
      console.log(`  ${chalk.red('✗')} ${chalk.white(r.file)} ${chalk.dim(dims)}`);
      for (const issue of r.issues) {
        console.log(`    ${chalk.yellow('→')} ${issue}`);
      }
      failed++;
    }
  }

  console.log();
  console.log(
    `  ${chalk.green(`${passed} passed`)}, ${failed > 0 ? chalk.red(`${failed} failed`) : chalk.dim(`${failed} failed`)}`
  );

  if (failed > 0) process.exit(1);
}
