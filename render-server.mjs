// Alternative, independent zero-cost deployment target for X-NIGHT QC.
// Serves only the public website and metadata from an upstream partner.
// No video content is downloaded, stored, or proxied.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const ROOT = resolve(process.cwd(), 'dist');
const PORT = Number(process.env.PORT || 10000);
const UPSTREAM = 'https://adultembed.com';
const SORT = new Set(['newest','popular','longest','views','likes']);
const ORIENTATION = new Set(['all','straight','gay','bi','trans']);
const TYPE = new Set(['scene','amateur']);
const MIME = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.png':'image/png',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml',
  '.webp':'image/webp', '.ico':'image/x-icon'
};
const CACHE = new Map();
const POLICY = [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'",
  "script-src 'self'", "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://adultembed.com https://www.adultembed.com https://imgds.net https://pornalizer.app https://*.phncdn.com",
  "connect-src 'self' https://adultembed.com https://www.adultembed.com",
  "frame-src https://adultembed.com https://www.adultembed.com https://www.xvideos.com https://xhamster.com https://www.xhamster.com https://www.pornhub.com https://pornhub.com",
  "frame-ancestors 'none'", "form-action 'self'", "upgrade-insecure-requests"
].join('; ');
const SEND_HEADERS = {
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'X-Frame-Options':'DENY',
  'Content-Security-Policy':POLICY,
  'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()',
  'X-Robots-Tag':'noindex, nofollow, noarchive'
};
function send(res, status, body, headers={}) {
  res.writeHead(status, {...SEND_HEADERS, ...headers});
  res.end(body);
}
function json(res, status, data, cache=false) {
  send(res,status,JSON.stringify(data),{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':cache?'public, max-age=60':'no-store'
  });
}
function integer(value, fallback, max) {
  const n=Number(value);
  return Number.isSafeInteger(n)&&n>=1&&n<=max?n:fallback;
}
function currentSite(req) {
  const external=process.env.PUBLIC_SITE_URL;
  if (external && /^https:\/\/[a-z0-9.-]+(?::\d+)?\/?$/i.test(external)) return external.replace(/\/$/,'');
  const host=req.headers.host || '';
  return /^[a-z0-9.-]+(?::\d+)?$/i.test(host)?'https://'+host:'';
}
async function catalog(req, url, res) {
  const p=url.searchParams;
  const page=integer(p.get('page'),1,1000);
  const pageSize=integer(p.get('page_size')||p.get('per_page'),24,40);
  const sort=SORT.has(p.get('sort'))?p.get('sort'):'newest';
  const orientation=ORIENTATION.has(p.get('orientation'))?p.get('orientation'):'all';
  const type=TYPE.has(p.get('content_type'))?p.get('content_type'):'';
  const query=(p.get('search')||p.get('query')||'').trim().slice(0,80);
  const key=JSON.stringify([page,pageSize,sort,orientation,type,query]);
  const cached=CACHE.get(key);
  if(cached && Date.now()-cached.at<60000) return json(res,200,cached.value,true);
  let empty=false;
  for (const version of ['browse','v1']) {
    const uri=new URL(version==='browse'?'/api/database/browse/':'/api/v1/search',UPSTREAM);
    uri.searchParams.set('page',String(page));
    uri.searchParams.set(version==='browse'?'page_size':'per_page',String(pageSize));
    uri.searchParams.set('sort',sort);
    uri.searchParams.set('orientation',orientation);
    if(version==='v1') uri.searchParams.set('quality','complete');
    if(type)uri.searchParams.set('content_type',type);
    if(query)uri.searchParams.set(version==='browse'?'search':'query',query);
    try {
      const r=await fetch(uri,{headers:{Accept:'application/json','X-Site-URL':currentSite(req)},signal:AbortSignal.timeout(7000)});
      if(!r.ok)continue;
      const data=await r.json();
      const rows=Array.isArray(data?.results)?data.results:[];
      const valid=rows.filter(row=>row&&typeof row==='object'
        &&Number.isSafeInteger(Number(row.id??row.video_id))
        &&Number(row.id??row.video_id)>0
        &&typeof(row.translation?.title||row.title||row.name)==='string');
      if(valid.length) {
        const advertised=Number(data.count);
        const output={count:Number.isSafeInteger(advertised)?advertised:valid.length,next:data.next||null,results:valid,provider:'AdultEmbed'};
        if(CACHE.size>100)CACHE.clear();
        CACHE.set(key,{at:Date.now(),value:output});
        return json(res,200,output,true);
      }
      if(rows.length===0 && (Number(data?.count)===0 || data?.next==null))empty=true;
    }catch {/* Try next officially documented endpoint. */}
  }
  if(empty) return json(res,200,{count:0,next:null,results:[],provider:'AdultEmbed'},true);
  return json(res,503,{error:'Catalogue fournisseur momentanément indisponible',results:[]});
}
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url||'/', 'http://localhost');
    if(req.method==='GET'&&url.pathname==='/healthz')return json(res,200,{ok:true});
    if(req.method==='GET'&&url.pathname==='/api/catalog')return await catalog(req,url,res);
    // Netlify-only forms are deliberately NOT simulated as successful on Render.
    if(req.method!=='GET'&&req.method!=='HEAD')
      return json(res,503,{error:'Formulaire indisponible sur cet hébergement'});
    let pathname;
    try{pathname=decodeURIComponent(url.pathname);}catch{return send(res,400,'Bad request');}
    if(pathname==='/')pathname='/index.html';
    if(pathname==='/confidentialite')pathname='/confidentialite.html';
    if(pathname==='/regles-et-moderation')pathname='/regles-et-moderation.html';
    const file=resolve(ROOT,'.'+pathname);
    if(!file.startsWith(ROOT+sep)||file.endsWith('_headers'))
      return send(res,403,'Forbidden');
    try {
      const body=await readFile(file);
      res.writeHead(200,{...SEND_HEADERS,
        'Content-Type':MIME[extname(file)]||'application/octet-stream',
        'Cache-Control':/\.(?:html|css|mjs|js|json)$/.test(file)?'no-cache':'public, max-age=86400'});
      return res.end(req.method==='HEAD'?undefined:body);
    }catch{return send(res,404,'Not found');}
  }catch{return send(res,500,'Internal error');}
});
server.listen(PORT,'0.0.0.0',()=>console.log('X-NIGHT QC listening on port '+PORT));
