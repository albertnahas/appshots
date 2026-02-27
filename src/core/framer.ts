import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { getDevice } from '../devices.js';
import { frameOptionsSchema, type FrameOptions } from '../types.js';

interface FrameInput {
  /** Path to the raw screenshot */
  input: string;
  /** Device slug (e.g., "iphone-6.9") */
  device: string;
  /** Frame styling options */
  options?: Partial<FrameOptions>;
  /** Title text overlay */
  title?: string;
  /** Subtitle text overlay */
  subtitle?: string;
  /** Orientation: portrait or landscape */
  orientation?: 'portrait' | 'landscape';
}

export async function frameScreenshot(params: FrameInput): Promise<Buffer> {
  const { input, device, title, subtitle, orientation = 'portrait' } = params;
  const opts = frameOptionsSchema.parse(params.options ?? {});

  const spec = getDevice(device);
  if (!spec) throw new Error(`Unknown device: ${device}`);

  const canvasW = orientation === 'portrait' ? spec.width : spec.height;
  const canvasH = orientation === 'portrait' ? spec.height : spec.width;

  // If no title/subtitle and no background styling, just resize to exact dimensions
  const hasOverlay = !!(title || subtitle);
  const isPlainResize =
    !hasOverlay && opts.background === '#000000' && !opts.shadow;

  if (isPlainResize) {
    return sharp(input)
      .resize(canvasW, canvasH, { fit: 'cover', position: 'center' })
      .png({ quality: 100 })
      .toBuffer();
  }

  // Calculate layout
  const padX = Math.round(canvasW * opts.padding);
  const padY = Math.round(canvasH * opts.padding * 0.6);
  const titleH = title ? Math.round(canvasH * opts.titleSize * 2.5) : 0;
  const subtitleH = subtitle ? Math.round(canvasH * opts.subtitleSize * 2.2) : 0;
  const textH = titleH + subtitleH;
  const topOffset = padY + textH;
  const screenshotW = canvasW - padX * 2;
  const screenshotH = canvasH - topOffset - padY;
  const cornerR = Math.round(screenshotW * opts.borderRadius);

  // Read and resize screenshot
  const resized = await sharp(input)
    .resize(screenshotW, screenshotH, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer();

  // Apply rounded corners via SVG mask
  const roundedMask = Buffer.from(
    `<svg width="${screenshotW}" height="${screenshotH}">
      <rect width="${screenshotW}" height="${screenshotH}" rx="${cornerR}" ry="${cornerR}" fill="white"/>
    </svg>`
  );
  const rounded = await sharp(resized)
    .ensureAlpha()
    .composite([{ input: roundedMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Build background SVG
  const bgSvg = buildBackgroundSvg(canvasW, canvasH, opts.background);

  // Build text SVG overlay
  const textSvg = hasOverlay
    ? buildTextSvg(canvasW, padY, titleH, subtitleH, title, subtitle, opts)
    : null;

  // Build shadow if enabled
  let shadowBuf: Buffer | null = null;
  if (opts.shadow) {
    const shadowPad = 40;
    const shadowW = screenshotW + shadowPad * 2;
    const shadowH = screenshotH + shadowPad * 2;
    const shadowSvg = `<svg width="${shadowW}" height="${shadowH}">
      <rect x="${shadowPad}" y="${shadowPad}" width="${screenshotW}" height="${screenshotH}"
        rx="${cornerR}" ry="${cornerR}" fill="rgba(0,0,0,0.35)"/>
    </svg>`;
    shadowBuf = await sharp(Buffer.from(shadowSvg))
      .blur(20)
      .png()
      .toBuffer();
  }

  // Composite everything
  const layers: sharp.OverlayOptions[] = [];

  if (shadowBuf) {
    layers.push({
      input: shadowBuf,
      top: topOffset - 40 + 8,
      left: padX - 40,
    });
  }

  layers.push({
    input: rounded,
    top: topOffset,
    left: padX,
  });

  if (textSvg) {
    layers.push({
      input: Buffer.from(textSvg),
      top: 0,
      left: 0,
    });
  }

  return sharp(Buffer.from(bgSvg))
    .png()
    .toBuffer()
    .then((bg) => sharp(bg).composite(layers).png({ quality: 100 }).toBuffer());
}

function buildBackgroundSvg(
  w: number,
  h: number,
  background: string
): string {
  // Parse gradient: "linear-gradient(135deg, #667eea, #764ba2)"
  const gradientMatch = background.match(
    /linear-gradient\(\s*(\d+)deg\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/
  );

  if (gradientMatch) {
    const angle = parseInt(gradientMatch[1], 10);
    const color1 = gradientMatch[2].trim();
    const color2 = gradientMatch[3].trim();
    const { x1, y1, x2, y2 } = angleToCoords(angle);

    return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
          <stop offset="0%" stop-color="${color1}"/>
          <stop offset="100%" stop-color="${color2}"/>
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#bg)"/>
    </svg>`;
  }

  // Solid color
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="${background}"/>
  </svg>`;
}

function buildTextSvg(
  canvasW: number,
  padY: number,
  titleH: number,
  subtitleH: number,
  title: string | undefined,
  subtitle: string | undefined,
  opts: FrameOptions
): string {
  const cx = Math.round(canvasW / 2);
  const titleFontSize = Math.round(canvasW * opts.titleSize);
  const subtitleFontSize = Math.round(canvasW * opts.subtitleSize);
  const font = `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;

  let textElements = '';

  if (title) {
    const titleY = padY + titleH * 0.7;
    textElements += `<text x="${cx}" y="${titleY}" text-anchor="middle"
      font-size="${titleFontSize}" font-weight="700" fill="${opts.titleColor}"
      font-family="${font}">${escapeXml(title)}</text>`;
  }

  if (subtitle) {
    const subtitleY = padY + titleH + subtitleH * 0.7;
    textElements += `<text x="${cx}" y="${subtitleY}" text-anchor="middle"
      font-size="${subtitleFontSize}" font-weight="400" fill="${opts.subtitleColor}"
      font-family="${font}">${escapeXml(subtitle)}</text>`;
  }

  return `<svg width="${canvasW}" height="${padY + titleH + subtitleH}" xmlns="http://www.w3.org/2000/svg">
    ${textElements}
  </svg>`;
}

function angleToCoords(angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  const x1 = Math.round(50 - Math.cos(rad) * 50);
  const y1 = Math.round(50 - Math.sin(rad) * 50);
  const x2 = Math.round(50 + Math.cos(rad) * 50);
  const y2 = Math.round(50 + Math.sin(rad) * 50);
  return { x1, y1, x2, y2 };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
