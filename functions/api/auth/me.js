import { handle, json, currentUser, getUsers, publicUser } from '../../../lib/server.js';

export const onRequestGet = handle(async ({ env, request }) => {
  const users = await getUsers(env);
  if (!users.length) return json({ user: null, needsSetup: true });
  const user = await currentUser(env, request);
  return json({ user: user ? publicUser(user) : null, needsSetup: false });
});
