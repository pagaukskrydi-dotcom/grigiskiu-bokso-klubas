import { handle, json, readJson, HttpError, getUsers, verifyPassword, createSession, normEmail, requireAppHeader, checkRateLimit, publicUser } from '../../../lib/server.js';

export const onRequestPost = handle(async ({ env, request }) => {
  requireAppHeader(request);
  await checkRateLimit(env, request, 'login');
  const body = await readJson(request);
  const email = normEmail(body.email);
  const users = await getUsers(env);
  const user = users.find(u => u.email === email);
  if (!user || !(await verifyPassword(String(body.password || ''), user))) {
    throw new HttpError(401, 'Neteisingas el. paštas arba slaptažodis.');
  }
  const cookie = await createSession(env, email);
  return json({ user: publicUser(user) }, 200, { 'set-cookie': cookie });
});
