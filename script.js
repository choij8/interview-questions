// ---------- Storage ----------
const STORAGE_KEY = 'star_bank_questions_v1';

function loadQuestions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.error('Failed to load', e); }
  return seedData();
}

function saveQuestions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.questions));
}

function seedData() {
  const now = Date.now();
  return [
    {
      id: 'seed-1',
      question: 'Tell me about a time you identified and resolved a data quality issue.',
      category: 'Problem Solving',
      company: 'Sydney Trains — ETL duplicate detection',
      situation: 'Roster data feeding the crew dashboards had unexplained duplicate records, which was eroding trust in the reporting.',
      task: 'I needed to find the root cause and build an automated way to catch duplicates before they reached production datasets.',
      action: 'I profiled the source data in Domo, identified the join keys causing fan-out, and built a Magic ETL and Beast Mode validation layer to flag duplicates on ingest, with alerting for anomalies.',
      result: 'Duplicate records dropped to effectively zero in downstream datasets, and the validation pattern became a reusable template for later data quality checks.',
      notes: 'Emphasise the detective work of tracing the join fan-out — it shows structured problem solving, not just a fix.',
      updatedAt: now - 100000
    },
    {
      id: 'seed-2',
      question: 'Describe a project where you built something to prevent a recurring risk.',
      category: 'Ownership',
      company: 'Optus — Data Loss Prevention dashboard',
      situation: 'There was no centralised visibility into data loss prevention incidents, making it hard to spot patterns or act early.',
      task: 'I was asked to design a dashboard giving the security team a real-time view of DLP events and trends.',
      action: 'I built the dashboard end-to-end, defining the metrics that mattered, structuring the data pipeline, and iterating on the design with stakeholder feedback.',
      result: 'The team gained a single source of truth for DLP activity, which sped up incident triage and became part of their regular reporting cadence.',
      notes: 'Good one for "ownership" or "initiative" style prompts — highlight that this wasn\'t assigned in detail, I shaped the approach.',
      updatedAt: now - 50000
    }
  ];
}

// ---------- State ----------
const state = {
  questions: loadQuestions(),
  search: '',
  activeCategory: null,
  sort: 'recent',
  editingId: null,
  practiceQueue: [],
  practiceIndex: 0
};

// ---------- Elements ----------
const el = {
  list: document.getElementById('list'),
  emptyState: document.getElementById('emptyState'),
  statsRow: document.getElementById('statsRow'),
  categoryChips: document.getElementById('categoryChips'),
  searchInput: document.getElementById('searchInput'),
  sortSelect: document.getElementById('sortSelect'),
  newBtn: document.getElementById('newBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importBtn: document.getElementById('importBtn'),
  importFile: document.getElementById('importFile'),
  editorOverlay: document.getElementById('editorOverlay'),
  modalEyebrow: document.getElementById('modalEyebrow'),
  closeEditor: document.getElementById('closeEditor'),
  cancelBtn: document.getElementById('cancelBtn'),
  saveBtn: document.getElementById('saveBtn'),
  deleteBtn: document.getElementById('deleteBtn'),
  qQuestion: document.getElementById('qQuestion'),
  qCategory: document.getElementById('qCategory'),
  qCompany: document.getElementById('qCompany'),
  qSituation: document.getElementById('qSituation'),
  qTask: document.getElementById('qTask'),
  qAction: document.getElementById('qAction'),
  qResult: document.getElementById('qResult'),
  qNotes: document.getElementById('qNotes'),
  categoryList: document.getElementById('categoryList'),
  practiceBtn: document.getElementById('practiceBtn'),
  practiceOverlay: document.getElementById('practiceOverlay'),
  practiceBody: document.getElementById('practiceBody'),
  closePractice: document.getElementById('closePractice'),
  revealBtn: document.getElementById('revealBtn'),
  nextBtn: document.getElementById('nextBtn')
};

// ---------- Helpers ----------
function uid() { return 'q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8); }

function getCategories() {
  const set = new Set(state.questions.map(q => q.category).filter(Boolean));
  return Array.from(set).sort();
}

function starFilledCount(q) {
  return ['situation', 'task', 'action', 'result'].filter(k => q[k] && q[k].trim()).length;
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------- Rendering ----------
function render() {
  renderStats();
  renderChips();
  renderList();
}

function renderStats() {
  const total = state.questions.length;
  const complete = state.questions.filter(q => starFilledCount(q) === 4).length;
  const incomplete = total - complete;
  el.statsRow.innerHTML = `
    <span class="stat-pill"><b>${total}</b> total questions</span>
    <span class="stat-pill"><b>${complete}</b> complete records</span>
    <span class="stat-pill ${incomplete ? 'warn' : ''}"><b>${incomplete}</b> need STAR fields</span>
  `;
}

function renderChips() {
  const cats = getCategories();
  el.categoryChips.innerHTML = cats.map(c => `
    <button class="chip ${state.activeCategory === c ? 'active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>
  `).join('');
  el.categoryChips.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const cat = chip.dataset.cat;
      state.activeCategory = state.activeCategory === cat ? null : cat;
      render();
    });
  });

  el.categoryList.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">`).join('');
}

function getFilteredSorted() {
  let list = [...state.questions];

  if (state.activeCategory) {
    list = list.filter(q => q.category === state.activeCategory);
  }

  if (state.search.trim()) {
    const term = state.search.toLowerCase();
    list = list.filter(q =>
      [q.question, q.category, q.company, q.situation, q.task, q.action, q.result]
        .some(f => (f || '').toLowerCase().includes(term))
    );
  }

  if (state.sort === 'recent') {
    list.sort((a, b) => b.updatedAt - a.updatedAt);
  } else if (state.sort === 'az') {
    list.sort((a, b) => (a.question || '').localeCompare(b.question || ''));
  } else if (state.sort === 'incomplete') {
    list.sort((a, b) => starFilledCount(a) - starFilledCount(b));
  }

  return list;
}

function renderList() {
  const list = getFilteredSorted();
  el.emptyState.hidden = list.length !== 0;
  el.list.innerHTML = list.map(cardHtml).join('');

  el.list.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openEditor(card.dataset.id));
  });
}

function cardHtml(q) {
  const seg = (key, label) => {
    const filled = q[key] && q[key].trim();
    return `<span class="star-seg ${filled ? 'filled-' + key[0] : ''}">${label}</span>`;
  };
  const previewSource = q.situation || q.action || q.task || q.result || 'No STAR details added yet — click to fill this in.';
  return `
    <div class="card" data-id="${q.id}">
      <div class="card-top">
        <p class="card-question">${escapeHtml(q.question) || '<em>Untitled question</em>'}</p>
        <div class="star-completeness">
          ${seg('situation', 'S')}${seg('task', 'T')}${seg('action', 'A')}${seg('result', 'R')}
        </div>
      </div>
      <div class="card-meta">
        ${q.category ? `<span class="category-tag">${escapeHtml(q.category)}</span>` : ''}
        ${q.company ? `<span class="company-tag">${escapeHtml(q.company)}</span>` : ''}
      </div>
      <p class="card-preview">${escapeHtml(previewSource)}</p>
    </div>
  `;
}

// ---------- Editor ----------
function openEditor(id) {
  state.editingId = id || null;
  const q = id ? state.questions.find(x => x.id === id) : null;

  el.modalEyebrow.textContent = q ? 'EDIT RECORD' : 'NEW RECORD';
  el.deleteBtn.hidden = !q;

  el.qQuestion.value = q?.question || '';
  el.qCategory.value = q?.category || '';
  el.qCompany.value = q?.company || '';
  el.qSituation.value = q?.situation || '';
  el.qTask.value = q?.task || '';
  el.qAction.value = q?.action || '';
  el.qResult.value = q?.result || '';
  el.qNotes.value = q?.notes || '';

  el.editorOverlay.hidden = false;
  setTimeout(() => el.qQuestion.focus(), 50);
}

function closeEditor() {
  el.editorOverlay.hidden = true;
  state.editingId = null;
}

function saveRecord() {
  const question = el.qQuestion.value.trim();
  if (!question) {
    el.qQuestion.focus();
    return;
  }

  const data = {
    question,
    category: el.qCategory.value.trim(),
    company: el.qCompany.value.trim(),
    situation: el.qSituation.value.trim(),
    task: el.qTask.value.trim(),
    action: el.qAction.value.trim(),
    result: el.qResult.value.trim(),
    notes: el.qNotes.value.trim(),
    updatedAt: Date.now()
  };

  if (state.editingId) {
    const idx = state.questions.findIndex(q => q.id === state.editingId);
    if (idx !== -1) state.questions[idx] = { ...state.questions[idx], ...data };
  } else {
    state.questions.unshift({ id: uid(), ...data });
  }

  saveQuestions();
  closeEditor();
  render();
}

function deleteRecord() {
  if (!state.editingId) return;
  if (!confirm('Delete this question? This can\'t be undone.')) return;
  state.questions = state.questions.filter(q => q.id !== state.editingId);
  saveQuestions();
  closeEditor();
  render();
}

// ---------- Practice mode ----------
function openPractice() {
  state.practiceQueue = shuffle([...state.questions]);
  state.practiceIndex = 0;
  if (state.practiceQueue.length === 0) {
    el.practiceBody.innerHTML = `<p class="practice-empty">Add a few questions first — practice mode pulls from your bank.</p>`;
  } else {
    renderPracticeCard();
  }
  el.practiceOverlay.hidden = false;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderPracticeCard() {
  const q = state.practiceQueue[state.practiceIndex];
  if (!q) {
    el.practiceBody.innerHTML = `<p class="practice-empty">That's every question in your bank — nice work. Close this and go again anytime.</p>`;
    return;
  }
  el.practiceBody.innerHTML = `
    <p class="practice-question">${escapeHtml(q.question)}</p>
    <div class="practice-meta">
      ${q.category ? `<span class="category-tag">${escapeHtml(q.category)}</span>` : ''}
    </div>
    <div class="practice-star" id="practiceStar">
      ${starBlock('SITUATION', q.situation)}
      ${starBlock('TASK', q.task)}
      ${starBlock('ACTION', q.action)}
      ${starBlock('RESULT', q.result)}
    </div>
  `;
}

function starBlock(label, value) {
  return `<div class="practice-star-block"><b>${label}</b>${escapeHtml(value) || '<em>Not filled in yet</em>'}</div>`;
}

function closePractice() {
  el.practiceOverlay.hidden = true;
}

// ---------- Export / Import ----------
function exportJson() {
  const blob = new Blob([JSON.stringify(state.questions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `star-bank-export-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data)) throw new Error('Expected an array');
      const withIds = data.map(q => ({ id: q.id || uid(), updatedAt: q.updatedAt || Date.now(), ...q }));
      state.questions = [...withIds, ...state.questions];
      saveQuestions();
      render();
    } catch (e) {
      alert('Could not import that file — make sure it\'s a JSON export from this app.');
    }
  };
  reader.readAsText(file);
}

// ---------- Event listeners ----------
el.newBtn.addEventListener('click', () => openEditor(null));
el.closeEditor.addEventListener('click', closeEditor);
el.cancelBtn.addEventListener('click', closeEditor);
el.saveBtn.addEventListener('click', saveRecord);
el.deleteBtn.addEventListener('click', deleteRecord);
el.editorOverlay.addEventListener('click', e => { if (e.target === el.editorOverlay) closeEditor(); });

el.searchInput.addEventListener('input', e => { state.search = e.target.value; renderList(); });
el.sortSelect.addEventListener('change', e => { state.sort = e.target.value; renderList(); });

el.exportBtn.addEventListener('click', exportJson);
el.importBtn.addEventListener('click', () => el.importFile.click());
el.importFile.addEventListener('change', e => {
  if (e.target.files[0]) importJson(e.target.files[0]);
  e.target.value = '';
});

el.practiceBtn.addEventListener('click', openPractice);
el.closePractice.addEventListener('click', closePractice);
el.practiceOverlay.addEventListener('click', e => { if (e.target === el.practiceOverlay) closePractice(); });
el.revealBtn.addEventListener('click', () => {
  document.getElementById('practiceStar')?.classList.toggle('shown');
});
el.nextBtn.addEventListener('click', () => {
  state.practiceIndex++;
  renderPracticeCard();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!el.editorOverlay.hidden) closeEditor();
    if (!el.practiceOverlay.hidden) closePractice();
  }
});

// ---------- Init ----------
render();
