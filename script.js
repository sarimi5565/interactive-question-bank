// Interactive Question Bank (GitHub Pages edition)
(() => {
  const SHEET_CSV = window.IQB_SHEET_CSV || "https://docs.google.com/spreadsheets/d/e/2PACX-1vSmH8dnXMAAwO35j4g0o8mWHnatyeC5CSQ08fwuhJFzU-hXsYBQ3pRAp1hGgdpNLWlKHo2qlATIuU1H/pub?output=csv";
  const PAGE_SIZE = 12;

  const state = {
    all: [],
    filtered: [],
    page: 1,
    query: '',
    topic: '',
    subtopic: '',
    difficulty: '',
  };

  const el = {
    grid: document.getElementById('grid'),
    empty: document.getElementById('empty'),
    search: document.getElementById('search'),
    topic: document.getElementById('topic'),
    subtopic: document.getElementById('subtopic'),
    difficulty: document.getElementById('difficulty'),
    clear: document.getElementById('clear'),
    random: document.getElementById('random'),
    prev: document.getElementById('prev'),
    next: document.getElementById('next'),
    pageInfo: document.getElementById('pageInfo'),
  };

  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t=setTimeout(() => fn(...a), ms); }; };

  function parseCSV(text) {
    const rows = [];
    let cur = [], field = '', inQuotes = false;
    for (let i=0;i<text.length;i++) {
      const c = text[i], n = text[i+1];
      if (c === '"') {
        if (inQuotes && n === '"') { field += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        cur.push(field); field = '';
      } else if ((c === '\n' || c === '\r') && !inQuotes) {
        if (field !== '' || cur.length) { cur.push(field); rows.push(cur); cur=[]; field=''; }
      } else field += c;
    }
    if (field !== '' || cur.length) { cur.push(field); rows.push(cur); }
    return rows;
  }

  function toObjects(rows) {
    const headers = rows.shift().map(h => h.trim());
    return rows.filter(r => r.some(x => (x||'').trim() !== '')).map(r => {
      const o = {};
      headers.forEach((h,i) => o[h] = (r[i]||'').trim());
      const tags = o.tags || o.tag || '';
      o.tags = tags ? tags.split(',').map(s => s.trim()).filter(Boolean) : [];
      const qi = o.question_images || o.question_image || '';
      o.question_images = qi ? qi.split(',').map(s => s.trim()).filter(Boolean) : [];
      const si = o.solution_images || o.solution_image || '';
      o.solution_images = si ? si.split(',').map(s => s.trim()).filter(Boolean) : [];
      o.video_url = o.video_url || o.solution_video_url || '';
      o.difficulty = o.difficulty || '';
      return o;
    });
  }

  async function loadData() {
    const cacheKey = 'iqb_cache_csv';
    const cacheTimeKey = 'iqb_cache_time';
    const now = Date.now();
    const cached = sessionStorage.getItem(cacheKey);
    const cachedAt = parseInt(sessionStorage.getItem(cacheTimeKey) || '0', 10);

    if (cached && (now - cachedAt < 30*60*1000)) {
      const rows = parseCSV(cached);
      return toObjects(rows);
    }
    const res = await fetch(SHEET_CSV, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    sessionStorage.setItem(cacheKey, text);
    sessionStorage.setItem(cacheTimeKey, String(now));
    const rows = parseCSV(text);
    return toObjects(rows);
  }

  function buildTopicSubtopicOptions() {
    const topics = Array.from(new Set(state.all.map(q => q.topic).filter(Boolean))).sort();
    el.topic.innerHTML = '<option value=\"\">All</option>' + topics.map(t => `<option>${t}</option>`).join('');
    updateSubtopics();
  }

  function updateSubtopics() {
    const chosen = state.topic;
    const subs = Array.from(new Set(state.all
      .filter(q => !chosen || q.topic === chosen)
      .map(q => q.subtopic).filter(Boolean))).sort();
    el.subtopic.innerHTML = '<option value=\"\">All</option>' + subs.map(s => `<option>${s}</option>`).join('');
  }

  function applyFilters() {
    const q = state.query.toLowerCase();
    state.filtered = state.all.filter(item => {
      const matchesQuery = !q || [
        item.id, item.question_text, item.solution_text, item.topic, item.subtopic, item.difficulty, (item.tags||[]).join(' ')
      ].join(' ').toLowerCase().includes(q);
      const matchesTopic = !state.topic || item.topic === state.topic;
      const matchesSub = !state.subtopic || item.subtopic === state.subtopic;
      const matchesDiff = !state.difficulty || (item.difficulty||'') === state.difficulty;
      return matchesQuery && matchesTopic && matchesSub && matchesDiff;
    });
    state.page = 1;
    render();
  }

  function escapeHTML(s='') {
    return s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function cardHTML(item) {
    const hasText = !!(item.solution_text && item.solution_text.trim());
    const hasImgs = (item.solution_images||[]).length>0;
    const hasVideo = !!(item.video_url && item.video_url.trim());
    const thumb = (item.question_images && item.question_images[0])
      ? `<img alt=\"Question image\" src=\"${item.question_images[0]}\" style=\"max-width:100%;border-radius:.5rem;border:1px solid var(--border);\"/>`
      : `<div class=\"thumb\">${escapeHTML((item.question_text||'').slice(0,160))}${(item.question_text||'').length>160?'…':''}</div>`;
    const tags = (item.tags||[]).map(t => `<span class=\"tag\" data-tag=\"${t}\">#${t}</span>`).join(' ');

    return `
    <article class=\"card\" data-id=\"${item.id}\" aria-label=\"${item.topic||''} • ${item.subtopic||''}\">

      <div class=\"meta\">
        <span>${item.topic||'—'} • ${item.subtopic||'—'}</span>
        <span>•</span>
        <span>${item.difficulty||'—'}</span>
      </div>

      <div class=\"title\">${item.question_text||''}</div>
      ${thumb}
      <div class=\"tags\">${tags}</div>

      <div class=\"bullets\">
        <span class=\"icon\" title=\"Text\">${hasText?'📝':''}</span>
        <span class=\"icon\" title=\"Images\">${hasImgs?'🖼️':''}</span>
        <span class=\"icon\" title=\"Video\">${hasVideo?'🎥':''}</span>
      </div>

      <div class=\"actions\">
        <button class=\"small toggle\" aria-expanded=\"false\">Show solution</button>
      </div>

      <div class=\"solution\" aria-hidden=\"true\"></div>
    </article>`;
  }

  function toggleSolution(card, item) {
    const panel = card.querySelector('.solution');
    const btn = card.querySelector('.toggle');
    const open = panel.classList.toggle('open');
    btn.textContent = open ? 'Hide solution' : 'Show solution';
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open && !panel.dataset.loaded) {
      panel.innerHTML = buildSolutionHTML(item);
      panel.dataset.loaded = '1';
      if (window.MathJax && window.MathJax.typeset) window.MathJax.typeset([panel]);
    }
  }

  function buildSolutionHTML(item) {
    const parts = [];
    if (item.solution_text) parts.push(`<div class=\"solution-text\">${item.solution_text}</div>`);
    (item.solution_images||[]).forEach(src => parts.push(`<img alt=\"Solution image\" src=\"${src}\"/>`));
    if (item.video_url) {
      let id = item.video_url.trim();
      const m = id.match(/[?&]v=([^&]+)/) || id.match(/youtu\\.be\\/([^?&]+)/) || id.match(/youtube\\.com\\/embed\\/([^?&]+)/);
      if (m) id = m[1];
      parts.push(`<iframe src=\"https://www.youtube.com/embed/${id}\" title=\"Solution video\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen></iframe>`);
    }
    return parts.join('\\n');
  }

  el.search.addEventListener('input', debounce(() => { state.query = el.search.value.trim(); applyFilters(); }, 200));
  el.topic.addEventListener('change', () => { state.topic = el.topic.value; updateSubtopics(); applyFilters(); });
  el.subtopic.addEventListener('change', () => { state.subtopic = el.subtopic.value; applyFilters(); });
  el.difficulty.addEventListener('change', () => { state.difficulty = el.difficulty.value; applyFilters(); });
  el.clear.addEventListener('click', () => {
    state.query = ''; state.topic=''; state.subtopic=''; state.difficulty=''; el.search.value=''; el.topic.value=''; updateSubtopics(); el.difficulty.value=''; applyFilters();
  });
  el.random.addEventListener('click', () => {
    if (!state.filtered.length) return;
    const idx = Math.floor(Math.random()*state.filtered.length);
    const id = state.filtered[idx].id;
    const card = document.querySelector(`[data-id=\"${id}\"]`);
    if (card) {
      card.scrollIntoView({ behavior:'smooth', block:'center' });
      const btn = card.querySelector('.toggle');
      const panel = card.querySelector('.solution');
      if (panel && !panel.classList.contains('open')) btn.click();
    }
  });
  el.prev.addEventListener('click', () => { if (state.page>1) { state.page--; render(); } });
  el.next.addEventListener('click', () => {
    const maxPage = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
    if (state.page < maxPage) { state.page++; render(); }
  });

  function render() {
    const start = (state.page-1)*PAGE_SIZE;
    const items = state.filtered.slice(start, start+PAGE_SIZE);
    el.grid.innerHTML = items.map(cardHTML).join('');
    el.empty.hidden = state.filtered.length > 0;
    const maxPage = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
    el.pageInfo.textContent = `Page ${state.page} of ${maxPage}`;
    el.prev.disabled = state.page <= 1;
    el.next.disabled = state.page >= maxPage;
    items.forEach(item => {
      const card = document.querySelector(`[data-id=\"${item.id}\"]`);
      const btn = card.querySelector('.toggle');
      btn.addEventListener('click', () => toggleSolution(card, item));
      card.querySelectorAll('.tag').forEach(tagEl => tagEl.addEventListener('click', () => {
        state.query = tagEl.dataset.tag;
        el.search.value = state.query;
        applyFilters();
      }));
    });
  }

  (async () => {
    try {
      state.all = await loadData();
      buildTopicSubtopicOptions();
      applyFilters();
    } catch (e) {
      document.getElementById('grid').innerHTML = `<div class='empty'>Failed to load data: ${e}</div>`;
    }
  })();

})();
