/* ═══════════════════════════════════════════════
   THE DIGITAL YES — App JS
   ═══════════════════════════════════════════════ */

'use strict';

// ─── NAVBAR ───────────────────────────────────────
const navbar = document.getElementById('navbar');
const navToggle = document.querySelector('.nav-toggle');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

navToggle?.addEventListener('click', () => {
  navbar.classList.toggle('mobile-open');
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-mobile a').forEach(link => {
  link.addEventListener('click', () => {
    navbar.classList.remove('mobile-open');
  });
});

// ─── REVEAL ON SCROLL ─────────────────────────────
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger siblings in the same parent
      const siblings = [...entry.target.parentElement.querySelectorAll('.reveal:not(.visible)')];
      const idx = siblings.indexOf(entry.target);
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, idx * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

// ─── TEMPLATE FILTER ──────────────────────────────
const filterBtns = document.querySelectorAll('.filter-btn');
const templateCards = document.querySelectorAll('.template-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    templateCards.forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

// ─── TESTIMONIALS SLIDER ──────────────────────────
const inner     = document.getElementById('testimonialsInner');
const prevBtn   = document.getElementById('tPrev');
const nextBtn   = document.getElementById('tNext');
const dotsEl    = document.getElementById('tDots');
const cards     = document.querySelectorAll('.testimonial-card');

let current = 0;
let visibleCount = getVisibleCount();
let total = Math.ceil(cards.length / visibleCount);
let autoSlide;

function getVisibleCount() {
  if (window.innerWidth <= 560) return 1;
  if (window.innerWidth <= 1024) return 2;
  return 3;
}

function buildDots() {
  if (!dotsEl) return;
  dotsEl.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.className = 't-dot' + (i === current ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  }
}

function goTo(idx) {
  current = Math.max(0, Math.min(idx, total - 1));
  const cardWidth = cards[0]?.offsetWidth + 24; // gap 1.5rem = 24px
  inner.style.transform = `translateX(-${current * visibleCount * cardWidth}px)`;
  updateDots();
}

function updateDots() {
  dotsEl?.querySelectorAll('.t-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === current);
  });
}

function nextSlide() {
  goTo(current < total - 1 ? current + 1 : 0);
}
function prevSlide() {
  goTo(current > 0 ? current - 1 : total - 1);
}

prevBtn?.addEventListener('click', () => { prevSlide(); resetAuto(); });
nextBtn?.addEventListener('click', () => { nextSlide(); resetAuto(); });

function resetAuto() {
  clearInterval(autoSlide);
  autoSlide = setInterval(nextSlide, 5000);
}

function initSlider() {
  visibleCount = getVisibleCount();
  total = Math.ceil(cards.length / visibleCount);
  current = 0;
  buildDots();
  goTo(0);
  resetAuto();
}

window.addEventListener('resize', initSlider, { passive: true });
initSlider();

// ─── FAQ ACCORDION ────────────────────────────────
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    // Close all
    document.querySelectorAll('.faq-question').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling.classList.remove('open');
    });
    // Open this one if it wasn't open
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      btn.nextElementSibling.classList.add('open');
    }
  });
});

// ─── SMOOTH SCROLL (Fallback for old Safari) ──────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const id = anchor.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      const offset = navbar.offsetHeight + 16;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ─── COUNTDOWN IN HERO (optional demo) ────────────
// Animates the stat numbers on first view
const statNumbers = document.querySelectorAll('.stat-number');

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const text = el.textContent;
    const match = text.match(/[\d\s]+/);
    if (!match) return;
    const target = parseInt(match[0].replace(/\s/g, ''), 10);
    if (isNaN(target) || target < 10) return;

    let start = 0;
    const duration = 1200;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      const current = Math.round(eased * target);
      el.textContent = text.replace(match[0], current.toLocaleString('pt-PT'));
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = text; // restore original
    };
    requestAnimationFrame(step);
    countObserver.unobserve(el);
  });
}, { threshold: 0.5 });

statNumbers.forEach(el => countObserver.observe(el));
