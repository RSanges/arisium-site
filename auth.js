/* ─── Supabase Auth — Arisium Landing Page (fetch natif, sans SDK) ────────────── */

/* ─── Config ─────────────────────────────────────────────────────────────────── */
const SUPABASE_URL  = 'https://nyxenthjdmesyldymxcn.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55eGVudGhqZG1lc3lsZHlteGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxOTEzODMsImV4cCI6MjA4ODc2NzM4M30.LSuLxy6iJ2El5OBKbbrWHmFbGKqlhW6tXLYiHjSgvSM';
const STORAGE_KEY   = 'sb-nyxenthjdmesyldymxcn-auth-token';

/* ─── Session locale (localStorage) ─────────────────────────────────────────── */
function getStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    // Expire dans moins de 60 s → considère invalide
    if (s.expires_at && s.expires_at < Math.round(Date.now() / 1000) + 60) return null;
    return s;
  } catch { return null; }
}

function saveSession(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      access_token:  s.access_token,
      token_type:    s.token_type    || 'bearer',
      expires_in:    s.expires_in    || 3600,
      expires_at:    s.expires_at    || Math.round(Date.now() / 1000) + (s.expires_in || 3600),
      refresh_token: s.refresh_token,
      user:          s.user,
    }));
  } catch {}
}

function clearSession() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

/* ─── REST helpers ───────────────────────────────────────────────────────────── */
async function authPost(path, body, token) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function fetchFirstName(userId, accessToken) {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(userId)}&select=first_name&limit=1`,
      {
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Accept':        'application/json',
        },
      },
    );
    if (!r.ok) return null;
    const rows = await r.json();
    return rows[0]?.first_name ?? null;
  } catch { return null; }
}

/* ─── DOM refs stables ───────────────────────────────────────────────────────── */
const modal       = document.getElementById('auth-modal');
const modalOvl    = document.getElementById('auth-overlay');
const modalClose  = document.getElementById('auth-close');
const tabLogin    = document.getElementById('tab-login');
const tabSignup   = document.getElementById('tab-signup');
const formLogin   = document.getElementById('form-login');
const formSignup  = document.getElementById('form-signup');
const navAuthArea = document.getElementById('nav-auth-area');

/* ─── Modal open / close ─────────────────────────────────────────────────────── */
function openModal(tab) {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  clearMessages();
  switchTab(tab || 'login');
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOvl.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ─── Délégation globale ─────────────────────────────────────────────────────── */
document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('.js-open-auth')) {
    e.preventDefault();
    openModal('login');
    return;
  }
  if (t.closest('.js-user-menu-btn')) {
    e.stopPropagation();
    navAuthArea.querySelector('.js-user-dropdown')?.classList.toggle('open');
    return;
  }
  if (t.closest('.js-signout')) {
    signOut();
    return;
  }
  if (!t.closest('.nav-user-menu')) {
    navAuthArea.querySelector('.js-user-dropdown')?.classList.remove('open');
  }
});

/* ─── Tabs ───────────────────────────────────────────────────────────────────── */
function switchTab(tab) {
  const isLogin = tab === 'login';
  tabLogin.classList.toggle('active', isLogin);
  tabSignup.classList.toggle('active', !isLogin);
  formLogin.style.display  = isLogin ? 'flex' : 'none';
  formSignup.style.display = isLogin ? 'none' : 'flex';
  clearMessages();
}

tabLogin.addEventListener('click',  () => switchTab('login'));
tabSignup.addEventListener('click', () => switchTab('signup'));

/* ─── Messages ───────────────────────────────────────────────────────────────── */
function showMsg(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.className = type === 'error' ? 'auth-error' : 'auth-success';
}
function clearMessages() {
  document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
    el.style.display = 'none';
    el.textContent = '';
  });
}

/* ─── Loading ────────────────────────────────────────────────────────────────── */
function setLoading(btn, on) {
  btn.disabled = on;
  btn.textContent = on ? 'Chargement...' : btn.dataset.label;
}

/* ─── Phone mockup ───────────────────────────────────────────────────────────── */
const GENERIC_NAME = 'Thomas';

function resolveName(firstName, user) {
  if (firstName) return firstName;
  if (user?.email) {
    const local = user.email.split('@')[0].split(/[._-]/)[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return GENERIC_NAME;
}

function updateMockup(firstName, user) {
  const greetEl  = document.getElementById('phone-greeting');
  const dateEl   = document.getElementById('phone-date');
  const avatarEl = document.getElementById('phone-avatar');
  if (greetEl) {
    const h    = new Date().getHours();
    const word = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
    greetEl.textContent = `${word}, ${resolveName(firstName, user)}`;
  }
  if (dateEl) {
    const d = new Date();
    dateEl.textContent = d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  }
  if (avatarEl) {
    avatarEl.textContent = firstName?.[0]?.toUpperCase()
      ?? user?.email?.[0]?.toUpperCase()
      ?? 'T';
  }
}

updateMockup(null, null);

/* ─── Navbar state ───────────────────────────────────────────────────────────── */
function setNavLoggedIn(user, firstName) {
  const initial = firstName
    ? firstName[0].toUpperCase()
    : (user.email || '?')[0].toUpperCase();

  navAuthArea.innerHTML = `
    <div class="nav-user-menu">
      <button class="nav-user-btn js-user-menu-btn" title="${user.email}">
        <span class="nav-avatar">${initial}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 4l4 4 4-4"/>
        </svg>
      </button>
      <div class="user-dropdown js-user-dropdown">
        <div class="user-dropdown-email">${firstName ? firstName + ' · ' : ''}${user.email}</div>
        <div class="user-dropdown-divider"></div>
        <button class="user-dropdown-item js-signout">Se déconnecter</button>
      </div>
    </div>`;
}

function setNavLoggedOut() {
  navAuthArea.innerHTML = `
    <button class="btn-outline js-open-auth" style="padding:10px 20px;font-size:0.8125rem">Connexion</button>
    <a href="#pricing" class="btn-primary nav-cta" style="padding:11px 24px">Essai gratuit 7 jours →</a>`;
}

/* ─── Session au chargement ──────────────────────────────────────────────────── */
(async () => {
  const session = getStoredSession();
  if (!session?.user) return;
  const firstName = await fetchFirstName(session.user.id, session.access_token);
  setNavLoggedIn(session.user, firstName);
  updateMockup(firstName, session.user);
})();

/* ─── Sign up ────────────────────────────────────────────────────────────────── */
formSignup.addEventListener('submit', async e => {
  e.preventDefault();
  clearMessages();

  const email   = document.getElementById('signup-email').value.trim();
  const pwd     = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;
  const btn     = formSignup.querySelector('.auth-submit');

  if (pwd !== confirm) { showMsg('signup-error', 'Les mots de passe ne correspondent pas.', 'error'); return; }
  if (pwd.length < 8)  { showMsg('signup-error', 'Le mot de passe doit contenir au moins 8 caractères.', 'error'); return; }

  setLoading(btn, true);
  try {
    const data = await authPost('/signup', { email, password: pwd });
    if (data.error || data.msg) {
      const raw = data.error_description || data.msg || data.error || '';
      const msg = raw.includes('already registered')
        ? 'Cet email est déjà utilisé. Essayez de vous connecter.'
        : raw || 'Erreur inconnue.';
      showMsg('signup-error', msg, 'error');
    } else {
      showMsg('signup-success', '✓ Compte créé ! Vérifiez votre email pour confirmer.', 'success');
      formSignup.reset();
    }
  } catch {
    showMsg('signup-error', 'Erreur réseau. Réessayez.', 'error');
  } finally {
    setLoading(btn, false);
  }
});

/* ─── Sign in ────────────────────────────────────────────────────────────────── */
formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  clearMessages();

  const email = document.getElementById('login-email').value.trim();
  const pwd   = document.getElementById('login-password').value;
  const btn   = formLogin.querySelector('.auth-submit');

  setLoading(btn, true);
  try {
    const data = await authPost('/token?grant_type=password', { email, password: pwd });
    if (data.error || data.error_code) {
      const raw = data.error_description || data.msg || data.error || '';
      const msg = raw.toLowerCase().includes('invalid login')
        ? 'Email ou mot de passe incorrect.'
        : raw || 'Email ou mot de passe incorrect.';
      showMsg('login-error', msg, 'error');
    } else {
      saveSession(data);
      const firstName = await fetchFirstName(data.user.id, data.access_token);
      setNavLoggedIn(data.user, firstName);
      updateMockup(firstName, data.user);
      closeModal();
    }
  } catch {
    showMsg('login-error', 'Erreur réseau. Réessayez.', 'error');
  } finally {
    setLoading(btn, false);
  }
});

/* ─── Waitlist ───────────────────────────────────────────────────────────────── */
async function handleWaitlist(e, id) {
  e.preventDefault();
  const form  = e.target;
  const input = form.querySelector('.waitlist-input');
  const btn   = form.querySelector('.waitlist-submit');
  const msg   = document.getElementById(`waitlist-${id}-msg`);
  const email = input.value.trim();
  if (!email) return;

  const origLabel = btn.textContent;
  btn.disabled    = true;
  btn.textContent = 'Inscription...';
  msg.textContent = '';
  msg.className   = 'waitlist-msg';

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey':       SUPABASE_KEY,
        'Prefer':       'return=minimal',
      },
      body: JSON.stringify({ email }),
    });

    if (res.status === 201) {
      msg.textContent = '✓ Inscrit ! Vous serez notifié dès le lancement.';
      msg.className   = 'waitlist-msg success';
      input.value     = '';
      btn.textContent = '✓ Inscrit';
    } else if (res.status === 409) {
      msg.textContent = 'Cet email est déjà inscrit.';
      msg.className   = 'waitlist-msg error';
      btn.disabled    = false;
      btn.textContent = origLabel;
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch {
    msg.textContent = 'Une erreur est survenue. Réessayez.';
    msg.className   = 'waitlist-msg error';
    btn.disabled    = false;
    btn.textContent = origLabel;
  }
}

/* ─── Sign out ───────────────────────────────────────────────────────────────── */
async function signOut() {
  const session = getStoredSession();
  clearSession();
  // Appel backend en arrière-plan (best-effort)
  if (session?.access_token) {
    fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type':  'application/json',
      },
    }).catch(() => {});
  }
  setNavLoggedOut();
  updateMockup(null, null);
}
