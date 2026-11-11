// After Dark premium catalog. No customer payment or provider invocation is enabled here.
// This public catalogue contains no API secrets, card details or entitlements.
export const PREMIUM_TOOLS = Object.freeze([
  { id:'avatar', symbol:'◈', label:'Avatar IA original', category:'Création', summary:'Créer des avatars fictifs adultes originaux, sans imitation ni nudification de personnes réelles.', tag:'Identité créative' },
  { id:'studio-video', symbol:'▶', label:'Studio vidéo IA', category:'Montage', summary:'Courtes créations et habillages vidéo, selon les droits et les conditions du fournisseur.', tag:'Vidéo avancée' },
  { id:'voice', symbol:'♫', label:'Voix studio', category:'Audio', summary:'Narrations et voix synthétiques avec autorisation du détenteur de voix.', tag:'FR-Québec / EN' },
  { id:'thumbnails', symbol:'▣', label:'Miniatures HD', category:'Graphisme', summary:'Visuels de couverture et bannières originales pour les créateurs majeurs.', tag:'Haute définition' },
  { id:'captions', symbol:'◎', label:'Sous-titres & langues', category:'Édition', summary:'Transcription, adaptation linguistique et sous-titrage de vidéos autorisées.', tag:'International' },
  { id:'creator-plus', symbol:'✦', label:'Espace créateur Plus', category:'Partenaires', summary:'Options premium de promotion et de mise en avant après validation des droits et des partenaires.', tag:'Partenariat vérifié' }
]);

export const CREDIT_MARKETPLACE_STATUS = Object.freeze({
  currency:'RK', active:false, paymentProvider:null, walletReady:false,
  providerCallsAllowed:false, publicPricesReady:false
});

export function getPremiumTool(id) {
  return PREMIUM_TOOLS.find(x=>x.id===id) ?? null;
}
export function canCallPaidProvider({paymentVerified=false,balance=null,toolCost=null,providerApproved=false,accountVerified=false}={}) {
  return CREDIT_MARKETPLACE_STATUS.active &&
    CREDIT_MARKETPLACE_STATUS.providerCallsAllowed &&
    paymentVerified === true && providerApproved === true && accountVerified === true &&
    Number.isSafeInteger(balance) && Number.isSafeInteger(toolCost) && toolCost>0 &&
    balance >= toolCost;
}
function node(tag,className='',content=''){
  const el=document.createElement(tag);
  if(className) el.className=className;
  if(content)el.textContent=content;
  return el;
}
export function mountPremiumMarketplace(){
  const grid=document.getElementById('premium-tools-grid');
  const dialog=document.getElementById('premium-dialog');
  const title=document.getElementById('premium-dialog-title');
  const message=document.getElementById('premium-dialog-copy');
  const cta=document.getElementById('premium-dialog-cta');
  if(!grid || !dialog || !title || !message || !cta) return;
  function show(name,description){
    title.textContent=name;
    message.textContent=description;
    if(typeof dialog.showModal==='function') dialog.showModal();
    else dialog.setAttribute('open','');
  }
  for(const tool of PREMIUM_TOOLS){
    const card=node('article','premium-tool-card');
    const top=node('div','premium-tool-top');
    top.append(node('span','premium-tool-symbol',tool.symbol),node('span','premium-tool-lock','🔒 CRÉDITS RK'));
    card.append(top,node('span','premium-tool-category',tool.category),node('h3','',tool.label),node('p','premium-tool-description',tool.summary));
    const footer=node('div','premium-tool-footer');
    footer.append(node('small','',tool.tag));
    const button=node('button','premium-tool-button','Voir le déblocage');
    button.type='button';
    button.addEventListener('click',()=>show(tool.label,
      'Cette fonction reste bloquée jusqu’à l’activation d’un prestataire de paiement acceptant les activités adultes, d’un compte vérifié et d’un solde RK réellement payé. Aucun coût ni essai payant ne sera lancé.'));
    footer.append(button);
    card.append(footer);grid.append(card);
  }
  document.querySelectorAll('[data-credit-plan]').forEach(button=>{
    button.addEventListener('click',()=>{
      show('Crédits RK — '+button.dataset.creditPlan,
      'Les packs sont présentés à titre indicatif. Les prix et les achats restent désactivés jusqu’à validation des frais du prestataire, du coût des API et des remboursements. Aucun paiement n’a été lancé.');
    });
  });
  document.getElementById('premium-dialog-close')?.addEventListener('click',()=>dialog.close());
  cta.addEventListener('click',()=>{dialog.close();document.getElementById('vip')?.scrollIntoView({behavior:'smooth'});});
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
}
