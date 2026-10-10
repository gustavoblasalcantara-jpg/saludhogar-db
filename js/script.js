import { initTracking, trackProductClick } from './tracker/tracker.js';

/* Rastreo de visitas/clics: el banner de cookies pide consentimiento y, solo si el
   visitante acepta, se registran visitas y clics por servicio vía /api (ver tracker.js). */
initTracking();

(function () {
  'use strict';

  /* ============================================================
     Fotos externas: si una no carga, el contenedor muestra su respaldo
     (iniciales / degradado) en vez del texto alternativo roto.
     ============================================================ */
  document.querySelectorAll('.avatar img, .backers-photo-frame img').forEach((img) => {
    const markFailed = () => img.parentElement.classList.add('img-failed');
    img.addEventListener('error', markFailed);
    if (img.complete && img.naturalWidth === 0) markFailed(); // ya había fallado antes de ejecutarse el módulo
  });

  /* ============================================================
     Navbar: sombra al hacer scroll + menú hamburguesa
     ============================================================ */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 8);
  });

  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  hamburger.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });
  navMenu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      navMenu.classList.remove('open');
      hamburger.classList.remove('open');
    })
  );

  /* ============================================================
     Hero: carrusel dinámico (fade + leve zoom), flechas y dots
     ============================================================ */
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroDotsWrap = document.getElementById('hero-dots');
  let heroIndex = 0;
  let heroTimer = null;

  heroSlides.forEach((_, i) => {
    const dot = document.createElement('button');
    if (i === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1));
    dot.addEventListener('click', () => goToHeroSlide(i));
    heroDotsWrap.appendChild(dot);
  });

  function goToHeroSlide(i) {
    heroSlides[heroIndex].classList.remove('active');
    heroDotsWrap.children[heroIndex].classList.remove('active');
    heroIndex = (i + heroSlides.length) % heroSlides.length;
    heroSlides[heroIndex].classList.add('active');
    heroDotsWrap.children[heroIndex].classList.add('active');
  }

  document.getElementById('hero-prev').addEventListener('click', () => {
    goToHeroSlide(heroIndex - 1);
    restartHeroTimer();
  });
  document.getElementById('hero-next').addEventListener('click', () => {
    goToHeroSlide(heroIndex + 1);
    restartHeroTimer();
  });

  function restartHeroTimer() {
    clearInterval(heroTimer);
    heroTimer = setInterval(() => goToHeroSlide(heroIndex + 1), 6500);
  }
  restartHeroTimer();

  const heroCarousel = document.getElementById('hero-carousel');
  heroCarousel.addEventListener('mouseenter', () => clearInterval(heroTimer));
  heroCarousel.addEventListener('mouseleave', restartHeroTimer);

  /* ------------------------------------------------------------
     Deslizamiento táctil (touch swipe) del carrusel principal
     ------------------------------------------------------------ */
  (function enableSwipe(el, onSwipeLeft, onSwipeRight) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let isSwiping = false;
    const THRESHOLD = 45; // píxeles mínimos para considerar un swipe válido

    el.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        isSwiping = true;
        clearInterval(heroTimer);
      },
      { passive: true }
    );

    el.addEventListener(
      'touchmove',
      (e) => {
        if (!isSwiping) return;
        touchEndX = e.changedTouches[0].screenX;
        const deltaX = touchEndX - touchStartX;
        const deltaY = e.changedTouches[0].screenY - touchStartY;
        // Si el gesto es mayormente horizontal, evitamos que el navegador
        // interprete el arrastre como scroll de página (sin bloquear el pan vertical normal).
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    el.addEventListener(
      'touchend',
      (e) => {
        if (!isSwiping) return;
        isSwiping = false;
        touchEndX = e.changedTouches[0].screenX;
        const deltaX = touchEndX - touchStartX;
        if (deltaX > THRESHOLD) {
          onSwipeRight();
        } else if (deltaX < -THRESHOLD) {
          onSwipeLeft();
        }
        restartHeroTimer();
      },
      { passive: true }
    );
  })(
    heroCarousel,
    () => goToHeroSlide(heroIndex + 1), // swipe hacia la izquierda → siguiente
    () => goToHeroSlide(heroIndex - 1) // swipe hacia la derecha → anterior
  );

  /* ============================================================
     Servicios: slider horizontal + tarjetas "Leer más"
     ============================================================ */
  const track = document.getElementById('services-track');
  const cardWidth = 320 + 24; // ancho de tarjeta + gap

  document.getElementById('services-prev').addEventListener('click', () => {
    track.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  });
  document.getElementById('services-next').addEventListener('click', () => {
    track.scrollBy({ left: cardWidth, behavior: 'smooth' });
  });

  /* ------------------------------------------------------------
     Puntos indicadores del carrusel de servicios (solo visibles en
     móvil, donde la navegación es 100% táctil / swipe)
     ------------------------------------------------------------ */
  const serviceCards = Array.from(document.querySelectorAll('.service-card'));
  const servicesDotsWrap = document.getElementById('services-dots');
  let activeServiceDot = 0;

  serviceCards.forEach((card, i) => {
    const dot = document.createElement('button');
    if (i === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', 'Ir al servicio ' + (i + 1));
    dot.addEventListener('click', () => {
      track.scrollTo({ left: card.offsetLeft - 20, behavior: 'smooth' });
    });
    servicesDotsWrap.appendChild(dot);
  });

  function updateActiveServiceDot() {
    // La tarjeta activa es la más cercana al borde izquierdo visible del track
    let closest = 0;
    let closestDist = Infinity;
    serviceCards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - track.scrollLeft);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    if (closest !== activeServiceDot) {
      servicesDotsWrap.children[activeServiceDot]?.classList.remove('active');
      servicesDotsWrap.children[closest]?.classList.add('active');
      activeServiceDot = closest;
    }
  }

  let serviceScrollTicking = false;
  track.addEventListener(
    'scroll',
    () => {
      if (!serviceScrollTicking) {
        requestAnimationFrame(() => {
          updateActiveServiceDot();
          serviceScrollTicking = false;
        });
        serviceScrollTicking = true;
      }
    },
    { passive: true }
  );

  // Botón "Ver más" de cada tarjeta de servicio → abre el banner de detalle
  document.querySelectorAll('.service-card').forEach((card) => {
    card.querySelector('.read-more').addEventListener('click', (e) => {
      e.stopPropagation();
      const key = card.id.replace('card-', '');
      openSpecialtyModal(key);
    });
  });

  /* ============================================================
     Modal de detalle de especialidad (banner con grilla de fotos)
     ============================================================ */
  // Debe coincidir con los ids de `productos_salud` en db/schema.sql
  const SERVICE_PRODUCT_IDS = {
    enfermeria: 1,
    medicina: 2,
    obstetricia: 3,
    psicologia: 4,
    fisioterapia: 5,
    telemedicina: 6,
    farmacia: 7,
  };
  let currentSpecialty = null;

  const SPECIALTY_DATA = {
    enfermeria: {
      title: 'Enfermería',
      intro: 'Cuidado directo y procedimientos clínicos en casa, a cargo de licenciados colegiados y verificados.',
      items: [
        { name: 'Cuidado de adulto mayor', img: 'https://images.unsplash.com/photo-1773227055624-07b515ba87c5?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Curación de heridas', img: 'https://images.unsplash.com/photo-1569508926450-cd832544c4ae?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Control de funciones vitales', img: 'https://images.unsplash.com/photo-1765896387387-0538bc9f997e?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Inyectables y colocación de sondas', img: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Control de glucosa', img: 'https://images.unsplash.com/photo-1587556930799-8dca6fad6d41?auto=format&fit=crop&w=500&h=380&q=75' },
      ],
    },
    medicina: {
      title: 'Medicina general',
      intro: 'Consultas presenciales o por telemedicina, con evaluación, receta y seguimiento de tu tratamiento.',
      items: [
        { name: 'Consulta domiciliaria', img: 'https://images.unsplash.com/photo-1587556930720-58ec521056a5?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Evaluación y receta médica', img: 'https://images.unsplash.com/photo-1454875392665-2ac2c85e8d3e?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Seguimiento de tratamiento', img: 'https://images.unsplash.com/photo-1513159446162-54eb8bdaa79b?auto=format&fit=crop&w=500&h=380&q=75' },
      ],
    },
    obstetricia: {
      title: 'Obstetricia',
      intro: 'Acompañamiento antes y después del parto, con orientación cercana para la madre y la familia.',
      items: [
        { name: 'Control prenatal a domicilio', img: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Visita postnatal', img: 'https://images.unsplash.com/photo-1765896387377-e293914d1e69?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Orientación en lactancia', img: 'https://images.unsplash.com/photo-1525336778665-96f9a12c5c4f?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Educación en planificación familiar', img: 'https://images.unsplash.com/photo-1762955911431-4c44c7c3f408?auto=format&fit=crop&w=500&h=380&q=75' },
      ],
    },
    psicologia: {
      title: 'Psicología',
      intro: 'Acompañamiento emocional para el paciente y su familia cuidadora, presencial o por videollamada.',
      items: [
        { name: 'Sesión individual a domicilio', img: 'https://images.unsplash.com/photo-1607990283143-e81e7a2c9349?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Apoyo a familias cuidadoras', img: 'https://images.unsplash.com/photo-1762955911431-4c44c7c3f408?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Terapia para adultos mayores', img: 'https://images.unsplash.com/photo-1543333995-a78aea2eee50?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Sesiones por videollamada', img: 'https://images.unsplash.com/photo-1758691463620-188ca7c1a04f?auto=format&fit=crop&w=500&h=380&q=75' },
      ],
    },
    fisioterapia: {
      title: 'Fisioterapia',
      intro: 'Recuperación de movilidad y rehabilitación en casa, con equipos portátiles y ejercicios guiados.',
      items: [
        { name: 'Terapia física domiciliaria', img: 'https://images.unsplash.com/photo-1649751361457-01d3a696c7e6?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Rehabilitación post-quirúrgica', img: 'https://images.unsplash.com/photo-1723433892471-62f113c8c9a0?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Ejercicios de movilidad guiada', img: 'https://images.unsplash.com/photo-1773227055624-07b515ba87c5?auto=format&fit=crop&w=500&h=380&q=75' },
      ],
    },
    farmacia: {
      title: 'Farmacia',
      intro: 'Entrega de medicamentos recetados junto con la visita del profesional, sin que tengas que salir.',
      items: [
        { name: 'Entrega de recetas médicas', img: 'https://images.unsplash.com/photo-1580281657529-557a6abb6387?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Insumos de curación', img: 'https://images.unsplash.com/photo-1696861286643-341a8d7a79e9?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Equipos de monitoreo', img: 'https://images.unsplash.com/photo-1587556930799-8dca6fad6d41?auto=format&fit=crop&w=500&h=380&q=75' },
      ],
    },
    telemedicina: {
      title: 'Telemedicina',
      intro: 'Consulta médica por videollamada, ideal para seguimientos, dudas puntuales o una segunda opinión.',
      items: [
        { name: 'Consulta por videollamada', img: 'https://images.unsplash.com/photo-1758691463620-188ca7c1a04f?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Seguimiento de tratamiento', img: 'https://images.unsplash.com/photo-1513159446162-54eb8bdaa79b?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Segunda opinión médica', img: 'https://images.unsplash.com/photo-1454875392665-2ac2c85e8d3e?auto=format&fit=crop&w=500&h=380&q=75' },
        { name: 'Orientación en emergencias menores', img: 'https://images.unsplash.com/photo-1587556930720-58ec521056a5?auto=format&fit=crop&w=500&h=380&q=75' },
      ],
    },
  };

  const modal = document.getElementById('specialty-modal');
  const modalTitle = document.getElementById('specialty-modal-title');
  const modalIntro = document.getElementById('specialty-modal-intro');
  const modalGrid = document.getElementById('specialty-modal-grid');
  const modalCtaLink = document.getElementById('specialty-modal-cta-link');

  function openSpecialtyModal(key) {
    const data = SPECIALTY_DATA[key];
    if (!data) return;
    currentSpecialty = key;
    trackProductClick(SERVICE_PRODUCT_IDS[key]); // "Ver detalles" (1 vez por servicio y visita)
    modalTitle.textContent = data.title;
    modalIntro.textContent = data.intro;
    modalGrid.innerHTML = data.items
      .map(
        (item) => `
        <div class="specialty-item" style="background-image:url('${item.img}')">
          <div class="specialty-item-body">
            <h4>${item.name}</h4>
            <a class="specialty-item-link" href="https://wa.me/51964000000?text=${encodeURIComponent(
              'Hola, quisiera más información sobre ' + item.name + ' (' + data.title + ')'
            )}" target="_blank" rel="noopener">Ver más ›</a>
          </div>
        </div>`
      )
      .join('');
    modalCtaLink.href = `https://wa.me/51964000000?text=${encodeURIComponent(
      'Hola, quisiera consultar por el servicio de ' + data.title
    )}`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  // Clic en cualquier enlace de WhatsApp del detalle = solicitud de información
  modal.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="wa.me"]');
    if (link && currentSpecialty) trackProductClick(SERVICE_PRODUCT_IDS[currentSpecialty]);
  });

  function closeSpecialtyModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.getElementById('specialty-modal-close').addEventListener('click', closeSpecialtyModal);
  document.getElementById('specialty-modal-backdrop').addEventListener('click', closeSpecialtyModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeSpecialtyModal();
  });

  /* ============================================================
     Testimonios
     ============================================================ */
  const testiSlides = document.querySelectorAll('.testi-slide');
  const testiDotsWrap = document.getElementById('testi-dots');
  let testiIndex = 0;
  testiSlides.forEach((_, i) => {
    const dot = document.createElement('button');
    if (i === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', 'Testimonio ' + (i + 1));
    dot.addEventListener('click', () => goToTesti(i));
    testiDotsWrap.appendChild(dot);
  });
  function goToTesti(i) {
    testiSlides[testiIndex].classList.remove('active');
    testiDotsWrap.children[testiIndex].classList.remove('active');
    testiIndex = i;
    testiSlides[testiIndex].classList.add('active');
    testiDotsWrap.children[testiIndex].classList.add('active');
  }
  setInterval(() => goToTesti((testiIndex + 1) % testiSlides.length), 6000);

  /* ============================================================
     Bloque social flotante: en móvil, Facebook/Messenger se abren
     con un botón "+" para no tapar contenido al hacer scroll
     ============================================================ */
  const socialStack = document.getElementById('social-stack');
  const socialToggle = document.getElementById('social-toggle');
  if (socialStack && socialToggle) {
    socialToggle.addEventListener('click', () => {
      const isOpen = socialStack.classList.toggle('expanded');
      socialToggle.setAttribute('aria-expanded', isOpen);
    });
    // Si el usuario toca fuera del bloque, se vuelve a colapsar
    document.addEventListener('click', (e) => {
      if (socialStack.classList.contains('expanded') && !socialStack.contains(e.target)) {
        socialStack.classList.remove('expanded');
        socialToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ============================================================
     FAQ acordeón
     ============================================================ */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const answer = item.querySelector('.faq-a');
    if (item.classList.contains('open')) answer.style.maxHeight = answer.scrollHeight + 'px';
    item.querySelector('.faq-q').addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((other) => {
        other.classList.remove('open');
        other.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* ============================================================
     Animaciones al hacer scroll (reveal)
     ============================================================ */
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealItems.length) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('in-view'));
  }

  /* ============================================================
     Contadores animados (sección "¿Por qué elegirnos?")
     ============================================================ */
  const statNums = document.querySelectorAll('.stat-num');
  function animateCount(el) {
    const target = parseFloat(el.getAttribute('data-count'));
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.round(target * eased);
      el.textContent = prefix + value + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && statNums.length) {
    const statsObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    statNums.forEach((el) => statsObserver.observe(el));
  } else {
    statNums.forEach((el) => animateCount(el));
  }
})();
