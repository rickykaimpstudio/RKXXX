import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// X-NIGHT QC uses an adult self-declaration, not a DOB form.
// Validate what is actually shipped without inventing a date verifier.
const app=readFileSync('app.mjs','utf8');
const html=readFileSync('index.html','utf8');
const css=readFileSync('xnight-refresh.css','utf8');

test('l’accès nécessite une déclaration 18+ avant de charger le catalogue',()=>{
  assert.match(html,/id="age-gate"/);
  assert.match(html,/id="age-form"/);
  assert.match(html,/J'AI 18 ANS OU PLUS · ENTRER/);
  assert.match(app,/app\.inert = !state\.ageConfirmed/);
  assert.match(app,/if \(state\.ageConfirmed\) void loadFeed\(false(?:,initialPage)?\)/);
});

test('la déclaration de majorité est mémorisée seulement pendant la session',()=>{
  assert.match(app,/sessionStorage\.getItem\(AGE_CONSENT_KEY\)/);
  assert.match(app,/sessionStorage\.setItem\(AGE_CONSENT_KEY, 'confirmed'\)/);
  assert.match(html,/uniquement pour cette session du navigateur/);
  assert.doesNotMatch(app,/localStorage\.setItem\(AGE_CONSENT_KEY/);
});

test('la validation masque réellement le portail et garde les vidéos sur le fournisseur',()=>{
  assert.match(app,/gate\.hidden = true/);
  assert.match(css,/#age-gate\[hidden\]\{display:none!important\}/);
  assert.match(app,/frame\.src=url\.href/);
  assert.doesNotMatch(html,/id="birthdate"/);
});
