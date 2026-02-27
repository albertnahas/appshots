import { z } from 'zod';

export interface DeviceSpec {
  /** Display name (e.g., "iPhone 6.9\"") */
  name: string;
  /** Device slug for CLI (e.g., "iphone-6.9") */
  slug: string;
  /** Portrait width in pixels */
  width: number;
  /** Portrait height in pixels */
  height: number;
  /** Platform */
  platform: 'ios' | 'android' | 'macos' | 'watchos' | 'tvos' | 'visionos';
  /** Device category */
  category: 'phone' | 'tablet' | 'desktop' | 'watch' | 'tv' | 'headset';
  /** Example devices */
  devices: string[];
  /** Device pixel ratio for capture viewport calculation */
  dpr: number;
}

export interface ScreenConfig {
  /** Screen identifier */
  name: string;
  /** URL path (e.g., "/home") */
  path: string;
  /** Promotional title text */
  title?: string;
  /** Promotional subtitle text */
  subtitle?: string;
  /** Wait for specific text before capturing */
  waitFor?: string;
  /** Wait delay in ms after page load */
  delay?: number;
}

export const frameOptionsSchema = z.object({
  background: z.string().default('#000000'),
  padding: z.number().min(0).max(0.4).default(0.08),
  borderRadius: z.number().min(0).max(0.2).default(0.04),
  titleColor: z.string().default('#ffffff'),
  subtitleColor: z.string().default('rgba(255,255,255,0.7)'),
  titleSize: z.number().min(0).max(0.2).default(0.05),
  subtitleSize: z.number().min(0).max(0.1).default(0.028),
  shadow: z.boolean().default(true),
});

export type FrameOptions = z.infer<typeof frameOptionsSchema>;

export const configSchema = z.object({
  devices: z.array(z.string()).default(['iphone-6.9']),
  frame: frameOptionsSchema.partial().default({}),
  capture: z
    .object({
      baseUrl: z.string().url(),
      screens: z.array(
        z.object({
          name: z.string(),
          path: z.string(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
          waitFor: z.string().optional(),
          delay: z.number().optional(),
        })
      ),
    })
    .optional(),
  output: z.string().default('./screenshots'),
});

export type AppShotsConfig = z.infer<typeof configSchema>;

export interface ValidationResult {
  file: string;
  width: number;
  height: number;
  format: string;
  fileSize: number;
  matches: DeviceSpec[];
  valid: boolean;
  issues: string[];
}
