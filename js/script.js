// SportDesign — Gallery Engine (minimal, Julien Calot style)

document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  renderGallery(ARTWORKS);
  initModal();
});

// ===== State =====
let activeFilters = { search: '', type: '', sport: '', era: '' };

// ===== Filter Init =====
function initFilters() {
  const types = [...new Set(ARTWORKS.map(a => a.type))].sort();
  const sports = [...new Set(ARTWORKS.map(a => a.sport))].sort();
  const eras = [...new Set(ARTWORKS.map(a => a.era))].sort();

  populateSelect('filter-type', types);
  populateSelect('filter-sport', sports);
  populateSelect('filter-era', eras);

  document.getElementById('search').addEventListener('input', debounce(applyFilters, 200));
  document.getElementById('clear-search').addEventListener('click', clearSearch);
  ['filter-type', 'filter-sport', 'filter-era'].forEach(id => {
    document.getElementById(id).addEventListener('change', applyFilters);
  });
}

function populateSelect(id, options) {
  const sel = document.getElementById(id);
  options.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt; el.textContent = opt;
    sel.appendChild(el);
  });
}

function applyFilters() {
  const sv = document.getElementById('search').value.toLowerCase().trim();
  document.getElementById('clear-search').classList.toggle('hidden', !sv);
  activeFilters = {
    search: sv,
    type: document.getElementById('filter-type').value,
    sport: document.getElementById('filter-sport').value,
    era: document.getElementById('filter-era').value,
  };
  renderGallery(ARTWORKS.filter(matchesFilters));
}

function matchesFilters(a) {
  const { search, type, sport, era } = activeFilters;
  if (search && !(`${a.title} ${a.artist} ${a.sport} ${a.type} ${a.description}`.toLowerCase().includes(search))) return false;
  if (type && a.type !== type) return false;
  if (sport && a.sport !== sport) return false;
  if (era && a.era !== era) return false;
  return true;
}

function clearSearch() {
  document.getElementById('search').value = '';
  applyFilters();
}

// ===== Gallery — pure image grid =====
function renderGallery(works) {
  const grid = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');
  grid.innerHTML = '';
  if (!works.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  works.forEach(w => {
    // Skip works without images
    if (!w.image) return;
    const card = document.createElement('div');
    card.className = 'card';
    const img = document.createElement('img');
    img.src = w.image || '';
    img.alt = w.title;
    img.loading = 'lazy';
    img.onerror = function() {
      this.style.display = 'none';
      card.style.background = '#e8e8e8';
    };
    card.appendChild(img);
    card.addEventListener('click', () => openModal(w));
    grid.appendChild(card);
  });
}

// ===== Modal =====
function initModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === document.getElementById('modal')) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function openModal(w) {
  const overlay = document.getElementById('modal');
  overlay.classList.remove('hidden');

  document.getElementById('modal-image').src = w.image || '';
  document.getElementById('modal-image').alt = w.title;

  document.getElementById('modal-title').textContent = w.title + (w.titleAlt ? ' / ' + w.titleAlt : '');

  // Meta line: artist, year, technique, museum
  const meta = [];
  if (w.artist) meta.push(w.artist);
  if (w.year) meta.push(w.year);
  if (w.technique) meta.push(w.technique);
  if (w.museum) meta.push(w.museum);
  document.getElementById('modal-meta').innerHTML = meta.join(' · ') +
    ' <span class="tag">' + w.type + '</span> <span class="tag">' + w.sport + '</span>';

  document.getElementById('modal-desc').textContent = w.description || '';

  const src = document.getElementById('modal-source');
  if (w.source) {
    src.href = w.source;
    src.classList.remove('hidden');
  } else {
    src.classList.add('hidden');
  }

  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
