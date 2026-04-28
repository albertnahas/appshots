import { describe, it, expect } from 'vitest';
import { firstFamily } from '../src/core/fonts.js';
import { estimateTextWidth, computeAutoFit, splitLines } from '../src/core/framer.js';
import { frameOptionsSchema } from '../src/types.js';

// ─── firstFamily ──────────────────────────────────────────

describe('firstFamily', () => {
  it('strips single quotes from Inter', () => {
    expect(firstFamily("'Inter', system-ui, sans-serif")).toBe('Inter');
  });

  it('handles no-quote families', () => {
    expect(firstFamily('system-ui, sans-serif')).toBe('system-ui');
  });

  it('strips double quotes', () => {
    expect(firstFamily('"Helvetica Neue", sans-serif')).toBe('Helvetica Neue');
  });

  it('handles single-family stack', () => {
    expect(firstFamily('Roboto')).toBe('Roboto');
  });
});

// ─── splitLines ───────────────────────────────────────────

describe('splitLines', () => {
  it('returns [] for empty input', () => {
    expect(splitLines('')).toEqual([]);
  });

  it('returns single-element array for plain string', () => {
    expect(splitLines('Hello world')).toEqual(['Hello world']);
  });

  it('splits on literal backslash-n (CLI default from bash)', () => {
    expect(splitLines('Foo\\nBar')).toEqual(['Foo', 'Bar']);
  });

  it('splits on real newline character (config files / programmatic)', () => {
    expect(splitLines('Foo\nBar')).toEqual(['Foo', 'Bar']);
  });

  it('splits on CRLF', () => {
    expect(splitLines('Foo\r\nBar')).toEqual(['Foo', 'Bar']);
  });

  it('splits on literal \\r\\n', () => {
    expect(splitLines('Foo\\r\\nBar')).toEqual(['Foo', 'Bar']);
  });

  it('handles three lines', () => {
    expect(splitLines('A\\nB\\nC')).toEqual(['A', 'B', 'C']);
  });

  it('handles mixed real and literal breaks', () => {
    expect(splitLines('A\nB\\nC')).toEqual(['A', 'B', 'C']);
  });
});

// ─── estimateTextWidth ────────────────────────────────────

describe('estimateTextWidth', () => {
  it('weight 400 uses ratio 0.50', () => {
    // 2 chars × 100px × 0.50 = 100
    expect(estimateTextWidth('Hi', 100, 400)).toBeCloseTo(100);
  });

  it('weight 800 uses ratio 0.55', () => {
    // 2 chars × 100px × 0.55 = 110
    expect(estimateTextWidth('Hi', 100, 800)).toBeCloseTo(110);
  });

  it('weight 600 interpolates to 0.525', () => {
    // 0.50 + (600-400) × (0.05/400) = 0.525 → 2 × 100 × 0.525 = 105
    expect(estimateTextWidth('Hi', 100, 600)).toBeCloseTo(105);
  });

  it('scales linearly with fontSize', () => {
    const w50 = estimateTextWidth('test', 50, 800);
    const w100 = estimateTextWidth('test', 100, 800);
    expect(w100).toBeCloseTo(w50 * 2);
  });

  it('scales linearly with char count', () => {
    const w1 = estimateTextWidth('A', 100, 800);
    const w4 = estimateTextWidth('AAAA', 100, 800);
    expect(w4).toBeCloseTo(w1 * 4);
  });
});

// ─── computeAutoFit ───────────────────────────────────────

describe('computeAutoFit', () => {
  const opts = frameOptionsSchema.parse({});
  // With defaults: padding=0.08, titleWeight=800
  // availW(1320) = 1320 × (1 - 2×0.08) × 0.95 ≈ 1054

  it('returns unchanged size and lines for short title', () => {
    const { lines, fontSize } = computeAutoFit('Hi', 1320, opts, 120);
    expect(lines).toEqual(['Hi']);
    expect(fontSize).toBe(120);
  });

  it('shrinks font for a title that exceeds available width', () => {
    // 'Complete Operation History' = 25 chars
    // estimateWidth(25, 120, 800) = 25×120×0.55 = 1650 > 1054 → must shrink
    const { lines, fontSize } = computeAutoFit('Complete Operation History', 1320, opts, 120);
    expect(fontSize).toBeLessThan(120);
    expect(fontSize).toBeGreaterThan(0);
    // should still fit on one line — no wrapping needed at shrunk size
    expect(lines).toEqual(['Complete Operation History']);
  });

  it('wraps at the most balanced word boundary when floor is insufficient', () => {
    // canvas 300px, title 37 chars; at floor (12px): 37×12×0.55=244.2 > availW(239.4)
    const { lines, fontSize } = computeAutoFit(
      'Complete Operation History Review Now', 300, opts, 100
    );
    expect(lines.length).toBe(2);
    // most balanced split is "Complete Operation" / "History Review Now" (18/18 chars)
    expect(lines[0]).toBe('Complete Operation');
    expect(lines[1]).toBe('History Review Now');
    expect(fontSize).toBe(Math.round(300 * 0.04)); // at the floor
  });

  it('preserves explicit \\n splits when no fit adjustment needed', () => {
    // In CLI: --title "Foo\nBar" → JS string with literal backslash-n
    const { lines, fontSize } = computeAutoFit('Foo\\nBar', 1320, opts, 80);
    expect(lines).toEqual(['Foo', 'Bar']);
    expect(fontSize).toBe(80); // unchanged — short enough
  });

  it('preserves explicit real newline splits (config / programmatic)', () => {
    const { lines, fontSize } = computeAutoFit('Foo\nBar', 1320, opts, 80);
    expect(lines).toEqual(['Foo', 'Bar']);
    expect(fontSize).toBe(80);
  });

  it('respects custom padding in available width calculation', () => {
    const tightPaddingOpts = frameOptionsSchema.parse({ padding: 0.2 });
    const loosePaddingOpts = frameOptionsSchema.parse({ padding: 0.02 });
    const title = 'Some Reasonably Long Title Here';
    const { fontSize: tightSize } = computeAutoFit(title, 1320, tightPaddingOpts, 120);
    const { fontSize: looseSize } = computeAutoFit(title, 1320, loosePaddingOpts, 120);
    // tighter padding → less available width → smaller resulting font
    expect(tightSize).toBeLessThanOrEqual(looseSize);
  });

  it('never shrinks below the 0.04 floor', () => {
    // absurdly long title on a tiny canvas
    const { fontSize } = computeAutoFit(
      'This Is An Extremely Long Title That Cannot Possibly Fit', 200, opts, 100
    );
    expect(fontSize).toBeGreaterThanOrEqual(Math.round(200 * 0.04));
  });
});

// ─── frameOptionsSchema defaults ─────────────────────────

describe('frameOptionsSchema defaults', () => {
  const opts = frameOptionsSchema.parse({});

  it('letter-spacing defaults to 0 (Phase 1 fix)', () => {
    expect(opts.titleSpacing).toBe(0);
    expect(opts.subtitleSpacing).toBe(0);
  });

  it('font weights default to 800/500', () => {
    expect(opts.titleWeight).toBe(800);
    expect(opts.subtitleWeight).toBe(500);
  });

  it('autoFitTitle defaults to false', () => {
    expect(opts.autoFitTitle).toBe(false);
  });

  it('titleLineHeight defaults to 1.15', () => {
    expect(opts.titleLineHeight).toBe(1.15);
  });

  it('fontFamily defaults to Inter stack', () => {
    expect(opts.fontFamily).toContain('Inter');
    expect(opts.fontFamily).toContain('system-ui');
  });

  it('accepts all new Phase 2 fields', () => {
    const custom = frameOptionsSchema.parse({
      titleWeight: 700,
      subtitleWeight: 400,
      titleSpacing: 0.02,
      subtitleSpacing: 0.01,
      fontFamily: 'SF Pro Display, sans-serif',
      titleLineHeight: 1.2,
      autoFitTitle: true,
    });
    expect(custom.titleWeight).toBe(700);
    expect(custom.subtitleWeight).toBe(400);
    expect(custom.titleSpacing).toBeCloseTo(0.02);
    expect(custom.fontFamily).toBe('SF Pro Display, sans-serif');
    expect(custom.autoFitTitle).toBe(true);
  });
});
