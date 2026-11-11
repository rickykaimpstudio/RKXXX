import {cleanProviderResult} from '../adult-provider.mjs';
// Read-only integration smoke test against the provider's official public API.
// Logs only technical metadata and never writes or downloads media files.
const endpoint='https://adultembed.com/api/database/browse/?orientation=all&page=1&page_size=2';
const response=await fetch(endpoint, {
  headers:{Accept:'application/json', Origin:'https://adult-content-site-db4416.netlify.app', 'X-Site-URL':'https://adult-content-site-db4416.netlify.app'},
  signal:AbortSignal.timeout(15000)
});
console.log('Provider status:',response.status);
console.log('Provider CORS:',response.headers.get('access-control-allow-origin') || '(non déclaré)');
if (!response.ok) throw new Error('Provider HTTP '+response.status);
const data=await response.json();
const valid=Array.isArray(data?.results) && data.results.some(row=>
  Number.isSafeInteger(Number(row?.id)) && Number(row.id)>0 && typeof row.title==='string'
);
console.log('Provider total:',Number(data?.count));
console.log('Provider returned cards:',Array.isArray(data?.results)?data.results.length:0);
if(!valid)throw new Error('Provider did not return valid catalogue items');
const normalized = cleanProviderResult(data);
console.log('Player cards parsed:',normalized.length);
console.log('Cards with thumbnails:',normalized.filter(row=>!!row.thumbnail).length);
for(const v of data.results.slice(0,2)){
  const value=v.thumbnail ?? v.thumbnail_url ?? v.thumbnails ?? v.poster ?? v.image ?? null;
  const u=typeof value==='string' ? (()=>{try{const p=new URL(value);return p.hostname+p.pathname.slice(0,80)}catch{return value.slice(0,80)}})() : JSON.stringify(value)?.slice(0,150);
  console.log('Thumbnail source shape:', typeof value, u);
  console.log('Metadata keys:',Object.keys(v).join(','));
}

if(!normalized.length)throw new Error('Normalization rejected real provider cards');
console.log('Catalogue public partenaire: métadonnées disponibles.');
