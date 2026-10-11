import { DEFAULT_CONTENT, CATEGORIES, SESSION_TYPES } from './defaults.js';

// KV saugykla turi būti prijungta Cloudflare Pages nustatymuose pavadinimu GBK.
export function kv(env) {
  if (!env.GBK) throw new HttpError(500, 'Nepavyko pasiekti saugyklos. Patikrinkite, ar Cloudflare prijungta KV saugykla „GBK“.');
  return env.GBK;
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
  });
}

export function handle(fn) {
  return async context => {
    try {
      return await fn(context);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: 'Įvyko serverio klaida. Pabandykite dar kartą.' }, 500);
    }
  };
}

export async function readJson(request) {
  try { return await request.json(); } catch { throw new HttpError(400, 'Neteisingi duomenys.'); }
}

// ---------- Turinys ----------
export async function getContent(env) {
  const stored = await kv(env).get('content', 'json');
  return normalizeContent(stored || DEFAULT_CONTENT);
}

const str = (v, max = 600) => (v == null ? '' : String(v)).trim().slice(0, max);
const arr = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const safeUrl = v => {
  const s = str(v, 400);
  return /^https:\/\//i.test(s) ? s : '';
};
const mediaPath = v => {
  const s = str(v, 300);
  return /^\/(media|assets)\/[A-Za-z0-9._\-/]+$/.test(s) ? s : '';
};

export function normalizeContent(c) {
  const d = DEFAULT_CONTENT;
  c = c && typeof c === 'object' ? c : {};
  const hero = c.hero || {};
  const sched = c.schedule || {};
  const about = c.about || {};
  const contacts = c.contacts || {};
  const posters = c.posters || {};
  return {
    version: 1,
    hero: {
      motto: arr(hero.motto ?? d.hero.motto, 4).map(s => str(s, 120)).filter(Boolean),
      description: arr(hero.description ?? d.hero.description, 6).map(s => str(s, 160)).filter(Boolean),
      season: str(hero.season ?? d.hero.season, 60)
    },
    groups: arr(c.groups ?? d.groups, 12).map(g => ({
      age: str(g && g.age, 60),
      title: str(g && g.title, 80),
      description: str(g && g.description, 600),
      hours: arr(g && g.hours, 6).map(h => ({ label: str(h && h.label, 80), value: str(h && h.value, 40) }))
    })).filter(g => g.title),
    schedule: {
      season: str(sched.season ?? d.schedule.season, 30),
      place: str(sched.place ?? d.schedule.place, 80),
      address: str(sched.address ?? d.schedule.address, 120),
      note: str(sched.note ?? d.schedule.note, 300),
      days: arr(sched.days ?? d.schedule.days, 7).map(day => ({
        name: str(day && day.name, 30),
        sessions: arr(day && day.sessions, 8).map(s => ({
          time: str(s && s.time, 30),
          title: str(s && s.title, 80),
          note: str(s && s.note, 120),
          type: SESSION_TYPES.includes(s && s.type) ? s.type : 'kids'
        })).filter(s => s.time || s.title)
      })).filter(day => day.name)
    },
    about: {
      founded: str(about.founded ?? d.about.founded, 10),
      paragraphs: arr(about.paragraphs ?? d.about.paragraphs, 6).map(p => str(p, 1500)).filter(Boolean)
    },
    contacts: {
      phone: str(contacts.phone ?? d.contacts.phone, 40),
      email: str(contacts.email ?? d.contacts.email, 120),
      place: str(contacts.place ?? d.contacts.place, 80),
      address: str(contacts.address ?? d.contacts.address, 160),
      facebook: safeUrl(contacts.facebook ?? d.contacts.facebook),
      instagram: safeUrl(contacts.instagram ?? d.contacts.instagram)
    },
    posters: {
      schedule: mediaPath(posters.schedule ?? d.posters.schedule),
      fitboxing: mediaPath(posters.fitboxing ?? d.posters.fitboxing)
    },
    gallery: arr(c.gallery ?? d.gallery, 1000).map(p => ({
      id: str(p && p.id, 40),
      src: mediaPath(p && p.src),
      thumb: mediaPath(p && p.thumb),
      caption: str(p && p.caption, 200),
      category: CATEGORIES.includes(p && p.category) ? p.category : ''
    })).filter(p => p.id && p.src)
  };
}

// ---------- Vartotojai ir prisijungimas ----------
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 dienų
const enc = new TextEncoder();
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const fromHex = hex => new Uint8Array(hex.match(/.{2}/g).map(h => parseInt(h, 16)));

export function randomToken(bytes = 32) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return toHex(a);
}

export async function hashPassword(password, saltHex = randomToken(16)) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromHex(saltHex), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return { salt: saltHex, hash: toHex(bits) };
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password, user) {
  const { hash } = await hashPassword(password, user.salt);
  return safeEqual(hash, user.hash);
}

export const normEmail = e => str(e, 120).toLowerCase();
export const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function getUsers(env) {
  return (await kv(env).get('users', 'json')) || [];
}
export async function saveUsers(env, users) {
  await kv(env).put('users', JSON.stringify(users));
}
export const publicUser = u => ({ email: u.email, name: u.name || '', role: u.role });

export function checkPasswordStrength(password) {
  if (typeof password !== 'string' || password.length < 8) throw new HttpError(400, 'Slaptažodis turi būti bent 8 simbolių.');
  if (password.length > 200) throw new HttpError(400, 'Slaptažodis per ilgas.');
}

function cookieValue(request, name) {
  const header = request.headers.get('cookie') || '';
  const m = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : '';
}

export async function createSession(env, email) {
  const token = randomToken();
  await kv(env).put('sess:' + token, JSON.stringify({ email, created: Date.now() }), { expirationTtl: SESSION_TTL });
  return `gbk_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}`;
}

export async function destroySession(env, request) {
  const token = cookieValue(request, 'gbk_session');
  if (/^[a-f0-9]{64}$/.test(token)) await kv(env).delete('sess:' + token);
  return 'gbk_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

export async function currentUser(env, request) {
  const token = cookieValue(request, 'gbk_session');
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await kv(env).get('sess:' + token, 'json');
  if (!session) return null;
  const users = await getUsers(env);
  return users.find(u => u.email === session.email) || null;
}

// Apsauga nuo užklausų iš kitų svetainių: keičiančios užklausos turi turėti šią antraštę.
export function requireAppHeader(request) {
  if (request.method !== 'GET' && request.headers.get('x-gbk') !== '1') throw new HttpError(403, 'Užklausa atmesta.');
}

// Paprastas apribojimas bandymams prisijungti.
export async function checkRateLimit(env, request, key) {
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const k = `rl:${key}:${ip}`;
  const count = parseInt((await kv(env).get(k)) || '0', 10);
  if (count >= 10) throw new HttpError(429, 'Per daug bandymų. Palaukite 15 minučių ir bandykite vėl.');
  await kv(env).put(k, String(count + 1), { expirationTtl: 900 });
}
