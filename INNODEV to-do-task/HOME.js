/* dashboard.js - Notes dashboard using chrome.storage.local
   - Place this in dashboard.html (include via <script src="dashboard.js"></script>)
   - Expects markup IDs used in your dashboard.html: #search, #folders, #notes-area, #pinned-area, #notes-count, #new-note-btn, #open-popup, #clear-all, #modal and modal inputs (#m-title, #m-body, #m-folder, #m-pin, #m-save, #modal-close, #m-delete)
   - Requires "storage" permission in manifest.json
*/

(() => {
  const KEY = 'notenexus_notes';

  // ---- storage helpers (promise) ----
  function readNotes() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ [KEY]: [] }, (res) => resolve(res[KEY] || []));
    });
  }
  function writeNotes(notes) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [KEY]: notes }, () => resolve());
    });
  }

  // ---- DOM refs ----
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  const searchEl = qs('#search');
  const foldersEl = qs('#folders');
  const notesArea = qs('#notes-area');
  const pinnedArea = qs('#pinned-area');
  const notesCount = qs('#notes-count');
  const newBtn = qs('#new-note-btn');
  const quickBtn = qs('#open-popup');
  const clearAllBtn = qs('#clear-all');

  const modal = qs('#modal');
  const modalTitle = qs('#modal-title');
  const mTitle = qs('#m-title');
  const mBody = qs('#m-body');
  const mFolder = qs('#m-folder');
  const mPin = qs('#m-pin');
  const mSave = qs('#m-save');
  const mClose = qs('#modal-close');
  const mDelete = qs('#m-delete');

  let currentEditId = null;
  let activeFolder = 'All';

  // ---- utilities ----
  function getUniqueFolders(notes) {
    const set = new Set(['All']);
    notes.forEach(n => set.add(n.folder || 'General'));
    return Array.from(set);
  }

  function makeNote(title, body, folder = 'General') {
    return { id: Date.now(), title: title || 'Untitled', body: body || '', folder, pinned: false, updated: new Date().toISOString(), image: null };
  }

  // ---- rendering ----
  function createNoteCard(note) {
    const el = document.createElement('article');
    el.className = 'note card';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';

    // meta
    const meta = document.createElement('div');
    meta.className = 'meta';
    const title = document.createElement('div');
    title.style.fontWeight = '600';
    title.textContent = note.title;
    const time = document.createElement('div');
    time.style.fontSize = '12px';
    time.style.color = 'var(--muted)';
    time.textContent = new Date(note.updated).toLocaleString();
    meta.appendChild(title);
    meta.appendChild(time);

    // image (if exists)
    if (note.image) {
      const imgWrap = document.createElement('div');
      imgWrap.style.margin = '8px 0';
      const img = document.createElement('img');
      img.src = note.image;
      img.alt = note.title || 'note image';
      img.style.maxWidth = '100%';
      img.style.borderRadius = '8px';
      img.style.display = 'block';
      imgWrap.appendChild(img);
      el.appendChild(meta);
      el.appendChild(imgWrap);
    } else {
      el.appendChild(meta);
    }

    // body
    const body = document.createElement('div');
    body.className = 'body';
    body.style.whiteSpace = 'pre-wrap';
    body.textContent = note.body || '';
    el.appendChild(body);

    // tags
    const tags = document.createElement('div');
    tags.className = 'tags';
    tags.textContent = note.folder + (note.pinned ? ' • Pinned' : '');
    el.appendChild(tags);

    // actions
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.gap = '6px';
    actions.style.marginTop = '8px';

    const pinBtn = document.createElement('button');
    pinBtn.className = 'icon-btn';
    pinBtn.textContent = note.pinned ? 'Unpin' : 'Pin';
    pinBtn.onclick = (e) => { e.stopPropagation(); togglePin(note.id); };

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.textContent = 'Edit';
    editBtn.onclick = (e) => { e.stopPropagation(); openEdit(note.id); };

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn';
    delBtn.style.color = 'var(--danger)';
    delBtn.textContent = 'Delete';
    delBtn.onclick = (e) => { e.stopPropagation(); deleteNote(note.id); };

    actions.appendChild(pinBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    el.appendChild(actions);

    el.onclick = () => openEdit(note.id);
    return el;
  }

  async function render() {
    const notes = await readNotes();
    const q = (searchEl?.value || '').toLowerCase().trim();

    // folders
    const folders = getUniqueFolders(notes);
    if (foldersEl) {
      foldersEl.innerHTML = '';
      folders.forEach(f => {
        const btn = document.createElement('button');
        btn.textContent = f;
        btn.className = 'inline small';
        btn.style.border = 'none';
        btn.style.background = activeFolder === f ? 'linear-gradient(90deg,#eef2ff,#eef6ff)' : 'transparent';
        btn.style.padding = '6px 8px';
        btn.style.borderRadius = '8px';
        btn.style.cursor = 'pointer';
        btn.onclick = () => { activeFolder = f; render(); };
        foldersEl.appendChild(btn);
      });
    }

    // filter notes
    let filtered = notes.filter(n => (activeFolder === 'All' ? true : n.folder === activeFolder));
    if (q) {
      filtered = filtered.filter(n => (n.title + ' ' + n.body + ' ' + n.folder).toLowerCase().includes(q));
    }

    // pinned & normal
    const pinned = filtered.filter(n => n.pinned);
    const normal = filtered.filter(n => !n.pinned);

    // counts
    if (notesCount) notesCount.textContent = `${filtered.length} notes`;

    // pinned
    if (pinnedArea) {
      pinnedArea.innerHTML = '';
      if (pinned.length) {
        const heading = document.createElement('div');
        heading.className = 'sub';
        heading.textContent = 'Pinned';
        pinnedArea.appendChild(heading);
        const grid = document.createElement('div');
        grid.className = 'grid';
        pinned.forEach(n => grid.appendChild(createNoteCard(n)));
        pinnedArea.appendChild(grid);
      }
    }

    // notes area
    if (notesArea) {
      notesArea.innerHTML = '';
      if (!filtered.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No notes yet. Use Quick Note or New Note to add.';
        notesArea.appendChild(empty);
      } else {
        const allGrid = document.createElement('div');
        allGrid.className = 'grid';
        normal.forEach(n => allGrid.appendChild(createNoteCard(n)));
        notesArea.appendChild(allGrid);
      }
    }
  }

  // ---- CRUD operations ----
  async function togglePin(id) {
    const notes = await readNotes();
    const updated = notes.map(n => n.id === id ? ({ ...n, pinned: !n.pinned, updated: new Date().toISOString() }) : n);
    await writeNotes(updated);
    await render();
  }

  async function deleteNote(id) {
    if (!confirm('Delete this note?')) return;
    const notes = await readNotes();
    const filtered = notes.filter(n => n.id !== id);
    await writeNotes(filtered);
    await render();
  }

  async function openEdit(id) {
    const notes = await readNotes();
    const note = notes.find(n => n.id === id);
    if (!note) return;
    currentEditId = id;
    modalTitle.textContent = 'Edit Note';
    mTitle.value = note.title || '';
    mBody.value = note.body || '';
    mFolder.value = note.folder || 'General';
    mPin.checked = !!note.pinned;
    mDelete.style.display = '';
    modal.style.display = 'flex';
  }

  async function saveEdit() {
    const notes = await readNotes();
    if (currentEditId) {
      const updated = notes.map(n => n.id === currentEditId ? ({
        ...n,
        title: mTitle.value || 'Untitled',
        body: mBody.value,
        folder: mFolder.value,
        pinned: !!mPin.checked,
        updated: new Date().toISOString()
      }) : n);
      await writeNotes(updated);
    } else {
      const note = makeNote(mTitle.value || 'Untitled', mBody.value, mFolder.value);
      note.pinned = !!mPin.checked;
      const newNotes = [note, ...notes];
      await writeNotes(newNotes);
    }
    closeModal();
    await render();
  }

  async function deleteFromModal() {
    if (!confirm('Delete this note?')) return;
    const notes = await readNotes();
    const filtered = notes.filter(n => n.id !== currentEditId);
    await writeNotes(filtered);
    closeModal();
    await render();
  }
  function closeModal() { modal.style.display = 'none'; currentEditId = null; }

  function openNew() {
    currentEditId = null;
    modalTitle.textContent = 'Create Note';
    mTitle.value = '';
    mBody.value = '';
    mFolder.value = 'General';
    mPin.checked = false;
    mDelete.style.display = 'none';
    modal.style.display = 'flex';
  }

  function openQuick() {
    // open popup.html (quick note) window
    if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
      // not appropriate for quick popup, but try fallback:
      window.open('popup.html', 'quicknote', 'width=360,height=420');
    } else {
      window.open('popup.html', 'quicknote', 'width=360,height=420');
    }
  }

  async function clearAll() {
    if (confirm('Clear ALL notes? This cannot be undone.')) {
      await writeNotes([]);
      await render();
    }
  }

  // ---- event wiring ----
  if (searchEl) searchEl.addEventListener('input', () => render());
  if (newBtn) newBtn.addEventListener('click', openNew);
  if (quickBtn) quickBtn.addEventListener('click', openQuick);
  if (mSave) mSave.addEventListener('click', saveEdit);
  if (mClose) mClose.addEventListener('click', closeModal);
  if (mDelete) mDelete.addEventListener('click', deleteFromModal);
  if (clearAllBtn) clearAllBtn.addEventListener('click', clearAll);

  // ---- initial sample (only if empty) ----
  (async () => {
    const notes = await readNotes();
    if (!notes.length) {
      const sample = [
        { id: Date.now()-3000, title: 'Welcome to NoteNexus', body: 'This is a sample note. Use Quick Note to add more.', folder: 'General', pinned: true, updated: new Date().toISOString(), image: null },
        { id: Date.now()-2000, title: 'Study Idea', body: 'AM modulation short summary...', folder: 'Study', pinned: false, updated: new Date().toISOString(), image: null }
      ];
      await writeNotes(sample);
    }
    await render();
  })();

  // ---- cross-page updates ----

  // expose refresh function so same-window scripts can call it
  window.refreshNotes = render;

  // chrome.storage.onChanged listener (reliable between extension pages)
  if (chrome && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[KEY]) {
        render();
      }
    });
  }

  // extra: BroadcastChannel (fast notification)
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('notenexus_channel');
      bc.onmessage = (ev) => {
        if (ev && ev.data === 'notes-updated') render();
      };
      window._notenexus_bc = bc;
    }
  } catch (err) { console.warn('bc error', err); }

  console.log('dashboard.js ready — listening for storage updates.');
})();
