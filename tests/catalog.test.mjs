import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanProviderResult} from '../adult-provider.mjs';
import handler from '../netlify/functions/catalog.mjs';

const video = {
  id: 3579910,
  title: 'Vidéo de démonstration — titre non explicite',
  thumbnail: 'https://adultembed.com/media/thumbnails/webp/pz-3579910.webp',
  duration_seconds: 2382
};
test('les fiches valides ont une miniature et un lecteur', () => {
  const videos = cleanProviderResult({results:[video]});
  assert.equal(videos.length,1);
  assert.equal(videos[0].thumbnail,video.thumbnail);
  assert.equal(videos[0].player,'https://adultembed.com/player/embed/3579910/');
});
test('les miniatures absentes ne retirent pas les fiches lisibles', () => {
  const videos = cleanProviderResult({results:[{...video,thumbnail:null}]});
  assert.equal(videos.length,1);
  assert.equal(videos[0].thumbnail,null);
});
test('le service Netlify retourne les fiches du fournisseur',async () => {
  const previous = globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({count:2,next:null,results:[video]}),{status:200});
  try {
    const response=await handler(new Request('https://example.net/api/catalog?page=1'));
    const data=await response.json();
    assert.equal(response.status,200);
    assert.equal(data.results.length,1);
    assert.equal(data.results[0].id,3579910);
  } finally {globalThis.fetch=previous;}
});
test('le service essaie v1 si browse est indisponible',async () => {
  const previous = globalThis.fetch;
  let n=0;
  globalThis.fetch=async()=> {
    n++;
    return n===1 ? new Response('{}',{status:500}) :
      new Response(JSON.stringify({count:1,results:[video],next:null}),{status:200});
  };
  try{
    const response=await handler(new Request('https://example.net/api/catalog'));
    const data=await response.json();
    assert.equal(response.status,200);
    assert.equal(data.version,'v1');
    assert.equal(data.results.length,1);
    assert.equal(n,2);
  } finally {globalThis.fetch=previous;}
});
