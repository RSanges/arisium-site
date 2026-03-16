/* ─── Supabase Auth — Arisium Landing Page ───────────────────────────────────── */

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

/* ─── Délégation globale (robuste aux re-renders du DOM) ─────────────────────── */
document.addEventListener('click', e => {
  const t = e.target;

  // Ouvrir modal
  if (t.closest('.js-open-auth')) {
    e.preventDefault();
    openModal('login');
    return;
  }
  // Toggle dropdown user
  if (t.closest('.js-user-menu-btn')) {
    e.stopPropagation();
    navAuthArea.querySelector('.js-user-dropdown')?.classList.toggle('open');
    return;
  }
  // Déconnexion
  if (t.closest('.js-signout')) {
    signOut();
    return;
  }
  // Fermer dropdown si clic ailleurs
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
    // e.g. "jean.dupont@gmail.com" → "Jean"
    const local = user.email.split('@')[0].split(/[._-]/)[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return GENERIC_NAME;
}

function updateMockup(firstName, user) {
  const greetEl = document.getElementById('phone-greeting');
  const dateEl  = document.getElementById('phone-date');

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
}

// Initialise le mockup au chargement (date réelle + salutation générique)
updateMockup(null, null);

/* ─── Fetch first_name depuis user_profiles ──────────────────────────────────── */
async function fetchFirstName(userId) {
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('user_profiles')
      .select('first_name')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) { console.warn('[Arisium] fetchFirstName error:', error.message); return null; }
    return data?.first_name ?? null;
  } catch (err) {
    console.warn('[Arisium] fetchFirstName exception:', err);
    return null;
  }
}

/* ─── Navbar state ───────────────────────────────────────────────────────────── */
function setNavLoggedIn(user, firstName) {
  // Initiale : prénom en priorité, sinon première lettre de l'email
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

/* ══════════════════════════════════════════════════════════════════════════════
   Init Supabase — isolé dans un try/catch pour ne pas bloquer le modal
══════════════════════════════════════════════════════════════════════════════ */
let sb = null;

try {
  const SUPABASE_URL  = 'https://nyxenthjdmesyldymxcn.supabase.co';
  const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55eGVudGhqZG1lc3lsZHlteGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxOTEzODMsImV4cCI6MjA4ODc2NzM4M30.LSuLxy6iJ2El5OBKbbrWHmFbGKqlhW6tXLYiHjSgvSM';
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // Session initiale
  sb.auth.getSession().then(async ({ data }) => {
    const u = data?.session?.user ?? null;
    console.log('[Arisium] session:', u ? u.email : 'none');
    if (u) {
      const firstName = await fetchFirstName(u.id);
      console.log('[Arisium] first_name:', firstName, '| résolu:', resolveName(firstName, u));
      setNavLoggedIn(u, firstName);
      updateMockup(firstName, u);
    }
  });

  // Changements d'état
  sb.auth.onAuthStateChange(async (_e, session) => {
    if (session?.user) {
      const u         = session.user;
      const firstName = await fetchFirstName(u.id);
      setNavLoggedIn(u, firstName);
      updateMockup(firstName, u);
    } else {
      setNavLoggedOut();
      updateMockup(null, null);
    }
  });

} catch (err) {
  console.error('[Arisium] Supabase init failed:', err);
}

/* ─── Sign up ────────────────────────────────────────────────────────────────── */
formSignup.addEventListener('submit', async e => {
  e.preventDefault();
  clearMessages();

  if (!sb) { showMsg('signup-error', 'Service indisponible. Réessayez plus tard.', 'error'); return; }

  const email   = document.getElementById('signup-email').value.trim();
  const pwd     = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;
  const btn     = formSignup.querySelector('.auth-submit');

  if (pwd !== confirm) { showMsg('signup-error', 'Les mots de passe ne correspondent pas.', 'error'); return; }
  if (pwd.length < 8)  { showMsg('signup-error', 'Le mot de passe doit contenir au moins 8 caractères.', 'error'); return; }

  setLoading(btn, true);
  try {
    const { error } = await sb.auth.signUp({ email, password: pwd });
    if (error) {
      const msg = error.message.includes('already registered')
        ? 'Cet email est déjà utilisé. Essayez de vous connecter.'
        : error.message;
      showMsg('signup-error', msg, 'error');
    } else {
      showMsg('signup-success', '✓ Compte créé ! Vérifiez votre email pour confirmer.', 'success');
      formSignup.reset();
    }
  } catch (err) {
    showMsg('signup-error', 'Erreur réseau. Réessayez.', 'error');
  } finally {
    setLoading(btn, false);
  }
});

/* ─── Sign in ────────────────────────────────────────────────────────────────── */
formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  clearMessages();

  if (!sb) { showMsg('login-error', 'Service indisponible. Réessayez plus tard.', 'error'); return; }

  const email = document.getElementById('login-email').value.trim();
  const pwd   = document.getElementById('login-password').value;
  const btn   = formLogin.querySelector('.auth-submit');

  setLoading(btn, true);
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pwd });
    if (error) {
      const msg = error.message.includes('Invalid login')
        ? 'Email ou mot de passe incorrect.'
        : error.message;
      showMsg('login-error', msg, 'error');
    } else {
      const u         = data.user;
      const firstName = await fetchFirstName(u.id);
      setNavLoggedIn(u, firstName);
      updateMockup(firstName, u);
      closeModal();
    }
  } catch (err) {
    showMsg('login-error', 'Erreur réseau. Réessayez.', 'error');
  } finally {
    setLoading(btn, false);
  }
});

/* ─── Sign out ───────────────────────────────────────────────────────────────── */
async function signOut() {
  if (sb) await sb.auth.signOut();
  setNavLoggedOut();
  updateMockup(null, null);
}
