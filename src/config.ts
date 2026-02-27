import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { configSchema, type AppShotsConfig } from './types.js';

const CONFIG_FILES = [
  'appshots.config.ts',
  'appshots.config.js',
  'appshots.config.mjs',
  'appshots.config.json',
];

export async function loadConfig(
  explicitPath?: string
): Promise<AppShotsConfig | null> {
  const cwd = process.cwd();

  if (explicitPath) {
    const fullPath = resolve(cwd, explicitPath);
    if (!existsSync(fullPath)) return null;
    return parseConfigFile(fullPath);
  }

  for (const file of CONFIG_FILES) {
    const fullPath = resolve(cwd, file);
    if (existsSync(fullPath)) {
      return parseConfigFile(fullPath);
    }
  }

  return null;
}

async function parseConfigFile(filePath: string): Promise<AppShotsConfig> {
  if (filePath.endsWith('.json')) {
    const raw = readFileSync(filePath, 'utf-8');
    return configSchema.parse(JSON.parse(raw));
  }

  // For TS/JS files, use dynamic import
  // tsup bundles for ESM, so we can use import() directly
  const fileUrl = pathToFileURL(filePath).href;
  const mod = await import(fileUrl);
  const raw = mod.default ?? mod;
  return configSchema.parse(raw);
}

export function defineConfig(config: Partial<AppShotsConfig>): AppShotsConfig {
  return configSchema.parse(config);
}
