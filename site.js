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
      img.src = photo.image;
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
  fetch('data/gallery.json', { cache: 'no-cache' })
    .then(response => { if (!response.ok) throw new Error(); return response.json(); })
    .then(data => {
      photos = (Array.isArray(data) ? data : (data.nuotraukos || [])).filter(photo => photo && photo.image);
      renderGallery();
    })
    .catch(() => {
      grid.innerHTML = '<p class="gallery-empty">Nepavyko įkelti galerijos. Pabandykite atnaujinti puslapį.</p>';
    });
})();
