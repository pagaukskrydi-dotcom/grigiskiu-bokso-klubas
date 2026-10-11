import { handle, HttpError, currentUser, requireAppHeader } from '../../../lib/server.js';

// Visi /api/admin/* adresai pasiekiami tik prisijungus.
export const onRequest = handle(async context => {
  requireAppHeader(context.request);
  const user = await currentUser(context.env, context.request);
  if (!user) throw new HttpError(401, 'Prisijunkite iš naujo.');
  context.data.user = user;
  return context.next();
});
