// SportDesign — Gallery Engine

document.addEventListener('DOMContentLoaded', () => {
  initChips();
  initFilters();
  showRandomHero();
  renderGallery(ARTWORKS);
  initModal();
  document.getElementById('hero-random').addEventListener('click', showRandomHero);
});

// ===== State =====
let activeType = '';

// ===== Hero =====
function showRandomHero() {
  const withImages = ARTWORKS.filter(w => w.image);
  if (!withImages.length) return;
  const w = withImages[Math.floor(Math.random() * withImages.length)];
  document.getElementById('hero-image').src = w.image;
  document.getElementById('hero-title').textContent = w.title + (w.titleAlt ? ' / ' + w.titleAlt : '');
  const meta = [];
  if (w.artist) meta.push(w.artist);
  if (w.year) meta.push(w.year);
  document.getElementById('hero-meta').innerHTML = meta.join(' · ') +
    ' <span class="chip">' + w.type + '</span> <span class="chip">' + w.sport + '</span>';
  document.getElementById('hero-desc').textContent = w.description || '';
}

// ===== Filter Chips =====
function initChips() {
  const types = [...new Set(ARTWORKS.map(a => a.type))].sort();
  const container = document.getElementById('filter-chips');
  types.forEach(t => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = t;
    chip.addEventListener('click', () => {
      if (activeType === t) {
        activeType = '';
        container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      } else {
        activeType = t;
        container.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.textContent === t));
      }
      applyFilters();
    });
    container.appendChild(chip);
  });
}

// ===== Dropdown Filters =====
function initFilters() {
  const sports = [...new Set(ARTWORKS.map(a => a.sport))].sort();
  const eras = [...new Set(ARTWORKS.map(a => a.era))].sort();
  populateSelect('filter-sport', sports);
  populateSelect('filter-era', eras);
  document.getElementById('search').addEventListener('input', debounce(applyFilters, 200));
  document.getElementById('clear-search').addEventListener('click', clearSearch);
  document.getElementById('filter-sport').addEventListener('change', applyFilters);
  document.getElementById('filter-era').addEventListener('change', applyFilters);
}

function populateSelect(id, opts) {
  const sel = document.getElementById(id);
  opts.forEach(o => { const el = document.createElement('option'); el.value = o; el.textContent = o; sel.appendChild(el); });
}

function applyFilters() {
  const sv = document.getElementById('search').value.toLowerCase().trim();
  document.getElementById('clear-search').classList.toggle('hidden', !sv);
  const sport = document.getElementById('filter-sport').value;
  const era = document.getElementById('filter-era').value;
  renderGallery(ARTWORKS.filter(w => {
    if (!w.image) return false;
    if (activeType && w.type !== activeType) return false;
    if (sv && !(`${w.title} ${w.artist} ${w.sport} ${w.type} ${w.description}`.toLowerCase().includes(sv))) return false;
    if (sport && w.sport !== sport) return false;
    if (era && w.era !== era) return false;
    return true;
  }));
}

function clearSearch() { document.getElementById('search').value = ''; applyFilters(); }

// ===== Gallery =====
function renderGallery(works) {
  const grid = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');
  grid.innerHTML = '';
  if (!works.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  works.forEach(w => {
    if (!w.image) return;
    const card = document.createElement('div');
    card.className = 'card';
    const img = document.createElement('img');
    img.src = w.image; img.alt = w.title; img.loading = 'lazy';
    card.appendChild(img);
    card.addEventListener('click', () => openModal(w));
    grid.appendChild(card);
  });
}

// ===== Modal =====
function initModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => { if (e.target === document.getElementById('modal')) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function openModal(w) {
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modal-image').src = w.image || '';
  document.getElementById('modal-title').textContent = w.title + (w.titleAlt ? ' / ' + w.titleAlt : '');
  const meta = [];
  if (w.artist) meta.push(w.artist);
  if (w.year) meta.push(w.year);
  if (w.technique) meta.push(w.technique);
  if (w.museum) meta.push(w.museum);
  document.getElementById('modal-meta').innerHTML = meta.join(' · ') +
    ' <span class="chip">' + w.type + '</span> <span class="chip">' + w.sport + '</span>';
  document.getElementById('modal-desc').textContent = w.description || '';
  const src = document.getElementById('modal-source');
  if (w.source) { src.href = w.source; src.classList.remove('hidden'); } else { src.classList.add('hidden'); }
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function debounce(fn, ms) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; }
