/* ─── Arisium Landing Page — Waitlist & Phone Mockup ─────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Config ─────────────────────────────────────────────────────────────────── */
const SUPABASE_URL = 'https://nyxenthjdmesyldymxcn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55eGVudGhqZG1lc3lsZHlteGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxOTEzODMsImV4cCI6MjA4ODc2NzM4M30.LSuLxy6iJ2El5OBKbbrWHmFbGKqlhW6tXLYiHjSgvSM';

/* ─── Phone mockup ───────────────────────────────────────────────────────────── */
(function updateMockup() {
  const greetEl  = document.getElementById('phone-greeting');
  const dateEl   = document.getElementById('phone-date');
  if (greetEl) {
    const h    = new Date().getHours();
    const word = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
    greetEl.textContent = `${word}, Thomas`;
  }
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  }
})();

/* ─── Waitlist (rate-limited) ────────────────────────────────────────────────── */
const waitlistLastSubmit = { ts: 0, count: 0 };
const WAITLIST_COOLDOWN  = 10000;
const WAITLIST_MAX_BURST = 3;

async function handleWaitlist(e, id) {
  e.preventDefault();
  const form  = e.target;
  const input = form.querySelector('.waitlist-input');
  const btn   = form.querySelector('.waitlist-submit');
  const msg   = document.getElementById(`waitlist-${id}-msg`);
  const email = input.value.trim();
  if (!email) return;
  if (!EMAIL_RE.test(email)) {
    msg.textContent = 'Entre une adresse email valide.';
    msg.className   = 'waitlist-msg error';
    return;
  }

  // Rate limiting client-side
  const now = Date.now();
  if (now - waitlistLastSubmit.ts < WAITLIST_COOLDOWN) {
    msg.textContent = 'Patiente quelques secondes avant de réessayer.';
    msg.className   = 'waitlist-msg error';
    return;
  }
  waitlistLastSubmit.count++;
  if (waitlistLastSubmit.count > WAITLIST_MAX_BURST) {
    msg.textContent = 'Trop de tentatives. Réessaie dans quelques minutes.';
    msg.className   = 'waitlist-msg error';
    return;
  }
  waitlistLastSubmit.ts = now;

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

    if (res.status === 201 || res.status === 409) {
      // Message identique pour 201 et 409 — évite l'énumération d'emails
      msg.textContent = '✓ Inscrit ! Tu seras notifié dès le lancement.';
      msg.className   = 'waitlist-msg success';
      input.value     = '';
      btn.textContent = '✓ Inscrit';
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch {
    msg.textContent = 'Une erreur est survenue. Réessaie.';
    msg.className   = 'waitlist-msg error';
    btn.disabled    = false;
    btn.textContent = origLabel;
  }
}

document.getElementById('waitlist-hero')?.addEventListener('submit', e => handleWaitlist(e, 'hero'));
document.getElementById('waitlist-cta')?.addEventListener('submit', e => handleWaitlist(e, 'cta'));
