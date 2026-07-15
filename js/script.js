// СЛЕД — Gallery Engine

document.addEventListener('DOMContentLoaded', () => {
  initChips();
  initFilters();
  initSplash();
  renderGallery(ARTWORKS);
  renderTimeline(ARTWORKS.filter(w => w.image));
  renderStats();
  initViewer();
});

// ===== State =====
let activeType = '';
let currentSplashWork = null;
let viewerWorks = [];
let viewerIndex = 0;
let touchStartX = 0;
let touchStartY = 0;

// ===== Stats =====
function renderStats() {
  const withImages = ARTWORKS.filter(w => w.image);
  const artists = new Set(withImages.map(w => w.artist).filter(Boolean));
  const types = new Set(withImages.map(w => w.type));
  const years = withImages.map(w => w.year).filter(Boolean);
  const minYear = years.length ? Math.min(...years) : '—';
  const maxYear = years.length ? Math.max(...years) : '—';

  document.getElementById('about-stats').innerHTML = `
    <div class="stat"><div class="stat-num">${withImages.length}</div><div class="stat-label">Работ</div></div>
    <div class="stat"><div class="stat-num">${artists.size}</div><div class="stat-label">Художников</div></div>
    <div class="stat"><div class="stat-num">${types.size}</div><div class="stat-label">Типов</div></div>
    <div class="stat"><div class="stat-num">${minYear}–${maxYear}</div><div class="stat-label">Годы</div></div>
  `;
}

// ===== Splash =====
function initSplash() {
  const withImages = ARTWORKS.filter(w => w.image && w.era !== '2000–2020');
  if (!withImages.length) return;
  currentSplashWork = withImages[Math.floor(Math.random() * withImages.length)];
  updateSplashContent(currentSplashWork);

  // Background images — 4 random works (excluding main)
  const bgContainer = document.getElementById('splash-bg-images');
  const others = withImages.filter(w => w.id !== currentSplashWork.id);
  const randomOthers = others.sort(() => Math.random() - 0.5).slice(0, 4);
  bgContainer.innerHTML = randomOthers.map(w => `<img src="${w.image}" alt="" loading="lazy">`).join('');

  document.getElementById('splash-image').addEventListener('click', () => {
    document.getElementById('about-top').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => openViewer(currentSplashWork), 600);
  });

  document.getElementById('splash-random-btn').addEventListener('click', () => {
    currentSplashWork = withImages[Math.floor(Math.random() * withImages.length)];
    updateSplashContent(currentSplashWork);
  });

  document.getElementById('splash-arrow').addEventListener('click', () => {
    document.getElementById('about-top').scrollIntoView({ behavior: 'smooth' });
  });
}

function updateSplashContent(w) {
  document.getElementById('splash-image').src = w.image;
  document.getElementById('splash-artwork-title').textContent = w.title;
  document.getElementById('splash-artwork-author').textContent = w.artist || '';
}

// ===== Filter Chips =====
function initChips() {
  const types = [...new Set(ARTWORKS.map(a => a.type))].sort();
  const container = document.getElementById('filter-chips');
  const allChip = document.createElement('button');
  allChip.className = 'chip active'; allChip.textContent = 'Все';
  allChip.addEventListener('click', () => {
    activeType = ''; container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    allChip.classList.add('active'); applyFilters();
  });
  container.appendChild(allChip);
  types.forEach(t => {
    const chip = document.createElement('button'); chip.className = 'chip'; chip.textContent = t;
    chip.addEventListener('click', () => {
      if (activeType === t) { activeType = ''; container.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); allChip.classList.add('active'); }
      else { activeType = t; container.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.textContent === t)); }
      applyFilters();
    });
    container.appendChild(chip);
  });
}

// ===== Dropdown Filters =====
function initFilters() {
  const eras = [...new Set(ARTWORKS.map(a => a.era))].sort();
  populateSelect('filter-era', eras);
  document.getElementById('filter-era').addEventListener('change', applyFilters);
}

function populateSelect(id, opts) {
  const sel = document.getElementById(id);
  if (!sel) return;
  opts.forEach(o => { const el = document.createElement('option'); el.value = o; el.textContent = o; sel.appendChild(el); });
}

function applyFilters() {
  const era = document.getElementById('filter-era')?.value || '';
  renderGallery(ARTWORKS.filter(w => {
    if (!w.image) return false;
    if (activeType && w.type !== activeType) return false;
    if (era && w.era !== era) return false;
    return true;
  }));
}

// ===== Gallery =====
function renderGallery(works) {
  const grid = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');
  grid.innerHTML = '';
  if (!works.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  works.forEach(w => {
    if (!w.image) return;
    const card = document.createElement('div'); card.className = 'card';
    const img = document.createElement('img'); img.src = w.image; img.alt = w.title; img.loading = 'lazy';
    card.appendChild(img);
    card.addEventListener('click', () => openViewer(w));
    grid.appendChild(card);
  });
}

// ===== Timeline =====
function renderTimeline(works) {
  const tl = document.getElementById('timeline');
  const section = tl.closest('.timeline-section');
  let title = section.querySelector('.section-title');
  if (!title) {
    title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = 'Таймлайн';
    tl.parentNode.insertBefore(title, tl);
  }
  
  const grouped = {};
  works.forEach(w => { if (!w.era) return; if (!grouped[w.era]) grouped[w.era] = []; grouped[w.era].push(w); });
  const order = ['1920–1940', '1940–1960', '1960–1980', '1980–2000', '2000–2020', 'Без даты'];
  tl.innerHTML = '';
  order.forEach(era => {
    if (!grouped[era]) return;
    const eraDiv = document.createElement('div'); eraDiv.className = 'tl-era';
    eraDiv.innerHTML = `
      <div class="tl-era-title">${getEraTitle(era)}</div>
      <div class="tl-era-items">
        ${grouped[era].sort((a,b) => (a.year||9999)-(b.year||9999)).map(w => `
          <div class="tl-item" data-id="${w.id}">
            <img class="tl-item-thumb" src="${w.image}" alt="${w.title}" loading="lazy" onerror="this.style.display='none'">
            <div class="tl-item-info"><div class="tl-item-title">${w.title}</div><div class="tl-item-year">${w.artist||''}${w.artist&&w.year?', ':''}${w.year||''}</div></div>
          </div>
        `).join('')}
      </div>`;
    tl.appendChild(eraDiv);
  });
  tl.querySelectorAll('.tl-item').forEach(el => {
    el.addEventListener('click', () => {
      const w = works.find(x => x.id === parseInt(el.dataset.id));
      if (w) openViewer(w);
    });
  });
}

function getEraTitle(era) {
  const map = { '1920–1940': 'Авангард и конструктивизм', '1940–1960': 'Соцреализм и монументализм', '1960–1980': 'Оттепель и новый визуальный язык', '1980–2000': 'Поздний советский период', '2000–2020': 'Современный российский дизайн' };
  return map[era] || '';
}

// ===== Viewer =====
function initViewer() {
  document.getElementById('viewer-close').addEventListener('click', closeViewer);
  document.getElementById('viewer').addEventListener('click', e => { if (e.target === document.getElementById('viewer')) closeViewer(); });
  document.getElementById('viewer-prev').addEventListener('click', () => navigateViewer(-1));
  document.getElementById('viewer-next').addEventListener('click', () => navigateViewer(1));
  document.addEventListener('keydown', e => {
    if (document.getElementById('viewer').classList.contains('hidden')) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowLeft') navigateViewer(-1);
    if (e.key === 'ArrowRight') navigateViewer(1);
  });
  const viewerEl = document.getElementById('viewer');
  viewerEl.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }, { passive: true });
  viewerEl.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (dy > 80 && Math.abs(dy) > Math.abs(dx)) { closeViewer(); return; }
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) navigateViewer(dx > 0 ? -1 : 1);
  });
}

function navigateViewer(dir) {
  const newIdx = viewerIndex + dir;
  if (newIdx < 0 || newIdx >= viewerWorks.length) return;
  viewerIndex = newIdx;
  updateViewerContent(viewerWorks[viewerIndex]);
}

function openViewer(w) {
  const visible = getVisibleWorks();
  viewerWorks = visible;
  viewerIndex = visible.findIndex(v => v.id === w.id);
  if (viewerIndex === -1) viewerIndex = 0;
  updateViewerContent(visible[viewerIndex]);
  document.getElementById('viewer').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function getVisibleWorks() {
  const withImages = ARTWORKS.filter(w => w.image);
  const era = document.getElementById('filter-era')?.value || '';
  return withImages.filter(w => {
    if (activeType && w.type !== activeType) return false;
    if (era && w.era !== era) return false;
    return true;
  });
}

function updateViewerContent(w) {
  document.getElementById('viewer-image').src = w.image || '';
  document.getElementById('viewer-title').textContent = w.title + (w.titleAlt ? ' / ' + w.titleAlt : '');
  const meta = [];
  if (w.artist) meta.push(w.artist);
  if (w.year) meta.push(w.year);
  if (w.technique) meta.push(w.technique);
  if (w.museum) meta.push(w.museum);
  document.getElementById('viewer-meta').innerHTML = meta.join(' · ') + ' <span class="chip">' + w.type + '</span> <span class="chip">' + w.sport + '</span>';
  document.getElementById('viewer-desc').textContent = w.description || '';
  const src = document.getElementById('viewer-source');
  if (w.source) { src.href = w.source; src.classList.remove('hidden'); } else { src.classList.add('hidden'); }
}

function closeViewer() {
  document.getElementById('viewer').classList.add('hidden');
  document.body.style.overflow = '';
}

function debounce(fn, ms) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; }
