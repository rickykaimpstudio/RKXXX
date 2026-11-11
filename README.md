# AFTER DARK · Déploiement propre

[![Déployer After Dark sur Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/rickykaimpstudio/RKXXX)

**Un clic pour créer un nouveau site Netlify depuis les fichiers GitHub.** Cette méthode est distincte de l'ancien site créé par glisser-déposer, et ne modifie pas Ricky Kaimp Studio ni son dépôt principal.

La configuration `netlify.toml` construit le dossier `dist` et publie une fonction serveur `/api/catalog`. Si le fournisseur est inaccessible, le navigateur lit `catalog.json`, une sélection de fiches officielles conservées en secours.

**Important :** le bouton crée un **nouveau site Netlify**, il ne remplace pas automatiquement le domaine existant. Le fournisseur vidéo conserve l'hébergement et le contrôle de la lecture. Les vidéos ne sont pas copiées sur le serveur.

Dépôt du site : https://github.com/rickykaimpstudio/RKXXX
