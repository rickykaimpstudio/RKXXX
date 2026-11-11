// Backup catalogue of public, approved metadata from AdultEmbed.
// Stores no media files. Frontend can render this even if live API is blocked.
import {writeFile} from 'node:fs/promises';
import {safeProviderThumbnail, validProviderPlayer} from '../adult-provider.mjs';
const source = new URL('https://adultembed.com/api/database/browse/');
source.searchParams.set('page','1');
source.searchParams.set('page_size','60');
source.searchParams.set('orientation','all');
source.searchParams.set('sort','newest');
const response = await fetch(source, {
  headers: {Accept:'application/json','X-Site-URL':'https://adult-content-site-db4416.netlify.app'},
  signal: AbortSignal.timeout(16000)
});
if(!response.ok) throw new Error('Catalogue partenaire HTTP '+response.status);
const payload = await response.json();
if(!Array.isArray(payload?.results)) throw new Error('Réponse fournisseur sans résultats');
const seen=new Set();
const items=[];
for (const raw of payload.results) {
  const id=Number(raw?.id ?? raw?.video_id);
  const title=typeof raw?.title==='string' ? raw.title.trim().slice(0,150) : '';
  const thumb=safeProviderThumbnail(raw?.thumbnail);
  if(!validProviderPlayer(id) || !title || !thumb || seen.has(id))continue;
  seen.add(id);
  const duration=Number(raw.duration_seconds);
  items.push({
    id,title,thumbnail:thumb,
    duration_seconds:Number.isFinite(duration) && duration>=0 ? Math.min(14400,Math.floor(duration)) : 0,
    content_type:raw.content_type === 'scene' ? 'scene' : 'amateur'
  });
}
if(items.length < 12)throw new Error('Trop peu de miniatures valides — conserver le snapshot précédent');
await writeFile('catalog.json',JSON.stringify({
  count:items.length, next:null, results:items, snapshot_at:new Date().toISOString(),
  source:'AdultEmbed — public metadata'
},null,2)+'\n');
console.log('Catalogue de secours créé : '+items.length+' miniatures officielles');
