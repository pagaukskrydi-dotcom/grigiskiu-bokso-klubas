import { handle, json, readJson, HttpError, getUsers, saveUsers, hashPassword, createSession, normEmail, validEmail, checkPasswordStrength, requireAppHeader, publicUser } from '../../../lib/server.js';

// Pirmoji paskyra (savininkas). Veikia tik tol, kol nėra nė vieno vartotojo.
export const onRequestPost = handle(async ({ env, request }) => {
  requireAppHeader(request);
  const users = await getUsers(env);
  if (users.length) throw new HttpError(403, 'Savininko paskyra jau sukurta. Prisijunkite.');
  const body = await readJson(request);
  const email = normEmail(body.email);
  if (!validEmail(email)) throw new HttpError(400, 'Įveskite teisingą el. pašto adresą.');
  checkPasswordStrength(body.password);
  const user = { email, name: String(body.name || '').trim().slice(0, 60), role: 'owner', created: Date.now(), ...(await hashPassword(body.password)) };
  await saveUsers(env, [user]);
  const cookie = await createSession(env, email);
  return json({ user: publicUser(user) }, 200, { 'set-cookie': cookie });
});
