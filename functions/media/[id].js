import { kv } from '../../lib/server.js';

export async function onRequestGet({ params, env }) {
  const id = String(params.id || '');
  if (!/^[a-z0-9-]{8,80}$/.test(id)) return new Response('Nerasta', { status: 404 });
  const { value, metadata } = await kv(env).getWithMetadata('img:' + id, 'arrayBuffer');
  if (!value) return new Response('Nerasta', { status: 404 });
  return new Response(value, {
    headers: {
      'content-type': (metadata && metadata.type) || 'image/jpeg',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  });
}
