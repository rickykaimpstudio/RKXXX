import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app=readFileSync('app.mjs','utf8');
const html=readFileSync('index.html','utf8');
const css=readFileSync('styles.css','utf8');

test('le catalogue se charge juste après confirmation 18+ ou si l’âge est déjà validé',()=>{
  assert.match(app,/if \(state\.ageConfirmed\) void loadFeed\(false\)/);
  assert.match(app,/fetch\('\/catalog\.json'/);
  assert.match(app,/shownSnapshot && incoming\.length/);
  assert.match(app,/document\.body\.classList\.toggle\('age-locked', !state\.ageConfirmed\)/);
});
test('la confirmation 18+ est retenue, pas répétée dans le lecteur',()=>{
  assert.match(app,/AGE_CONSENT_KEY/);
  assert.match(app,/localStorage\.setItem\(AGE_CONSENT_KEY,String\(Date\.now\(\)\)\)/);
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

test('un avis 18+ avec date de naissance est visible avant le site',()=>{
  assert.match(html, /<form id="age-form"/);
  assert.match(html, /id="birthdate"[^>]*type="date"/);
  assert.match(html, /id="age-error"/);
  assert.match(css, /body\.age-locked \.app \{visibility:hidden\}/);
  assert.match(app, /if \(years < 18\)/);
  assert.match(app, /dobInput\.value=''/);
  assert.doesNotMatch(app, /localStorage\.setItem\([^)]*,[^)]*dobInput/);
});
