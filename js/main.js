(() => {
  'use strict';

  window.__portfolioReady = true;

  const root = document.documentElement;
  const gsap = window.gsap;
  const canAnimate = root.classList.contains('js') && typeof gsap !== 'undefined';

  // Sin GSAP o con movimiento reducido: todo queda visible y estático.
  if (!canAnimate) root.classList.remove('js');

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  setupNavHighlight();

  if (canAnimate) {
    splitName();
    playIntro();
    setupReveals();
  }

  /* -------------------------------------------------------
     Nombre: separa cada letra para animarlas una por una
     ------------------------------------------------------- */
  function splitName() {
    const title = document.querySelector('.hero-name');
    const lines = [...title.querySelectorAll('.name-line')];

    // Texto completo para lectores de pantalla; las letras sueltas se ocultan.
    const label = document.createElement('span');
    label.className = 'sr-only';
    label.textContent = lines.map((l) => l.textContent.trim()).join(' ');
    title.prepend(label);

    lines.forEach((line) => {
      const text = line.textContent.trim();
      line.textContent = '';
      line.setAttribute('aria-hidden', 'true');
      for (const ch of text) {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch === ' ' ? ' ' : ch;
        line.appendChild(span);
      }
    });
  }

  /* -------------------------------------------------------
     Intro: franjas diagonales + entrada de la portada
     ------------------------------------------------------- */
  function playIntro() {
    const intro = document.querySelector('.intro');
    const stripes = intro.querySelectorAll('.intro-stripe');
    const cover = intro.querySelector('.intro-cover');
    const skipEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        skipEvents.forEach((e) => window.removeEventListener(e, skip));
        intro.remove();
        startTyping();
      },
    });

    tl.set(stripes, { xPercent: -110, autoAlpha: 1 })
      // Las franjas entran y tapan la pantalla...
      .to(stripes, { xPercent: 0, duration: 0.5, ease: 'power3.inOut', stagger: 0.07 })
      .set(cover, { autoAlpha: 0 })
      // ...y salen hacia la derecha descubriendo la portada.
      .to(stripes, {
        xPercent: 110,
        duration: 0.55,
        ease: 'power3.inOut',
        stagger: { each: 0.07, from: 'end' },
      }, '+=0.05')
      .addLabel('hero', '-=0.35')
      .from('.hero-shape', { xPercent: 100, duration: 0.9, ease: 'expo.out' }, 'hero')
      .from('.hero-stripe', { scaleY: 0, transformOrigin: 'top center', duration: 0.6 }, 'hero+=0.1')
      .from('.hero-label', { x: -30, autoAlpha: 0, duration: 0.5 }, 'hero+=0.15')
      .from('.hero-name .char', {
        x: -60,
        autoAlpha: 0,
        duration: 0.55,
        stagger: 0.035,
        ease: 'power4.out',
      }, 'hero+=0.2')
      .from('.hero-tag', { scaleX: 0, transformOrigin: 'left center', duration: 0.45, ease: 'expo.out' }, '-=0.25')
      .from('.hero-typed', { y: 10, autoAlpha: 0, duration: 0.4 }, '-=0.15')
      .from('.p3-row', {
        x: 140,
        autoAlpha: 0,
        duration: 0.6,
        stagger: 0.09,
        ease: 'expo.out',
      }, 'hero+=0.35')
      .from('.site-nav', { yPercent: -150, autoAlpha: 0, duration: 0.5 }, '-=0.3')
      .from('.scroll-cue', { y: -12, autoAlpha: 0, duration: 0.5 }, '-=0.2');

    // Cualquier interacción salta directo al final de la intro.
    function skip() {
      if (tl.progress() < 1) tl.progress(1);
    }
    skipEvents.forEach((e) => window.addEventListener(e, skip, { passive: true }));
  }

  /* -------------------------------------------------------
     Texto que se escribe y borra solo
     ------------------------------------------------------- */
  function startTyping() {
    const el = document.querySelector('.typed-text');
    if (!el) return;
    const words = (el.dataset.words || '').split('|').map((w) => w.trim()).filter(Boolean);
    if (words.length < 2) return;

    let wordIndex = 0;
    let charIndex = words[0].length;
    let deleting = false;

    const tick = () => {
      const word = words[wordIndex];
      if (!deleting && charIndex === word.length) {
        deleting = true;
        return setTimeout(tick, 1800);
      }
      if (deleting && charIndex === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        return setTimeout(tick, 300);
      }
      charIndex += deleting ? -1 : 1;
      el.textContent = words[wordIndex].slice(0, charIndex);
      setTimeout(tick, deleting ? 35 : 70);
    };
    tick();
  }

  /* -------------------------------------------------------
     Aparición de secciones al hacer scroll
     ------------------------------------------------------- */
  function setupReveals() {
    const items = gsap.utils.toArray('[data-reveal]');
    const titles = gsap.utils.toArray('.section-title');

    gsap.set(items, { autoAlpha: 0, y: 32 });
    titles.forEach((t) => {
      gsap.set(t.querySelectorAll('.section-num, .section-text'), { autoAlpha: 0 });
      gsap.set(t.querySelector('.wipe'), { scaleX: 0, transformOrigin: 'left center' });
    });

    const io = new IntersectionObserver((entries) => {
      const batch = [];
      entries.forEach((entry) => {
        // Se revela si entra en pantalla o si ya quedó arriba (al recargar a mitad de página).
        const alreadyPassed = entry.boundingClientRect.bottom < 0;
        if (!entry.isIntersecting && !alreadyPassed) return;
        io.unobserve(entry.target);
        if (entry.target.matches('.section-title')) revealTitle(entry.target);
        else batch.push(entry.target);
      });
      if (batch.length) {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.1,
          // Limpia los estilos para que funcionen los :hover de CSS.
          clearProps: 'transform,opacity,visibility',
        });
      }
    }, { rootMargin: '0px 0px -12% 0px' });

    [...titles, ...items].forEach((el) => io.observe(el));
  }

  function revealTitle(title) {
    const wipe = title.querySelector('.wipe');
    const parts = title.querySelectorAll('.section-num, .section-text');
    gsap.timeline()
      .to(wipe, { scaleX: 1, duration: 0.35, ease: 'power3.in' })
      .set(parts, { autoAlpha: 1 })
      .set(wipe, { transformOrigin: 'right center' })
      .to(wipe, { scaleX: 0, duration: 0.4, ease: 'power3.out' });
  }

  /* -------------------------------------------------------
     Navbar: resalta la sección visible
     ------------------------------------------------------- */
  function setupNavHighlight() {
    const links = [...document.querySelectorAll('.nav-link')];
    const ids = ['inicio', ...links.map((a) => a.getAttribute('href').slice(1))];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);

    const setActive = (id) => {
      links.forEach((a) => {
        const on = a.getAttribute('href') === `#${id}`;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((s) => io.observe(s));
  }
})();
