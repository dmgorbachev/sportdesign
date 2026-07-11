// SportDesign — Gallery Engine

document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  renderGallery(ARTWORKS);
  renderTimeline(ARTWORKS);
  updateStats(ARTWORKS);
  initModal();
});

// ===== State =====
let activeFilters = { search: '', era: '', artist: '', sport: '', type: '' };

// ===== Filter Init =====
function initFilters() {
  const eras = [...new Set(ARTWORKS.map(a => a.era))].sort();
  const artists = [...new Set(ARTWORKS.map(a => a.artist))].sort();
  const sports = [...new Set(ARTWORKS.map(a => a.sport))].sort();
  const types = [...new Set(ARTWORKS.map(a => a.type))].sort();

  populateSelect('filter-era', eras);
  populateSelect('filter-artist', artists);
  populateSelect('filter-sport', sports);
  populateSelect('filter-type', types);

  document.getElementById('search').addEventListener('input', debounce(applyFilters, 200));
  document.getElementById('clear-search').addEventListener('click', clearSearch);
  ['filter-era', 'filter-artist', 'filter-sport', 'filter-type'].forEach(id => {
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

// ===== Filtering =====
function applyFilters() {
  const searchVal = document.getElementById('search').value.toLowerCase().trim();
  document.getElementById('clear-search').classList.toggle('hidden', !searchVal);

  activeFilters = {
    search: searchVal,
    era: document.getElementById('filter-era').value,
    artist: document.getElementById('filter-artist').value,
    sport: document.getElementById('filter-sport').value,
    type: document.getElementById('filter-type').value,
  };

  const filtered = ARTWORKS.filter(matchesFilters);
  renderGallery(filtered);
}

function matchesFilters(a) {
  const { search, era, artist, sport, type } = activeFilters;
  if (search && !(`${a.title} ${a.artist} ${a.sport} ${a.type} ${a.description}`.toLowerCase().includes(search))) return false;
  if (era && a.era !== era) return false;
  if (artist && a.artist !== artist) return false;
  if (sport && a.sport !== sport) return false;
  if (type && a.type !== type) return false;
  return true;
}

function clearSearch() {
  document.getElementById('search').value = '';
  applyFilters();
}

// ===== Gallery Rendering =====
function renderGallery(works) {
  const grid = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');

  grid.innerHTML = '';
  if (works.length === 0) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  works.forEach(w => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img class="card-image" src="${w.image}" alt="${w.title}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22340%22 height=%22260%22><rect fill=%22%2316161a%22 width=%22340%22 height=%22260%22/><text fill=%22%23888892%22 x=%22170%22 y=%22130%22 text-anchor=%22middle%22 font-size=%2214%22>Нет изображения</text></svg>'">
      <div class="card-body">
        <div class="card-title">${w.title}</div>
        <div class="card-artist">${w.artist}, ${w.year || '—'}</div>
        <div class="card-tags">
          <span class="tag">${w.sport}</span>
          <span class="tag">${w.type}</span>
          <span class="tag">${w.era}</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openModal(w));
    grid.appendChild(card);
  });
}

// ===== Timeline =====
function renderTimeline(works) {
  const tl = document.getElementById('timeline');
  const grouped = {};
  works.forEach(w => {
    const era = w.era || 'Без даты';
    if (!grouped[era]) grouped[era] = [];
    grouped[era].push(w);
  });

  const order = ['1920–1940', '1940–1960', '1960–1980', 'Без даты'];
  tl.innerHTML = '';

  order.forEach(era => {
    if (!grouped[era]) return;
    const items = grouped[era].sort((a, b) => (a.year || 9999) - (b.year || 9999));
    const eraDiv = document.createElement('div');
    eraDiv.className = 'tl-era';
    eraDiv.innerHTML = `
      <div class="tl-era-label">${era}</div>
      <div class="tl-era-title">${getEraTitle(era)}</div>
      <div class="tl-era-items">
        ${items.map(w => `
          <div class="tl-item" data-id="${w.id}">
            <img class="tl-item-thumb" src="${w.image}" alt="${w.title}" loading="lazy" onerror="this.style.display='none'">
            <div class="tl-item-info">
              <div class="tl-item-title">${w.title}</div>
              <div class="tl-item-year">${w.artist}, ${w.year || '—'}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    tl.appendChild(eraDiv);
  });

  // Click handlers
  tl.querySelectorAll('.tl-item').forEach(el => {
    el.addEventListener('click', () => {
      const w = works.find(x => x.id === parseInt(el.dataset.id));
      if (w) openModal(w);
    });
  });
}

function getEraTitle(era) {
  const map = {
    '1920–1940': 'Авангард и конструктивизм',
    '1940–1960': 'Соцреализм и монументализм',
    '1960–1980': 'Оттепель и новый визуальный язык',
  };
  return map[era] || '';
}

// ===== Modal =====
function initModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal')) closeModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

function openModal(w) {
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modal-image').src = w.image;
  document.getElementById('modal-image').alt = w.title;
  document.getElementById('modal-title').textContent = w.title + (w.titleAlt ? ` / ${w.titleAlt}` : '');
  document.getElementById('modal-meta').textContent = [
    w.artist, w.year || '—', w.technique,
    w.museum ? `• ${w.museum}` : ''
  ].filter(Boolean).join(' • ');
  document.getElementById('modal-desc').textContent = w.description || '';
  const srcLink = document.getElementById('modal-source');
  if (w.source) { srcLink.href = w.source; srcLink.classList.remove('hidden'); }
  else srcLink.classList.add('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ===== Stats =====
function updateStats(works) {
  document.getElementById('stat-works').textContent = works.length;
  const artists = new Set(works.map(w => w.artist));
  document.getElementById('stat-artists').textContent = artists.size;
}

// ===== Helpers =====
function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
