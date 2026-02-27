// Public API for programmatic usage
export { frameScreenshot } from './core/framer.js';
export { captureScreenshots } from './core/capturer.js';
export { validateScreenshots, validateFile } from './core/validator.js';
export { getDevice, findDeviceByDimensions, listDevices, devices } from './devices.js';
export { defineConfig, loadConfig } from './config.js';
export type {
  DeviceSpec,
  ScreenConfig,
  FrameOptions,
  AppShotsConfig,
  ValidationResult,
} from './types.js';
