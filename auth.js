/* ─── Supabase Auth — Arisium Landing Page ───────────────────────────────────── */
const SUPABASE_URL      = 'https://nyxenthjdmesyldymxcn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55eGVudGhqZG1lc3lsZHlteGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxOTEzODMsImV4cCI6MjA4ODc2NzM4M30.LSuLxy6iJ2El5OBKbbrWHmFbGKqlhW6tXLYiHjSgvSM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ─── DOM refs ───────────────────────────────────────────────────────────────── */
const modal        = document.getElementById('auth-modal');
const modalOverlay = document.getElementById('auth-overlay');
const modalClose   = document.getElementById('auth-close');
const tabLogin     = document.getElementById('tab-login');
const tabSignup    = document.getElementById('tab-signup');
const formLogin    = document.getElementById('form-login');
const formSignup   = document.getElementById('form-signup');
const btnOpenLogin = document.getElementById('btn-open-auth');    // nav desktop
const btnOpenMob   = document.getElementById('btn-open-auth-mob'); // nav mobile
const navAuthArea  = document.getElementById('nav-auth-area');

/* ─── Open / close modal ─────────────────────────────────────────────────────── */
function openModal(tab = 'login') {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  clearErrors();
  switchTab(tab);
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

btnOpenLogin?.addEventListener('click', e => { e.preventDefault(); openModal('login'); });
btnOpenMob?.addEventListener('click',   e => { e.preventDefault(); openModal('login'); });

/* ─── Tab switch ─────────────────────────────────────────────────────────────── */
function switchTab(tab) {
  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    formLogin.style.display = 'flex';
    formSignup.style.display = 'none';
  } else {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    formSignup.style.display = 'flex';
    formLogin.style.display = 'none';
  }
  clearErrors();
}

tabLogin.addEventListener('click',  () => switchTab('login'));
tabSignup.addEventListener('click', () => switchTab('signup'));

/* ─── Error / success helpers ────────────────────────────────────────────────── */
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function showSuccess(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function clearErrors() {
  document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
    el.style.display = 'none';
    el.textContent = '';
  });
}

/* ─── Loading state ──────────────────────────────────────────────────────────── */
function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.textContent = loading ? 'Chargement...' : btn.dataset.label;
}

/* ─── Update navbar after auth ───────────────────────────────────────────────── */
function updateNavbar(user) {
  if (!navAuthArea) return;
  if (user) {
    const email = user.email || '';
    const initials = email.slice(0, 2).toUpperCase();
    navAuthArea.innerHTML = `
      <div class="nav-user-menu" id="user-menu-wrap">
        <button class="nav-user-btn" id="user-menu-btn" title="${email}">
          <span class="nav-avatar">${initials}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2 4l4 4 4-4"/>
          </svg>
        </button>
        <div class="user-dropdown" id="user-dropdown">
          <div class="user-dropdown-email">${email}</div>
          <div class="user-dropdown-divider"></div>
          <button class="user-dropdown-item" id="btn-signout">Se déconnecter</button>
        </div>
      </div>
    `;
    document.getElementById('user-menu-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('user-dropdown')?.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      document.getElementById('user-dropdown')?.classList.remove('open');
    });
    document.getElementById('btn-signout')?.addEventListener('click', signOut);
  } else {
    navAuthArea.innerHTML = `
      <a href="#" id="btn-open-auth" class="btn-outline" style="padding:10px 20px;font-size:0.8125rem">Connexion</a>
      <a href="#pricing" class="btn-primary nav-cta" style="padding:11px 24px">Essai gratuit 7 jours →</a>
    `;
    document.getElementById('btn-open-auth')?.addEventListener('click', e => {
      e.preventDefault(); openModal('login');
    });
  }
}

/* ─── Sign up ────────────────────────────────────────────────────────────────── */
formSignup.addEventListener('submit', async e => {
  e.preventDefault();
  clearErrors();

  const email    = formSignup.querySelector('#signup-email').value.trim();
  const password = formSignup.querySelector('#signup-password').value;
  const confirm  = formSignup.querySelector('#signup-confirm').value;
  const btn      = formSignup.querySelector('.auth-submit');

  if (password !== confirm) {
    showError('signup-error', 'Les mots de passe ne correspondent pas.');
    return;
  }
  if (password.length < 8) {
    showError('signup-error', 'Le mot de passe doit contenir au moins 8 caractères.');
    return;
  }

  setLoading(btn, true);
  const { error } = await supabase.auth.signUp({ email, password });
  setLoading(btn, false);

  if (error) {
    const msg = error.message.includes('already registered')
      ? 'Cet email est déjà utilisé. Essayez de vous connecter.'
      : error.message;
    showError('signup-error', msg);
  } else {
    showSuccess('signup-success',
      '✓ Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
    formSignup.reset();
  }
});

/* ─── Sign in ────────────────────────────────────────────────────────────────── */
formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  clearErrors();

  const email    = formLogin.querySelector('#login-email').value.trim();
  const password = formLogin.querySelector('#login-password').value;
  const btn      = formLogin.querySelector('.auth-submit');

  setLoading(btn, true);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  setLoading(btn, false);

  if (error) {
    const msg = error.message.includes('Invalid login')
      ? 'Email ou mot de passe incorrect.'
      : error.message;
    showError('login-error', msg);
  } else {
    updateNavbar(data.user);
    closeModal();
  }
});

/* ─── Sign out ───────────────────────────────────────────────────────────────── */
async function signOut() {
  await supabase.auth.signOut();
  updateNavbar(null);
}

/* ─── Session check on load ──────────────────────────────────────────────────── */
supabase.auth.getSession().then(({ data }) => {
  updateNavbar(data?.session?.user ?? null);
});

supabase.auth.onAuthStateChange((_event, session) => {
  updateNavbar(session?.user ?? null);
});
