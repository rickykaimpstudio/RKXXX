/**
 * Strict player-URL parser for the providers' official share -> embed output.
 * An embed URL is NOT an API key and does NOT grant a commercial licence.
 */
const ID = /^[0-9]{3,18}$/;
const PROVIDERS = Object.freeze({
  xvideos: Object.freeze({
    host: 'www.xvideos.com',
    path: /^\/embedframe\/([0-9]{3,18})\/?$/,
  }),
  xhamster: Object.freeze({
    host: 'xhamster.com',
    path: /^\/embed\/([0-9]{3,18})\/?$/,
  }),
});

export function safePartnerEmbedUrl(provider, raw) {
  if (!Object.prototype.hasOwnProperty.call(PROVIDERS, provider)) return null;
  if (typeof raw !== 'string' || raw.length > 350) return null;
  const cfg = PROVIDERS[provider];
  let url;
  try { url = new URL(raw); }
  catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash) return null;
  const h = url.hostname.toLowerCase();
  if (h !== cfg.host && !(provider === 'xhamster' && h === 'www.xhamster.com')) return null;
  const match = url.pathname.match(cfg.path);
  if (!match || !ID.test(match[1])) return null;
  return `https://${cfg.host}${provider === 'xvideos' ? '/embedframe/' : '/embed/'}${match[1]}`;
}

/**
 * These flags are server-attested, NOT provided by users/browser.
 * xHamster is denied until the operator gets prior WRITTEN commercial authorisation.
 */
export function vettedPartnerEntry(record, { xhamsterContractApproved = false } = {}) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  const provider = record.provider;
  if (provider !== 'xvideos' && provider !== 'xhamster') return null;
  if (provider === 'xhamster' && !xhamsterContractApproved) return null;
  const url = safePartnerEmbedUrl(provider, record.embedUrl);
  if (!url) return null;
  for (const key of ['providerApproved', 'rightsVerified', 'agesVerified', 'consentVerified', 'humanReviewed', 'territoryApproved']) {
    if (record[key] !== true) return null;
  }
  if (record.removed === true) return null;
  if (typeof record.title !== 'string' || record.title.trim().length < 3 || record.title.length > 140) return null;
  const title = record.title.trim();
  const category = typeof record.category === 'string' ? record.category.trim().slice(0, 50) : '18+';
  return Object.freeze({
    provider,
    key: `${provider}:${url.split('/').pop()}`,
    title,
    category: category || '18+',
    embedUrl: url,
  });
}
