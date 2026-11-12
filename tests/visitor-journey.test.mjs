import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app=readFileSync('app.mjs','utf8');
const html=readFileSync('index.html','utf8');
const refresh=readFileSync('xnight-refresh.css','utf8');

test('le catalogue se charge uniquement après confirmation de majorité',()=>{
  assert.match(app,/if \(state\.ageConfirmed\) void loadFeed\(false(?:,initialPage)?\)/);
  assert.match(app,/fetch\('\/catalog\.json'/);
  assert.match(app,/shownSnapshot && incoming\.length/);
  assert.match(app,/document\.body\.classList\.toggle\('age-locked', !state\.ageConfirmed\)/);
});

test('le portail 18+ se mémorise pour la session et disparaît après validation',()=>{
  assert.match(app,/AGE_CONSENT_KEY/);
  assert.match(app,/sessionStorage\.setItem\(AGE_CONSENT_KEY, 'confirmed'\)/);
  assert.match(app,/state\.ageConfirmed = true/);
  assert.match(app,/gate\.hidden = true/);
  assert.match(refresh,/#age-gate\[hidden\]\{display:none!important\}/);
  assert.doesNotMatch(html,/id="video-modal"[\s\S]*<input[^>]+type="checkbox"/);
});

test('une vignette lance directement le vrai lecteur du fournisseur',()=>{
  assert.match(app,/cover\.addEventListener\('click',\(\)=>openVideo\(v\)\)/);
  assert.match(app,/url\.searchParams\.set\('autoplay','1'\)/);
  assert.match(app,/url\.searchParams\.set\('muted','1'\)/);
  assert.match(app,/frame\.src=url\.href/);
});

test('les vidéos sont empilées en grand format, la lecture reste sur la page',()=>{
  assert.match(refresh,/\.video-grid\{[\s\S]*grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(refresh,/\.video-grid\[hidden\]\{display:none!important\}/);
  assert.match(refresh,/\.hero,\.stats-strip\{display:none!important\}/);
  assert.match(html,/id="viewer-frame"/);
});

test('le portail 18+ est présent, sans enregistrer de date de naissance',()=>{
  assert.match(html,/<form id="age-form"/);
  assert.match(html,/id="age-error"/);
  assert.match(html,/id="age-title"/);
  assert.match(html,/>J'AI 18 ANS OU PLUS · ENTRER</);
  assert.doesNotMatch(html,/id="birthdate"/);
  assert.doesNotMatch(app,/localStorage\.setItem\([^)]*,[^)]*dobInput/);
});
