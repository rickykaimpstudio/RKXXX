// Safety-first internal margin model inspired by the main Studio's existing logic.
// The files under tools/ are not shipped with the public website.
export const MIN_MARGIN = 0.35;
const finite=(n)=>typeof n==='number' && Number.isFinite(n)&&n>=0;
export function calculateMinimumPriceCad({
  providerCostUsd=null,fxUsdToCad=null,pspRate=null,pspFixedCad=null,
  reserveRate=null,refundAllowanceRate=null,overheadCad=0,margin=MIN_MARGIN
}={}){
  if(!finite(providerCostUsd)||providerCostUsd<=0)return {ok:false,reason:'provider_cost_unknown'};
  if(!finite(fxUsdToCad)||fxUsdToCad<=0)return {ok:false,reason:'fx_unknown'};
  if(!finite(pspRate)||!finite(pspFixedCad))return {ok:false,reason:'processor_cost_unknown'};
  if(!finite(reserveRate)||!finite(refundAllowanceRate)||!finite(overheadCad))return {ok:false,reason:'operating_cost_unknown'};
  if(!finite(margin)||margin<MIN_MARGIN||margin>=1)return {ok:false,reason:'margin_below_minimum'};
  const share=1-pspRate-reserveRate-refundAllowanceRate-margin;
  if(share<=0)return {ok:false,reason:'fees_exceed_revenue'};
  const costCad=providerCostUsd*fxUsdToCad+overheadCad;
  const raw=(costCad+pspFixedCad)/share;
  if(!Number.isFinite(raw)||raw>1_000_000)return {ok:false,reason:'value_out_of_range'};
  const priceCents=Math.ceil(raw*100-1e-8);
  if(!Number.isSafeInteger(priceCents)||priceCents<1)return {ok:false,reason:'value_out_of_range'};
  const priceCad=priceCents/100;
  const net=priceCad*(1-pspRate-reserveRate-refundAllowanceRate)-pspFixedCad;
  const contributionCad=net-costCad;
  return {ok:true,priceCad,costCad,contributionCad:Number(contributionCad.toFixed(2)),margin:contributionCad/priceCad,
    note:'simulation_only_no_guaranteed_profit'};
}
