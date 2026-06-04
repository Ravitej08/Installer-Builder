import { Intent, MatchResult } from '../types';

let intentsCache: Intent[] | null = null;

async function loadIntents(): Promise<Intent[]> {
  if (intentsCache) return intentsCache;

  const [settings, controls, apps, winget, troubleshooting] = await Promise.all([
    import('../../data/intents/windows-settings.json'),
    import('../../data/intents/system-controls.json'),
    import('../../data/intents/apps.json'),
    import('../../data/intents/winget.json'),
    import('../../data/intents/troubleshooting.json'),
  ]);

  intentsCache = [
    ...settings.default,
    ...controls.default,
    ...apps.default,
    ...winget.default,
    ...troubleshooting.default,
  ] as Intent[];

  return intentsCache;
}

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(/\s+/).filter(Boolean);
}

function wordOverlapScore(queryTokens: string[], targetTokens: string[]): number {
  if (queryTokens.length === 0 || targetTokens.length === 0) return 0;
  const matches = queryTokens.filter(qt =>
    targetTokens.some(tt => tt.includes(qt) || qt.includes(tt))
  );
  return matches.length / Math.max(queryTokens.length, targetTokens.length);
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function fuzzyScore(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);
  if (q === t) return 1.0;
  if (t.includes(q) || q.includes(t)) return 0.9;

  const qTokens = tokenize(q);
  const tTokens = tokenize(t);
  const overlap = wordOverlapScore(qTokens, tTokens);
  if (overlap >= 0.7) return 0.85;
  if (overlap >= 0.4) return 0.7;

  // Character similarity for short queries
  if (q.length <= 15 && t.length <= 20) {
    const lev = levenshtein(q, t);
    const maxLen = Math.max(q.length, t.length);
    const similarity = 1 - lev / maxLen;
    if (similarity > 0.7) return similarity * 0.6;
  }

  return overlap * 0.5;
}

function scoreIntent(query: string, intent: Intent): number {
  const q = normalize(query);
  const tokens = tokenize(q);
  let best = 0;

  // Check all keywords
  for (const kw of intent.keywords) {
    const s = fuzzyScore(q, kw);
    if (s > best) best = s;
    // Also check token overlap with multi-word keywords
    const kwTokens = tokenize(kw);
    const overlap = wordOverlapScore(tokens, kwTokens);
    if (overlap > best) best = overlap;
  }

  // Check aliases
  for (const alias of (intent.aliases ?? [])) {
    const s = fuzzyScore(q, alias);
    if (s > best) best = s;
  }

  // Check description
  const descScore = fuzzyScore(q, intent.description) * 0.8;
  if (descScore > best) best = descScore;

  return best;
}

export async function matchIntent(query: string): Promise<MatchResult | null> {
  if (!query.trim()) return null;

  const intents = await loadIntents();
  let best: { intent: Intent; score: number } | null = null;

  for (const intent of intents) {
    const score = scoreIntent(query, intent);
    if (!best || score > best.score) {
      best = { intent, score };
    }
  }

  if (!best || best.score < 0.3) return null;

  return { intent: best.intent, score: best.score, query };
}

export async function topMatches(query: string, limit = 5): Promise<MatchResult[]> {
  if (!query.trim()) return [];

  const intents = await loadIntents();
  const scored = intents.map(intent => ({
    intent,
    score: scoreIntent(query, intent),
    query,
  }));

  return scored
    .filter(r => r.score >= 0.25)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
