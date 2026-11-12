// Serve the official AdultEmbed catalogue from the site's own origin.
// Only metadata is returned; no third-party media is downloaded or rehosted.
const BASE = 'https://adultembed.com';
const TARGET_SITE = 'https://adult-content-site-db4416.netlify.app';
const allowedSort = new Set(['newest', 'popular', 'longest', 'views', 'likes']);
const allowedOrientation = new Set(['all', 'straight', 'gay', 'bi', 'trans']);
const allowedType = new Set(['scene', 'amateur']);
const number = (text, fallback, max) => {
  const parsed = Number(text);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
};
const result = (body, status=200, cache=false) => Response.json(body, {
  status,
  headers:{
    'Cache-Control': cache ? 'public, max-age=60, s-maxage=300' : 'no-store',
    'X-Content-Type-Options':'nosniff'
  }
});

export default async function catalog(request) {
  if(request.method !== 'GET') return result({error:'Méthode non autorisée'},405);
  const query = new URL(request.url).searchParams;
  // Deep paging remains bounded; actual results must be supplied by the partner.
  const page = number(query.get('page'), 1, 1000);
  const pageSize = number(query.get('page_size') || query.get('per_page'), 24, 40);
  const sort = allowedSort.has(query.get('sort')) ? query.get('sort') : 'newest';
  const orientation = allowedOrientation.has(query.get('orientation')) ? query.get('orientation') : 'all';
  const type = allowedType.has(query.get('content_type')) ? query.get('content_type') : '';
  const search = (query.get('search') || query.get('query') || '').slice(0,80).trim();
  const upstreams = [
    {url: new URL('/api/database/browse/', BASE), version:'browse'},
    {url: new URL('/api/v1/search', BASE), version:'v1'}
  ];
  let sawEmpty = false;
  for (const {url, version} of upstreams) {
    url.searchParams.set('page',String(page));
    url.searchParams.set(version === 'v1' ? 'per_page' : 'page_size',String(pageSize));
    url.searchParams.set('sort',sort);
    url.searchParams.set('orientation',orientation);
    if (version === 'v1') url.searchParams.set('quality','complete');
    if (type) url.searchParams.set('content_type',type);
    if (search) url.searchParams.set(version === 'v1' ? 'query' : 'search',search);
    try {
      const res = await fetch(url, {
        headers: {Accept:'application/json','X-Site-URL': TARGET_SITE},
        signal: AbortSignal.timeout(8500)
      });
      if (!res.ok) continue;
      const data = await res.json();
      const rows = Array.isArray(data?.results) ? data.results : [];
      const valid = rows.filter(r => r && typeof r === 'object' &&
        Number.isSafeInteger(Number(r.id ?? r.video_id)) &&
        Number(r.id ?? r.video_id) > 0 &&
        typeof (r.translation?.title || r.title || r.name) === 'string');
      const total = Number(data?.count);
      if (valid.length) return result({
        count:Number.isSafeInteger(total) ? total : valid.length,
        next:data.next || null,
        results:valid,
        provider:'AdultEmbed',
        version
      },200,true);
      if (total === 0 || (rows.length === 0 && !data.next && (data.count == null || total === 0))) sawEmpty = true;
    } catch { /* Retry the other documented official endpoint */ }
  }
  if(sawEmpty) return result({count:0,next:null,results:[],provider:'AdultEmbed'},200,true);
  return result({error:'Catalogue partenaire indisponible',results:[]},503);
}
export const config = {path:'/api/catalog',method:'GET'};
