import { handle, json, readJson, HttpError, getUsers, saveUsers, hashPassword, normEmail, validEmail, checkPasswordStrength, publicUser } from '../../../lib/server.js';

export const onRequestGet = handle(async ({ env }) => {
  const users = await getUsers(env);
  return json({ users: users.map(publicUser) });
});

// Naują vartotoją gali pridėti tik savininkas.
export const onRequestPost = handle(async ({ env, request, data }) => {
  if (data.user.role !== 'owner') throw new HttpError(403, 'Vartotojus gali pridėti tik savininkas.');
  const body = await readJson(request);
  const email = normEmail(body.email);
  if (!validEmail(email)) throw new HttpError(400, 'Įveskite teisingą el. pašto adresą.');
  checkPasswordStrength(body.password);
  const users = await getUsers(env);
  if (users.some(u => u.email === email)) throw new HttpError(400, 'Toks vartotojas jau yra.');
  const role = body.role === 'owner' ? 'owner' : 'editor';
  users.push({ email, name: String(body.name || '').trim().slice(0, 60), role, created: Date.now(), ...(await hashPassword(body.password)) });
  await saveUsers(env, users);
  return json({ users: users.map(publicUser) });
});
