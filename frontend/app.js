// Simple hash router → loads /pages/<route>.html into #content
const routes = new Set([
  'login','home','events','announcements','materials','resources',
  'schedule','profile','favorites','notifications'
]);

async function loadHTML(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load: ${path}`);
  return await res.text();
}

// Minimal fallback Login view (used only if /pages/login.html not present)
function fallbackLoginHTML() {
  return `
  <div class="min-h-[calc(100vh-0px)] grid place-items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
    <div class="w-full max-w-md bg-white rounded-xl shadow border p-6 space-y-4">
      <div class="text-center space-y-2">
        <div class="flex justify-center">
          <div class="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
            <i data-lucide="graduation-cap" class="text-white" style="width:40px;height:40px"></i>
          </div>
        </div>
        <h1 class="text-2xl font-semibold">Campus Portal</h1>
        <p class="text-slate-500">AI-Integrated Campus Resources</p>
      </div>
      <div class="space-y-3">
        <div>
          <label class="block text-sm mb-1">Email</label>
          <input id="login-email" class="w-full border rounded px-3 py-2" placeholder="student@gmail.com" />
        </div>
        <div>
          <label class="block text-sm mb-1">Password</label>
          <input id="login-pass" type="password" class="w-full border rounded px-3 py-2" placeholder="••••••••" />
        </div>
        <div>
          <label class="block text-sm mb-1">Role</label>
          <select id="login-role" class="w-full border rounded px-3 py-2">
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button id="login-submit" class="w-full bg-blue-600 text-white rounded py-2 font-semibold">Login</button>
        <p class="text-xs text-center text-slate-500">Demo: use any email & password.</p>
      </div>
    </div>
  </div>`;
}

async function render(route) {
  const content = document.getElementById('content');
  const user = AppState.getUser();

  // Guarded routes
  if (!user && route !== 'login') {
    location.hash = '#/login';
    return;
  }

  // Header
  renderHeader(route);

  try {
    let html;
    if (route === 'login') {
      try {
        html = await loadHTML('./pages/login.html');
      } catch {
        html = fallbackLoginHTML();
      }
      content.innerHTML = html;
      if (window.lucide && lucide.createIcons) lucide.createIcons();
      const btn = content.querySelector('#login-submit');
      if (btn) {
        btn.addEventListener('click', () => {
          const email = content.querySelector('#login-email').value.trim() || 'user@gmail.com';
          const name = email.split('@')[0];
          const role = (content.querySelector('#login-role').value || 'student').toLowerCase();
          AppState.setUser({ name, email, role });
          location.hash = '#/home';
        });
      }
      return;
    }

    if (!routes.has(route)) route = 'home';
    html = await loadHTML(`./pages/${route}.html`);
    content.innerHTML = html;
    //  automatic page JS/CSS loader 
    const cssPath = `pages/${route}.css`;
    const jsPath = `pages/${route}.js`;

    // inject CSS once
    if (!document.querySelector(`link[href="${cssPath}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssPath;
      document.head.appendChild(link);
    }

    // run JS if available
    fetch(jsPath, { method: "HEAD" })
      .then(res => {
        if (res.ok) {
          const script = document.createElement("script");
          script.src = jsPath;
          script.defer = true;
          document.body.appendChild(script);
        }
      })
      .catch(() => {});
    // --- end loader ---

    // wait a tick so HTML is in the DOM
    setTimeout(() => {
    // run schedule init if present
    if (route === "schedule" && typeof initSchedulePage === "function") {
        console.log("⚙️ Initializing schedule page after HTML injection");
        initSchedulePage();
    }

    // icons and chat after init
    if (window.lucide && lucide.createIcons) lucide.createIcons();
    ensureAIChat();
    }, 100);

    if (window.lucide && lucide.createIcons) lucide.createIcons();
    ensureAIChat();
  } catch (err) {
    content.innerHTML = `
      <div class="container-portal py-16">
        <div class="rounded-xl border p-8">
          <h2 class="text-xl font-semibold mb-2">Page not found</h2>
          <p class="text-slate-600 mb-4">The page <code>${route}</code> could not be loaded.</p>
          <a href="#/home" class="px-4 py-2 rounded bg-slate-900 text-white inline-block">Go Home</a>
        </div>
      </div>`;
  }
}

// AI Chat loader
let chatLoaded = false;
async function ensureAIChat() {
  if (chatLoaded) return;
  try {
    const html = await loadHTML('./components/ai-chat.html');
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap);
    chatLoaded = true;
    if (window.lucide && lucide.createIcons) lucide.createIcons();
  } catch {}
}

// Router
function currentRoute() {
  const h = location.hash.replace(/^#\//, '').trim();
  return h || (AppState.getUser() ? 'home' : 'login');
}
window.addEventListener('hashchange', () => render(currentRoute()));
document.addEventListener('DOMContentLoaded', () => render(currentRoute()));
