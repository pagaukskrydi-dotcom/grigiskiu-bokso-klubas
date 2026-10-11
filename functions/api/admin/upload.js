import { handle, json, HttpError, kv, randomToken } from '../../../lib/server.js';

const MAX = 8 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Priima nuotrauką (ir sumažintą jos versiją), išsaugo KV ir grąžina adresus.
export const onRequestPost = handle(async ({ env, request }) => {
  const form = await request.formData().catch(() => null);
  if (!form) throw new HttpError(400, 'Nepavyko perskaityti nuotraukos.');
  const full = form.get('full');
  const thumb = form.get('thumb');
  if (!full || typeof full === 'string') throw new HttpError(400, 'Nepasirinkta nuotrauka.');
  const id = `${Date.now().toString(36)}-${randomToken(6)}`;
  const store = async (file, key) => {
    if (!TYPES.includes(file.type)) throw new HttpError(400, 'Galima įkelti tik JPG, PNG arba WEBP nuotraukas.');
    if (file.size > MAX) throw new HttpError(400, 'Nuotrauka per didelė (daugiausia 8 MB).');
    await kv(env).put('img:' + key, await file.arrayBuffer(), { metadata: { type: file.type } });
  };
  await store(full, id);
  let thumbPath = '';
  if (thumb && typeof thumb !== 'string') {
    await store(thumb, id + '-t');
    thumbPath = `/media/${id}-t`;
  }
  return json({ id, src: `/media/${id}`, thumb: thumbPath });
});
