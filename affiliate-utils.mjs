// Site-owner curated affiliate/campaign endpoints only. No advertiser Javascript is loaded.
const ADULT_HOSTS = ["chaturbate.com", "www.chaturbate.com", "crakrevenue.com", "www.crakrevenue.com"];
const HTTPS = /^https:\/\//i;
export function approvedPartnerLink(url) {
  if (typeof url !== "string" || url.length > 500 || !HTTPS.test(url)) return null;
  try {
    const u = new URL(url);
    if (u.username || u.password || u.port || !ADULT_HOSTS.includes(u.hostname.toLowerCase())) return null;
    return u.href;
  } catch { return null; }
}
export function normalizePlacements(raw) {
  if (!raw || typeof raw !== "object" || raw.version !== 1) return { campaigns: [], partnerOffers: [], liveEmbeds: [] };
  const read = (list, max) => Array.isArray(list) ? list.slice(0,max).flatMap(row => {
    if (!row || typeof row !== "object" || !row.active) return [];
    const url=approvedPartnerLink(row.url);
    const title=typeof row.title === "string"?row.title.trim().slice(0,75):"";
    const description=typeof row.description === "string"?row.description.trim().slice(0,220):"";
    return url&&title?[{title,description,url,disclosure:"Lien partenaire"}]:[];
  }):[];
  return { campaigns: read(raw.campaigns,4), partnerOffers: read(raw.partnerOffers,6), liveEmbeds: [] };
}
