import sharp from 'sharp';
import { getDevice } from '../devices.js';
import { frameOptionsSchema, type FrameOptions, type DeviceSpec } from '../types.js';

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

// ─── Device frame configuration ────────────────────────────

interface DeviceFrameConfig {
  bezelX: number; // side bezel as ratio of device width
  bezelTop: number; // top bezel as ratio of device height
  bezelBottom: number; // bottom bezel as ratio of device height
  bodyRadius: number; // device corner radius as ratio of width
  screenRadius: number; // screen corner radius as ratio of width
  dynamicIsland: boolean;
  homeButton: boolean;
}

function getFrameConfig(spec: DeviceSpec): DeviceFrameConfig {
  // Modern iPhones (Dynamic Island)
  if (spec.platform === 'ios' && spec.category === 'phone') {
    const isOlder = spec.slug === 'iphone-5.5' || spec.slug === 'iphone-4.7';
    if (isOlder) {
      return {
        bezelX: 0.04,
        bezelTop: 0.055,
        bezelBottom: 0.055,
        bodyRadius: 0.1,
        screenRadius: 0.02,
        dynamicIsland: false,
        homeButton: true,
      };
    }
    return {
      bezelX: 0.03,
      bezelTop: 0.025,
      bezelBottom: 0.025,
      bodyRadius: 0.12,
      screenRadius: 0.09,
      dynamicIsland: true,
      homeButton: false,
    };
  }

  // iPads
  if (spec.platform === 'ios' && spec.category === 'tablet') {
    return {
      bezelX: 0.025,
      bezelTop: 0.02,
      bezelBottom: 0.02,
      bodyRadius: 0.04,
      screenRadius: 0.025,
      dynamicIsland: false,
      homeButton: false,
    };
  }

  // Android phones
  if (spec.platform === 'android' && spec.category === 'phone') {
    return {
      bezelX: 0.028,
      bezelTop: 0.022,
      bezelBottom: 0.022,
      bodyRadius: 0.1,
      screenRadius: 0.075,
      dynamicIsland: false,
      homeButton: false,
    };
  }

  // Android tablets
  if (spec.platform === 'android' && spec.category === 'tablet') {
    return {
      bezelX: 0.025,
      bezelTop: 0.02,
      bezelBottom: 0.02,
      bodyRadius: 0.04,
      screenRadius: 0.025,
      dynamicIsland: false,
      homeButton: false,
    };
  }

  // Default (desktop, watch, tv, etc.) — no device frame
  return {
    bezelX: 0.03,
    bezelTop: 0.025,
    bezelBottom: 0.025,
    bodyRadius: 0.08,
    screenRadius: 0.06,
    dynamicIsland: false,
    homeButton: false,
  };
}

// ─── Main export ───────────────────────────────────────────

export async function frameScreenshot(params: FrameInput): Promise<Buffer> {
  const { input, device, title, subtitle, orientation = 'portrait' } = params;
  const opts = frameOptionsSchema.parse(params.options ?? {});

  const spec = getDevice(device);
  if (!spec) throw new Error(`Unknown device: ${device}`);

  const canvasW = orientation === 'portrait' ? spec.width : spec.height;
  const canvasH = orientation === 'portrait' ? spec.height : spec.width;

  // Plain resize: no styling, just make exact dimensions
  const hasOverlay = !!(title || subtitle);
  const isPlainResize =
    !hasOverlay && opts.background === '#000000' && !opts.shadow && !opts.deviceFrame;

  if (isPlainResize) {
    return sharp(input)
      .resize(canvasW, canvasH, { fit: 'cover', position: 'center' })
      .png({ quality: 100 })
      .toBuffer();
  }

  // Layout calculations
  const padX = Math.round(canvasW * opts.padding);
  const padY = Math.round(canvasH * opts.padding * 0.6);
  const titleH = title ? Math.round(canvasH * opts.titleSize * 2.5) : 0;
  const subtitleH = subtitle ? Math.round(canvasH * opts.subtitleSize * 2.2) : 0;
  const textH = titleH + subtitleH;
  const topOffset = padY + textH;
  const areaW = canvasW - padX * 2;
  const areaH = canvasH - topOffset - padY;

  // Device frame for phones and tablets
  const showFrame =
    opts.deviceFrame && (spec.category === 'phone' || spec.category === 'tablet');

  if (showFrame) {
    return frameWithDevice(
      input, spec, opts, canvasW, canvasH, areaW, areaH, padX, topOffset, padY,
      title, subtitle, titleH, subtitleH, hasOverlay,
    );
  }

  return frameWithoutDevice(
    input, opts, canvasW, canvasH, areaW, areaH, padX, topOffset, padY,
    title, subtitle, titleH, subtitleH, hasOverlay,
  );
}

// ─── Frame WITH device bezel ───────────────────────────────

async function frameWithDevice(
  input: string,
  spec: DeviceSpec,
  opts: FrameOptions,
  canvasW: number,
  canvasH: number,
  deviceW: number,
  deviceH: number,
  padX: number,
  topOffset: number,
  padY: number,
  title: string | undefined,
  subtitle: string | undefined,
  titleH: number,
  subtitleH: number,
  hasOverlay: boolean,
): Promise<Buffer> {
  const fc = getFrameConfig(spec);

  const bezelX = Math.round(deviceW * fc.bezelX);
  const bezelTop = Math.round(deviceH * fc.bezelTop);
  const bezelBottom = Math.round(deviceH * fc.bezelBottom);
  const bodyRadius = Math.round(deviceW * fc.bodyRadius);
  const screenRadius = Math.round(deviceW * fc.screenRadius);
  const screenW = deviceW - bezelX * 2;
  const screenH = deviceH - bezelTop - bezelBottom;

  // Resize screenshot to screen area
  const resized = await sharp(input)
    .resize(screenW, screenH, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer();

  // Apply screen corner radius
  const screenMask = Buffer.from(
    `<svg width="${screenW}" height="${screenH}">
      <rect width="${screenW}" height="${screenH}" rx="${screenRadius}" ry="${screenRadius}" fill="white"/>
    </svg>`
  );
  const roundedScreen = await sharp(resized)
    .ensureAlpha()
    .composite([{ input: screenMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Build device body SVG
  const deviceBodySvg = buildDeviceBodySvg(
    deviceW, deviceH, bodyRadius,
    bezelX, bezelTop, screenW, screenH, screenRadius,
    fc.homeButton,
  );

  // Build background
  const bgSvg = buildBackgroundSvg(canvasW, canvasH, opts.background);

  // Build text overlay
  const textSvg = hasOverlay
    ? buildTextSvg(canvasW, padY, titleH, subtitleH, title, subtitle, opts)
    : null;

  // Build shadow (cast by device body)
  let shadowBuf: Buffer | null = null;
  if (opts.shadow) {
    const sp = 50;
    const shadowSvg = `<svg width="${deviceW + sp * 2}" height="${deviceH + sp * 2}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${sp}" y="${sp}" width="${deviceW}" height="${deviceH}"
        rx="${bodyRadius}" ry="${bodyRadius}" fill="rgba(0,0,0,0.4)"/>
    </svg>`;
    shadowBuf = await sharp(Buffer.from(shadowSvg))
      .blur(25)
      .png()
      .toBuffer();
  }

  // Composite layers
  const layers: sharp.OverlayOptions[] = [];

  if (shadowBuf) {
    layers.push({ input: shadowBuf, top: topOffset - 50 + 12, left: padX - 50 });
  }

  // Device body
  layers.push({ input: Buffer.from(deviceBodySvg), top: topOffset, left: padX });

  // Screenshot inside device
  layers.push({ input: roundedScreen, top: topOffset + bezelTop, left: padX + bezelX });

  // Dynamic Island
  if (fc.dynamicIsland) {
    const diW = Math.round(screenW * 0.26);
    const diH = Math.round(Math.max(screenH * 0.013, 12));
    const diX = Math.round((screenW - diW) / 2);
    const diY = Math.round(screenH * 0.013);
    const diRadius = Math.round(diH / 2);
    const diSvg = `<svg width="${screenW}" height="${screenH}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${diX}" y="${diY}" width="${diW}" height="${diH}"
        rx="${diRadius}" ry="${diRadius}" fill="#000000"/>
    </svg>`;
    layers.push({
      input: Buffer.from(diSvg),
      top: topOffset + bezelTop,
      left: padX + bezelX,
    });
  }

  // Text
  if (textSvg) {
    layers.push({ input: Buffer.from(textSvg), top: 0, left: 0 });
  }

  const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();
  return sharp(bg).composite(layers).png({ quality: 100 }).toBuffer();
}

// ─── Frame WITHOUT device bezel (original behavior) ────────

async function frameWithoutDevice(
  input: string,
  opts: FrameOptions,
  canvasW: number,
  canvasH: number,
  areaW: number,
  areaH: number,
  padX: number,
  topOffset: number,
  padY: number,
  title: string | undefined,
  subtitle: string | undefined,
  titleH: number,
  subtitleH: number,
  hasOverlay: boolean,
): Promise<Buffer> {
  const cornerR = Math.round(areaW * opts.borderRadius);

  const resized = await sharp(input)
    .resize(areaW, areaH, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer();

  const roundedMask = Buffer.from(
    `<svg width="${areaW}" height="${areaH}">
      <rect width="${areaW}" height="${areaH}" rx="${cornerR}" ry="${cornerR}" fill="white"/>
    </svg>`
  );
  const rounded = await sharp(resized)
    .ensureAlpha()
    .composite([{ input: roundedMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const bgSvg = buildBackgroundSvg(canvasW, canvasH, opts.background);
  const textSvg = hasOverlay
    ? buildTextSvg(canvasW, padY, titleH, subtitleH, title, subtitle, opts)
    : null;

  let shadowBuf: Buffer | null = null;
  if (opts.shadow) {
    const sp = 40;
    const shadowSvg = `<svg width="${areaW + sp * 2}" height="${areaH + sp * 2}">
      <rect x="${sp}" y="${sp}" width="${areaW}" height="${areaH}"
        rx="${cornerR}" ry="${cornerR}" fill="rgba(0,0,0,0.35)"/>
    </svg>`;
    shadowBuf = await sharp(Buffer.from(shadowSvg)).blur(20).png().toBuffer();
  }

  const layers: sharp.OverlayOptions[] = [];
  if (shadowBuf) {
    layers.push({ input: shadowBuf, top: topOffset - 40 + 8, left: padX - 40 });
  }
  layers.push({ input: rounded, top: topOffset, left: padX });
  if (textSvg) {
    layers.push({ input: Buffer.from(textSvg), top: 0, left: 0 });
  }

  const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();
  return sharp(bg).composite(layers).png({ quality: 100 }).toBuffer();
}

// ─── Device body SVG ───────────────────────────────────────

function buildDeviceBodySvg(
  w: number,
  h: number,
  bodyRadius: number,
  bezelX: number,
  bezelTop: number,
  screenW: number,
  screenH: number,
  screenRadius: number,
  homeButton: boolean,
): string {
  let extras = '';

  // Home button for older iPhones
  if (homeButton) {
    const btnR = Math.round(w * 0.06);
    const btnCx = Math.round(w / 2);
    const btnCy = Math.round(h - bezelTop * 0.55);
    extras += `<circle cx="${btnCx}" cy="${btnCy}" r="${btnR}"
      fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>`;
  }

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="body" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#303032"/>
        <stop offset="10%" stop-color="#1c1c1e"/>
        <stop offset="100%" stop-color="#1a1a1c"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" rx="${bodyRadius}" ry="${bodyRadius}" fill="url(#body)"/>
    <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${bodyRadius}" ry="${bodyRadius}"
      fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>
    <rect x="${bezelX}" y="${bezelTop}" width="${screenW}" height="${screenH}"
      rx="${screenRadius}" ry="${screenRadius}" fill="#000000"/>
    ${extras}
  </svg>`;
}

// ─── Background SVG ────────────────────────────────────────

function buildBackgroundSvg(w: number, h: number, background: string): string {
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

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="${background}"/>
  </svg>`;
}

// ─── Text SVG ──────────────────────────────────────────────

function buildTextSvg(
  canvasW: number,
  padY: number,
  titleH: number,
  subtitleH: number,
  title: string | undefined,
  subtitle: string | undefined,
  opts: FrameOptions,
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

// ─── Helpers ───────────────────────────────────────────────

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
