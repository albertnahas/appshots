import type { DeviceSpec } from './types.js';

export const devices: DeviceSpec[] = [
  // ─── iPhone ───────────────────────────────────────────
  {
    name: 'iPhone 6.9"',
    slug: 'iphone-6.9',
    width: 1320,
    height: 2868,
    platform: 'ios',
    category: 'phone',
    devices: ['iPhone Air', 'iPhone 17 Pro Max', 'iPhone 16 Pro Max'],
    dpr: 3,
  },
  {
    name: 'iPhone 6.9" (alt)',
    slug: 'iphone-6.9-alt',
    width: 1290,
    height: 2796,
    platform: 'ios',
    category: 'phone',
    devices: ['iPhone 16 Plus', 'iPhone 15 Pro Max', 'iPhone 15 Plus'],
    dpr: 3,
  },
  {
    name: 'iPhone 6.9" (alt-2)',
    slug: 'iphone-6.9-alt2',
    width: 1260,
    height: 2736,
    platform: 'ios',
    category: 'phone',
    devices: ['iPhone 14 Pro Max'],
    dpr: 3,
  },
  {
    name: 'iPhone 6.5"',
    slug: 'iphone-6.5',
    width: 1284,
    height: 2778,
    platform: 'ios',
    category: 'phone',
    devices: ['iPhone 14 Plus', 'iPhone 13 Pro Max', 'iPhone 12 Pro Max'],
    dpr: 3,
  },
  {
    name: 'iPhone 6.5" (alt)',
    slug: 'iphone-6.5-alt',
    width: 1242,
    height: 2688,
    platform: 'ios',
    category: 'phone',
    devices: ['iPhone 11 Pro Max', 'iPhone XS Max'],
    dpr: 3,
  },
  {
    name: 'iPhone 6.3"',
    slug: 'iphone-6.3',
    width: 1206,
    height: 2622,
    platform: 'ios',
    category: 'phone',
    devices: ['iPhone 17 Pro', 'iPhone 17'],
    dpr: 3,
  },
  {
    name: 'iPhone 6.3" (alt)',
    slug: 'iphone-6.3-alt',
    width: 1179,
    height: 2556,
    platform: 'ios',
    category: 'phone',
    devices: ['iPhone 16 Pro', 'iPhone 16', 'iPhone 15 Pro', 'iPhone 15'],
    dpr: 3,
  },
  {
    name: 'iPhone 6.1"',
    slug: 'iphone-6.1',
    width: 1170,
    height: 2532,
    platform: 'ios',
    category: 'phone',
    devices: ['iPhone 14', 'iPhone 13', 'iPhone 12'],
    dpr: 3,
  },
  {
    name: 'iPhone 5.5"',
    slug: 'iphone-5.5',
    width: 1242,
    height: 2208,
    platform: 'ios',
    category: 'phone',
    devices: ['iPhone 8 Plus', 'iPhone 7 Plus', 'iPhone 6s Plus'],
    dpr: 3,
  },
  {
    name: 'iPhone 4.7"',
    slug: 'iphone-4.7',
    width: 750,
    height: 1334,
    platform: 'ios',
    category: 'phone',
    devices: ['iPhone SE (3rd/2nd gen)', 'iPhone 8', 'iPhone 7'],
    dpr: 2,
  },

  // ─── iPad ─────────────────────────────────────────────
  {
    name: 'iPad 13"',
    slug: 'ipad-13',
    width: 2064,
    height: 2752,
    platform: 'ios',
    category: 'tablet',
    devices: ['iPad Pro M5', 'iPad Pro M4', 'iPad Air M3'],
    dpr: 2,
  },
  {
    name: 'iPad 13" (alt)',
    slug: 'ipad-13-alt',
    width: 2048,
    height: 2732,
    platform: 'ios',
    category: 'tablet',
    devices: ['iPad Pro 12.9" (6th-1st gen)'],
    dpr: 2,
  },
  {
    name: 'iPad 11"',
    slug: 'ipad-11',
    width: 1668,
    height: 2388,
    platform: 'ios',
    category: 'tablet',
    devices: ['iPad Pro 11"', 'iPad Air (5th/4th gen)'],
    dpr: 2,
  },
  {
    name: 'iPad 11" (alt)',
    slug: 'ipad-11-alt',
    width: 1640,
    height: 2360,
    platform: 'ios',
    category: 'tablet',
    devices: ['iPad (10th gen)', 'iPad Air (M2)'],
    dpr: 2,
  },
  {
    name: 'iPad 10.5"',
    slug: 'ipad-10.5',
    width: 1668,
    height: 2224,
    platform: 'ios',
    category: 'tablet',
    devices: ['iPad Air (3rd gen)', 'iPad (9th-7th gen)'],
    dpr: 2,
  },

  // ─── Google Play ──────────────────────────────────────
  {
    name: 'Android Phone',
    slug: 'android-phone',
    width: 1080,
    height: 1920,
    platform: 'android',
    category: 'phone',
    devices: ['Standard Android phone (16:9)'],
    dpr: 3,
  },
  {
    name: 'Android Phone (20:9)',
    slug: 'android-phone-tall',
    width: 1080,
    height: 2400,
    platform: 'android',
    category: 'phone',
    devices: ['Modern Android phone (20:9)'],
    dpr: 3,
  },
  {
    name: 'Android 7" Tablet',
    slug: 'android-tablet-7',
    width: 1200,
    height: 1920,
    platform: 'android',
    category: 'tablet',
    devices: ['7" Android tablet'],
    dpr: 2,
  },
  {
    name: 'Android 10" Tablet',
    slug: 'android-tablet-10',
    width: 1600,
    height: 2560,
    platform: 'android',
    category: 'tablet',
    devices: ['10" Android tablet'],
    dpr: 2,
  },

  // ─── Mac ──────────────────────────────────────────────
  {
    name: 'Mac',
    slug: 'mac',
    width: 2880,
    height: 1800,
    platform: 'macos',
    category: 'desktop',
    devices: ['MacBook Pro 16"', 'MacBook Pro 15"'],
    dpr: 2,
  },
  {
    name: 'Mac (alt)',
    slug: 'mac-alt',
    width: 2560,
    height: 1600,
    platform: 'macos',
    category: 'desktop',
    devices: ['MacBook Pro 14"', 'MacBook Air 15"'],
    dpr: 2,
  },

  // ─── Apple Watch ──────────────────────────────────────
  {
    name: 'Apple Watch Ultra',
    slug: 'watch-ultra',
    width: 410,
    height: 502,
    platform: 'watchos',
    category: 'watch',
    devices: ['Apple Watch Ultra 2', 'Apple Watch Ultra'],
    dpr: 2,
  },
  {
    name: 'Apple Watch Series 10+',
    slug: 'watch-series10',
    width: 416,
    height: 496,
    platform: 'watchos',
    category: 'watch',
    devices: ['Apple Watch Series 11', 'Apple Watch Series 10'],
    dpr: 2,
  },
  {
    name: 'Apple Watch Series 7-9',
    slug: 'watch-series7',
    width: 396,
    height: 484,
    platform: 'watchos',
    category: 'watch',
    devices: ['Apple Watch Series 9', 'Series 8', 'Series 7'],
    dpr: 2,
  },

  // ─── Apple TV ─────────────────────────────────────────
  {
    name: 'Apple TV 4K',
    slug: 'apple-tv',
    width: 3840,
    height: 2160,
    platform: 'tvos',
    category: 'tv',
    devices: ['Apple TV 4K'],
    dpr: 1,
  },

  // ─── Apple Vision Pro ─────────────────────────────────
  {
    name: 'Apple Vision Pro',
    slug: 'vision-pro',
    width: 3840,
    height: 2160,
    platform: 'visionos',
    category: 'headset',
    devices: ['Apple Vision Pro'],
    dpr: 1,
  },
];

export function getDevice(slug: string): DeviceSpec | undefined {
  return devices.find((d) => d.slug === slug);
}

export function findDeviceByDimensions(
  width: number,
  height: number
): DeviceSpec[] {
  return devices.filter(
    (d) =>
      (d.width === width && d.height === height) ||
      (d.width === height && d.height === width)
  );
}

export function listDevices(
  filter?: Partial<Pick<DeviceSpec, 'platform' | 'category'>>
): DeviceSpec[] {
  if (!filter) return devices;
  return devices.filter(
    (d) =>
      (!filter.platform || d.platform === filter.platform) &&
      (!filter.category || d.category === filter.category)
  );
}
