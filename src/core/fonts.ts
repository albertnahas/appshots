import { execFileSync } from 'node:child_process';

export interface FontCheckResult {
  available: boolean;
  matched?: string;
}

export function checkFont(family: string): FontCheckResult | null {
  try {
    const out = execFileSync('fc-match', ['-f', '%{family}', family], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return { available: out.toLowerCase() === family.toLowerCase(), matched: out };
  } catch {
    // fc-match not installed — skip the check (Windows, minimal Linux)
    return null;
  }
}

export function firstFamily(stack: string): string {
  const first = stack.split(',')[0].trim();
  return first.replace(/^['"]|['"]$/g, '');
}
