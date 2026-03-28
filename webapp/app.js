'use strict';

/* ── LANGUAGE SWITCHER ── */
const html    = document.documentElement;
let lang = 'pt';

function setLang(newLang) {
  lang = newLang;
  html.setAttribute('data-lang', lang);

  // Update all elements with data-pt / data-en
  document.querySelectorAll('[data-pt][data-en]').forEach(el => {
    el.textContent = el.dataset[lang];
  });

  // Update lang toggles
  document.querySelectorAll('.lang-pt, .lang-en').forEach(span => {
    const isActive = span.classList.contains(`lang-${lang}`);
    span.classList.toggle('active', isActive);
  });

  // Update html lang attr
  html.setAttribute('lang', lang === 'pt' ? 'pt' : 'en');

  // Update filter buttons (data-pt/data-en already handled above)
  // Update title
  document.title = lang === 'pt'
    ? 'Invite Studio — Convites Digitais para Momentos Especiais'
    : 'Invite Studio — Digital Invitations for Special Moments';
}

document.querySelectorAll('.lang-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    setLang(lang === 'pt' ? 'en' : 'pt');
  });
});

/* ── NAVBAR ── */
const navbar = document.getElementById('navbar');
const toggleBtn = document.querySelector('.nav-toggle-btn');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

toggleBtn?.addEventListener('click', () => {
  navbar.classList.toggle('open');
});

document.querySelectorAll('.nav-mobile a').forEach(link => {
  link.addEventListener('click', () => navbar.classList.remove('open'));
});

/* ── REVEAL ON SCROLL ── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const siblings = [...entry.target.parentElement.querySelectorAll('.reveal:not(.visible)')];
    const delay = siblings.indexOf(entry.target) * 75;
    setTimeout(() => entry.target.classList.add('visible'), delay);
    revealObs.unobserve(entry.target);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

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
      rsvpFill.style.width = rsvpFill.style.width; // trigger reflow
      rsvpObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
if (rsvpFill) rsvpObs.observe(rsvpFill);
