import { handle, json, HttpError, getUsers, saveUsers, normEmail, publicUser } from '../../../../lib/server.js';

export const onRequestDelete = handle(async ({ env, params, data }) => {
  if (data.user.role !== 'owner') throw new HttpError(403, 'Vartotojus gali šalinti tik savininkas.');
  const email = normEmail(decodeURIComponent(params.email || ''));
  if (email === data.user.email) throw new HttpError(400, 'Savęs pašalinti negalima.');
  const users = await getUsers(env);
  const next = users.filter(u => u.email !== email);
  if (next.length === users.length) throw new HttpError(404, 'Toks vartotojas nerastas.');
  await saveUsers(env, next);
  return json({ users: next.map(publicUser) });
});
