// Fail-closed premium API entry point.
// NEVER call an external paid API unless a verified adult-compatible payment,
// authenticated account, durable wallet, atomic debit and approved provider exist.
const result=(body,status)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default async function premiumExecute(request){
  if(request.method!=='POST')return result({error:'method_not_allowed'},405);
  return result({
    status:'locked',code:'PAID_SERVICES_NOT_ACTIVATED',
    message:'Aucun paiement vérifié ni fournisseur approuvé. Aucun appel API payant exécuté.'
  },423);
}
export const config={path:'/api/premium/execute',method:['GET','POST']};
