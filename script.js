/* script.js - Adds a lightweight NoteNexus app overlay to your landing page.
   - Stores notes in localStorage under key "notenexus_notes".
   - Full CRUD + pin + folders + search.
   - No external libs required.
*/

(() => {
  const STORAGE_KEY = 'notenexus_notes';

  /* ---------- Helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const create = (tag, props = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'cls') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    });
    children.forEach(c => el.appendChild(c));
    return el;
  };

  function readNotes() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function writeNotes(notes) { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); }
  function newNoteObj(title, body, folder) {
    return { id: Date.now(), title: title || 'Untitled', body: body || '', folder: folder || 'General', pinned: false, updated: new Date().toISOString() };
  }

  /* ---------- Build overlay UI ---------- */
  function buildOverlay() {
    if ($('#nn-overlay')) return $('#nn-overlay'); // already present

    // backdrop / overlay
    const overlay = create('div', { id: 'nn-overlay', cls: 'nn-overlay' });
    Object.assign(overlay.style, {
      position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    });

    // panel
    const panel = create('div', { cls: 'nn-panel' });
    Object.assign(panel.style, {
      width: '100%', maxWidth: '1100px', height: '80vh', background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))',
      borderRadius: '12px', padding: '14px', display: 'flex', gap: '12px', boxShadow: '0 30px 60px rgba(2,6,23,0.7)', overflow: 'hidden'
    });

    // sidebar
    const sidebar = create('div', { cls: 'nn-sidebar' });
    Object.assign(sidebar.style, { width: '220px', padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '10px' });

    const title = create('div', { cls: 'nn-title', text: 'NoteNexus' });
    Object.assign(title.style, { fontWeight: 700, fontSize: '18px' });

    const search = create('input', { cls: 'nn-search', placeholder: 'Search notes...' });
    Object.assign(search.style, { padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#fff' });

    const newBtn = create('button', { cls: 'nn-btn nn-btn-primary', text: 'New Note' });
    Object.assign(newBtn.style, { padding: '8px', borderRadius: '8px', cursor: 'pointer', background: 'linear-gradient(90deg,#9333ea,#2563eb)', border: 'none', color: '#fff' });

    const folderSelect = create('select', { cls: 'nn-folder' });
    ['All','General','Study','Personal','Ideas'].forEach(f => folderSelect.appendChild(create('option', { value: f, text: f })));
    Object.assign(folderSelect.style, { padding: '8px', borderRadius: '8px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.06)' });

    const clearBtn = create('button', { cls: 'nn-btn nn-btn-clear', text: 'Clear All' });
    Object.assign(clearBtn.style, { padding: '8px', borderRadius: '8px', background: 'transparent', color: '#fda4af', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' });

    sidebar.append(title, search, newBtn, folderSelect, clearBtn);

    // main area
    const main = create('div', { cls: 'nn-main' });
    Object.assign(main.style, { flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' });

    // header
    const header = create('div', { cls: 'nn-header' });
    Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
    header.append(create('div', { cls: 'nn-h-title', text: 'Your Notes' }));
    const headerRight = create('div', { cls: 'nn-h-right' });
    headerRight.style.display = 'flex';
    headerRight.style.gap = '8px';
    header.append(headerRight);

    // pinned container
    const pinnedContainer = create('div', { cls: 'nn-pinned' });
    pinnedContainer.append(create('div', { cls: 'nn-section-title', text: 'Pinned' }));

    // notes grid
    const notesGrid = create('div', { cls: 'nn-grid' });
    Object.assign(notesGrid.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '12px', overflow: 'auto', paddingBottom: '12px' });

    // footer close
    const footer = create('div', { cls: 'nn-footer' });
    Object.assign(footer.style, { display: 'flex', justifyContent: 'flex-end', gap: '8px' });
    const closeBtn = create('button', { cls: 'nn-btn', text: 'Close' });
    Object.assign(closeBtn.style, { padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#fff', cursor: 'pointer' });
    footer.append(closeBtn);

    main.append(header, pinnedContainer, notesGrid, footer);
    panel.append(sidebar, main);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // modal (create/edit)
    const modal = create('div', { cls: 'nn-modal', id: 'nn-modal' });
    Object.assign(modal.style, {
      position: 'fixed', inset: 0, display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    });
    const modalCard = create('div', { cls: 'nn-modal-card' });
    Object.assign(modalCard.style, { width: '680px', maxWidth: '94%', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '14px' });

    const mTitle = create('input', { cls: 'nn-m-title', placeholder: 'Title' });
    Object.assign(mTitle.style, { width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color:'#fff' });
    const mBody = create('textarea', { cls: 'nn-m-body', placeholder: 'Write your note...' });
    Object.assign(mBody.style, { width: '100%', minHeight: '160px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color:'#fff' });

    const mRow = create('div', { cls: 'nn-m-row' });
    Object.assign(mRow.style, { display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' });
    const mFolder = create('select', { cls: 'nn-m-folder' });
    ['General','Study','Personal','Ideas'].forEach(f => mFolder.appendChild(create('option', { value: f, text: f })));
    Object.assign(mFolder.style, { padding: '8px', borderRadius: '8px', background: 'transparent', color:'#fff', border: '1px solid rgba(255,255,255,0.06)' });
    const mPin = create('label', { cls: 'nn-m-pin', html: '<input type="checkbox" class="nn-pin-checkbox" /> Pin' });
    Object.assign(mPin.style, { color: '#cbd5e1' });
    const mSave = create('button', { cls: 'nn-btn nn-save', text: 'Save' });
    Object.assign(mSave.style, { marginLeft: 'auto', padding: '8px 12px', borderRadius: '8px', background: 'linear-gradient(90deg,#9333ea,#2563eb)', color:'#fff', border:'none', cursor:'pointer' });
    const mDelete = create('button', { cls: 'nn-btn nn-delete', text: 'Delete' });
    Object.assign(mDelete.style, { padding: '8px 12px', borderRadius:'8px', background:'transparent', color:'#fb7185', border:'1px solid rgba(255,255,255,0.06)' });

    mRow.append(mFolder, mPin, mDelete, mSave);
    modalCard.append(mTitle, mBody, mRow);
    modal.appendChild(modalCard);
    document.body.appendChild(modal);

    // attach controls to overlay object for later use
    return {
      overlay, panel, sidebar, search, newBtn, folderSelect, clearBtn, pinnedContainer, notesGrid, closeBtn,
      modal, mTitle, mBody, mFolder, mPin, mSave, mDelete
    };
  }

  /* ---------- Rendering notes ---------- */
  function renderNotes(state) {
    const { pinnedContainer, notesGrid } = state;
    const notes = readNotes();

    // clear
    pinnedContainer.innerHTML = '<div class="nn-section-title">Pinned</div>';
    notesGrid.innerHTML = '';

    const q = (state.search.value || '').toLowerCase();
    const activeFolder = state.folderSelect.value;

    const filtered = notes.filter(n => {
      if (activeFolder !== 'All' && n.folder !== activeFolder) return false;
      if (!q) return true;
      return ((n.title + ' ' + n.body + ' ' + (n.folder||'')).toLowerCase().includes(q));
    });

    const pinned = filtered.filter(n => n.pinned);
    const normal = filtered.filter(n => !n.pinned);

    if (pinned.length) {
      const pGrid = create('div', { cls: 'nn-pgrid' });
      Object.assign(pGrid.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '10px', marginBottom: '12px' });
      pinned.forEach(n => pGrid.appendChild(noteCard(n)));
      pinnedContainer.appendChild(pGrid);
    } else {
      pinnedContainer.appendChild(create('div', { cls: 'nn-empty', text: 'No pinned notes' }));
    }

    if (normal.length) {
      normal.forEach(n => notesGrid.appendChild(noteCard(n)));
    } else {
      notesGrid.appendChild(create('div', { cls: 'nn-empty', text: 'No notes yet. Click New Note to add.' }));
    }
  }

  function noteCard(note) {
    const card = create('div', { cls: 'nn-note' });
    Object.assign(card.style, { padding: '12px', borderRadius: '10px', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.04)', display:'flex', flexDirection:'column', gap:'8px' });

    const meta = create('div', { cls: 'nn-meta' });
    Object.assign(meta.style, { display:'flex', justifyContent:'space-between', alignItems:'center' });
    const t = create('div', { cls: 'nn-title', text: note.title });
    Object.assign(t.style, { fontWeight: 600 });
    const time = create('div', { cls: 'nn-time', text: new Date(note.updated).toLocaleString() });
    Object.assign(time.style, { fontSize: '12px', color:'#94a3b8' });

    meta.append(t, time);
    const body = create('div', { cls: 'nn-body', text: note.body });
    Object.assign(body.style, { color:'#e6eef8', fontSize:'14px', whiteSpace:'pre-wrap', overflow:'hidden', maxHeight:'120px' });
    const footer = create('div', { cls: 'nn-footer' });
    Object.assign(footer.style, { display:'flex', justifyContent:'space-between', alignItems:'center', gap:'8px' });

    const left = create('div', { cls: 'nn-folder-tag', text: note.folder });
    Object.assign(left.style, { fontSize:'12px', color:'#cbd5e1' });

    // actions
    const actions = create('div', { cls: 'nn-actions' });
    Object.assign(actions.style, { display:'flex', gap:'6px' });
    const pinBtn = create('button', { cls: 'nn-act nn-pin', text: note.pinned ? 'Unpin' : 'Pin' });
    const editBtn = create('button', { cls: 'nn-act nn-edit', text: 'Edit' });
    const delBtn = create('button', { cls: 'nn-act nn-del', text: 'Delete' });
    [pinBtn, editBtn, delBtn].forEach(b => Object.assign(b.style, { padding:'6px 8px', borderRadius:'8px', border:'none', cursor:'pointer', background:'transparent', color:'#cbd5e1' }));

    pinBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePin(note.id); });
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); openEditModal(note.id); });
    delBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteNote(note.id); });

    actions.append(pinBtn, editBtn, delBtn);
    footer.append(left, actions);

    card.append(meta, body, footer);

    // clicking card opens edit
    card.addEventListener('click', () => openEditModal(note.id));
    return card;
  }

  /* ---------- CRUD operations ---------- */
  function togglePin(id) {
    const notes = readNotes().map(n => n.id === id ? ({ ...n, pinned: !n.pinned, updated: new Date().toISOString() }) : n);
    writeNotes(notes);
    refresh();
  }
  function deleteNote(id) {
    if (!confirm('Delete this note?')) return;
    const notes = readNotes().filter(n => n.id !== id);
    writeNotes(notes);
    refresh();
  }

  /* ---------- Modal / Edit ---------- */
  let editId = null;
  function openModalForNew(state) {
    editId = null;
    state.modal.style.display = 'flex';
    state.mTitle.value = '';
    state.mBody.value = '';
    state.mFolder.value = 'General';
    state.mPin.querySelector('input').checked = false;
    state.mDelete.style.display = 'none';
  }
  function openEditModal(id) {
    const notes = readNotes();
    const note = notes.find(n => n.id === id);
    if (!note) return;
    editId = id;
    const state = getState();
    state.modal.style.display = 'flex';
    state.mTitle.value = note.title;
    state.mBody.value = note.body;
    state.mFolder.value = note.folder || 'General';
    state.mPin.querySelector('input').checked = !!note.pinned;
    state.mDelete.style.display = '';
  }
  function saveModal(state) {
    const notes = readNotes();
    const title = state.mTitle.value.trim();
    const body = state.mBody.value.trim();
    const folder = state.mFolder.value;
    const pinned = state.mPin.querySelector('input').checked;

    if (editId) {
      const updated = notes.map(n => n.id === editId ? ({ ...n, title: title||'Untitled', body, folder, pinned, updated: new Date().toISOString() }) : n);
      writeNotes(updated);
    } else {
      const note = newNoteObj(title || 'Untitled', body, folder);
      note.pinned = pinned;
      writeNotes([note, ...notes]);
    }
    state.modal.style.display = 'none';
    refresh();
  }
  function deleteFromModal(state) {
    if (!editId) return;
    if (!confirm('Delete this note?')) return;
    const notes = readNotes().filter(n => n.id !== editId);
    writeNotes(notes);
    state.modal.style.display = 'none';
    refresh();
  }

  /* ---------- Wiring & Events ---------- */
  function getState() {
    return buildOverlay(); // buildOverlay returns same object if already built
  }

  function refresh() {
    const state = getState();
    renderNotes(state);
  }

  function wireUp() {
    // find buttons on page
    const launchBtn = document.querySelector('.btn-primary');
    const installBtn = document.querySelector('.btn-outline');

    // Attach launch
    launchBtn && launchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const state = getState();
      state.overlay.style.display = 'flex';
      refresh();
    });

    // Attach install/info
    installBtn && installBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showInstallDialog();
    });

    // If overlay created, attach controls
    document.addEventListener('click', (ev) => {
      // close overlay if clicking outside the panel (backdrop)
      const overlay = $('#nn-overlay');
      if (overlay && ev.target === overlay) overlay.style.display = 'none';
    });

    // When overlay created, attach internal handlers
    const observer = new MutationObserver(() => {
      const overlay = $('#nn-overlay'); if (!overlay) return;
      const state = getState();

      // search & filter
      state.search.oninput = () => refresh();
      state.folderSelect.onchange = () => refresh();
      state.clearBtn.onclick = () => {
        if (!confirm('Clear ALL notes?')) return;
        writeNotes([]);
        refresh();
      };
      state.newBtn.onclick = () => openModalForNew(state);
      state.closeBtn.onclick = () => state.overlay.style.display = 'none';

      // modal controls
      state.mSave.onclick = () => saveModal(state);
      state.mDelete.onclick = () => deleteFromModal(state);
      state.modal.onclick = (e) => {
        if (e.target === state.modal) state.modal.style.display = 'none';
      };
      state.mBody.addEventListener('keydown', (k) => {
        if (k.ctrlKey && k.key === 'Enter') state.mSave.click();
      });

      observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- Install dialog ---------- */
  function showInstallDialog() {
    const id = 'nn-install';
    if (document.getElementById(id)) return;
    const modal = create('div', { id, cls: 'nn-install' });
    Object.assign(modal.style, { position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(2,6,23,0.7)', zIndex:9999 });
    const card = create('div', { cls: 'nn-install-card' });
    Object.assign(card.style, { width:'720px', maxWidth:'94%', padding:'18px', borderRadius:'12px', background:'rgba(255,255,255,0.03)' });

    card.append(create('h3', { text: 'Install NoteNexus Chrome Extension' }));
    const p = create('p', { html: `To install the extension in developer mode:<br>
      1. Open <strong>chrome://extensions</strong><br>
      2. Enable <strong>Developer mode</strong><br>
      3. Click <strong>Load unpacked</strong> and select the extension folder.<br><br>
      Or visit the Chrome Web Store if published.` });
    Object.assign(p.style, { color:'#cbd5e1', lineHeight: '1.6' });

    const close = create('button', { text: 'Close' });
    Object.assign(close.style, { marginTop:'12px', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', border:'none', background:'linear-gradient(90deg,#9333ea,#2563eb)', color:'#fff' });

    close.addEventListener('click', () => modal.remove());
    card.append(p, close);
    modal.appendChild(card);
    document.body.appendChild(modal);
  }

  /* ---------- Init ---------- */
  function init() {
    // If there is no sample data, add minimal note
    if (!localStorage.getItem(STORAGE_KEY)) {
      const sample = [
        { id: Date.now()-2000, title: 'Welcome to NoteNexus', body: 'Click Launch App to open the quick dashboard. Use New Note to add your first note.', folder: 'General', pinned: true, updated: new Date().toISOString() }
      ];
      writeNotes(sample);
    }
    wireUp();
  }

  // run
  init();

})();
