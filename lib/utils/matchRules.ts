import type { CachedRule } from '@/lib/localCache';

/**
 * Match a transaction title against user rules.
 * Order: exact match first → contains match (first added wins) → null.
 */
export function matchRule(title: string, rules: CachedRule[]): CachedRule | null {
  const lower = title.toLowerCase().trim();

  // Sort by createdAt ascending so oldest (first added) wins on contains
  const sorted = [...rules].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // 1. Exact match
  for (const rule of sorted) {
    if (lower === rule.keyword.toLowerCase().trim()) return rule;
  }

  // 2. Contains match
  for (const rule of sorted) {
    if (lower.includes(rule.keyword.toLowerCase().trim())) return rule;
  }

  return null;
}
