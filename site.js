(() => {
  document.documentElement.classList.add('js');
  const button = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#navigation');
  const mobile = window.matchMedia('(max-width: 1000px)');
  button.hidden = false;
  function closeMenu(returnFocus = false) {
    menu.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    button.querySelector('.menu-label').textContent = 'Meniu';
    if (returnFocus) button.focus();
  }
  button.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(isOpen));
    button.querySelector('.menu-label').textContent = isOpen ? 'Uždaryti' : 'Meniu';
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a') && mobile.matches) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (mobile.matches && !event.target.closest('.header-inner')) closeMenu();
  });
  mobile.addEventListener('change', () => closeMenu());

  // Keep the existing navigation aligned with the section being read.
  const sectionLinks = [...menu.querySelectorAll('a[href^="#"]')];
  const sections = sectionLinks.map(link => ({
    link,
    section: document.querySelector(link.getAttribute('href'))
  })).filter(item => item.section);
  let updatePending = false;
  function updateCurrentSection() {
    const readingLine = Math.min(window.innerHeight * 0.25, 180);
    sections.forEach(({ link, section }) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= readingLine && rect.bottom > readingLine) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
    updatePending = false;
  }
  function queueSectionUpdate() {
    if (updatePending) return;
    updatePending = true;
    window.requestAnimationFrame(updateCurrentSection);
  }
  window.addEventListener('scroll', queueSectionUpdate, { passive: true });
  window.addEventListener('resize', queueSectionUpdate);
  window.addEventListener('load', queueSectionUpdate);
  queueSectionUpdate();


  // ---------- Animacijos slenkant ----------
  const motionOK = 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let revealObserver = null;
  if (motionOK) {
    document.documentElement.classList.add('reveal-ready');
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  }
  function reveal(selector, direction, stagger = 0) {
    const els = typeof selector === 'string' ? document.querySelectorAll(selector) : selector;
    els.forEach((el, i) => {
      if (!revealObserver) return;
      el.dataset.reveal = direction;
      if (stagger) el.style.setProperty('--reveal-delay', `${(i % 6) * stagger}s`);
      revealObserver.observe(el);
    });
  }
  window.gbkReveal = reveal;
  reveal('.club-band-inner > span', 'up', 0.08);
  reveal('.section-heading > div:first-child', 'left');
  reveal('.section-lead, .schedule-context, .gallery-filters', 'right');
  reveal('.group-row', 'up', 0.1);
  reveal('.philosophy-top', 'up');
  reveal('.philosophy-section h2', 'left');
  reveal('.philosophy-story', 'right');
  reveal('.principle', 'up', 0.12);
  reveal('.day-column', 'up', 0.08);
  reveal('.schedule-footer, .gallery-footer', 'up');
  reveal('.about-visual', 'left');
  reveal('.about-copy', 'right');
  reveal('.contact-top > div', 'left');
  reveal('.contact-cta', 'zoom');
  reveal('.contact-item', 'up', 0.1);
  reveal('.map-frame', 'up');

  // ---------- Žemėlapis ----------
  // Rodomas tik tikroje svetainėje; įterptose peržiūrose lieka tamsi adreso kortelė.
  const mapFrame = document.querySelector('.map-frame iframe[data-src]');
  if (mapFrame && window.self === window.top) {
    mapFrame.src = mapFrame.dataset.src;
    mapFrame.hidden = false;
    mapFrame.closest('.map-frame').classList.add('has-map');
  }

  // ---------- Lightbox ----------
  const lightbox = document.getElementById('lightbox');
  const lbImage = document.getElementById('lightbox-image');
  const lbCaption = document.getElementById('lightbox-caption');
  const lbPrev = document.getElementById('lightbox-prev');
  const lbNext = document.getElementById('lightbox-next');
  let lbItems = [];
  let lbIndex = 0;
  function renderLightbox() {
    const item = lbItems[lbIndex];
    lbImage.src = item.image;
    lbImage.alt = item.caption || 'Grigiškių bokso klubo nuotrauka';
    lbCaption.textContent = item.caption || '';
    if (lbItems.length > 1) {
      const counter = document.createElement('span');
      counter.textContent = `${lbIndex + 1} / ${lbItems.length}`;
      lbCaption.appendChild(counter);
    }
    lbPrev.hidden = lbNext.hidden = lbItems.length < 2;
  }
  function openLightbox(items, index) {
    lbItems = items;
    lbIndex = index;
    renderLightbox();
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
    else lightbox.setAttribute('open', '');
  }
  function step(delta) {
    lbIndex = (lbIndex + delta + lbItems.length) % lbItems.length;
    renderLightbox();
  }
  document.getElementById('lightbox-close').addEventListener('click', () => lightbox.close());
  lbPrev.addEventListener('click', () => step(-1));
  lbNext.addEventListener('click', () => step(1));
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox || event.target.classList.contains('lightbox-inner')) lightbox.close();
  });
  document.addEventListener('keydown', event => {
    if (!lightbox.open) return;
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  });
  let touchX = null;
  lightbox.addEventListener('touchstart', event => { touchX = event.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', event => {
    if (touchX === null) return;
    const dx = event.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    touchX = null;
  });

  // Posters open in the lightbox instead of a new tab.
  document.querySelectorAll('[data-poster]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      openLightbox([{ image: link.getAttribute('href'), caption: link.textContent.trim() }], 0);
    });
  });

  // ---------- Galerija (nuotraukos tvarkomos per Pages CMS: data/gallery.json) ----------
  const grid = document.getElementById('gallery-grid');
  const filters = [...document.querySelectorAll('.gallery-filter')];
  let photos = [];
  let category = '';
  function renderGallery() {
    const items = photos.filter(photo => !category || photo.category === category);
    grid.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'gallery-empty';
      empty.textContent = 'Šioje kategorijoje nuotraukų dar nėra.';
      grid.appendChild(empty);
      return;
    }
    items.forEach((photo, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'gallery-item';
      const img = document.createElement('img');
      img.src = photo.thumb || photo.image;
      img.alt = photo.caption || 'Grigiškių bokso klubo nuotrauka';
      img.loading = 'lazy';
      item.appendChild(img);
      if (photo.category) {
        const tag = document.createElement('span');
        tag.className = 'gallery-tag';
        tag.textContent = photo.category;
        item.appendChild(tag);
      }
      if (photo.caption) {
        const caption = document.createElement('span');
        caption.className = 'gallery-caption';
        caption.textContent = photo.caption;
        item.appendChild(caption);
      }
      item.addEventListener('click', () => openLightbox(items, index));
      grid.appendChild(item);
    });
    reveal(grid.querySelectorAll('.gallery-item'), 'up', 0.07);
  }
  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      category = filter.dataset.category;
      filters.forEach(f => f.setAttribute('aria-pressed', String(f === filter)));
      renderGallery();
    });
  });
  // ---------- Turinys iš valdymo programėlės ----------
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };
  const svgIcon = (name, cls = 'icon') => {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', cls);
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#' + name);
    svg.appendChild(use);
    return svg;
  };
  const lines = (node, list) => {
    node.textContent = '';
    list.forEach((line, i) => { if (i) node.appendChild(document.createElement('br')); node.appendChild(document.createTextNode(line)); });
  };
  const pad = n => String(n).padStart(2, '0');
  const telHref = phone => 'tel:' + String(phone).replace(/[^\d+]/g, '');

  function renderHero(hero) {
    if (hero.motto.length) lines(document.querySelector('.hero-motto'), hero.motto);
    if (hero.description.length) lines(document.querySelector('.hero-description'), hero.description);
    const season = document.querySelector('.hero-footer > span');
    if (season && hero.season) season.textContent = hero.season;
  }

  function renderGroups(groups) {
    const list = document.querySelector('.group-list');
    if (!list || !groups.length) return;
    list.textContent = '';
    groups.forEach((g, i) => {
      const row = el('article', 'group-row');
      const num = el('span', 'group-number', pad(i + 1));
      num.setAttribute('aria-hidden', 'true');
      const name = el('div', 'group-name');
      name.append(el('span', 'group-age', g.age), el('h3', null, g.title));
      const hours = el('div', 'group-hours');
      let hasTime = false;
      g.hours.forEach(h => {
        const div = el('div');
        div.appendChild(el('span', null, h.label));
        const strong = el('strong');
        if (h.value) { strong.textContent = h.value; hasTime = true; }
        else { const a = el('a', null, 'Susisiekite'); a.href = '#kontaktai'; strong.appendChild(a); }
        div.appendChild(strong);
        hours.appendChild(div);
      });
      const arrow = el('a', 'group-arrow');
      arrow.href = hasTime ? '#grafikas' : '#kontaktai';
      arrow.setAttribute('aria-label', `${g.title} — ${hasTime ? 'treniruočių laikas' : 'susisiekti'}`);
      arrow.appendChild(svgIcon('arrow-up'));
      row.append(num, name, el('p', 'group-description', g.description), hours, arrow);
      list.appendChild(row);
    });
    reveal(list.querySelectorAll('.group-row'), 'up', 0.1);
  }

  function renderSchedule(s) {
    const badge = document.querySelector('.season-badge');
    if (badge && s.season) badge.textContent = s.season;
    const ctx = document.querySelector('.schedule-context p');
    if (ctx) lines(ctx, [s.place, s.address].filter(Boolean));
    const note = document.querySelector('.schedule-footer p');
    if (note && s.note) { note.textContent = ''; note.append(svgIcon('clock'), document.createTextNode(s.note)); }
    const grid = document.querySelector('.week-grid');
    if (!grid || !s.days.length) return;
    grid.textContent = '';
    s.days.forEach((day, i) => {
      const col = el('section', 'day-column');
      col.setAttribute('aria-labelledby', 'day-' + (i + 1));
      const head = el('div', 'day-heading');
      const n = el('span', null, pad(i + 1));
      n.setAttribute('aria-hidden', 'true');
      const h3 = el('h3', null, day.name);
      h3.id = 'day-' + (i + 1);
      head.append(n, h3);
      const sessions = el('div', 'day-sessions');
      day.sessions.forEach(ses => {
        const box = el('div', 'session session-' + ses.type);
        box.append(el('strong', 'session-time', ses.time), el('p', null, ses.title), el('span', null, ses.note));
        sessions.appendChild(box);
      });
      col.append(head, sessions);
      grid.appendChild(col);
    });
    reveal(grid.querySelectorAll('.day-column'), 'up', 0.08);
  }

  function renderAbout(a) {
    const year = document.querySelector('.about-visual figcaption strong');
    if (year && a.founded) year.textContent = a.founded;
    const copy = document.querySelector('.about-copy');
    if (!copy || !a.paragraphs.length) return;
    copy.querySelectorAll(':scope > p:not(.eyebrow)').forEach(p => p.remove());
    const h2 = copy.querySelector('h2');
    let after = h2;
    a.paragraphs.forEach(text => { const p = el('p', null, text); after.after(p); after = p; });
  }

  function renderContacts(c) {
    const items = document.querySelectorAll('.contact-grid:not(.contact-grid-social) .contact-item');
    if (items[0] && c.phone) { items[0].href = telHref(c.phone); items[0].querySelector('strong').textContent = c.phone; }
    if (items[1] && c.email) { items[1].href = 'mailto:' + c.email; items[1].querySelector('strong').textContent = c.email; }
    if (items[2]) {
      if (c.place) items[2].querySelector('strong').textContent = c.place;
      if (c.address) {
        items[2].querySelector('.contact-address').textContent = c.address;
        items[2].href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.address);
      }
    }
    if (c.phone) document.querySelectorAll('a[href^="tel:"]').forEach(a => { a.href = telHref(c.phone); });
    const swap = (oldStart, url, label) => {
      if (!url) return;
      document.querySelectorAll(`a[href^="${oldStart}"]`).forEach(a => {
        a.href = url;
        const strong = a.querySelector('strong');
        if (strong && label) strong.textContent = label(url);
      });
    };
    swap('https://www.facebook.com', c.facebook, url => url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''));
    swap('https://www.instagram.com', c.instagram, url => '@' + url.replace(/\/$/, '').split('/').pop().split('?')[0]);
    if (c.address) {
      const fallback = document.querySelector('.map-fallback strong');
      const sub = document.querySelector('.map-fallback span');
      const [street, ...rest] = c.address.split(',');
      if (fallback) fallback.textContent = street.trim();
      if (sub) sub.textContent = [c.place, rest.join(',').trim()].filter(Boolean).join(', ');
      const q = encodeURIComponent(c.address);
      const open = document.querySelector('.map-open');
      if (open) open.href = 'https://www.google.com/maps/search/?api=1&query=' + q;
      const frame = document.querySelector('.map-frame iframe');
      if (frame) {
        const url = `https://www.google.com/maps?q=${q}&z=16&output=embed`;
        if (frame.dataset.src) frame.dataset.src = url;
        if (frame.getAttribute('src')) frame.src = url;
      }
    }
  }

  function renderPosters(p) {
    const links = document.querySelectorAll('[data-poster]');
    if (links[0] && p.schedule) links[0].href = p.schedule;
    if (links[1] && p.fitboxing) links[1].href = p.fitboxing;
  }

  function showGallery(list) {
    photos = list.filter(p => p && p.image);
    renderGallery();
  }

  function galleryFallback() {
    fetch('data/gallery.json', { cache: 'no-cache' })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => showGallery((Array.isArray(data) ? data : (data.nuotraukos || []))))
      .catch(() => {
        grid.innerHTML = '<p class="gallery-empty">Nepavyko įkelti galerijos. Pabandykite atnaujinti puslapį.</p>';
      });
  }

  fetch('/api/content', { cache: 'no-cache' })
    .then(response => {
      if (!response.ok || !(response.headers.get('content-type') || '').includes('json')) throw new Error();
      return response.json();
    })
    .then(content => {
      const run = (fn, data) => { try { fn(data); } catch (err) { console.warn(err); } };
      run(renderHero, content.hero);
      run(renderGroups, content.groups);
      run(renderSchedule, content.schedule);
      run(renderAbout, content.about);
      run(renderContacts, content.contacts);
      run(renderPosters, content.posters);
      showGallery(content.gallery.map(p => ({ image: p.src, thumb: p.thumb, caption: p.caption, category: p.category })));
      queueSectionUpdate();
    })
    .catch(galleryFallback);
})();
