// Public account capability status, not a wallet ledger or an authenticated balance.
export default async function creditStatus(request){
  if(request.method!=='GET')return Response.json({error:'method_not_allowed'},{status:405});
  return Response.json({
    currency:'RK',publicCheckoutEnabled:false,creditWalletEnabled:false,
    accountBalance:null,premiumCallsEnabled:false,processor:'not_configured',
    message:'Achats et crédits en préparation : aucun paiement activé.'
  },{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
export const config={path:'/api/premium/status',method:'GET'};
