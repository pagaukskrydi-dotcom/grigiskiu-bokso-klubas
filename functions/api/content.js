import { handle, json, getContent } from '../../lib/server.js';

export const onRequestGet = handle(async ({ env }) => {
  const content = await getContent(env);
  return json(content, 200, { 'cache-control': 'public, max-age=15' });
});
