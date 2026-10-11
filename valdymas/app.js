(() => {
  'use strict';

  const CATS = ['Treniruotės', 'Varžybos', 'Stovyklos', 'Renginiai', 'Laisvalaikis'];
  const TYPES = { kids: 'Vaikai (geltona)', youth: 'Jaunimas (šviesi)', women: 'Moterys (tamsi)' };
  const appEl = document.getElementById('app');
  const toastEl = document.getElementById('toast');

  let me = null;          // prisijungęs vartotojas
  let content = null;     // redaguojamas turinys
  let savedJson = '';     // paskutinis išsaugotas turinys
  let pendingDeletes = []; // nuotraukos, kurias reikia ištrinti po išsaugojimo
  let installPrompt = null;

  // ---------- Ikonos ----------
  const ICONS = {
    back: '<path d="M15 6l-6 6 6 6"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    text: '<path d="M4 6h16M4 12h10M4 18h14"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    poster: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>'
  };
  const icon = name => {
    const span = document.createElement('span');
    span.style.display = 'contents';
    span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
    return span.firstChild;
  };

  // ---------- DOM pagalba ----------
  function h(tag, props, ...children) {
    const node = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
        else if (k === 'value') node.value = v;
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }

  function toast(message, bad = false) {
    toastEl.textContent = message;
    toastEl.classList.toggle('bad', bad);
    toastEl.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { toastEl.hidden = true; }, bad ? 4500 : 2200);
  }

  async function api(method, path, body, isForm = false) {
    const opts = { method, credentials: 'same-origin', headers: { 'x-gbk': '1' } };
    if (body !== undefined) {
      if (isForm) opts.body = body;
      else { opts.body = JSON.stringify(body); opts.headers['content-type'] = 'application/json'; }
    }
    let res;
    try { res = await fetch(path, opts); } catch { throw new Error('Nėra interneto ryšio. Patikrinkite ryšį ir bandykite vėl.'); }
    let data = {};
    try { data = await res.json(); } catch { /* tuščias atsakymas */ }
    if (res.status === 401 && path.startsWith('/api/admin')) { me = null; render(); }
    if (!res.ok) throw new Error(data.error || 'Įvyko klaida. Bandykite dar kartą.');
    return data;
  }

  const clone = v => JSON.parse(JSON.stringify(v));
  const isDirty = () => content && JSON.stringify(content) !== savedJson;
  function move(list, i, d) {
    const j = i + d;
    if (j < 0 || j >= list.length) return false;
    [list[i], list[j]] = [list[j], list[i]];
    return true;
  }

  // ---------- Laukai ----------
  function field(label, value, onChange, opts = {}) {
    const id = 'f' + Math.random().toString(36).slice(2, 9);
    let control;
    if (opts.options) {
      control = h('select', { id }, Object.entries(opts.options).map(([v, t]) => h('option', { value: v, text: t })));
      control.value = value || '';
      control.addEventListener('change', () => { onChange(control.value); changed(); });
    } else {
      control = h(opts.textarea ? 'textarea' : 'input', {
        id, type: opts.textarea ? null : (opts.type || 'text'), placeholder: opts.placeholder || null,
        autocomplete: opts.autocomplete || 'off', inputmode: opts.inputmode || null, rows: opts.rows || null
      });
      control.value = value || '';
      control.addEventListener('input', () => { onChange(control.value); changed(); });
    }
    return h('label', { class: 'field', for: id }, h('span', { text: label }), control, opts.hint ? h('small', { text: opts.hint }) : null);
  }
  const linesField = (label, list, onChange, hint) =>
    field(label, list.join('\n'), v => onChange(v.split('\n').map(s => s.trim()).filter(Boolean)), { textarea: true, rows: Math.max(3, list.length + 1), hint: hint || 'Kiekviena eilutė – atskiroje eilutėje.' });

  function changed() { updateSaveBar(); }

  // ---------- Išsaugojimas ----------
  let saveBarEl = null;
  function saveBar() {
    saveBarEl = h('div', { class: 'savebar' }, h('div', { class: 'savebar-in' },
      h('p'), h('button', { class: 'btn primary', type: 'button', onclick: () => save() }, 'Išsaugoti')));
    updateSaveBar();
    return saveBarEl;
  }
  function updateSaveBar() {
    if (!saveBarEl) return;
    const dirty = isDirty();
    saveBarEl.classList.toggle('dirty', dirty);
    saveBarEl.querySelector('p').textContent = dirty ? 'Yra neišsaugotų pakeitimų' : 'Visi pakeitimai išsaugoti';
    saveBarEl.querySelector('button').disabled = !dirty;
  }

  let saving = false;
  async function save(silent = false) {
    if (saving) return false;
    saving = true;
    const btn = saveBarEl && saveBarEl.querySelector('button');
    if (btn) { btn.disabled = true; btn.textContent = 'Saugoma…'; }
    try {
      const result = await api('PUT', '/api/admin/content', content);
      content = result;
      savedJson = JSON.stringify(content);
      const toDelete = pendingDeletes.splice(0);
      for (const id of toDelete) api('DELETE', '/api/admin/media/' + encodeURIComponent(id)).catch(() => {});
      if (!silent) toast('Išsaugota. Svetainėje pakeitimai matomi iškart.');
      return true;
    } catch (err) {
      toast(err.message, true);
      return false;
    } finally {
      saving = false;
      if (btn) btn.textContent = 'Išsaugoti';
      updateSaveBar();
    }
  }

  window.addEventListener('beforeunload', e => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- Nuotraukų sumažinimas ----------
  async function loadBitmap(file) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* senesnės naršyklės */ }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Nepavyko atidaryti nuotraukos. Pabandykite kitą failą.'));
      img.src = URL.createObjectURL(file);
    });
  }
  async function resize(source, max, quality) {
    const w = source.width, hgt = source.height;
    const scale = Math.min(1, max / Math.max(w, hgt));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(hgt * scale);
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
  }
  async function uploadImage(file, withThumb = true) {
    const bmp = await loadBitmap(file);
    const form = new FormData();
    form.append('full', await resize(bmp, 1800, 0.84), 'full.jpg');
    if (withThumb) form.append('thumb', await resize(bmp, 640, 0.8), 'thumb.jpg');
    return api('POST', '/api/admin/upload', form, true);
  }
  const mediaId = src => (src && src.startsWith('/media/') ? src.slice(7) : '');

  // ---------- Apatinis langas ----------
  function sheet(build) {
    const close = () => back.remove();
    const panel = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'grab' }));
    const back = h('div', { class: 'sheet-back', onclick: e => { if (e.target === back) close(); } }, panel);
    build(panel, close);
    document.body.appendChild(back);
    return close;
  }

  // ---------- Ekranai ----------
  function topBar(title, backTo = '#/') {
    const left = backTo
      ? h('a', { class: 'icon-btn', href: backTo, 'aria-label': 'Atgal' }, icon('back'))
      : h('img', { class: 'logo', src: '/valdymas/icon-192.png', alt: '' });
    const right = backTo ? null : h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Atsijungti', onclick: logout }, icon('logout'));
    return h('header', { class: 'top' }, left, h('h1', { text: title }), right);
  }

  async function logout() {
    if (isDirty() && !(await confirmLeave())) return;
    await api('POST', '/api/auth/logout').catch(() => {});
    me = null; content = null;
    location.hash = '#/';
    render();
  }

  function confirmLeave() {
    return new Promise(resolve => {
      sheet((panel, close) => {
        panel.append(
          h('h3', { text: 'Neišsaugoti pakeitimai' }),
          h('p', { class: 'hint', text: 'Turite pakeitimų, kurie dar neišsaugoti. Ką daryti?' }),
          h('div', { class: 'actions' },
            h('button', { class: 'btn primary', type: 'button', onclick: async () => { close(); resolve(await save()); } }, 'Išsaugoti'),
            h('button', { class: 'btn danger', type: 'button', onclick: () => { content = JSON.parse(savedJson); pendingDeletes = []; close(); resolve(true); } }, 'Atmesti pakeitimus'),
            h('button', { class: 'btn', type: 'button', onclick: () => { close(); resolve(false); } }, 'Grįžti')));
      });
    });
  }

  function screenHome() {
    const tile = (href, ic, title, sub) => h('a', { class: 'tile', href }, icon(ic), h('b', { text: title }), sub ? h('span', { text: sub }) : null);
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const nodes = [
      topBar('GBK valdymas', null),
      h('div', { class: 'hello' }, h('p', { text: 'Grigiškių bokso klubo svetainė' }), h('h2', { text: `Sveiki${me.name ? ', ' + me.name : ''}!` })),
      isDirty() ? h('div', { class: 'card', style: 'margin-bottom:12px;border-color:var(--yellow)' },
        h('p', { style: 'margin:0', text: 'Turite neišsaugotų pakeitimų.' }),
        h('button', { class: 'btn primary', type: 'button', onclick: async () => { if (await save()) render(); } }, 'Išsaugoti dabar')) : null,
      h('div', { class: 'tiles' },
        tile('#/galerija', 'photo', 'Galerija', `${content.gallery.length} nuotr.`),
        tile('#/tvarkarastis', 'calendar', 'Tvarkaraštis', 'Treniruočių laikas'),
        tile('#/treniruotes', 'list', 'Treniruotės', 'Grupės ir aprašymai'),
        tile('#/tekstai', 'text', 'Tekstai', 'Pradžia ir apie klubą'),
        tile('#/kontaktai', 'phone', 'Kontaktai', 'Telefonas, adresas'),
        tile('#/plakatai', 'poster', 'Plakatai', 'Sezono plakatai'),
        tile('#/vartotojai', 'users', 'Vartotojai', 'Kas gali tvarkyti'),
        tile('#/paskyra', 'key', 'Mano paskyra', 'Slaptažodis')),
      h('a', { class: 'site-link', href: '/', target: '_blank', rel: 'noopener' }, icon('external'), 'Atidaryti svetainę')
    ];
    if (!standalone) {
      nodes.push(h('div', { class: 'card', style: 'margin-top:14px' },
        h('p', { class: 'card-title', text: 'Programėlė telefone' }),
        h('p', { style: 'margin:0;font-size:.92rem', text: 'Įsidėkite šį puslapį į telefono pradžios ekraną – atsidarys kaip programėlė.' }),
        installPrompt
          ? h('button', { class: 'btn primary', type: 'button', onclick: async () => { installPrompt.prompt(); installPrompt = null; } }, icon('download'), 'Įdiegti programėlę')
          : h('p', { class: 'hint', style: 'margin:0', text: 'iPhone: „Safari“ apačioje spauskite „Bendrinti“ → „Į pradžios ekraną“. Android: „Chrome“ meniu ⋮ → „Įdiegti programą“ arba „Pridėti prie pradžios ekrano“.' })));
    }
    nodes.push(h('div', { class: 'home-foot' }, h('span', { text: me.email }), h('button', { class: 'btn small', type: 'button', onclick: logout }, icon('logout'), 'Atsijungti')));
    return nodes;
  }

  // Galerija
  let galleryFilter = '';
  let uploadCategory = 'Treniruotės';
  function screenGallery() {
    const progress = h('p', { class: 'progress', hidden: true });
    const fileInput = h('input', { type: 'file', accept: 'image/*', multiple: true });
    fileInput.addEventListener('change', async () => {
      const files = [...fileInput.files];
      fileInput.value = '';
      if (!files.length) return;
      progress.hidden = false;
      let done = 0;
      const added = [];
      for (const file of files) {
        progress.textContent = `Įkeliama ${done + 1} iš ${files.length}…`;
        try {
          const r = await uploadImage(file);
          added.push({ id: 'p' + r.id, src: r.src, thumb: r.thumb, caption: '', category: uploadCategory });
        } catch (err) { toast(`${file.name}: ${err.message}`, true); }
        done++;
      }
      progress.hidden = true;
      if (!added.length) return;
      content.gallery.unshift(...added.reverse());
      if (await save(true)) toast(added.length === 1 ? 'Nuotrauka įkelta ir jau matoma svetainėje.' : `Įkelta nuotraukų: ${added.length}. Jau matomos svetainėje.`);
      render();
    });

    const filterBtns = ['', ...CATS].map(c => h('button', {
      class: 'chip', type: 'button', 'aria-pressed': String(galleryFilter === c),
      onclick: () => { galleryFilter = c; render(); }
    }, c || 'Visos'));

    const items = content.gallery.map((p, i) => ({ p, i })).filter(({ p }) => !galleryFilter || p.category === galleryFilter);
    const grid = items.length
      ? h('div', { class: 'photos' }, items.map(({ p, i }) => h('button', { class: 'photo', type: 'button', onclick: () => editPhoto(i), 'aria-label': p.caption || 'Nuotrauka be aprašymo' },
          h('img', { src: p.thumb || p.src, alt: '', loading: 'lazy' }),
          p.category ? h('span', { class: 'badge', text: p.category }) : null,
          p.caption ? h('span', { class: 'cap', text: p.caption }) : null)))
      : h('div', { class: 'empty', text: galleryFilter ? 'Šioje kategorijoje nuotraukų dar nėra.' : 'Galerija tuščia. Įkelkite pirmąsias nuotraukas.' });

    return [
      topBar('Galerija'),
      h('div', { class: 'section' },
        h('div', { class: 'upload' },
          field('Naujų nuotraukų kategorija', uploadCategory, v => { uploadCategory = v; }, { options: Object.fromEntries(CATS.map(c => [c, c])) }),
          h('label', { class: 'btn primary block' }, icon('upload'), 'Įkelti nuotraukas', fileInput),
          progress,
          h('p', { class: 'hint', style: 'margin:0', text: 'Galite pasirinkti kelias nuotraukas iš karto. Jos sumažinamos automatiškai ir iškart atsiranda svetainėje.' }))),
      h('div', { class: 'section' },
        h('h3', { text: 'Nuotraukos (paspauskite, kad redaguotumėte)' }),
        h('div', { class: 'filters' }, filterBtns),
        grid),
      saveBar()
    ];
  }

  function editPhoto(index) {
    const p = content.gallery[index];
    sheet((panel, close) => {
      const done = () => { close(); render(); };
      const confirmBox = h('div', { class: 'confirm', hidden: true },
        h('p', { text: 'Ar tikrai ištrinti šią nuotrauką? Ji dings ir iš svetainės.' }),
        h('div', { class: 'actions' },
          h('button', { class: 'btn danger', type: 'button', onclick: async () => {
            content.gallery.splice(index, 1);
            [mediaId(p.src), mediaId(p.thumb)].filter(Boolean).forEach(id => pendingDeletes.push(id.replace(/-t$/, '')));
            pendingDeletes = [...new Set(pendingDeletes)];
            close();
            if (await save(true)) toast('Nuotrauka ištrinta.');
            render();
          } }, icon('trash'), 'Taip, ištrinti'),
          h('button', { class: 'btn', type: 'button', onclick: () => { confirmBox.hidden = true; } }, 'Atšaukti')));
      panel.append(
        h('h3', { text: 'Nuotrauka' }),
        h('img', { class: 'sheet-img', src: p.src, alt: '' }),
        field('Aprašymas', p.caption, v => { p.caption = v; }, { placeholder: 'Lietuvos jaunių čempionatas, Kaunas' }),
        field('Kategorija', p.category, v => { p.category = v; }, { options: Object.fromEntries([['', 'Be kategorijos'], ...CATS.map(c => [c, c])]) }),
        h('div', { class: 'actions' },
          h('button', { class: 'btn small', type: 'button', onclick: () => { if (move(content.gallery, index, -1)) { changed(); index--; toast('Perkelta anksčiau'); } } }, icon('up'), 'Anksčiau'),
          h('button', { class: 'btn small', type: 'button', onclick: () => { if (move(content.gallery, index, 1)) { changed(); index++; toast('Perkelta vėliau'); } } }, icon('down'), 'Vėliau'),
          h('button', { class: 'btn small danger', type: 'button', onclick: () => { confirmBox.hidden = false; } }, icon('trash'), 'Ištrinti')),
        confirmBox,
        h('div', { class: 'actions' },
          h('button', { class: 'btn primary', type: 'button', onclick: async () => { close(); if (isDirty()) await save(); render(); } }, 'Išsaugoti ir uždaryti'),
          h('button', { class: 'btn', type: 'button', onclick: done }, 'Uždaryti')));
    });
  }

  // Tvarkaraštis
  function screenSchedule() {
    const s = content.schedule;
    const days = s.days.map((day, di) => {
      const sessions = day.sessions.map((ses, si) => h('div', { class: 'session-card ' + ses.type },
        h('div', { class: 'row2' },
          field('Laikas', ses.time, v => { ses.time = v; }, { placeholder: '18:00–19:00' }),
          field('Spalva', ses.type, v => { ses.type = v; render(); }, { options: TYPES })),
        field('Pavadinimas', ses.title, v => { ses.title = v; }, { placeholder: 'Boksas vaikams' }),
        field('Papildomai', ses.note, v => { ses.note = v; }, { placeholder: '7–12 metų' }),
        h('div', { class: 'mini' },
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Aukščiau', onclick: () => { if (move(day.sessions, si, -1)) { changed(); render(); } } }, icon('up')),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Žemiau', onclick: () => { if (move(day.sessions, si, 1)) { changed(); render(); } } }, icon('down')),
          h('button', { class: 'btn small danger', type: 'button', onclick: () => { day.sessions.splice(si, 1); changed(); render(); } }, icon('trash'), 'Pašalinti'))));
      return h('div', { class: 'card' },
        h('div', { class: 'day-head' },
          field('Diena', day.name, v => { day.name = v; }, { placeholder: 'Pirmadienis' }),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Diena aukščiau', onclick: () => { if (move(s.days, di, -1)) { changed(); render(); } } }, icon('up')),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Diena žemiau', onclick: () => { if (move(s.days, di, 1)) { changed(); render(); } } }, icon('down'))),
        sessions.length ? sessions : h('p', { class: 'hint', style: 'margin:0', text: 'Šią dieną treniruočių nėra.' }),
        h('div', { class: 'actions' },
          h('button', { class: 'btn small', type: 'button', onclick: () => { day.sessions.push({ time: '', title: '', note: '', type: 'kids' }); changed(); render(); } }, icon('plus'), 'Pridėti treniruotę'),
          h('button', { class: 'btn small danger', type: 'button', onclick: () => { s.days.splice(di, 1); changed(); render(); } }, icon('trash'), 'Pašalinti dieną')));
    });
    return [
      topBar('Tvarkaraštis'),
      h('div', { class: 'section' }, h('h3', { text: 'Bendra informacija' }), h('div', { class: 'card' },
        field('Sezonas', s.season, v => { s.season = v; }, { placeholder: '2026–2027' }),
        field('Vieta', s.place, v => { s.place = v; }),
        field('Adresas', s.address, v => { s.address = v; }),
        field('Pastaba po tvarkaraščiu', s.note, v => { s.note = v; }))),
      h('div', { class: 'section' }, h('h3', { text: 'Savaitės dienos' }), days,
        s.days.length < 7 ? h('button', { class: 'btn block', type: 'button', style: 'margin-top:12px', onclick: () => { s.days.push({ name: '', sessions: [] }); changed(); render(); } }, icon('plus'), 'Pridėti dieną') : null),
      saveBar()
    ];
  }

  // Treniruotės
  function screenGroups() {
    const cards = content.groups.map((g, gi) => h('div', { class: 'card' },
      h('div', { class: 'day-head' },
        h('p', { class: 'card-title', style: 'flex:1;margin:0', text: `Grupė ${String(gi + 1).padStart(2, '0')}` }),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Aukščiau', onclick: () => { if (move(content.groups, gi, -1)) { changed(); render(); } } }, icon('up')),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Žemiau', onclick: () => { if (move(content.groups, gi, 1)) { changed(); render(); } } }, icon('down'))),
      field('Pavadinimas', g.title, v => { g.title = v; }, { placeholder: 'Boksas vaikams' }),
      field('Amžius / kam skirta', g.age, v => { g.age = v; }, { placeholder: '7–12 metų' }),
      field('Aprašymas', g.description, v => { g.description = v; }, { textarea: true, rows: 3 }),
      h('p', { class: 'card-title', style: 'margin:4px 0 0', text: 'Laikas' }),
      g.hours.map((hr, hi) => h('div', { class: 'session-card' },
        h('div', { class: 'row2' },
          field('Dienos', hr.label, v => { hr.label = v; }, { placeholder: 'Pirm. · Treč.' }),
          field('Laikas', hr.value, v => { hr.value = v; }, { placeholder: '18:00–19:00' })),
        h('button', { class: 'btn small danger', type: 'button', onclick: () => { g.hours.splice(hi, 1); changed(); render(); } }, icon('trash'), 'Pašalinti laiką'))),
      h('p', { class: 'hint', style: 'margin:0', text: 'Jei laiko laukelį paliksite tuščią, svetainėje bus rodoma nuoroda „Susisiekite“.' }),
      h('div', { class: 'actions' },
        h('button', { class: 'btn small', type: 'button', onclick: () => { g.hours.push({ label: '', value: '' }); changed(); render(); } }, icon('plus'), 'Pridėti laiką'),
        h('button', { class: 'btn small danger', type: 'button', onclick: () => { content.groups.splice(gi, 1); changed(); render(); } }, icon('trash'), 'Pašalinti grupę'))));
    return [
      topBar('Treniruotės'),
      h('div', { class: 'section' }, h('h3', { text: 'Grupės (rodomos skiltyje „Mūsų treniruotės“)' }), cards,
        h('button', { class: 'btn block', type: 'button', style: 'margin-top:12px', onclick: () => { content.groups.push({ age: '', title: 'Nauja grupė', description: '', hours: [{ label: '', value: '' }] }); changed(); render(); } }, icon('plus'), 'Pridėti grupę')),
      saveBar()
    ];
  }

  // Tekstai
  function screenTexts() {
    const hero = content.hero, about = content.about;
    const paragraphs = about.paragraphs.map((p, i) => h('div', { class: 'session-card' },
      field(`${i + 1} pastraipa`, p, v => { about.paragraphs[i] = v; }, { textarea: true, rows: 4 }),
      h('button', { class: 'btn small danger', type: 'button', onclick: () => { about.paragraphs.splice(i, 1); changed(); render(); } }, icon('trash'), 'Pašalinti pastraipą')));
    return [
      topBar('Tekstai'),
      h('div', { class: 'section' }, h('h3', { text: 'Pradžios ekranas' }), h('div', { class: 'card' },
        linesField('Šūkis', hero.motto, v => { hero.motto = v; }),
        linesField('Ką siūlome', hero.description, v => { hero.description = v; }),
        field('Sezonas (apačioje)', hero.season, v => { hero.season = v; }, { placeholder: '2026–2027 m. sezonas' }))),
      h('div', { class: 'section' }, h('h3', { text: 'Apie klubą' }), h('div', { class: 'card' },
        field('Įkūrimo metai', about.founded, v => { about.founded = v; }, { inputmode: 'numeric' }),
        paragraphs,
        h('button', { class: 'btn small', type: 'button', onclick: () => { about.paragraphs.push(''); changed(); render(); } }, icon('plus'), 'Pridėti pastraipą'))),
      saveBar()
    ];
  }

  // Kontaktai
  function screenContacts() {
    const c = content.contacts;
    return [
      topBar('Kontaktai'),
      h('div', { class: 'section' }, h('div', { class: 'card' },
        field('Telefonas', c.phone, v => { c.phone = v; }, { type: 'tel', placeholder: '+370 600 00000' }),
        field('El. paštas', c.email, v => { c.email = v; }, { type: 'email' }),
        field('Treniruočių vieta', c.place, v => { c.place = v; }),
        field('Adresas', c.address, v => { c.address = v; }, { hint: 'Pagal šį adresą rodomas ir žemėlapis.' }),
        field('Facebook nuoroda', c.facebook, v => { c.facebook = v; }, { type: 'url', placeholder: 'https://www.facebook.com/…' }),
        field('Instagram nuoroda', c.instagram, v => { c.instagram = v; }, { type: 'url', placeholder: 'https://www.instagram.com/…' }))),
      saveBar()
    ];
  }

  // Plakatai
  function screenPosters() {
    const item = (key, title) => {
      const input = h('input', { type: 'file', accept: 'image/*' });
      const status = h('p', { class: 'progress', hidden: true, text: 'Įkeliama…' });
      input.addEventListener('change', async () => {
        const file = input.files[0];
        input.value = '';
        if (!file) return;
        status.hidden = false;
        try {
          const r = await uploadImage(file, false);
          const old = mediaId(content.posters[key]);
          if (old) pendingDeletes.push(old);
          content.posters[key] = r.src;
          if (await save(true)) toast('Plakatas pakeistas.');
        } catch (err) { toast(err.message, true); }
        render();
      });
      return h('div', { class: 'card' }, h('div', { class: 'poster' },
        h('img', { src: content.posters[key] || '/valdymas/icon-192.png', alt: '' }),
        h('div', { style: 'display:grid;gap:10px' },
          h('b', { text: title }),
          h('label', { class: 'btn small', style: 'position:relative;overflow:hidden' }, icon('upload'), 'Pakeisti plakatą',
            Object.assign(input, { style: 'position:absolute;inset:0;opacity:0' })),
          status)));
    };
    return [
      topBar('Plakatai'),
      h('div', { class: 'section' },
        h('p', { class: 'hint', style: 'margin:0 0 12px', text: 'Plakatai atsidaro paspaudus nuorodas svetainėje. Įkėlus naują, senasis pakeičiamas iškart.' }),
        item('schedule', 'Sezono plakatas'),
        item('fitboxing', 'Fitbokso moterims plakatas'))
    ];
  }

  // Vartotojai
  function genPassword() {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const a = new Uint32Array(12);
    crypto.getRandomValues(a);
    return [...a].map(n => chars[n % chars.length]).join('').replace(/(.{4})(?!$)/g, '$1-');
  }
  function screenUsers() {
    const listBox = h('div', { class: 'card' }, h('p', { class: 'hint', style: 'margin:0', text: 'Kraunama…' }));
    const drawList = users => {
      listBox.textContent = '';
      users.forEach(u => {
        const del = me.role === 'owner' && u.email !== me.email
          ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Pašalinti ' + u.email, onclick: () => confirmRemove(u) }, icon('trash'))
          : null;
        listBox.appendChild(h('div', { class: 'user' },
          h('div', null, h('b', { text: u.name || u.email }), h('small', { text: u.name ? u.email : '' })),
          h('span', { class: u.role === 'owner' ? 'badge' : 'badge muted', text: u.role === 'owner' ? 'Savininkas' : 'Redaktorius' }),
          del));
      });
    };
    const confirmRemove = u => sheet((panel, close) => {
      panel.append(h('h3', { text: 'Pašalinti vartotoją?' }),
        h('p', { class: 'hint', text: `${u.email} nebegalės prisijungti prie valdymo.` }),
        h('div', { class: 'actions' },
          h('button', { class: 'btn danger', type: 'button', onclick: async () => {
            try { const r = await api('DELETE', '/api/admin/users/' + encodeURIComponent(u.email)); drawList(r.users); toast('Vartotojas pašalintas.'); } catch (err) { toast(err.message, true); }
            close();
          } }, 'Pašalinti'),
          h('button', { class: 'btn', type: 'button', onclick: close }, 'Atšaukti')));
    });
    api('GET', '/api/admin/users').then(r => drawList(r.users)).catch(err => { listBox.textContent = err.message; });

    const nodes = [topBar('Vartotojai'), h('div', { class: 'section' }, h('h3', { text: 'Kas gali tvarkyti svetainę' }), listBox)];
    if (me.role === 'owner') {
      const form = { name: '', email: '', password: genPassword(), role: 'editor' };
      const err = h('p', { class: 'error', hidden: true });
      const result = h('div', { hidden: true });
      const pwBox = h('div', { class: 'secret', text: form.password });
      nodes.push(h('div', { class: 'section' }, h('h3', { text: 'Pridėti naują žmogų' }), h('div', { class: 'card' },
        field('Vardas', '', v => { form.name = v; }, { placeholder: 'Jonas' }),
        field('El. paštas', '', v => { form.email = v; }, { type: 'email', placeholder: 'vardas@gmail.com' }),
        field('Teisės', 'editor', v => { form.role = v; }, { options: { editor: 'Redaktorius – tvarko turinį', owner: 'Savininkas – gali ir pridėti žmonių' } }),
        h('div', { class: 'field' }, h('span', { text: 'Laikinas slaptažodis' }), pwBox,
          h('small', { text: 'Perduokite šį slaptažodį žmogui. Prisijungęs jis galės jį pasikeisti skiltyje „Mano paskyra“.' })),
        h('button', { class: 'btn small', type: 'button', onclick: () => { form.password = genPassword(); pwBox.textContent = form.password; } }, 'Sugeneruoti kitą'),
        err,
        h('button', { class: 'btn primary block', type: 'button', onclick: async () => {
          err.hidden = true;
          try {
            const r = await api('POST', '/api/admin/users', form);
            drawList(r.users);
            result.hidden = false;
            result.textContent = '';
            result.append(h('div', { class: 'confirm', style: 'border-color:var(--line-2);background:var(--ink)' },
              h('p', { text: 'Vartotojas pridėtas. Perduokite jam šiuos duomenis:' }),
              h('p', null, 'Adresas: ', h('b', { text: location.origin + '/valdymas/' })),
              h('p', null, 'El. paštas: ', h('b', { text: form.email })),
              h('p', null, 'Slaptažodis: ', h('b', { text: form.password }))));
            toast('Vartotojas pridėtas.');
          } catch (e) { err.textContent = e.message; err.hidden = false; }
        } }, icon('plus'), 'Pridėti vartotoją'),
        result)));
    } else {
      nodes.push(h('p', { class: 'hint', text: 'Naujus žmones gali pridėti tik savininkas.' }));
    }
    return nodes;
  }

  // Mano paskyra
  function screenAccount() {
    const f = { current: '', password: '', repeat: '' };
    const err = h('p', { class: 'error', hidden: true });
    return [
      topBar('Mano paskyra'),
      h('div', { class: 'section' }, h('div', { class: 'card' },
        h('div', null, h('b', { text: me.name || me.email }), h('p', { class: 'hint', style: 'margin:2px 0 0', text: me.email })))),
      h('div', { class: 'section' }, h('h3', { text: 'Pakeisti slaptažodį' }), h('div', { class: 'card' },
        field('Dabartinis slaptažodis', '', v => { f.current = v; }, { type: 'password', autocomplete: 'current-password' }),
        field('Naujas slaptažodis', '', v => { f.password = v; }, { type: 'password', autocomplete: 'new-password', hint: 'Bent 8 simboliai.' }),
        field('Pakartokite naują slaptažodį', '', v => { f.repeat = v; }, { type: 'password', autocomplete: 'new-password' }),
        err,
        h('button', { class: 'btn primary block', type: 'button', onclick: async () => {
          err.hidden = true;
          if (f.password !== f.repeat) { err.textContent = 'Nauji slaptažodžiai nesutampa.'; err.hidden = false; return; }
          try { await api('POST', '/api/admin/password', { current: f.current, password: f.password }); toast('Slaptažodis pakeistas.'); location.hash = '#/'; }
          catch (e) { err.textContent = e.message; err.hidden = false; }
        } }, 'Pakeisti slaptažodį'))),
      h('button', { class: 'btn block', type: 'button', style: 'margin-top:22px', onclick: logout }, icon('logout'), 'Atsijungti')
    ];
  }

  // Prisijungimas ir pirmoji paskyra
  function screenAuth(setup) {
    const f = { name: '', email: '', password: '', repeat: '' };
    const err = h('p', { class: 'error', hidden: true });
    const submit = async e => {
      e.preventDefault();
      err.hidden = true;
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true;
      try {
        if (setup && f.password !== f.repeat) throw new Error('Slaptažodžiai nesutampa.');
        const r = await api('POST', setup ? '/api/auth/setup' : '/api/auth/login', f);
        me = r.user;
        await loadContent();
        render();
      } catch (ex) { err.textContent = ex.message; err.hidden = false; }
      btn.disabled = false;
    };
    return [h('form', { class: 'auth', onsubmit: submit },
      h('div', { class: 'auth-head' },
        h('img', { src: '/valdymas/icon-192.png', alt: '' }),
        h('h1', { text: 'GBK valdymas' }),
        h('p', { text: setup ? 'Sukurkite savininko paskyrą. Tai daroma tik vieną kartą.' : 'Prisijunkite, kad tvarkytumėte svetainę.' })),
      h('div', { class: 'card' },
        setup ? field('Jūsų vardas', '', v => { f.name = v; }, { autocomplete: 'given-name' }) : null,
        field('El. paštas', '', v => { f.email = v; }, { type: 'email', autocomplete: 'username', inputmode: 'email' }),
        field('Slaptažodis', '', v => { f.password = v; }, { type: 'password', autocomplete: setup ? 'new-password' : 'current-password', hint: setup ? 'Bent 8 simboliai.' : null }),
        setup ? field('Pakartokite slaptažodį', '', v => { f.repeat = v; }, { type: 'password', autocomplete: 'new-password' }) : null,
        err,
        h('button', { class: 'btn primary block', type: 'submit' }, setup ? 'Sukurti paskyrą' : 'Prisijungti')),
      setup ? null : h('p', { class: 'hint', style: 'text-align:center', text: 'Pamiršote slaptažodį? Paprašykite savininko jus pašalinti ir pridėti iš naujo.' }))];
  }

  // ---------- Maršrutai ----------
  const ROUTES = {
    '': screenHome, galerija: screenGallery, tvarkarastis: screenSchedule, treniruotes: screenGroups,
    tekstai: screenTexts, kontaktai: screenContacts, plakatai: screenPosters, vartotojai: screenUsers, paskyra: screenAccount
  };
  let needsSetup = false;

  function render(scrollTop = false) {
    let nodes;
    if (!me) nodes = screenAuth(needsSetup);
    else {
      const key = location.hash.replace(/^#\/?/, '');
      nodes = (ROUTES[key] || screenHome)();
    }
    appEl.textContent = '';
    appEl.append(...nodes.filter(Boolean));
    if (scrollTop) window.scrollTo(0, 0);
  }

  async function loadContent() {
    content = await api('GET', '/api/admin/content');
    savedJson = JSON.stringify(content);
  }

  window.addEventListener('hashchange', () => render(true));
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; if (me && !location.hash.replace(/^#\/?/, '')) render(); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/valdymas/sw.js', { scope: '/valdymas/' }).catch(() => {});

  (async () => {
    try {
      const r = await api('GET', '/api/auth/me');
      needsSetup = r.needsSetup;
      me = r.user;
      if (me) await loadContent();
      render();
    } catch (err) {
      appEl.textContent = '';
      appEl.append(h('div', { class: 'auth' }, h('div', { class: 'auth-head' },
        h('img', { src: '/valdymas/icon-192.png', alt: '' }), h('h1', { text: 'GBK valdymas' }),
        h('p', { text: err.message }),
        h('button', { class: 'btn primary', type: 'button', onclick: () => location.reload() }, 'Bandyti dar kartą'))));
    }
  })();
})();
