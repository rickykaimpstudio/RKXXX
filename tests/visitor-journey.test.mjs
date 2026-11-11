import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app=readFileSync('app.mjs','utf8');
const html=readFileSync('index.html','utf8');
const css=readFileSync('styles.css','utf8');

test('le catalogue se charge immédiatement sans attendre le bouton 18+',()=>{
  assert.match(app,/void loadFeed\(false\)/);
  assert.match(app,/fetch\('\/catalog\.json'/);
  assert.match(app,/shownSnapshot && incoming\.length/);
});
test('la confirmation 18+ est retenue, pas répétée dans le lecteur',()=>{
  assert.match(app,/AGE_CONSENT_KEY/);
  assert.match(app,/localStorage\.setItem\(AGE_CONSENT_KEY,'yes'\)/);
  assert.match(app,/state\.ageConfirmed=true/);
  assert.match(app,/function openVideo\(v\)/);
  assert.doesNotMatch(html,/id="video-modal"[\s\S]*<input[^>]+type="checkbox"/);
});
test('une vignette lance directement le vrai lecteur du fournisseur',()=>{
  assert.match(app,/cover\.addEventListener\('click',\(\)=>openVideo\(v\)\)/);
  assert.match(app,/url\.searchParams\.set\('autoplay','1'\)/);
  assert.match(app,/url\.searchParams\.set\('muted','1'\)/);
  assert.match(app,/frame\.src=url\.href/);
});
test('l’accueil favorise les miniatures et garde la lecture sur la page',()=>{
  assert.match(css,/\.hero,\.stats-strip \{display:none!important\}/);
  assert.match(css,/\.videos-section \.video-grid \{grid-template-columns:repeat\(5/);
  assert.match(css,/@media \(max-width:700px\)[\s\S]*\.videos-section \.video-grid \{grid-template-columns:repeat\(2/);
  assert.match(html,/id="viewer-frame"/);
});
