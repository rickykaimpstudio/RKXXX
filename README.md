# X-NIGHT QC · After Dark 18+

Site pour adultes distinct du site principal Ricky Kaimp Studio.

**Code source officiel :** https://github.com/rickykaimpstudio/RKXXX

**Ancienne adresse de production (Netlify, maintenue jusqu'à la migration) :** https://x-nightqc.netlify.app/

## Publication sans dépenses Netlify

La branche `main` contient le code à jour. Le workflow GitHub Actions de publication automatique vers Netlify a été désactivé pour éviter d'épuiser davantage de crédits. Il reste uniquement déclenchable manuellement par le propriétaire pour un éventuel retour en arrière.

Le fichier `render.yaml` prépare un hébergement indépendant sur Render, avec les fichiers publics compilés par `node tools/prepare-public.mjs` et l'API de catalogue servie par `render-server.mjs`. Un nouveau site Render **n'est pas encore créé ni connecté** à ce dépôt : modifier GitHub seul ne met donc pas encore à jour le site public.

**Avant une migration :** vérifier les conditions du nouveau fournisseur pour les contenus adultes, connecter ce dépôt au nouvel hébergement et tester sur son URL de préproduction les aperçus, les lecteurs, la page 18+ et les API. Garder l'ancien site accessible jusqu'à la validation. Le nom de domaine Netlify appartient à Netlify et ne peut pas être déplacé tel quel.

Les aperçus et les lecteurs restent fournis par les partenaires; aucun fichier vidéo n'est réhébergé sans licence. Une déclaration 18+ ne remplace pas une vérification d'âge si celle-ci est légalement exigée.

**Ce dépôt ne contient pas le code du site Lovable principal.**
