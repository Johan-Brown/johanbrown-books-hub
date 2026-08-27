const state = {
  categories: [],
  query: ''
};

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function categoryInitials(title) {
  const words = String(title).replace(/[_-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '📚';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getCategoryUrl(cat, folder) {
  if (cat.url) return cat.url;
  // Step out of johanbrown-books-hub repo directory to sibling repo directory on GitHub Pages
  return `../${folder}/`;
}

function renderCategoryIcon(cat, folder) {
  if (cat.logo) {
    const src = (cat.logo.startsWith('http://') || cat.logo.startsWith('https://') || cat.logo.startsWith('/'))
      ? cat.logo
      : `../${folder}/${cat.logo}`;
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(cat.title)} logo" class="card-logo-img">`;
  }
  if (cat.icon) {
    return `<span class="card-emoji-icon">${escapeHtml(cat.icon)}</span>`;
  }
  return escapeHtml(categoryInitials(cat.title));
}

async function loadJson(file) {
  const response = await fetch(`${file}?t=${Date.now()}`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Could not load ${file} (${response.status})`);
  return response.json();
}

async function fetchBookCount(cat, folder) {
  try {
    const baseUrl = cat.url ? cat.url.replace(/\/$/, '') : `../${folder}`;
    const data = await loadJson(`${baseUrl}/books.json`);
    const books = Array.isArray(data) ? data : (data.books || []);
    const published = books.filter(b => b.status !== 'draft' && b.status !== 'hidden');
    return published.length;
  } catch (_) {
    return null;
  }
}

async function renderCategories() {
  const grid = $('#categoriesGrid');
  const query = state.query.trim().toLowerCase();

  const filtered = state.categories
    .filter(cat => cat.status !== 'draft' && cat.status !== 'hidden')
    .filter(cat => {
      if (!query) return true;
      const titleMatch = String(cat.title || '').toLowerCase().includes(query);
      const descMatch = String(cat.description || '').toLowerCase().includes(query);
      const folderMatch = String(cat.folder || '').toLowerCase().includes(query);
      return titleMatch || descMatch || folderMatch;
    })
    .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

  $('#categoryCount').textContent = query
    ? `${filtered.length} matching categor${filtered.length === 1 ? 'y' : 'ies'}`
    : `${filtered.length} categor${filtered.length === 1 ? 'y' : 'ies'} in this hub`;

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty">No categories found${query ? ` for “${escapeHtml(state.query)}”` : ''}.</div>`;
    return;
  }

  const cardsHtml = await Promise.all(filtered.map(async (cat) => {
    const title = escapeHtml(cat.title || 'Untitled Category');
    const desc = escapeHtml(cat.description || 'Interactive digital storybooks collection.');
    const folder = cat.folder || cat.slug || '';
    const href = getCategoryUrl(cat, folder);
    const count = await fetchBookCount(cat, folder);
    const countLabel = count !== null ? `📖 ${count} Book${count === 1 ? '' : 's'}` : '📖 Explore Library';

    return `
      <article class="category-card">
        <div class="card-header">
          <span class="card-badge">${escapeHtml(cat.badge || 'CATEGORY')}</span>
          <div class="card-icon-box" aria-hidden="true">${renderCategoryIcon(cat, folder)}</div>
        </div>
        <div class="card-body">
          <h3 class="category-title">${title}</h3>
          <p class="category-description">${desc}</p>
          <div class="card-meta">
            <span class="book-count-tag">${countLabel}</span>
            <a class="open-btn" href="${href}">Explore Collection <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </article>`;
  }));

  grid.innerHTML = cardsHtml.join('');
}

function showError(error) {
  console.error(error);
  $('#status').textContent = 'The Books Hub could not be loaded. Please ensure categories.json is generated.';
}

async function init() {
  $('#year').textContent = new Date().getFullYear();
  $('#searchInput').addEventListener('input', (event) => {
    state.query = event.target.value;
    renderCategories();
  });

  try {
    const data = await loadJson('./categories.json');
    state.categories = Array.isArray(data) ? data : (data.categories || []);
    await renderCategories();
    $('#status').classList.add('hidden');
  } catch (error) {
    showError(error);
  }
}

document.addEventListener('DOMContentLoaded', init);
