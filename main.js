/* ─── Navbar scroll ──────────────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });


/* ─── Mobile menu ────────────────────────────────────────────────────────────── */
const burger      = document.getElementById('burger');
const mobileMenu  = document.getElementById('mobile-menu');

burger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

// Close menu when any link inside is clicked
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  });
});


/* ─── Scroll animations (Intersection Observer) ──────────────────────────────── */
const fadeEls = document.querySelectorAll('.fade-up');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // animate once
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px',
});

fadeEls.forEach(el => observer.observe(el));


/* ─── FAQ accordion ──────────────────────────────────────────────────────────── */
document.querySelectorAll('.faq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const item   = btn.parentElement;
    const body   = item.querySelector('.faq-body');
    const isOpen = item.classList.contains('open');

    // Close all
    document.querySelectorAll('.faq-item').forEach(el => {
      el.classList.remove('open');
      el.querySelector('.faq-body').style.maxHeight = null;
      el.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
    });

    // Open clicked if it was closed
    if (!isOpen) {
      item.classList.add('open');
      body.style.maxHeight = body.scrollHeight + 'px';
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});


/* ─── Anchor links ───────────────────────────────────────────────────────────── */
// Le scroll est géré nativement par :
//   html { scroll-behavior: smooth }  → animation fluide
//   [id]  { scroll-margin-top: 96px } → offset navbar automatique
// On intercepte uniquement href="#" pour éviter le saut en haut de page.
document.querySelectorAll('a[href="#"]').forEach(a => {
  a.addEventListener('click', e => e.preventDefault());
});


/* ─── Primus CTA → scroll to waitlist with context ─────────────────────────── */
let primusMode = false;

document.querySelectorAll('[data-primus="true"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    primusMode = true;

    const ctaBtn = document.getElementById('waitlist-cta-btn');
    const ctaEmail = document.getElementById('waitlist-cta-email');
    if (ctaBtn) ctaBtn.textContent = 'Réserver ma place Primus →';
    if (ctaEmail) ctaEmail.placeholder = 'ton@email.com';

    document.getElementById('waitlist').scrollIntoView({ behavior: 'smooth' });
  });
});

/* ─── Waitlist form success message ─────────────────────────────────────────── */
// Override handleWaitlist if it exists to show Primus-specific message
const _origHandleWaitlist = window.handleWaitlist;
window.handleWaitlist = function(e, source) {
  if (typeof _origHandleWaitlist === 'function') {
    _origHandleWaitlist(e, source);
  }

  // After submission, if Primus mode, update the success message
  if (primusMode && source === 'cta') {
    setTimeout(() => {
      const msg = document.getElementById('waitlist-cta-msg');
      if (msg && msg.classList.contains('success')) {
        msg.textContent = 'Ta place Primus est réservée. Tu recevras un accès prioritaire au lancement.';
      }
    }, 500);
  }
};
