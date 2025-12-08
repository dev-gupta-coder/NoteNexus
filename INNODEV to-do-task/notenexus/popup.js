/* popup.js - Quick Note popup that uses chrome.storage.local
   - Place this in popup.html (include as <script src="popup.js"></script>)
   - Expects elements: #p-title, #p-body, #p-folder, #p-save, optional #open-dashboard-btn, optional #p-image (file input)
*/

(() => {
  const KEY = 'notenexus_notes';

  // ---- storage helpers (promise wrappers) ----
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

  // ---- element selectors (update if your popup uses other ids) ----
  const titleEl = document.querySelector('#p-title');
  const bodyEl = document.querySelector('#p-body');
  const folderEl = document.querySelector('#p-folder');
  const saveBtn = document.querySelector('#p-save');
  const openDashBtn = document.querySelector('#open-dashboard-btn');
  const imageInput = document.querySelector('#p-image'); // optional file input for image in popup

  // fallback safe UI if elements missing
  if (!saveBtn) {
    console.warn('popup.js: save button (#p-save) not found — adjust selectors.');
    return;
  }

  // helper to read file as dataURL (if image input is used)
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // create note object
  function makeNoteObj(title, body, folder, imageDataUrl = null) {
    return {
      id: Date.now(),
      title: title || 'Untitled',
      body: body || '',
      folder: folder || 'General',
      pinned: false,
      updated: new Date().toISOString(),
      image: imageDataUrl || null
    };
  }

  // save handler
  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const title = titleEl ? titleEl.value.trim() : '';
    const body = bodyEl ? bodyEl.value.trim() : '';
    const folder = folderEl ? (folderEl.value || 'General') : 'General';

    if (!title && !body && (!imageInput || !imageInput.files.length)) {
      // friendly feedback
      saveBtn.textContent = 'Write or add image';
      setTimeout(() => saveBtn.textContent = 'Save', 900);
      return;
    }

    // read optional image (if provided)
    let imageDataUrl = null;
    if (imageInput && imageInput.files && imageInput.files[0]) {
      try {
        imageDataUrl = await fileToDataURL(imageInput.files[0]);
      } catch (err) {
        console.warn('popup: failed to read image', err);
        imageDataUrl = null;
      }
    }

    // create and persist
    const note = makeNoteObj(title || (body.split('\n').find(l => l.trim()) || 'Untitled'), body, folder, imageDataUrl);
    const notes = await readNotes();
    notes.unshift(note);
    await writeNotes(notes);

    // optional BroadcastChannel notify (fast)
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('notenexus_channel');
        bc.postMessage('notes-updated');
        bc.close();
      }
    } catch (err) { /* ignore */ }

    // UI feedback + clear inputs
    saveBtn.textContent = 'Saved ✓';
    setTimeout(() => saveBtn.textContent = 'Save', 700);
    if (titleEl) titleEl.value = '';
    if (bodyEl) bodyEl.value = '';
    if (imageInput) imageInput.value = '';
  });

  // open dashboard/options page
  if (openDashBtn) {
    openDashBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open('dashboard.html', '_blank');
      }
    });
  }

  // optional: allow Ctrl+Enter to save from body
  if (bodyEl) {
    bodyEl.addEventListener('keydown', (ev) => {
      if (ev.ctrlKey && ev.key === 'Enter') saveBtn.click();
    });
  }

  console.log('popup.js ready — using chrome.storage.local');
})();
