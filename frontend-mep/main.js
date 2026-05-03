
(function () {
  'use strict';

  /* ── Mobile nav toggle ──────────────────────────────────── */
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('is-open');
      hamburgerBtn.classList.toggle('is-open', isOpen);
      hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    });

    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('.nav__mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('is-open');
        hamburgerBtn.classList.remove('is-open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      });
    });
  }

  /* ── Scroll entrance animations ────────────────────────── */
  const animateTargets = [
    '.step-card',
    '.metric-card',
    '.testimonial-card',
    '.section__header',
    '.cta-band__inner',
    '.final-cta__inner',
  ];

  // Add fade-up class to all animation targets
  animateTargets.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('fade-up');
    });
  });

  // IntersectionObserver to trigger animations
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
  } else {
    // Fallback: show everything immediately
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('is-visible'));
  }

  /* ── Sticky nav shadow on scroll ───────────────────────── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const updateNavShadow = () => {
      if (window.scrollY > 8) {
        navbar.style.boxShadow = '0 2px 16px rgba(0,0,0,0.1)';
      } else {
        navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
      }
    };
    window.addEventListener('scroll', updateNavShadow, { passive: true });
    updateNavShadow();
  }

  /* ── Botón flotante: latido periódico cada 5 segundos ── */
  const floatBtn = document.querySelector('.floating-donate-btn');
  if (floatBtn) {
    // Latido inicial al cargar (ya lo hace el CSS, pero aseguramos)
    floatBtn.style.animation = 'gentleBeat 1s ease-in-out';
    // Repetir cada 5 segundos
    setInterval(() => {
      floatBtn.style.animation = 'none';
      // Forzar reflow para reiniciar la animación
      void floatBtn.offsetWidth;
      floatBtn.style.animation = 'gentleBeat 1s ease-in-out';
    }, 5000);
  }

})();
