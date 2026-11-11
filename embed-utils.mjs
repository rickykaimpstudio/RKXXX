const KEY = /^[a-zA-Z0-9_-]{6,64}$/;
const EMBED_HOSTS = new Set(["pornhub.com", "www.pornhub.com"]);

export function safeEmbedUrl(input) {
  if (typeof input !== "string") return null;
  let key = input.trim();
  if (key.includes(":") || key.includes("/") || key.includes("?") || key.includes("#")) {
    try {
      const u = new URL(key);
      if (u.protocol !== "https:" || !EMBED_HOSTS.has(u.hostname.toLowerCase())) return null;
      if (u.search || u.hash) return null;
      const match = u.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{6,64})\/?$/);
      if (!match) return null;
      key = match[1];
    } catch { return null; }
  }
  return KEY.test(key) ? `https://www.pornhub.com/embed/${encodeURIComponent(key)}` : null;
}

export function safeThumb(input) {
  if (typeof input !== "string") return null;
  try {
    const u = new URL(input);
    const host = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || !/(^|\.)(mrstcdn\.store|phncdn\.com)$/.test(host)) return null;
    return u.href;
  } catch { return null; }
}

export function normalizedCatalog(payload) {
  if (!Array.isArray(payload)) return [];
  const result = [];
  const seen = new Set();
  for (const row of payload.slice(0, 1000)) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const player = safeEmbedUrl(row.key ?? row.embedUrl);
    const title = typeof row.title === "string" ? row.title.trim().slice(0, 140) : "";
    if (!player || !title || seen.has(player)) continue;
    seen.add(player);
    const category = typeof row.category === "string" ? row.category.trim().slice(0, 50) || "Vidéos" : "Vidéos";
    const seconds = Number(row.durationSeconds);
    result.push({ player, key: player.split("/").pop(), title, category,
      durationSeconds: Number.isInteger(seconds) && seconds > 0 && seconds < 14400 ? seconds : null,
      thumbnail: safeThumb(row.thumbnail) });
  }
  return result;
}
