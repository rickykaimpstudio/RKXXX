import test from 'node:test';
import assert from 'node:assert/strict';
import {PREMIUM_TOOLS,CREDIT_MARKETPLACE_STATUS,canCallPaidProvider,getPremiumTool} from '../premium-tools.mjs';
import {calculateMinimumPriceCad,MIN_MARGIN} from '../tools/adult-pricing.mjs';
import execute from '../netlify/functions/premium-execute.mjs';
import status from '../netlify/functions/premium-status.mjs';

test('aucun outil payant ne s’exécute, même si le navigateur prétend avoir payé',()=>{
  assert.equal(CREDIT_MARKETPLACE_STATUS.active,false);
  assert.equal(canCallPaidProvider({balance:50000,toolCost:1,providerApproved:true,accountVerified:true,paymentVerified:true}),false);
  assert.equal(canCallPaidProvider({balance:0,toolCost:1}),false);
  assert.equal(PREMIUM_TOOLS.length,6);
  assert.equal(getPremiumTool('missing'),null);
});
test('l’API bloque réellement toute exécution non autorisée',async()=>{
  const res=await execute(new Request('https://rk.example/api/premium/execute',{method:'POST',body:JSON.stringify({tool:'avatar',credits:999999})}));
  assert.equal(res.status,423);
  assert.equal((await res.json()).code,'PAID_SERVICES_NOT_ACTIVATED');
});
test('aucun faux solde ni paiement actif n’est présenté par le serveur',async()=>{
  const res=await status(new Request('https://rk.example/api/premium/status'));
  assert.equal(res.status,200);
  const data=await res.json();
  assert.equal(data.accountBalance,null);
  assert.equal(data.premiumCallsEnabled,false);
  assert.equal(data.publicCheckoutEnabled,false);
});
test('le simulateur refuse les coûts inconnus et empêche les ventes à marge insuffisante',()=>{
  assert.equal(calculateMinimumPriceCad({}).ok,false);
  assert.equal(calculateMinimumPriceCad({
    providerCostUsd:2,fxUsdToCad:1.4,pspRate:0.1,pspFixedCad:0.35,reserveRate:0.05,
    refundAllowanceRate:0.03,overheadCad:0.4,margin:0.2
  }).ok,false);
  const good=calculateMinimumPriceCad({
    providerCostUsd:2,fxUsdToCad:1.4,pspRate:0.1,pspFixedCad:0.35,reserveRate:0.05,
    refundAllowanceRate:0.03,overheadCad:0.4,margin:MIN_MARGIN
  });
  assert.equal(good.ok,true);
  assert.ok(good.margin>=MIN_MARGIN-1e-4);
  assert.ok(good.priceCad>good.costCad);
});
test('les frais excessifs empêchent de publier un prix',()=>{
  const r=calculateMinimumPriceCad({providerCostUsd:1,fxUsdToCad:1.2,pspRate:0.6,
    pspFixedCad:1,reserveRate:0.1,refundAllowanceRate:0.1,margin:0.35});
  assert.equal(r.ok,false);
});
