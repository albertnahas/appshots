import { existsSync, writeFileSync } from 'node:fs';
import chalk from 'chalk';

const TEMPLATE = `import { defineConfig } from 'appshots';

export default defineConfig({
  // Target devices for screenshot generation
  devices: ['iphone-6.9', 'ipad-13'],

  // Frame styling options (used by 'appshots frame')
  frame: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    padding: 0.08,
    borderRadius: 0.04,
    titleColor: '#ffffff',
    subtitleColor: 'rgba(255,255,255,0.7)',
    shadow: true,
  },

  // Screens to capture (used by 'appshots capture')
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

  // Output directory
  output: './screenshots',
});
`;

export function initCommand(): void {
  const fileName = 'appshots.config.ts';

  if (existsSync(fileName)) {
    console.log(chalk.yellow(`${fileName} already exists. Skipping.`));
    return;
  }

  writeFileSync(fileName, TEMPLATE, 'utf-8');
  console.log(chalk.green(`Created ${chalk.bold(fileName)}`));
  console.log();
  console.log('Next steps:');
  console.log(`  1. Edit ${chalk.cyan(fileName)} with your app's screens`);
  console.log(`  2. Run ${chalk.cyan('appshots capture')} to capture screenshots`);
  console.log(`  3. Run ${chalk.cyan('appshots frame ./raw')} to frame existing screenshots`);
}
