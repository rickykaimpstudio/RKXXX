// Keep Netlify Functions source, CI, and admin files OUT of public assets.
import {mkdir,copyFile,rm} from 'node:fs/promises';
const files = [
  'index.html','styles.css','app.mjs','premium-tools.mjs','adult-provider.mjs',
  'affiliate-utils.mjs','embed-utils.mjs','moderation-policy.mjs',
  'partner-embeds.mjs','confidentialite.html','regles-et-moderation.html',
  'catalog.json','owner-placements.json','promos.json','_headers'
];
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const file of files) await copyFile(file,'dist/'+file);
console.log('After Dark: '+files.length+' fichiers publics préparés; fonctions exclues.');
