/** Provider metadata only. Never downloads media; no account key required for public API. */
export const SOURCE = 'https://adultembed.com';
const THUMB_DOMAINS = ['adultembed.com', 'www.adultembed.com'];

function cleanString(value, max = 140) {
  return typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, max) : '';
}
export function validProviderPlayer(id) {
  const value = Number(id);
  return Number.isSafeInteger(value) && value >= 1 && value <= 9999999999
    ? `${SOURCE}/player/embed/${value}/` : null;
}
export function safeProviderThumbnail(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !THUMB_DOMAINS.includes(url.hostname.toLowerCase())) return null;
    if (!url.pathname.startsWith('/media/thumbnails/')) return null;
    return url.href;
  } catch { return null; }
}
export function cleanProviderResult(payload) {
  const rows = payload && typeof payload === 'object' && Array.isArray(payload.results) ? payload.results : [];
  const result = [];
  const seen = new Set();
  for (const row of rows.slice(0, 40)) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const player = validProviderPlayer(row.id);
    const title = cleanString(row.translation?.title || row.title);
    if (!player || !title || seen.has(player)) continue;
    seen.add(player);
    const category = cleanString(row.categories?.[0]?.name || row.content_type || 'Vidéos', 45);
    const duration = Number(row.duration_seconds);
    result.push({
      source: 'AdultEmbed',
      key: `adultembed-${Number(row.id)}`,
      player, title, category,
      thumbnail: safeProviderThumbnail(row.thumbnail),
      durationSeconds: Number.isFinite(duration) && duration > 0 && duration < 14400 ? Math.floor(duration) : null,
    });
  }
  return result;
}
/** Strictly bounded options, for a future verified server-side route. */
export function providerSearchPath({query = '', sort = 'newest', page = 1, contentType = 'all'} = {}) {
  const u = new URL(`${SOURCE}/api/v1/search`);
  u.searchParams.set('per_page', '20');
  u.searchParams.set('quality', 'complete');
  u.searchParams.set('orientation', 'all');
  u.searchParams.set('sort', sort === 'popular' ? 'popular' : 'newest');
  u.searchParams.set('page', String(Math.max(1, Math.min(50, Number.isInteger(page) ? page : 1))));
  u.searchParams.set('lang', 'fr');
  const q = cleanString(query, 60);
  if (q) u.searchParams.set('query', q);
  if (contentType === 'scene' || contentType === 'amateur') u.searchParams.set('content_type', contentType);
  return u.href;
}
