// КОДЕКС — Gallery Engine

document.addEventListener('DOMContentLoaded', () => {
  initChips();
  initFilters();
  initSplash();
  renderGallery(ARTWORKS);
  renderTimeline(ARTWORKS.filter(w => w.image));
  renderStats();
  initModal();
});

// ===== State =====
let activeType = '';
let currentSplashWork = null;

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
  const withImages = ARTWORKS.filter(w => w.image);
  if (!withImages.length) return;
  currentSplashWork = withImages[Math.floor(Math.random() * withImages.length)];
  document.getElementById('splash-image').src = currentSplashWork.image;

  // Click on image → scroll to about section + open modal
  document.getElementById('splash-image').addEventListener('click', () => {
    document.getElementById('about-top').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => openModal(currentSplashWork), 600);
  });

  // Arrow button → scroll to about section
  document.getElementById('splash-arrow').addEventListener('click', () => {
    document.getElementById('about-top').scrollIntoView({ behavior: 'smooth' });
  });
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
    card.addEventListener('click', () => openModal(w));
    grid.appendChild(card);
  });
}

// ===== Modal =====
let modalWorks = [];
let modalIndex = 0;
let touchStartX = 0;
let touchStartY = 0;

// ===== Timeline =====
function renderTimeline(works) {
  const tl = document.getElementById('timeline');
  const grouped = {};
  works.forEach(w => { if (!w.era) return; if (!grouped[w.era]) grouped[w.era] = []; grouped[w.era].push(w); });
  const order = ['1920–1940', '1940–1960', '1960–1980', '1980–2000', 'Без даты'];
  tl.innerHTML = '';
  order.forEach(era => {
    if (!grouped[era]) return;
    const eraDiv = document.createElement('div'); eraDiv.className = 'tl-era';
    eraDiv.innerHTML = `
      <div class="tl-era-label">${era}</div>
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
      if (w) openModal(w);
    });
  });
}

function getEraTitle(era) {
  const map = { '1920–1940': 'Авангард и конструктивизм', '1940–1960': 'Соцреализм и монументализм', '1960–1980': 'Оттепель и новый визуальный язык', '1980–2000': 'Поздний советский период' };
  return map[era] || '';
}

// ===== Modal =====
function initModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => { if (e.target === document.getElementById('modal')) closeModal(); });
  document.getElementById('modal-prev').addEventListener('click', () => navigateModal(-1));
  document.getElementById('modal-next').addEventListener('click', () => navigateModal(1));
  document.addEventListener('keydown', e => {
    if (document.getElementById('modal').classList.contains('hidden')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') navigateModal(-1);
    if (e.key === 'ArrowRight') navigateModal(1);
  });
  const modalOverlayEl = document.getElementById('modal');
  modalOverlayEl.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }, { passive: true });
  modalOverlayEl.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (dy > 80 && Math.abs(dy) > Math.abs(dx)) { closeModal(); return; }
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) navigateModal(dx > 0 ? -1 : 1);
  });
}

function navigateModal(dir) {
  const newIdx = modalIndex + dir;
  if (newIdx < 0 || newIdx >= modalWorks.length) return;
  modalIndex = newIdx;
  updateModalContent(modalWorks[modalIndex]);
}

function openModal(w) {
  const visible = getVisibleWorks();
  modalWorks = visible;
  modalIndex = visible.findIndex(v => v.id === w.id);
  if (modalIndex === -1) modalIndex = 0;
  updateModalContent(visible[modalIndex]);
  document.getElementById('modal').classList.remove('hidden');
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

function updateModalContent(w) {
  document.getElementById('modal-image').src = w.image || '';
  document.getElementById('modal-title').textContent = w.title + (w.titleAlt ? ' / ' + w.titleAlt : '');
  const meta = [];
  if (w.artist) meta.push(w.artist);
  if (w.year) meta.push(w.year);
  if (w.technique) meta.push(w.technique);
  if (w.museum) meta.push(w.museum);
  document.getElementById('modal-meta').innerHTML = meta.join(' · ') + ' <span class="chip">' + w.type + '</span> <span class="chip">' + w.sport + '</span>';
  document.getElementById('modal-desc').textContent = w.description || '';
  const src = document.getElementById('modal-source');
  if (w.source) { src.href = w.source; src.classList.remove('hidden'); } else { src.classList.add('hidden'); }
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); document.body.style.overflow = ''; }
function debounce(fn, ms) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; }
