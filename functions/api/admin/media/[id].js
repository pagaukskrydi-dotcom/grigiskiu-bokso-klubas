import { handle, json, HttpError, kv } from '../../../../lib/server.js';

export const onRequestDelete = handle(async ({ env, params }) => {
  const id = String(params.id || '');
  if (!/^[a-z0-9-]{8,80}$/.test(id)) throw new HttpError(400, 'Neteisingas nuotraukos adresas.');
  await kv(env).delete('img:' + id);
  await kv(env).delete('img:' + id + '-t');
  return json({ ok: true });
});
