// Initialize Lucide icons
lucide.createIcons();

// Sample notes data
const notes = [
  {
    id: '1',
    title: 'Product Roadmap Q1 2024',
    preview: 'Key milestones and deliverables for the first quarter. Focus on user experience improvements and performance optimization...',
    tags: ['work', 'planning'],
    date: '2 days ago',
    isPinned: true,
    isFavorite: true,
  },
  {
    id: '2',
    title: 'Meeting Notes - Design Review',
    preview: 'Discussed new dashboard layout, color scheme updates, and accessibility improvements. Action items assigned to team members...',
    tags: ['meetings', 'design'],
    date: '1 week ago',
    isPinned: false,
    isFavorite: false,
  },
  {
    id: '3',
    title: 'Recipe: Homemade Pasta',
    preview: 'Ingredients: 2 cups flour, 3 eggs, pinch of salt. Mix ingredients, knead for 10 minutes, rest for 30 minutes...',
    tags: ['personal', 'cooking'],
    date: '2 weeks ago',
    isPinned: false,
    isFavorite: true,
  },
  {
    id: '4',
    title: 'Book Ideas',
    preview: 'Collection of story concepts and character sketches. Exploring themes of technology and human connection in modern society...',
    tags: ['creative', 'writing'],
    date: '3 weeks ago',
    isPinned: false,
    isFavorite: false,
  },
  {
    id: '5',
    title: 'Travel Plans - Japan 2024',
    preview: 'Tokyo, Kyoto, Osaka itinerary. Must visit: Fushimi Inari, teamLab Borderless, Osaka Castle. Food recommendations included...',
    tags: ['travel', 'personal'],
    date: '1 month ago',
    isPinned: true,
    isFavorite: false,
  },
  {
    id: '6',
    title: 'Learning JavaScript - Advanced Concepts',
    preview: 'Notes on closures, promises, async/await, and event loop. Practice exercises and code snippets for reference...',
    tags: ['learning', 'code'],
    date: '1 month ago',
    isPinned: false,
    isFavorite: false,
  },
];

// Create note card HTML
function createNoteCard(note) {
  const card = document.createElement('div');
  card.className = 'note-card';
  
  const tagsHTML = note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('');
  
  const pinHTML = note.isPinned 
    ? `<button class="note-icon-btn pin"><i data-lucide="pin"></i></button>`
    : '';
  
  const favoriteHTML = note.isFavorite
    ? `<div class="favorite-icon"><i data-lucide="star"></i></div>`
    : '';
  
  card.innerHTML = `
    <div class="note-header">
      <h3 class="note-title">${note.title}</h3>
      <div class="note-actions">
        ${pinHTML}
        <button class="note-icon-btn more"><i data-lucide="more-vertical"></i></button>
      </div>
    </div>
    <p class="note-preview">${note.preview}</p>
    <div class="note-tags">${tagsHTML}</div>
    <div class="note-footer">
      <span class="note-date">${note.date}</span>
      ${favoriteHTML}
    </div>
  `;
  
  return card;
}

// Render all notes
function renderNotes() {
  const notesGrid = document.getElementById('notesGrid');
  notesGrid.innerHTML = '';
  
  notes.forEach(note => {
    const card = createNoteCard(note);
    notesGrid.appendChild(card);
  });
  
  // Re-initialize Lucide icons for dynamically added content
  lucide.createIcons();
}

// Dark mode toggle
const darkModeToggle = document.getElementById('darkModeToggle');
let isDarkMode = false;

darkModeToggle.addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark', isDarkMode);
  
  // Update icon
  const icon = darkModeToggle.querySelector('i');
  icon.setAttribute('data-lucide', isDarkMode ? 'sun' : 'moon');
  lucide.createIcons();
});

// Navigation items
const navItems = document.querySelectorAll('.nav-item[data-nav]');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
  });
});

// Folders toggle
const foldersToggle = document.querySelector('.folders-toggle');
const foldersList = document.querySelector('.folders-list');
let foldersExpanded = true;

foldersToggle.addEventListener('click', () => {
  foldersExpanded = !foldersExpanded;
  foldersToggle.classList.toggle('collapsed', !foldersExpanded);
  foldersList.classList.toggle('collapsed', !foldersExpanded);
  
  // Update chevron icon
  const chevron = foldersToggle.querySelector('.chevron');
  chevron.setAttribute('data-lucide', foldersExpanded ? 'chevron-down' : 'chevron-right');
  lucide.createIcons();
});

// Initialize
renderNotes();