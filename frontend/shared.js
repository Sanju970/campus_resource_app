// Shared app state & helpers — no framework needed
window.AppState = {
  user: null,                     // { name, email, role }
  setUser(u) { this.user = u; localStorage.setItem('portal_user', JSON.stringify(u)); },
  getUser() {
    if (this.user) return this.user;
    const raw = localStorage.getItem('portal_user');
    this.user = raw ? JSON.parse(raw) : null;
    return this.user;
  },
  clearUser() { this.user = null; localStorage.removeItem('portal_user'); }
};

// Build header HTML (matches your Layout.tsx look)
function headerTemplate(user, current = '') {
  const initial = (user?.name || 'User').charAt(0).toUpperCase();
  const role = (user?.role || 'student').toLowerCase();

  // active classes helper
  const active = (id) =>
    id === current ? 'bg-slate-900 text-white' : 'hover:bg-slate-100';

  return `
<header class="border-b bg-white/90 header-blur sticky top-0 z-50">
  <div class="container-portal h-16 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
        <i data-lucide="graduation-cap" class="text-white" style="width:20px;height:20px"></i>
      </div>
      <span class="font-semibold">Campus Portal</span>
      <span class="ml-2 text-xs px-2 py-0.5 rounded bg-slate-900 text-white uppercase">${role}</span>
    </div>

    <nav class="hidden md:flex items-center gap-1">
      <a href="#/home"          data-nav="home"          class="px-3 py-2 rounded ${active('home')}">
        <i data-lucide="home" class="inline mr-2 w-4 h-4"></i>Home</a>
      <a href="#/events"        data-nav="events"        class="px-3 py-2 rounded ${active('events')}">
        <i data-lucide="calendar-days" class="inline mr-2 w-4 h-4"></i>Events</a>
      <a href="#/announcements" data-nav="announcements" class="px-3 py-2 rounded ${active('announcements')}">
        <i data-lucide="bell" class="inline mr-2 w-4 h-4"></i>Announcements</a>
      <a href="#/materials"     data-nav="materials"     class="px-3 py-2 rounded ${active('materials')}">
        <i data-lucide="file-text" class="inline mr-2 w-4 h-4"></i>Materials</a>
      <a href="#/resources"     data-nav="resources"     class="px-3 py-2 rounded ${active('resources')}">
        <i data-lucide="book-open" class="inline mr-2 w-4 h-4"></i>Resources</a>
      <a href="#/schedule"      data-nav="schedule"      class="px-3 py-2 rounded ${active('schedule')}">
        <i data-lucide="calendar" class="inline mr-2 w-4 h-4"></i>Schedule</a>
    </nav>

    <div class="relative">
      <button class="h-10 w-10 rounded-full bg-blue-600 text-white font-semibold avatar-ring" data-avatar>${initial}</button>
      <div class="absolute right-0 mt-2 w-64 bg-white border rounded dropdown-shadow hidden" data-dropdown>
        <div class="p-3 space-y-1">
          <p class="font-medium" data-user-name>${user?.name || 'User'}</p>
          <p class="text-xs text-slate-500" data-user-email>${user?.email || 'user@campus.edu'}</p>
          <p class="text-xs text-slate-500 capitalize" data-user-role>Role: ${role}</p>
        </div>
        <div class="border-t my-2"></div>
        <a href="#/profile" class="block px-3 py-2 hover:bg-slate-100">
          <i data-lucide="user" class="inline mr-2 w-4 h-4"></i>Profile Settings</a>
        <a href="#/notifications" class="block px-3 py-2 hover:bg-slate-100">
          <i data-lucide="bell" class="inline mr-2 w-4 h-4"></i>Notifications
          <span class="ml-2 inline-flex bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">5</span></a>
        <a href="#/favorites" class="block px-3 py-2 hover:bg-slate-100">
          <i data-lucide="heart" class="inline mr-2 w-4 h-4"></i>Favorites</a>
        <div class="border-t my-2"></div>
        <button class="w-full text-left px-3 py-2 hover:bg-slate-100" data-logout>
          <i data-lucide="log-out" class="inline mr-2 w-4 h-4"></i>Logout</button>
      </div>
    </div>
  </div>
</header>`;
}

// Inject header & attach common interactions
window.renderHeader = function renderHeader(currentRoute) {
  const user = AppState.getUser();
  const slot = document.getElementById('header-slot');
  if (!user) { slot.innerHTML = ''; return; }

  slot.innerHTML = headerTemplate(user, currentRoute);

  // Icons
  if (window.lucide && lucide.createIcons) lucide.createIcons();

  // Dropdown
  const avatar = slot.querySelector('[data-avatar]');
  const dropdown = slot.querySelector('[data-dropdown]');
  if (avatar && dropdown) {
    avatar.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !avatar.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }

  // Logout
  const logoutBtn = slot.querySelector('[data-logout]');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      AppState.clearUser();
      location.hash = '#/login';
    });
  }
};
