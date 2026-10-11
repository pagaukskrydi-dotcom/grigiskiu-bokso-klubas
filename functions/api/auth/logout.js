import { handle, json, destroySession } from '../../../lib/server.js';

export const onRequestPost = handle(async ({ env, request }) => {
  const cookie = await destroySession(env, request);
  return json({ ok: true }, 200, { 'set-cookie': cookie });
});
