import sharp from 'sharp';
import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { findDeviceByDimensions } from '../devices.js';
import type { ValidationResult } from '../types.js';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (App Store limit)

export async function validateScreenshots(
  dir: string
): Promise<ValidationResult[]> {
  const files = readdirSync(dir)
    .filter((f) => IMAGE_EXTENSIONS.has(extname(f).toLowerCase()))
    .sort();

  const results: ValidationResult[] = [];

  for (const file of files) {
    const filePath = join(dir, file);
    results.push(await validateFile(filePath));
  }

  return results;
}

export async function validateFile(filePath: string): Promise<ValidationResult> {
  const meta = await sharp(filePath).metadata();
  const stats = statSync(filePath);
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const format = meta.format ?? 'unknown';
  const fileSize = stats.size;

  const matches = findDeviceByDimensions(width, height);
  const issues: string[] = [];

  if (!['png', 'jpeg'].includes(format)) {
    issues.push(`Format "${format}" is not supported. Use PNG or JPEG.`);
  }

  if (meta.hasAlpha && format === 'png') {
    issues.push('PNG has transparency. App Store requires no transparency.');
  }

  if (fileSize > MAX_FILE_SIZE) {
    const sizeMB = (fileSize / 1024 / 1024).toFixed(1);
    issues.push(`File size ${sizeMB}MB exceeds 10MB App Store limit.`);
  }

  if (matches.length === 0) {
    issues.push(
      `Dimensions ${width}x${height} don't match any known device spec.`
    );
  }

  if (meta.space && meta.space !== 'srgb') {
    issues.push(
      `Color space "${meta.space}" detected. App Store requires sRGB.`
    );
  }

  return {
    file: filePath,
    width,
    height,
    format,
    fileSize,
    matches,
    valid: issues.length === 0,
    issues,
  };
}
