import { normalizePlacements } from './affiliate-utils.mjs';
import { mountPremiumMarketplace } from './premium-tools.mjs';
import { cleanProviderResult, validProviderPlayer } from './adult-provider.mjs';

// Public no-key API and permanent player URLs documented by the content provider.
// Nothing is scraped, downloaded, copied, or served as a video file by After Dark.
const API = '/api/catalog';
const DIRECT_API = 'https://adultembed.com/api/database/browse/';
const BACKUP_API = 'https://adultembed.com/api/v1/search';
const $ = (id) => document.getElementById(id);
const gate = $('age-gate');
const app = $('app');
$('year').textContent = new Date().getFullYear().toString();

let favorites = [];
try { const v = JSON.parse(localStorage.getItem('rk-afterdark-favorites-v2') || '[]'); if (Array.isArray(v)) favorites = v.filter(Number.isSafeInteger).slice(0,300); } catch { /* private browsing */ }
// Privacy: store a time-limited adult declaration only; never retain full birth dates.
const AGE_CONSENT_KEY = 'rk-afterdark-age-declaration-v2';
const AGE_DECLARATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
let ageConfirmed = false;
try {
  const stamp = Number(localStorage.getItem(AGE_CONSENT_KEY));
  ageConfirmed = Number.isFinite(stamp) && stamp > 0 &&
    stamp <= Date.now() && Date.now() - stamp < AGE_DECLARATION_TTL_MS;
} catch { /* browsing in private mode */ }
const state = { items: [], category: 'all', sort: 'newest', search: '', page: 1, total: 0, hasNext: false, loading: false, request: 0, active: true, ageConfirmed, favOnly: false, current: null, feature: null };
const isFav = (id) => favorites.includes(id);
function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
function status(title, message, retry = false) {
  $('catalog-state').hidden = false;
  $('catalog-state').querySelector('h3').textContent = title;
  $('catalog-state').querySelector('p').textContent = message;
  $('retry-feed').hidden = !retry;
}
function formatDuration(value) {
  if (!Number.isInteger(value) || value <= 0) return '';
  const h = Math.floor(value / 3600), m = Math.floor(value % 3600 / 60), s = value % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
function setCategories() {
  const root = $('categories'); root.replaceChildren();
  for (const [id,label] of [['all','Toutes'],['scene','Studios'],['amateur','Amateur']]) {
    const b = element('button', id === state.category ? 'selected' : '', label);
    b.type = 'button';b.setAttribute('aria-pressed',String(id===state.category));
    b.addEventListener('click',() => { if(state.category === id) return; state.category=id; state.page=1; state.items=[]; loadFeed(false); setCategories(); });
    root.append(b);
  }
}
function toggleFav(id) {
  favorites = isFav(id) ? favorites.filter(x => x !== id) : [...favorites, id].slice(-300);
  try { localStorage.setItem('rk-afterdark-favorites-v2',JSON.stringify(favorites)); } catch { /* optional */ }
  renderVideos();
}
function renderVideos() {
  const root = $('video-grid'); root.replaceChildren();
  $('favorites-only').setAttribute('aria-pressed',String(state.favOnly));
  const shown = state.items.filter(x=>!state.favOnly || isFav(Number(x.key.replace('adultembed-',''))));
  for(const [index,v] of shown.entries()) {
    const id = Number(v.key.replace('adultembed-',''));
    const card = element('article','video-card');
    const cover = element('button','video-cover'); cover.type='button'; cover.setAttribute('aria-label',`Lire la vidéo : ${v.title}`);
    if(v.thumbnail){const img=element('img');img.src=v.thumbnail;img.alt='Aperçu de la vidéo';img.loading=index<6?'eager':'lazy';if(index<4)img.fetchPriority='high';img.decoding='async';img.referrerPolicy='strict-origin-when-cross-origin';img.addEventListener('error',()=>{img.remove();cover.classList.add('image-unavailable');}); cover.append(img);} else {cover.classList.add('image-unavailable');}
    const play=element('span','video-play','▶');cover.append(play);
    const duration=formatDuration(v.durationSeconds); if(duration)cover.append(element('span','video-duration',duration));
    cover.addEventListener('click',()=>openVideo(v));
    const meta=element('div','video-meta');meta.append(element('h3','',v.title));
    const footer=element('div','video-meta-bottom');footer.append(element('span','','VIDÉO · 18+'));
    const fav=element('button','',isFav(id)?'♥':'♡');fav.type='button'; fav.setAttribute('aria-label',isFav(id)?'Retirer des favoris':'Ajouter aux favoris');fav.addEventListener('click',()=>toggleFav(id));
    footer.append(fav);meta.append(footer);card.append(cover,meta);root.append(card);
  }
  root.hidden = !shown.length;
  if (state.items.length && !shown.length) status('Aucun favori dans cette sélection','Appuie sur ♡ sous les vidéos pour les conserver ici.');
  else if(state.items.length) $('catalog-state').hidden=true;
  $('feed-count').textContent=state.total?`${state.total.toLocaleString('fr-CA')} vidéos annoncées par le partenaire · ${state.items.length} chargées`:`${state.items.length} vidéos chargées`;
  $('load-more').hidden=!state.hasNext || state.favOnly || !state.active;
}
function featureVideo(v){
  if(!v || !v.thumbnail)return;
  state.feature=v;
  const img=$('featured-poster');img.src=v.thumbnail;img.hidden=false;
  img.referrerPolicy='strict-origin-when-cross-origin';
  img.addEventListener('error',()=>{img.hidden=true;}, {once:true});
  $('featured-play').hidden=false;
}
const videoId=v=>Number(v.key.replace('adultembed-',''));
function openVideo(v){
  if (!state.active || !state.ageConfirmed || !validProviderPlayer(videoId(v))) return;
  // The provider supports muted autoplay. One thumbnail tap starts the player
  // without a second After Dark confirmation. The player itself stays provider-owned.
  const url=new URL(validProviderPlayer(videoId(v)));
  url.searchParams.set('autoplay','1');
  url.searchParams.set('muted','1');
  state.current = v;
  const frame=element('iframe');
  frame.src=url.href;
  frame.title=v.title;
  frame.loading='eager';
  frame.referrerPolicy='strict-origin-when-cross-origin';
  frame.setAttribute('allow','autoplay; fullscreen; picture-in-picture; encrypted-media');
  frame.setAttribute('allowfullscreen','');
  // No pop-ups, top-level navigations, forms or downloads triggered by embedded code.
  frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');
  $('viewer-frame').replaceChildren(frame);
  $('video-title').textContent=v.title;
  $('player-notice').hidden=true;
  $('video-modal').hidden=false; document.body.classList.add('modal-open');
  $('close-modal').focus();
}
function closeVideo(){
  $('video-modal').hidden=true;$('viewer-frame').replaceChildren();
  document.body.classList.remove('modal-open');state.current=null;
}
$('close-modal').addEventListener('click',closeVideo);
$('video-modal').addEventListener('click', e=>{if(e.target===$('video-modal'))closeVideo();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.current)closeVideo();});
$('featured-play').addEventListener('click',()=>{if(state.feature)openVideo(state.feature);});

let activeFeedController = null;
async function loadFeed(append=false){
  if (!state.active) return;
  if (state.loading && append) return;
  if (state.loading) activeFeedController?.abort();
  state.loading=true;
  const token=++state.request;
  if(!append){state.page=1;state.total=0;state.hasNext=false;state.items=[];renderVideos();}
  $('feed-badge').textContent='◉ CHARGEMENT DES VIDÉOS';
  $('load-more').hidden=true;
  status('Chargement des vraies miniatures…','Connexion au catalogue vidéo partenaire.');
  const controller=new AbortController();
  activeFeedController=controller;
  const timeout=setTimeout(()=>controller.abort(),15000);
  // Show a real, locally deployed backup feed within the first paint of the catalogue.
  // The live provider request still runs and replaces it when fresh results arrive.
  let shownSnapshot=false;
  if(!append && !state.search.trim() && state.category==='all' && state.sort==='newest'){
    try{
      const backupResponse=await fetch('/catalog.json',{cache:'force-cache',signal:controller.signal});
      if(backupResponse.ok){
        const backup=await backupResponse.json();
        const initial=cleanProviderResult(backup).filter(v=>validProviderPlayer(videoId(v)));
        if(initial.length && token===state.request){
          state.items=initial;
          state.total=initial.length;
          shownSnapshot=true;
          $('feed-badge').textContent='● VIDÉOS DISPONIBLES';
          renderVideos();
        }
      }
    } catch { /* live API will still be tried */ }
  }
  const buildUrl=(base,v1=false)=>{
    const u=new URL(base);
    u.searchParams.set('page',String(state.page));
    u.searchParams.set(v1?'per_page':'page_size','24');
    u.searchParams.set('orientation','all');
    u.searchParams.set('sort',state.sort);
    if(v1)u.searchParams.set('quality','complete');
    if(state.category!=='all')u.searchParams.set('content_type',state.category);
    if(state.search.trim())u.searchParams.set(v1?'query':'search',state.search.trim().slice(0,80));
    return u.href;
  };
  const requestFeed=async(base,v1=false)=>{
    const response=await fetch(buildUrl(base,v1),{mode:'cors',credentials:'omit',cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error('Réponse catalogue '+response.status);
    const payload=await response.json();
    if(!payload||typeof payload!=='object')throw new Error('Réponse catalogue invalide');
    return payload;
  };
  try{
    let payload, incoming=[], firstError=null;
    // Prefer same-origin Netlify function (no mobile CORS dependency).
    // Fall back to the two documented AdultEmbed APIs until a live result is obtained.
    for(const [base,v1] of [[API,false],[DIRECT_API,false],[BACKUP_API,true]]){
      if(controller.signal.aborted)break;
      try{
        const candidate=await requestFeed(base,v1);
        const items=cleanProviderResult(candidate).filter(v=>validProviderPlayer(videoId(v)));
        if(items.length){payload=candidate;incoming=items;break;}
        if(!payload)payload=candidate;
      }catch(error){firstError ||= error;}
    }
    // Static emergency snapshot: real supplier metadata, refreshed by GitHub Actions.
    // When a mobile browser or server blocks the live API, visitors still see previews.
    if(!incoming.length && state.page === 1 && !controller.signal.aborted) {
      try {
        const snapshotResponse = await fetch('./catalog.json',{cache:'no-store',signal:controller.signal});
        if(snapshotResponse.ok) {
          const snapshot = await snapshotResponse.json();
          const recovered = cleanProviderResult(snapshot).filter(v=>validProviderPlayer(videoId(v)));
          if(recovered.length){payload={...snapshot,next:null,__snapshot:true};incoming=recovered;}
        }
      } catch { /* last-resort snapshot unavailable */ }
    }
    if(!payload)throw firstError || new Error('Catalogue indisponible');
    if(token!==state.request)return;
    if(shownSnapshot && incoming.length && !payload?.__snapshot) state.items=[];
    const known=new Set(state.items.map(x=>x.key));
    for(const v of incoming)if(!known.has(v.key)){state.items.push(v);known.add(v.key);}
    state.total=Number.isSafeInteger(Number(payload?.count))?Number(payload.count):state.items.length;
    state.hasNext=!!payload?.next&&incoming.length>0;
    if(state.items.length){
      $('feed-badge').textContent=payload?.__snapshot ? '● VIDÉOS DE SECOURS' : '● VIDÉOS DISPONIBLES';
      renderVideos();
      $('catalog-state').hidden=true;
      if(!state.feature)featureVideo(state.items.find(v=>v.thumbnail));
    }else{
      $('feed-badge').textContent='○ CATALOGUE SANS RÉSULTATS';
      renderVideos();
      const advertised=state.total>0;
      status(advertised?'Catalogue indisponible':'Aucune vidéo trouvée',
        advertised?'Le fournisseur annonce des vidéos mais ne renvoie aucune fiche compatible. Réessayer ou signaler le problème.':'Aucun résultat pour cette recherche. Essaie une autre catégorie.',advertised);
    }
  }catch(error){
    if(token!==state.request)return;
    $('feed-badge').textContent='○ CATALOGUE INDISPONIBLE';
    if(state.items.length)renderVideos();
    else status('Impossible de charger les vidéos','Le service partenaire ne répond pas ou le navigateur bloque la connexion. Réessaie plus tard.',true);
  }finally{
    clearTimeout(timeout);
    if(token===state.request){state.loading=false;activeFeedController=null;$('load-more').disabled=false;}
  }
}
let searchTimer;
$('search').addEventListener('input', e=>{
  state.search=e.target.value.slice(0,80);
  clearTimeout(searchTimer);
  searchTimer=setTimeout(()=>loadFeed(false),500);
});
$('sort').addEventListener('change', e=>{state.sort=['newest','popular','longest'].includes(e.target.value)?e.target.value:'newest';loadFeed(false);});
$('favorites-only').addEventListener('click',()=>{state.favOnly=!state.favOnly;renderVideos();});
$('retry-feed').addEventListener('click',()=>loadFeed(false));
$('load-more').addEventListener('click',()=>{if(state.loading||!state.hasNext)return;state.page+=1;loadFeed(true);});
if('IntersectionObserver' in window) {
  const autoLoad = new IntersectionObserver((entries)=>{
    if(entries.some(entry=>entry.isIntersecting) && state.hasNext && !state.loading && state.ageConfirmed && !state.favOnly){
      $('load-more').click();
    }
  },{rootMargin:'700px'});
  autoLoad.observe($('load-more'));
}
setCategories();renderVideos();
mountPremiumMarketplace();
// Restricted material is not fetched or displayed before the declaration.
gate.hidden = state.ageConfirmed;
app.inert = !state.ageConfirmed;
document.body.classList.toggle('age-locked', !state.ageConfirmed);

function ageOnCalendarDate(value, today = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  if (y < 1900 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  const currentY=today.getFullYear(), currentM=today.getMonth()+1, currentD=today.getDate();
  let years = currentY - y;
  if (mo > currentM || (mo === currentM && d > currentD)) years -= 1;
  return years >= 0 ? years : null;
}
const dobInput = $('birthdate');
const ageError = $('age-error');
const ageSubmit = $('enter');
const today = new Date();
dobInput.max = [today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
$('age-form').addEventListener('submit', event => {
  event.preventDefault();
  const years=ageOnCalendarDate(dobInput.value);
  if (years === null) { ageError.textContent = 'Entre une date de naissance valide.'; return; }
  if (years < 18) {
    ageError.textContent = 'Accès refusé : ce site est réservé aux adultes de 18 ans ou plus.';
    ageSubmit.disabled=true;
    return;
  }
  // Confirmation only; local storage contains a timestamp, not a birth date.
  state.ageConfirmed=true;
  try { localStorage.setItem(AGE_CONSENT_KEY,String(Date.now())); } catch { /* private mode */ }
  dobInput.value='';
  ageError.textContent='';
  gate.hidden=true;
  app.inert=false;
  document.body.classList.remove('age-locked');
  window.scrollTo({top:0,behavior:'instant'});
  void loadFeed(false);
});
dobInput.addEventListener('input', () => { ageError.textContent=''; ageSubmit.disabled=false; });
if (state.ageConfirmed) void loadFeed(false);

const el = element;

const MOVES = ["dance", "pose", "clap"];
const DISPLAY = { dance: "♪ DANSE!", pose: "★ PRENDS LA POSE!", clap: "♥ APPLAUDIS!" };
const game = { playing: false, remaining: 30, score: 0, combo: 0, target: "dance", timer: null, sound: false, audio: null };
let best = 0;
try { const saved = Number(localStorage.getItem("rk-afterdark-2d-best-v1")); best = Number.isFinite(saved) && saved >= 0 && saved < 1e6 ? saved : 0; }
catch { /* no storage */ }
$("record").textContent = String(best);
const choice = () => MOVES[Math.floor(Math.random() * MOVES.length)];
const updateGame = () => {
  $("score").textContent = String(game.score);
  $("combo").textContent = `×${game.combo}`;
  $("timer").textContent = `${game.remaining}s`;
  $("prompt-label").textContent = game.playing ? "FAIS LE BON MOUVEMENT" : game.remaining === 0 ? "MANCHE TERMINÉE" : "PRÊT À FAIRE LE SHOW?";
  $("prompt").textContent = game.playing ? DISPLAY[game.target] : game.remaining === 0 ? "BRAVO!" : "ENVOIE LA MUSIQUE!";
  document.querySelectorAll("[data-move]").forEach((button) => {
    button.disabled = !game.playing;
    button.classList.toggle("lit", game.playing && button.dataset.move === game.target);
  });
  $("game-stage").classList.toggle("playing", game.playing);
};
function endGame() {
  game.playing = false;
  game.remaining = 0;
  if (game.timer !== null) window.clearInterval(game.timer);
  game.timer = null;
  $("start-game").textContent = "↻ REJOUER";
  $("game-message").textContent = `Partie terminée! ${game.score} points.`;
  updateGame();
}
$("start-game").addEventListener("click", () => {
  if (game.timer !== null) window.clearInterval(game.timer);
  game.playing = true; game.score = 0; game.combo = 0; game.remaining = 30; game.target = choice();
  $("game-message").textContent = "Vas-y! Fais les bons mouvements!";
  $("start-game").textContent = "↻ RECOMMENCER";
  game.timer = window.setInterval(() => {
    if (document.hidden || !game.playing) return;
    game.remaining -= 1;
    if (game.remaining <= 0) endGame(); else updateGame();
  }, 1000);
  updateGame();
});
function beep(ok) {
  if (!game.sound) return;
  try {
    const context = game.audio ?? new AudioContext(); game.audio = context;
    void context.resume().catch(() => undefined);
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.frequency.value = ok ? 500 : 160;
    oscillator.type = "sine"; oscillator.connect(gain); gain.connect(context.destination);
    gain.gain.setValueAtTime(.055, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .12);
    oscillator.start(); oscillator.stop(context.currentTime + .13);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  } catch { game.sound = false; $("sound-toggle").textContent = "♪ SON OFF"; }
}
const playMove = (move) => {
  if (!game.playing) return;
  const ok = move === game.target;
  beep(ok);
  $("actor").dataset.move = move;
  if (ok) {
    game.score += 100 + Math.min(game.combo, 10) * 10;
    game.combo += 1;
    game.target = choice();
    $("game-message").textContent = "SOLIDE! TU TIENS LE BEAT!";
    if (game.score > best) {
      best = game.score; $("record").textContent = String(best);
      try { localStorage.setItem("rk-afterdark-2d-best-v1", String(best)); } catch { /* no storage */ }
    }
  } else { game.combo = 0; $("game-message").textContent = "OUF! ESSAIE L'AUTRE MOUVEMENT!"; }
  updateGame();
};
document.querySelectorAll("[data-move]").forEach((b) => b.addEventListener("click", () => playMove(b.dataset.move)));
window.addEventListener("keydown", (e) => {
  if (!game.playing || e.repeat || ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
  if (["1", "2", "3"].includes(e.key)) playMove(MOVES[Number(e.key) - 1]);
});
$("sound-toggle").addEventListener("click", () => {
  game.sound = !game.sound;
  $("sound-toggle").textContent = game.sound ? "♪ SON ON" : "♪ SON OFF";
  $("sound-toggle").setAttribute("aria-pressed", String(game.sound));
});
window.addEventListener("pagehide", () => {
  if (game.timer !== null) window.clearInterval(game.timer);
  if (game.audio) void game.audio.close().catch(() => undefined);
});
updateGame();

// Owned advertisements and approved affiliate spots, gated by human-provided tracking IDs.
// No external advertising scripts, ad-network pixels or arbitrary user supplied redirects.
async function initPartnerPlacements() {
  try {
    const response = await fetch("/owner-placements.json", { cache: "no-cache" });
    if (!response.ok) return;
    const data = normalizePlacements(await response.json());
    const ownerRoot = $("owner-promos");
    for (const item of data.campaigns) {
      const card = el("a", "promo-card owner-ad-card");
      card.href = item.url; card.target="_blank"; card.rel="noopener noreferrer sponsored nofollow";
      card.append(el("span", "promo-disclosure", "PUBLICITÉ • PARTENAIRE"));
      card.append(el("strong", "", item.title));
      card.append(el("small", "", item.description));
      card.append(el("b", "", "DÉCOUVRIR ↗"));
      ownerRoot?.append(card);
    }
    const root = $("live-partner-grid");
    for (const item of data.partnerOffers) {
      const card = el("article", "live-partner-card");
      card.append(el("span", "promo-disclosure", item.disclosure));
      card.append(el("h3", "", item.title));
      card.append(el("p", "", item.description));
      const link=el("a", "button button-hot", "DÉCOUVRIR LE PARTENAIRE ↗");
      link.href=item.url;link.target="_blank";link.rel="noopener noreferrer sponsored nofollow";
      card.append(link);root?.append(card);
    }
    if (data.partnerOffers.length > 0) {
      $("live-partner-state").textContent="Des offres partenaires vérifiées sont affichées. Les lecteurs live intégrés et les appels privés nécessitent encore une connexion approuvée.";
    }
  } catch { /* No network or valid config: no ads, no errors, no costs. */ }
}
void initPartnerPlacements();

const menuToggle = $("mobile-menu-toggle");
const mobileMenu = $("mobile-menu");
menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  mobileMenu.hidden = !open;
});
mobileMenu?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  mobileMenu.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Ouvrir le menu");
}));

// Netlify Forms parses final deployed HTML. These forms are inactive until detection is enabled
// in Netlify and the version containing their markup is deployed.
for (const [formId, statusId] of [["sponsor-form", "sponsor-status"], ["report-form", "report-status"], ["vip-form", "vip-status"], ["creator-form", "creator-status"]]) {
  $(formId)?.addEventListener("submit", async event => {
    event.preventDefault();
    const form=event.currentTarget, status=$(statusId);
    if (!form.reportValidity()) return;
    const button=form.querySelector('button[type="submit"]');
    if (button) button.disabled=true;
    status.textContent="Transmission en cours…";
    try {
      const body = new URLSearchParams(new FormData(form));
      const response = await fetch("/", {
        method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body:body.toString()
      });
      if (!response.ok) throw new Error("Form submission not acknowledged");
      form.reset();
      status.textContent="Demande reçue par Netlify. Merci!";
    } catch {
      status.textContent="Envoi impossible pour l’instant. Réessaie plus tard.";
    } finally { if (button) button.disabled=false; }
  });
}
