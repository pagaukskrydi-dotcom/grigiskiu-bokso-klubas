// Visi lankytojai nukreipiami į pagrindinį adresą, kad Google matytų vieną svetainės versiją.
const MAIN = 'grigiskiuboksoklubas.lt';
const ALIASES = ['www.grigiskiuboksoklubas.lt', 'grigiskiu-bokso-klubas.pages.dev'];

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (ALIASES.includes(url.hostname) && (request.method === 'GET' || request.method === 'HEAD')) {
    url.hostname = MAIN;
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
