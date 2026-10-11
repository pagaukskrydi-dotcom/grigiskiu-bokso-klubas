import { handle, json, readJson, HttpError, getUsers, saveUsers, hashPassword, verifyPassword, checkPasswordStrength } from '../../../lib/server.js';

export const onRequestPost = handle(async ({ env, request, data }) => {
  const body = await readJson(request);
  if (!(await verifyPassword(String(body.current || ''), data.user))) throw new HttpError(400, 'Dabartinis slaptažodis neteisingas.');
  checkPasswordStrength(body.password);
  const users = await getUsers(env);
  const user = users.find(u => u.email === data.user.email);
  Object.assign(user, await hashPassword(body.password));
  await saveUsers(env, users);
  return json({ ok: true });
});
