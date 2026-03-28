'use strict';

/* ── LANGUAGE SWITCHER ── */
const html = document.documentElement;
let lang = 'pt';

function setLang(newLang) {
  lang = newLang;
  html.setAttribute('data-lang', lang);

  document.querySelectorAll('[data-pt][data-en]').forEach(el => {
    el.textContent = el.dataset[lang];
  });

  document.querySelectorAll('.lang-pt, .lang-en').forEach(span => {
    span.classList.toggle('active', span.classList.contains(`lang-${lang}`));
  });

  html.setAttribute('lang', lang === 'pt' ? 'pt' : 'en');
  document.title = lang === 'pt'
    ? 'Invite Studio — Convites Digitais para Momentos Especiais'
    : 'Invite Studio — Digital Invitations for Special Moments';
}

document.querySelectorAll('.lang-toggle').forEach(btn => {
  btn.addEventListener('click', () => setLang(lang === 'pt' ? 'en' : 'pt'));
});

/* ── CINEMATIC INTRO ── */
(function () {
  const overlay = document.getElementById('intro-overlay');
  if (!overlay) return;

  // Only play once per browser session
  if (sessionStorage.getItem('is-intro-played')) {
    overlay.remove();
    return;
  }
  sessionStorage.setItem('is-intro-played', '1');

  document.body.style.overflow = 'hidden';
  const introLogo    = overlay.querySelector('.intro-logo');
  const introTagline = overlay.querySelector('.intro-tagline');

  // Two rAF frames ensure transition picks up initial state
  requestAnimationFrame(() => requestAnimationFrame(() => {
    introLogo?.classList.add('show');
    introTagline?.classList.add('show');
  }));

  // Fade out overlay, unlock scroll
  setTimeout(() => {
    overlay.classList.add('fade-out');
    document.body.style.overflow = '';
    setTimeout(() => overlay.remove(), 1300);
  }, 2300);
}());

/* ── SCROLL PROGRESS ── */
const progressBar = document.getElementById('scroll-progress');
if (progressBar) {
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (total > 0) progressBar.style.width = (window.scrollY / total * 100) + '%';
  }, { passive: true });
}

/* ── NAVBAR ── */
const navbar    = document.getElementById('navbar');
const toggleBtn = document.querySelector('.nav-toggle-btn');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

toggleBtn?.addEventListener('click', () => navbar.classList.toggle('open'));

document.querySelectorAll('.nav-mobile a').forEach(link => {
  link.addEventListener('click', () => navbar.classList.remove('open'));
});

/* ── REVEAL ON SCROLL ── */
const REVEAL_SEL = '.reveal, .reveal-blur, .reveal-scale';
const REVEAL_PENDING = '.reveal:not(.visible), .reveal-blur:not(.visible), .reveal-scale:not(.visible)';

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const siblings = [...entry.target.parentElement.querySelectorAll(REVEAL_PENDING)];
    const idx   = siblings.indexOf(entry.target);
    const delay = idx >= 0 ? idx * 90 : 0;
    setTimeout(() => entry.target.classList.add('visible'), delay);
    revealObs.unobserve(entry.target);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

document.querySelectorAll(REVEAL_SEL).forEach(el => revealObs.observe(el));

/* ── TEMPLATE FILTER ── */
const filterBtns = document.querySelectorAll('.f-btn');
const tCards     = document.querySelectorAll('.t-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    tCards.forEach(card => {
      card.classList.toggle('hidden', filter !== 'all' && card.dataset.cat !== filter);
    });
  });
});

/* ── SMOOTH SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      const offset = navbar.offsetHeight + 12;
      window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - offset, behavior: 'smooth' });
    }
  });
});

/* ── RSVP BAR ANIMATION ── */
const rsvpFill = document.querySelector('.rsvp-fill');
const rsvpObs  = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      rsvpFill.style.width = rsvpFill.style.width;
      rsvpObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
if (rsvpFill) rsvpObs.observe(rsvpFill);
