import { Command } from 'commander';
import { frameCommand } from './commands/frame.js';
import { captureCommand } from './commands/capture.js';
import { validateCommand } from './commands/validate.js';
import { devicesCommand } from './commands/devices.js';
import { initCommand } from './commands/init.js';

const program = new Command();

program
  .name('appshots')
  .description(
    'Generate App Store-ready screenshots. Capture, frame, and validate.'
  )
  .version('1.3.0');

program
  .command('frame <input>')
  .description('Frame raw screenshots with backgrounds, rounded corners, and text')
  .option('-d, --device <slug>', 'target device preset', 'iphone-6.9')
  .option('-o, --output <dir>', 'output directory')
  .option('-b, --background <value>', 'background color or gradient')
  .option('-t, --title <text>', 'title text overlay')
  .option('-s, --subtitle <text>', 'subtitle text overlay')
  .option('--padding <ratio>', 'padding ratio (0-0.4)')
  .option('--border-radius <ratio>', 'corner radius ratio (0-0.2)')
  .option('--landscape', 'landscape orientation')
  .option('--no-shadow', 'disable drop shadow')
  .option('--no-device-frame', 'disable device frame bezel')
  .option('--frame-color <color>', 'device frame color (black, silver, gold, blue, red, white, or hex)')
  .option('--pattern <name>', 'background pattern (dots, grid, diagonal, waves, diamonds, cross-dots)')
  .option('--pattern-opacity <ratio>', 'pattern opacity (0-1)')
  .option('--text-position <pos>', 'text position: top or bottom', 'bottom')
  .option('--title-size <ratio>', 'title size as ratio of canvas width (0–0.2)')
  .option('--subtitle-size <ratio>', 'subtitle size as ratio of canvas width (0–0.1)')
  .option('--title-weight <weight>', 'title font-weight 100–900')
  .option('--subtitle-weight <weight>', 'subtitle font-weight 100–900')
  .option('--title-spacing <ratio>', 'title letter-spacing as ratio of font size')
  .option('--subtitle-spacing <ratio>', 'subtitle letter-spacing as ratio of font size')
  .option('--title-color <color>', 'title color (CSS color)')
  .option('--subtitle-color <color>', 'subtitle color (CSS color)')
  .option('--font-family <stack>', 'CSS font-family stack')
  .option('--title-line-height <number>', 'title line-height')
  .option('--auto-fit-title', 'shrink and wrap title to fit canvas width')
  .option('--phone-scale <ratio>', 'phone width as ratio of canvas width (0.4–1.0)')
  .option('-c, --config <path>', 'config file path')
  .action(frameCommand);

program
  .command('capture')
  .description('Capture screenshots from a running web app using Playwright')
  .option('-u, --url <url>', 'base URL of the running app')
  .option('-d, --device <slug>', 'target device preset')
  .option('-p, --path <paths...>', 'URL paths to capture (e.g., /home /about)')
  .option('-o, --output <dir>', 'output directory')
  .option('--landscape', 'landscape orientation')
  .option('-c, --config <path>', 'config file path')
  .action(captureCommand);

program
  .command('validate <dir>')
  .description('Validate screenshots against App Store/Play Store requirements')
  .action(validateCommand);

program
  .command('devices')
  .description('List all available device presets')
  .option('--platform <platform>', 'filter by platform (ios, android, macos)')
  .option('--category <category>', 'filter by category (phone, tablet, desktop)')
  .action(devicesCommand);

program
  .command('init')
  .description('Generate an appshots.config.ts config file')
  .action(initCommand);

program.parse();
