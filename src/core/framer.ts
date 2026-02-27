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
  bezelX: number;
  bezelTop: number;
  bezelBottom: number;
  bodyRadius: number;
  screenRadius: number;
  dynamicIsland: boolean;
  homeButton: boolean;
}

function getFrameConfig(spec: DeviceSpec): DeviceFrameConfig {
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

// ─── Frame color presets ───────────────────────────────────

const FRAME_COLORS: Record<string, [string, string, string]> = {
  black: ['#3A3A3A', '#1F1F1F', '#0D0D0D'],
  silver: ['#D4D4D8', '#A1A1AA', '#71717A'],
  gold: ['#D4A574', '#B8860B', '#7A5C1F'],
  blue: ['#4A6FA5', '#2C4A7C', '#1A2F4F'],
  red: ['#B04040', '#8B2020', '#5C1010'],
  white: ['#F5F5F5', '#E0E0E0', '#C8C8C8'],
};

function resolveFrameColors(frameColor: string): [string, string, string] {
  if (FRAME_COLORS[frameColor]) return FRAME_COLORS[frameColor];
  // Treat as hex — derive gradient from single color
  const base = frameColor;
  return [lighten(base, 30), base, darken(base, 20)];
}

function lighten(hex: string, pct: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex(
    Math.min(255, r + Math.round((255 - r) * pct / 100)),
    Math.min(255, g + Math.round((255 - g) * pct / 100)),
    Math.min(255, b + Math.round((255 - b) * pct / 100)),
  );
}

function darken(hex: string, pct: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex(
    Math.max(0, Math.round(r * (1 - pct / 100))),
    Math.max(0, Math.round(g * (1 - pct / 100))),
    Math.max(0, Math.round(b * (1 - pct / 100))),
  );
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ─── Main export ───────────────────────────────────────────

export async function frameScreenshot(params: FrameInput): Promise<Buffer> {
  const { input, device, title, subtitle, orientation = 'portrait' } = params;
  const opts = frameOptionsSchema.parse(params.options ?? {});

  const spec = getDevice(device);
  if (!spec) throw new Error(`Unknown device: ${device}`);

  const canvasW = orientation === 'portrait' ? spec.width : spec.height;
  const canvasH = orientation === 'portrait' ? spec.height : spec.width;

  const hasOverlay = !!(title || subtitle);
  const isPlainResize =
    !hasOverlay && opts.background === '#000000' && !opts.shadow && !opts.deviceFrame && !opts.pattern;

  if (isPlainResize) {
    return sharp(input)
      .resize(canvasW, canvasH, { fit: 'cover', position: 'center' })
      .png({ quality: 100 })
      .toBuffer();
  }

  // Layout calculations — text sizing based on font size
  const padX = Math.round(canvasW * opts.padding);
  const padY = Math.round(canvasH * opts.padding * 0.6);
  const titleFontSize = Math.round(canvasW * opts.titleSize);
  const subtitleFontSize = Math.round(canvasW * opts.subtitleSize);
  const titleH = title ? Math.round(titleFontSize * 2) : 0;
  const subtitleH = subtitle ? Math.round(subtitleFontSize * 2.4) : 0;
  const textH = titleH + subtitleH;
  const topOffset = padY + textH;
  const areaW = canvasW - padX * 2;
  const areaH = canvasH - topOffset - padY;

  const showFrame =
    opts.deviceFrame && (spec.category === 'phone' || spec.category === 'tablet');

  if (showFrame) {
    return frameWithDevice(
      input, spec, opts, canvasW, canvasH, areaW, areaH, padX, topOffset, padY,
      title, subtitle, titleH, subtitleH, titleFontSize, subtitleFontSize, hasOverlay,
    );
  }

  return frameWithoutDevice(
    input, opts, canvasW, canvasH, areaW, areaH, padX, topOffset, padY,
    title, subtitle, titleH, subtitleH, titleFontSize, subtitleFontSize, hasOverlay,
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
  titleFontSize: number,
  subtitleFontSize: number,
  hasOverlay: boolean,
): Promise<Buffer> {
  const fc = getFrameConfig(spec);
  const frameColors = resolveFrameColors(opts.frameColor);

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
    fc.homeButton, frameColors,
  );

  // Build background
  const bgSvg = buildBackgroundSvg(canvasW, canvasH, opts.background);

  // Build pattern overlay
  const patternSvg = opts.pattern
    ? buildPatternSvg(canvasW, canvasH, opts.pattern, opts.patternColor, opts.patternOpacity)
    : null;

  // Build text overlay
  const textSvg = hasOverlay
    ? buildTextSvg(canvasW, padY, titleH, subtitleH, titleFontSize, subtitleFontSize, title, subtitle, opts)
    : null;

  // Build shadow
  let shadowBuf: Buffer | null = null;
  if (opts.shadow) {
    const sp = 50;
    const shadowSvg = `<svg width="${deviceW + sp * 2}" height="${deviceH + sp * 2}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${sp}" y="${sp}" width="${deviceW}" height="${deviceH}"
        rx="${bodyRadius}" ry="${bodyRadius}" fill="rgba(0,0,0,0.4)"/>
    </svg>`;
    shadowBuf = await sharp(Buffer.from(shadowSvg)).blur(25).png().toBuffer();
  }

  // Composite layers
  const layers: sharp.OverlayOptions[] = [];

  // Pattern
  if (patternSvg) {
    layers.push({ input: Buffer.from(patternSvg), top: 0, left: 0 });
  }

  // Shadow
  if (shadowBuf) {
    layers.push({ input: shadowBuf, top: topOffset - 50 + 12, left: padX - 50 });
  }

  // Device body
  layers.push({ input: Buffer.from(deviceBodySvg), top: topOffset, left: padX });

  // Screenshot
  layers.push({ input: roundedScreen, top: topOffset + bezelTop, left: padX + bezelX });

  // Dynamic Island (ellipse)
  if (fc.dynamicIsland) {
    const diW = Math.round(screenW * 0.26);
    const diH = Math.round(Math.max(screenH * 0.014, 14));
    const diCx = Math.round(screenW / 2);
    const diCy = Math.round(screenH * 0.014 + diH / 2);
    const diSvg = `<svg width="${screenW}" height="${screenH}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${diCx}" cy="${diCy}" rx="${Math.round(diW / 2)}" ry="${Math.round(diH / 2)}" fill="#000000"/>
    </svg>`;
    layers.push({ input: Buffer.from(diSvg), top: topOffset + bezelTop, left: padX + bezelX });
  }

  // Text
  if (textSvg) {
    layers.push({ input: Buffer.from(textSvg), top: 0, left: 0 });
  }

  const bg = await sharp(Buffer.from(bgSvg)).png().toBuffer();
  return sharp(bg).composite(layers).png({ quality: 100 }).toBuffer();
}

// ─── Frame WITHOUT device bezel ────────────────────────────

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
  titleFontSize: number,
  subtitleFontSize: number,
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
  const patternSvg = opts.pattern
    ? buildPatternSvg(canvasW, canvasH, opts.pattern, opts.patternColor, opts.patternOpacity)
    : null;
  const textSvg = hasOverlay
    ? buildTextSvg(canvasW, padY, titleH, subtitleH, titleFontSize, subtitleFontSize, title, subtitle, opts)
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
  if (patternSvg) {
    layers.push({ input: Buffer.from(patternSvg), top: 0, left: 0 });
  }
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
  colors: [string, string, string],
): string {
  let extras = '';

  if (homeButton) {
    const btnR = Math.round(w * 0.06);
    const btnCx = Math.round(w / 2);
    const btnCy = Math.round(h - bezelTop * 0.55);
    extras += `<circle cx="${btnCx}" cy="${btnCy}" r="${btnR}"
      fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>`;
  }

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="body" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors[0]}"/>
        <stop offset="50%" stop-color="${colors[1]}"/>
        <stop offset="100%" stop-color="${colors[2]}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" rx="${bodyRadius}" ry="${bodyRadius}" fill="url(#body)"/>
    <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${bodyRadius}" ry="${bodyRadius}"
      fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>
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

// ─── Pattern SVG ───────────────────────────────────────────

const PATTERNS: Record<string, (size: number, color: string) => string> = {
  dots: (s, c) => `<circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.08}" fill="${c}"/>`,

  grid: (s, c) =>
    `<line x1="0" y1="${s}" x2="${s}" y2="${s}" stroke="${c}" stroke-width="1"/>
     <line x1="${s}" y1="0" x2="${s}" y2="${s}" stroke="${c}" stroke-width="1"/>`,

  diagonal: (s, c) =>
    `<line x1="0" y1="${s}" x2="${s}" y2="0" stroke="${c}" stroke-width="1.5"/>`,

  'cross-dots': (s, c) =>
    `<circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.06}" fill="${c}"/>
     <line x1="${s * 0.3}" y1="${s / 2}" x2="${s * 0.7}" y2="${s / 2}" stroke="${c}" stroke-width="1"/>
     <line x1="${s / 2}" y1="${s * 0.3}" x2="${s / 2}" y2="${s * 0.7}" stroke="${c}" stroke-width="1"/>`,

  waves: (s, c) => {
    const h = s / 2;
    return `<path d="M0 ${h} Q${s / 4} ${h - s * 0.3} ${s / 2} ${h} T${s} ${h}"
      fill="none" stroke="${c}" stroke-width="1.5"/>`;
  },

  diamonds: (s, c) => {
    const m = s / 2;
    return `<polygon points="${m},${s * 0.1} ${s * 0.9},${m} ${m},${s * 0.9} ${s * 0.1},${m}" fill="none" stroke="${c}" stroke-width="1"/>`;
  },
};

function buildPatternSvg(
  w: number,
  h: number,
  pattern: string,
  color: string,
  opacity: number,
): string | null {
  const builder = PATTERNS[pattern];
  if (!builder) return null;

  const tileSize = Math.round(Math.min(w, h) * 0.025);
  const tile = builder(tileSize, color);

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="pat" width="${tileSize}" height="${tileSize}" patternUnits="userSpaceOnUse">
        ${tile}
      </pattern>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#pat)" opacity="${opacity}"/>
  </svg>`;
}

// ─── Text SVG ──────────────────────────────────────────────

function buildTextSvg(
  canvasW: number,
  padY: number,
  titleH: number,
  subtitleH: number,
  titleFontSize: number,
  subtitleFontSize: number,
  title: string | undefined,
  subtitle: string | undefined,
  opts: FrameOptions,
): string {
  const cx = Math.round(canvasW / 2);
  const font = `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;

  let textElements = '';

  if (title) {
    const titleY = padY + Math.round(titleFontSize * 1.25);
    textElements += `<text x="${cx}" y="${titleY}" text-anchor="middle"
      font-size="${titleFontSize}" font-weight="800" fill="${opts.titleColor}"
      font-family="${font}">${escapeXml(title)}</text>`;
  }

  if (subtitle) {
    const subtitleY = padY + titleH + Math.round(subtitleFontSize * 1.4);
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
