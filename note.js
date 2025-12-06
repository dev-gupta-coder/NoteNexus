// // note.js
// (function () {
//   /* Config / selectors */
//   const EDITOR_ID = 'noteContent';
//   const TOOLBAR_SELECTOR = '.toolbar';
//   const SAVE_STATUS_ID = 'saveStatus';
//   const AUTOSAVE_KEY = 'note-draft';
//   const AUTOSAVE_DEBOUNCE_MS = 900;
//   const TITLE_ID = 'noteTitle';
//   const WORD_COUNT_ID = 'wordCount';
//   const CHAR_COUNT_ID = 'charCount';
//   const TAG_INPUT_ID = 'tagInput';
//   const TAG_CONTAINER_ID = 'tagContainer';
//   const FOLDER_SELECT_ID = 'folderSelect';
//   const PIN_TOGGLE_ID = 'pinToggle';
//   const COLOR_GRID_ID = 'colorGrid';
//   const HIGHLIGHT_BTN_ID = 'highlightBtn';
//   const HIGHLIGHT_PICKER_ID = 'highlightColor';
//   const CREATED_DATE_ID = 'createdDate';
//   const UPDATED_TIME_ID = 'updatedTime';

//   /* Nodes */
//   const editor = document.getElementById(EDITOR_ID);
//   const toolbar = document.querySelector(TOOLBAR_SELECTOR);
//   const saveStatus = document.getElementById(SAVE_STATUS_ID);
//   const titleInput = document.getElementById(TITLE_ID);
//   const wordCount = document.getElementById(WORD_COUNT_ID);
//   const charCount = document.getElementById(CHAR_COUNT_ID);
//   const tagInput = document.getElementById(TAG_INPUT_ID);
//   const tagContainer = document.getElementById(TAG_CONTAINER_ID);
//   const folderSelect = document.getElementById(FOLDER_SELECT_ID);
//   const pinToggle = document.getElementById(PIN_TOGGLE_ID);
//   const colorGrid = document.getElementById(COLOR_GRID_ID);
//   const highlightBtn = document.getElementById(HIGHLIGHT_BTN_ID);
//   const highlightPicker = document.getElementById(HIGHLIGHT_PICKER_ID);
//   const createdDateEl = document.getElementById(CREATED_DATE_ID);
//   const updatedTimeEl = document.getElementById(UPDATED_TIME_ID);

//   if (!editor) {
//     console.warn('Editor element not found:', EDITOR_ID);
//     return;
//   }

//   /* In-memory note state (persisted to localStorage) */
//   let noteState = {
//     title: titleInput?.value || '',
//     content: editor.innerHTML || '',
//     tags: [], // strings
//     folder: folderSelect?.value || 'general',
//     isPinned: pinToggle?.getAttribute('aria-checked') === 'true' || false,
//     colorLabel: 'default',
//     created: createdDateEl?.textContent || new Date().toLocaleDateString(),
//     updated: updatedTimeEl?.textContent || 'Just now'
//   };

//   /* Utilities */
//   function saveToStorageDebounced() {
//     // debounce wrapper
//     if (saveToStorageDebounced.timeout) clearTimeout(saveToStorageDebounced.timeout);
//     saveStatusShowSaving();
//     saveToStorageDebounced.timeout = setTimeout(() => {
//       noteState.title = titleInput?.value || noteState.title;
//       noteState.content = editor.innerHTML;
//       noteState.folder = folderSelect?.value || noteState.folder;
//       noteState.updated = new Date().toLocaleString();
//       // tags are read from DOM
//       noteState.tags = getTagsFromDOM();
//       noteState.isPinned = pinToggle?.getAttribute('aria-checked') === 'true';
//       const activeColorBtn = colorGrid?.querySelector('.color-option.active');
//       if (activeColorBtn) noteState.colorLabel = activeColorBtn.dataset.color || noteState.colorLabel;

//       try {
//         localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(noteState));
//       } catch (e) {
//         console.warn('Unable to save to localStorage:', e);
//       }
//       saveStatusShowSaved();
//       updateUpdatedTime();
//     }, AUTOSAVE_DEBOUNCE_MS);
//   }

//   function saveStatusShowSaving() {
//     if (!saveStatus) return;
//     const saving = saveStatus.querySelector('.saving-indicator');
//     const saved = saveStatus.querySelector('.saved-indicator');
//     if (saving) saving.classList.remove('hidden');
//     if (saved) saved.classList.add('hidden');
//   }

//   function saveStatusShowSaved() {
//     if (!saveStatus) return;
//     const saving = saveStatus.querySelector('.saving-indicator');
//     const saved = saveStatus.querySelector('.saved-indicator');
//     if (saving) saving.classList.add('hidden');
//     if (saved) {
//       saved.classList.remove('hidden');
//       // small flash
//       saved.classList.add('just-saved');
//       setTimeout(() => saved.classList.remove('just-saved'), 900);
//     }
//   }

//   function updateUpdatedTime() {
//     if (!updatedTimeEl) return;
//     updatedTimeEl.textContent = new Date().toLocaleString();
//   }

//   function getTagsFromDOM() {
//     if (!tagContainer) return [];
//     const tags = [];
//     tagContainer.querySelectorAll('.tag').forEach(tagEl => {
//       // textContent includes the remove button text; read firstChild text node if present
//       const textNode = tagEl.childNodes[0];
//       const tagText = textNode ? String(textNode.textContent).trim() : '';
//       if (tagText) tags.push(tagText);
//     });
//     return tags;
//   }

//   function addTag(tagText) {
//     if (!tagContainer || !tagText) return;
//     tagText = String(tagText).trim();
//     if (!tagText) return;
//     // prevent duplicates
//     const existing = getTagsFromDOM();
//     if (existing.includes(tagText)) return;
//     const span = document.createElement('span');
//     span.className = 'tag';
//     span.textContent = tagText;
//     const btn = document.createElement('button');
//     btn.className = 'tag-remove';
//     btn.type = 'button';
//     btn.setAttribute('aria-label', `Remove tag ${tagText}`);
//     btn.dataset.tag = tagText;
//     btn.innerHTML = `
//       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//         <line x1="18" y1="6" x2="6" y2="18"></line>
//         <line x1="6" y1="6" x2="18" y2="18"></line>
//       </svg>
//     `;
//     // Add remove click
//     btn.addEventListener('click', () => {
//       span.remove();
//       saveToStorageDebounced();
//     });
//     span.appendChild(btn);
//     tagContainer.appendChild(span);
//     saveToStorageDebounced();
//   }

//   function removeAllTags() {
//     if (!tagContainer) return;
//     tagContainer.innerHTML = '';
//   }

//   /* exec wrapper */
//   function exec(cmd, value = null) {
//     try {
//       document.execCommand(cmd, false, value);
//     } catch (e) {
//       console.warn('execCommand failed', cmd, e);
//     }
//     // ensure editor stays focused
//     editor.focus();
//     updateToolbarState();
//     saveToStorageDebounced();
//   }

//   /* Insert helpers */
//   function insertHtmlAtCaret(html) {
//     editor.focus();
//     const sel = window.getSelection();
//     if (!sel || !sel.rangeCount) {
//       editor.insertAdjacentHTML('beforeend', html);
//       return;
//     }
//     const range = sel.getRangeAt(0);
//     range.deleteContents();
//     const frag = range.createContextualFragment(html);
//     range.insertNode(frag);
//     // move caret after inserted content
//     range.collapse(false);
//     sel.removeAllRanges();
//     sel.addRange(range);
//     saveToStorageDebounced();
//     updateToolbarState();
//   }

//   function insertCheckboxLine() {
//     insertHtmlAtCaret(`<div class="checkbox-item"><input type="checkbox" /> <span contenteditable="true">New task</span></div><br>`);
//   }

//   function wrapSelectionWithCodeBlock() {
//     const sel = window.getSelection();
//     if (!sel || sel.isCollapsed) {
//       insertHtmlAtCaret('<pre><code>code</code></pre>');
//       return;
//     }
//     const range = sel.getRangeAt(0);
//     const text = sel.toString();
//     const pre = document.createElement('pre');
//     const code = document.createElement('code');
//     code.textContent = text;
//     pre.appendChild(code);
//     range.deleteContents();
//     range.insertNode(pre);
//     // place caret after pre
//     range.setStartAfter(pre);
//     range.setEndAfter(pre);
//     sel.removeAllRanges();
//     sel.addRange(range);
//     saveToStorageDebounced();
//   }

//   function createLinkForSelection() {
//     const url = prompt('Enter URL (include https://):', 'https://');
//     if (!url) return;
//     exec('createLink', url);
//   }

//   function toggleHighlight(color) {
//     const sel = window.getSelection();
//     if (!sel || sel.isCollapsed) {
//       // insert placeholder highlighted text
//       insertHtmlAtCaret(`<span class="editor-highlight" style="background:${color};padding:0 0.15em;">highlighted</span>`);
//       return;
//     }
//     try {
//       // Try execCommand for backColor (works in many browsers)
//       document.execCommand('backColor', false, color);
//     } catch (e) {
//       // fallback: wrap selection in span
//       const range = sel.getRangeAt(0);
//       const wrapper = document.createElement('span');
//       wrapper.style.background = color;
//       wrapper.style.padding = '0 0.15em';
//       wrapper.className = 'editor-highlight';
//       wrapper.appendChild(range.extractContents());
//       range.insertNode(wrapper);
//       range.setStartAfter(wrapper);
//       range.setEndAfter(wrapper);
//       sel.removeAllRanges();
//       sel.addRange(range);
//     }
//     saveToStorageDebounced();
//     updateToolbarState();
//   }

//   /* Toolbar state updater */
//   function updateToolbarState() {
//     if (!toolbar) return;
//     const mapping = [
//       { cmd: 'bold', action: 'bold' },
//       { cmd: 'italic', action: 'italic' },
//       { cmd: 'underline', action: 'underline' },
//       { cmd: 'strikeThrough', action: 'strikeThrough' },
//       { cmd: 'insertUnorderedList', action: 'insertUnorderedList' },
//       { cmd: 'insertOrderedList', action: 'insertOrderedList' },
//       { cmd: 'justifyLeft', action: 'justifyLeft' },
//       { cmd: 'justifyCenter', action: 'justifyCenter' },
//       { cmd: 'justifyRight', action: 'justifyRight' }
//     ];
//     mapping.forEach(m => {
//       const btn = toolbar.querySelector(`[data-command="${m.action}"]`);
//       if (!btn) return;
//       try {
//         const state = document.queryCommandState(m.cmd);
//         btn.classList.toggle('active', !!state);
//       } catch (e) {
//         // ignore
//       }
//     });

//     // headings detection: if selection inside H1/H2
//     const sel = window.getSelection();
//     if (sel && sel.rangeCount) {
//       let node = sel.anchorNode;
//       if (node && node.nodeType === 3) node = node.parentElement;
//       const h1Btn = toolbar.querySelector('[data-command="h1"]');
//       const h2Btn = toolbar.querySelector('[data-command="h2"]');
//       if (h1Btn) h1Btn.classList.toggle('active', !!closestBlock(node, 'H1'));
//       if (h2Btn) h2Btn.classList.toggle('active', !!closestBlock(node, 'H2'));
//     }
//   }

//   function closestBlock(node, tagName) {
//     while (node && node !== editor) {
//       if (node.tagName === tagName) return node;
//       node = node.parentElement;
//     }
//     return null;
//   }

//   /* Word/char count */
//   function computeCounts() {
//     const text = editor.innerText || '';
//     // words: split on whitespace, filter empties
//     const words = text.trim().split(/\s+/).filter(Boolean).length;
//     const chars = text.replace(/\s/g, '').length;
//     if (wordCount) wordCount.textContent = `${words} words`;
//     if (charCount) charCount.textContent = `${chars} characters`;
//   }

//   /* Event wiring */
//   // Toolbar click (event delegation)
//   if (toolbar) {
//     toolbar.addEventListener('click', (ev) => {
//       const btn = ev.target.closest('[data-command]');
//       if (!btn) return;
//       ev.preventDefault();
//       const action = btn.dataset.command;
//       editor.focus();
//       switch (action) {
//         case 'bold': exec('bold'); break;
//         case 'italic': exec('italic'); break;
//         case 'underline': exec('underline'); break;
//         case 'strikeThrough': exec('strikeThrough'); break;
//         case 'h1': exec('formatBlock', '<H1>'); break;
//         case 'h2': exec('formatBlock', '<H2>'); break;
//         case 'insertUnorderedList': exec('insertUnorderedList'); break;
//         case 'insertOrderedList': exec('insertOrderedList'); break;
//         case 'checkbox': insertCheckboxLine(); break;
//         case 'quote': exec('formatBlock', '<BLOCKQUOTE>'); break;
//         case 'code': wrapSelectionWithCodeBlock(); break;
//         case 'link': createLinkForSelection(); break;
//         case 'justifyLeft': exec('justifyLeft'); break;
//         case 'justifyCenter': exec('justifyCenter'); break;
//         case 'justifyRight': exec('justifyRight'); break;
//         default:
//           console.warn('Unknown toolbar action', action);
//       }
//     });
//   }

//   // Highlight button and color picker
//   if (highlightBtn && highlightPicker) {
//     highlightBtn.addEventListener('click', () => {
//       const color = highlightPicker.value || '#fef08a';
//       toggleHighlight(color);
//     });
//     // if user changes color, optionally auto-apply to selection
//     highlightPicker.addEventListener('change', () => {
//       // no immediate action; user clicks highlightBtn to apply
//     });
//   }

//   // Selection-based toolbar state update
//   document.addEventListener('selectionchange', () => {
//     const sel = window.getSelection();
//     if (!sel || !sel.rangeCount) return;
//     if (editor.contains(sel.anchorNode)) updateToolbarState();
//   });

//   // Editor input events
//   editor.addEventListener('input', () => {
//     computeCounts();
//     saveToStorageDebounced();
//   });

//   // Title input
//   if (titleInput) {
//     titleInput.addEventListener('input', () => saveToStorageDebounced());
//   }

//   // Keyboard shortcuts
//   editor.addEventListener('keydown', (ev) => {
//     if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey) {
//       switch (ev.key.toLowerCase()) {
//         case 'b': ev.preventDefault(); exec('bold'); break;
//         case 'i': ev.preventDefault(); exec('italic'); break;
//         case 'u': ev.preventDefault(); exec('underline'); break;
//       }
//     }
//   });

//   // Tag manager: add on Enter
//   if (tagInput) {
//     tagInput.addEventListener('keydown', (ev) => {
//       if (ev.key === 'Enter') {
//         ev.preventDefault();
//         const v = tagInput.value.trim();
//         if (v) {
//           addTag(v);
//           tagInput.value = '';
//         }
//       }
//     });
//   }

//   // Tag removal is handled on creation by attaching listeners to the remove button

//   // Folder select
//   if (folderSelect) {
//     folderSelect.addEventListener('change', () => saveToStorageDebounced());
//   }

//   // Pin toggle
//   if (pinToggle) {
//     pinToggle.addEventListener('click', () => {
//       const current = pinToggle.getAttribute('aria-checked') === 'true';
//       const next = !current;
//       pinToggle.setAttribute('aria-checked', next ? 'true' : 'false');
//       pinToggle.classList.toggle('active', next);
//       saveToStorageDebounced();
//     });
//   }

//   // Color grid selection
//   if (colorGrid) {
//     colorGrid.addEventListener('click', (ev) => {
//       const btn = ev.target.closest('.color-option');
//       if (!btn) return;
//       // remove active from siblings
//       colorGrid.querySelectorAll('.color-option').forEach(c => c.classList.remove('active'));
//       btn.classList.add('active');
//       // apply to editor container or store in state (we add data attribute)
//       editor.dataset.colorLabel = btn.dataset.color || 'default';
//       // Optional: set a CSS variable for accent (you can hook it into your CSS)
//       const colorValue = btn.dataset.value;
//       if (colorValue) editor.style.setProperty('--note-accent', colorValue);
//       saveToStorageDebounced();
//     });
//   }

//   /* Load & init */
//   function restoreFromStorage() {
//     try {
//       const raw = localStorage.getItem(AUTOSAVE_KEY);
//       if (!raw) return;
//       const parsed = JSON.parse(raw);
//       if (!parsed) return;
//       noteState = Object.assign({}, noteState, parsed);

//       if (titleInput && typeof noteState.title === 'string') titleInput.value = noteState.title;
//       if (editor && typeof noteState.content === 'string') editor.innerHTML = noteState.content;
//       if (folderSelect && noteState.folder) folderSelect.value = noteState.folder;
//       if (pinToggle) {
//         pinToggle.setAttribute('aria-checked', !!noteState.isPinned ? 'true' : 'false');
//         pinToggle.classList.toggle('active', !!noteState.isPinned);
//       }
//       // tags
//       if (Array.isArray(noteState.tags)) {
//         removeAllTags();
//         noteState.tags.forEach(t => addTag(t));
//       }
//       // color label
//       if (noteState.colorLabel && colorGrid) {
//         const btn = colorGrid.querySelector(`.color-option[data-color="${noteState.colorLabel}"]`);
//         if (btn) {
//           colorGrid.querySelectorAll('.color-option').forEach(c => c.classList.remove('active'));
//           btn.classList.add('active');
//           if (btn.dataset.value) editor.style.setProperty('--note-accent', btn.dataset.value);
//         }
//       }
//       if (createdDateEl && noteState.created) createdDateEl.textContent = noteState.created;
//       if (updatedTimeEl && noteState.updated) updatedTimeEl.textContent = noteState.updated;
//     } catch (e) {
//       console.warn('Failed to restore draft:', e);
//     }
//   }

//   // get initial counts & toolbar state
//   computeCounts();
//   updateToolbarState();
//   restoreFromStorage();

//   // update updated timestamp every minute for UX (optional)
//   setInterval(() => {
//     // keep last updated relative text? for now we leave it as saved timestamp
//   }, 60_000);

//   // Expose small API for debugging
//   window.NoteEditor = {
//     saveNow: () => {
//       if (saveToStorageDebounced.timeout) clearTimeout(saveToStorageDebounced.timeout);
//       // force save
//       try {
//         noteState.title = titleInput?.value || noteState.title;
//         noteState.content = editor.innerHTML;
//         noteState.tags = getTagsFromDOM();
//         noteState.updated = new Date().toLocaleString();
//         localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(noteState));
//         saveStatusShowSaved();
//         updateUpdatedTime();
//       } catch (e) { console.warn(e); }
//     },
//     clearDraft: () => {
//       localStorage.removeItem(AUTOSAVE_KEY);
//       console.log('Draft cleared');
//     }
//   };
// })();
// // note.css
// // Make toolbar buttons highlight when clicked
// const toolbarButtons = document.querySelectorAll('.toolbar-btn');

// toolbarButtons.forEach(btn => {
//     btn.addEventListener('click', () => {

//         // Remove active class from all buttons
//         toolbarButtons.forEach(b => b.classList.remove('active'));

//         // Add active class to the clicked one
//         btn.classList.add('active');
//     });
// });

// /* ---------- Improved CSS for Note Editor ---------- */



// note.js
(function () {
  // ------- Config / element refs -------
  const STORAGE_KEY = 'notenexus_note_v1';

  const titleInput = document.getElementById('noteTitle');
  const editor = document.getElementById('noteContent');
  const tagInput = document.getElementById('tagInput');
  const tagContainer = document.getElementById('tagContainer');
  const saveBtn = document.querySelector('.save-btn');
  const wordCountEl = document.getElementById('wordCount');
  const charCountEl = document.getElementById('charCount');
  const createdDateEl = document.getElementById('createdDate');
  const updatedTimeEl = document.getElementById('updatedTime');
  const darkToggle = document.getElementById('darkModeToggle');
  const highlightPicker = document.getElementById('highlightColor'); // optional
  const colorGrid = document.getElementById('colorGrid'); // optional if present

  if (!editor) {
    console.warn('noteContent element missing');
    return;
  }

  // ------- Helpers -------
  function nowISO() { return new Date().toISOString(); }
  function niceDate(iso) {
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }

  function sanitizeTagText(text) {
    return String(text || '').trim();
  }

  function createTagElement(tagText) {
    const span = document.createElement('span');
    span.className = 'tag';
    // text node first, so we can read it easily later
    const textNode = document.createTextNode(tagText);
    span.appendChild(textNode);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tag-remove';
    btn.dataset.tag = tagText;
    btn.setAttribute('aria-label', `Remove tag ${tagText}`);
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    btn.addEventListener('click', () => {
      span.remove();
    });

    span.appendChild(btn);
    return span;
  }

  function getTagsFromDOM() {
    if (!tagContainer) return [];
    const tags = [];
    tagContainer.querySelectorAll('.tag').forEach(span => {
      // first child text node contains the tag text
      const txt = (span.childNodes[0] && span.childNodes[0].textContent) ? span.childNodes[0].textContent.trim() : '';
      if (txt) tags.push(txt);
    });
    return tags;
  }

  function setTagsToDOM(tags = []) {
    if (!tagContainer) return;
    tagContainer.innerHTML = '';
    tags.forEach(t => {
      tagContainer.appendChild(createTagElement(t));
    });
  }

  function computeCounts() {
    const text = editor.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const chars = text.replace(/\s/g, '').length;
    if (wordCountEl) wordCountEl.textContent = `${words} words`;
    if (charCountEl) charCountEl.textContent = `${chars} characters`;
  }

  // ------- Save / Load -------
  function getActiveColorLabel() {
    if (!colorGrid) return null;
    const active = colorGrid.querySelector('.color-option.active');
    return active ? (active.dataset.color || null) : null;
  }

  function saveNote() {
    const payload = {
      title: titleInput ? titleInput.value : '',
      content: editor.innerHTML,
      tags: getTagsFromDOM(),
      folder: (document.getElementById('folderSelect') && document.getElementById('folderSelect').value) || 'general',
      colorLabel: getActiveColorLabel(),
      created: (createdDateEl && createdDateEl.dataset.iso) ? createdDateEl.dataset.iso : nowISO(),
      updated: nowISO()
    };

    // if created not present, set created to now
    if (!payload.created) payload.created = nowISO();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      // update UI
      if (createdDateEl && !createdDateEl.dataset.iso) {
        createdDateEl.dataset.iso = payload.created;
        createdDateEl.textContent = niceDate(payload.created);
      }
      if (updatedTimeEl) updatedTimeEl.textContent = niceDate(payload.updated);
      // show a quick save flash (use saved-indicator if present)
      const savedIndicator = document.querySelector('#saveStatus .saved-indicator');
      const savingIndicator = document.querySelector('#saveStatus .saving-indicator');
      if (savingIndicator) savingIndicator.classList.add('hidden');
      if (savedIndicator) {
        savedIndicator.classList.remove('hidden');
        savedIndicator.classList.add('just-saved');
        setTimeout(()=> savedIndicator.classList.remove('just-saved'), 900);
      }
    } catch (e) {
      console.warn('Failed to save note', e);
    }
  }

  function loadNote() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (!payload) return;
      if (titleInput && typeof payload.title === 'string') titleInput.value = payload.title;
      if (typeof payload.content === 'string') editor.innerHTML = payload.content;
      setTagsToDOM(Array.isArray(payload.tags) ? payload.tags : []);
      if (createdDateEl && payload.created) {
        createdDateEl.dataset.iso = payload.created;
        createdDateEl.textContent = niceDate(payload.created);
      }
      if (updatedTimeEl && payload.updated) updatedTimeEl.textContent = niceDate(payload.updated);
      // color label restore if colorGrid exists
      if (payload.colorLabel && colorGrid) {
        const btn = colorGrid.querySelector(`.color-option[data-color="${payload.colorLabel}"]`);
        if (btn) {
          colorGrid.querySelectorAll('.color-option').forEach(c=>c.classList.remove('active'));
          btn.classList.add('active');
          if (btn.dataset.value) editor.style.setProperty('--note-accent', btn.dataset.value);
        }
      }
      computeCounts();
    } catch (e) {
      console.warn('Failed to load note', e);
    }
  }

  // ------- Tag input handling -------
  if (tagInput) {
    tagInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const v = sanitizeTagText(tagInput.value);
        if (v) {
          // prevent duplicates
          const existing = getTagsFromDOM();
          if (!existing.includes(v)) {
            tagContainer.appendChild(createTagElement(v));
          }
          tagInput.value = '';
        }
      }
    });
  }

  // ------- Save button -------
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      // ensure created date is set if first time
      if (createdDateEl && !createdDateEl.dataset.iso) {
        const iso = nowISO();
        createdDateEl.dataset.iso = iso;
        createdDateEl.textContent = niceDate(iso);
      }
      saveNote();
    });
  }

  // ------- Dark mode toggle -------
  (function initDarkMode() {
    const stored = localStorage.getItem('notenexus_theme'); // 'dark' or 'light' or null
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let theme = stored || (prefersDark ? 'dark' : 'light');

    function applyTheme(t) {
      if (t === 'dark') {
        document.body.classList.add('dark-mode');
        if (darkToggle) {
          darkToggle.setAttribute('aria-pressed', 'true');
          // swap icons if present
          darkToggle.querySelector('.sun-icon')?.classList.add('hidden');
          darkToggle.querySelector('.moon-icon')?.classList.remove('hidden');
        }
      } else {
        document.body.classList.remove('dark-mode');
        if (darkToggle) {
          darkToggle.setAttribute('aria-pressed', 'false');
          darkToggle.querySelector('.sun-icon')?.classList.remove('hidden');
          darkToggle.querySelector('.moon-icon')?.classList.add('hidden');
        }
      }
      localStorage.setItem('notenexus_theme', t);
    }

    if (darkToggle) {
      darkToggle.addEventListener('click', () => {
        theme = (theme === 'dark') ? 'light' : 'dark';
        applyTheme(theme);
      });
    }

    applyTheme(theme);
  })();

  // ------- Quick toolbar highlight behavior (optional) -------
  // When clicking a toolbar button, give visual active state.
  document.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      // toggle active for formatting buttons (multi-select ok)
      btn.classList.toggle('active');
      // For some actions we want to perform formatting using execCommand:
      const cmd = btn.dataset.command;
      if (cmd) {
        // simple mapping for commands used in your HTML
        if (['bold','italic','underline','strikeThrough','insertUnorderedList','insertOrderedList','justifyLeft','justifyCenter','justifyRight'].includes(cmd)) {
          try { document.execCommand(cmd, false, null); } catch(e){}
        } else if (cmd === 'h1') {
          try { document.execCommand('formatBlock', false, '<H1>'); } catch(e){}
        } else if (cmd === 'h2') {
          try { document.execCommand('formatBlock', false, '<H2>'); } catch(e){}
        } else if (cmd === 'checkbox') {
          // simple insert
          editor.focus();
          document.execCommand('insertHTML', false, '<div class="checkbox-item"><input type="checkbox" /> <span contenteditable="true">New task</span></div><br>');
        } else if (cmd === 'code') {
          // wrap selection in pre/code
          const sel = window.getSelection();
          if (sel && sel.rangeCount) {
            const text = sel.toString();
            if (text) {
              document.execCommand('insertHTML', false, `<pre><code>${escapeHtml(text)}</code></pre>`);
            } else {
              document.execCommand('insertHTML', false, '<pre><code>code</code></pre>');
            }
          }
        }
        // after formatting update counts and focus
        setTimeout(() => { computeCounts(); editor.focus(); }, 10);
      }
    });
  });

  // small helper for escaping (used for code insert)
  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  // ------- Color picker highlight action -------
  const highlightBtn = document.getElementById('highlightBtn');
  if (highlightBtn && highlightPicker) {
    highlightBtn.addEventListener('click', () => {
      const color = highlightPicker.value || '#fef08a';
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        // insert placeholder
        document.execCommand('insertHTML', false, `<span style="background:${color};padding:0 0.15em;">highlight</span>`);
      } else {
        try { document.execCommand('backColor', false, color); } catch(e) {
          // fallback: wrap
          const range = sel.getRangeAt(0);
          const span = document.createElement('span');
          span.style.background = color;
          span.style.padding = '0 0.15em';
          span.appendChild(range.extractContents());
          range.insertNode(span);
        }
      }
      saveNote();
    });
  }

  // ------- Word/char count live update -------
  editor.addEventListener('input', () => {
    computeCounts();
  });

  // also compute on load
  computeCounts();

  // ------- Load saved note on start -------
  loadNote();

  // ------- expose quick functions (optional) -------
  window.NoteNexus = {
    save: saveNote,
    load: loadNote,
    clear: () => { localStorage.removeItem(STORAGE_KEY); location.reload(); }
  };

})();
