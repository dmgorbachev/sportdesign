// SportDesign — Gallery Engine
// ===== Preloader =====
(function() {
  const fill = document.getElementById('preloader-fill');
  const pct = document.getElementById('preloader-pct');
  const loader = document.getElementById('preloader');
  let progress = 0;
  
  function tick() {
    // Accelerate: fast 0-60, slower 60-90, crawl 90-100
    if (progress < 60) progress += 3 + Math.random() * 5;
    else if (progress < 90) progress += 1 + Math.random() * 2;
    else if (progress < 100) progress += 0.3;
    if (progress > 100) progress = 100;
    
    fill.style.width = progress + '%';
    pct.textContent = Math.round(progress) + '%';
    
    if (progress < 100) {
      setTimeout(tick, 40 + Math.random() * 60);
    } else {
      setTimeout(() => loader.classList.add('hide'), 200);
      setTimeout(() => loader.remove(), 600);
    }
  }
  
  tick();
})();

document.addEventListener('DOMContentLoaded', () => {
  initChips();
  initFilters();
  showRandomHero();
  renderGallery(ARTWORKS);
  initModal();
  document.getElementById('hero-random').addEventListener('click', showRandomHero);
  document.getElementById('hero-open-gallery').addEventListener('click', () => {
    document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
  });
});

// ===== State =====
let activeType = '';

// ===== Hero =====
function showRandomHero() {
  const withImages = ARTWORKS.filter(w => w.image);
  if (!withImages.length) return;
  const w = withImages[Math.floor(Math.random() * withImages.length)];
  document.getElementById('hero-image').src = w.image;
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

  // "Все" chip
  const allChip = document.createElement('button');
  allChip.className = 'chip active';
  allChip.textContent = 'Все';
  allChip.addEventListener('click', () => {
    activeType = '';
    container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    allChip.classList.add('active');
    applyFilters();
  });
  container.appendChild(allChip);

  types.forEach(t => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = t;
    chip.addEventListener('click', () => {
      if (activeType === t) {
        activeType = '';
        container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        allChip.classList.add('active');
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
let modalWorks = [];
let modalIndex = 0;
let touchStartX = 0;
let touchStartY = 0;

function initModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => { if (e.target === document.getElementById('modal')) closeModal(); });
  document.getElementById('modal-prev').addEventListener('click', () => navigateModal(-1));
  document.getElementById('modal-next').addEventListener('click', () => navigateModal(1));

  // Keyboard arrows
  document.addEventListener('keydown', e => {
    if (document.getElementById('modal').classList.contains('hidden')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') navigateModal(-1);
    if (e.key === 'ArrowRight') navigateModal(1);
  });

  // Touch swipe on entire modal overlay
  const modalOverlayEl = document.getElementById('modal');
  modalOverlayEl.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  modalOverlayEl.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // Swipe down to close
    if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
      closeModal();
      return;
    }
    // Swipe left/right to navigate
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      navigateModal(dx > 0 ? -1 : 1);
    }
  });
}

function navigateModal(dir) {
  const newIdx = modalIndex + dir;
  if (newIdx < 0 || newIdx >= modalWorks.length) return;
  modalIndex = newIdx;
  updateModalContent(modalWorks[modalIndex]);
}

function openModal(w) {
  // Get currently visible artworks
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
  // Apply current filters
  const sv = document.getElementById('search')?.value?.toLowerCase().trim() || '';
  const sport = document.getElementById('filter-sport')?.value || '';
  const era = document.getElementById('filter-era')?.value || '';
  return withImages.filter(w => {
    if (activeType && w.type !== activeType) return false;
    if (sv && !(`${w.title} ${w.artist} ${w.sport} ${w.type} ${w.description}`.toLowerCase().includes(sv))) return false;
    if (sport && w.sport !== sport) return false;
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
  document.getElementById('modal-meta').innerHTML = meta.join(' · ') +
    ' <span class="chip">' + w.type + '</span> <span class="chip">' + w.sport + '</span>';
  document.getElementById('modal-desc').textContent = w.description || '';
  const src = document.getElementById('modal-source');
  if (w.source) { src.href = w.source; src.classList.remove('hidden'); } else { src.classList.add('hidden'); }
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.style.overflow = '';
}

function debounce(fn, ms) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; }
