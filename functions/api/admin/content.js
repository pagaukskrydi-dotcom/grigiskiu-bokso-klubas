import { handle, json, readJson, kv, normalizeContent, getContent } from '../../../lib/server.js';

export const onRequestGet = handle(async ({ env }) => json(await getContent(env)));

export const onRequestPut = handle(async ({ env, request, data }) => {
  const body = await readJson(request);
  const content = normalizeContent(body);
  await kv(env).put('content', JSON.stringify(content));
  await kv(env).put('content:updated', JSON.stringify({ at: Date.now(), by: data.user.email }));
  return json(content);
});
