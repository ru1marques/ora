const hero = document.getElementById('hero');
const points = Array.from(document.querySelectorAll('.hotspot'));
const siteHeader = document.querySelector('.site-header');

let activePoint = null;
let leaveTimer = null;

function setFocus(point) {
  window.clearTimeout(leaveTimer);

  if (activePoint && activePoint !== point) {
    activePoint.classList.remove('is-active');
  }

  activePoint = point;
  point.classList.add('is-active');

  hero.style.setProperty('--focus-x', `${point.dataset.x}%`);
  hero.style.setProperty('--focus-y', `${point.dataset.y}%`);
  hero.style.setProperty('--focus-size', 'clamp(48px, 4.2vw, 72px)');
}

function clearFocus(point) {
  if (point) {
    point.classList.remove('is-active');
  }

  leaveTimer = window.setTimeout(() => {
    if (!points.some((item) => item.matches(':hover') || document.activeElement === item)) {
      hero.style.setProperty('--focus-size', '0px');
      activePoint = null;
    }
  }, 70);
}

points.forEach((point) => {
  point.addEventListener('pointerenter', () => setFocus(point));
  point.addEventListener('focus', () => setFocus(point));
  point.addEventListener('pointerleave', () => clearFocus(point));
  point.addEventListener('blur', () => clearFocus(point));
});

hero.addEventListener('pointerleave', () => clearFocus(activePoint));

const canAttractPoints = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
let attractionFrame = null;
let pointerPosition = null;

function updatePointAttraction() {
  attractionFrame = null;
  if (!pointerPosition) return;

  const heroBounds = hero.getBoundingClientRect();
  const attractionRadius = 150;
  const maximumPull = 6;

  points.forEach((point) => {
    const pointX = heroBounds.left + heroBounds.width * Number(point.dataset.x) / 100;
    const pointY = heroBounds.top + heroBounds.height * Number(point.dataset.y) / 100;
    const deltaX = pointerPosition.x - pointX;
    const deltaY = pointerPosition.y - pointY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance === 0 || distance >= attractionRadius) {
      point.style.setProperty('--pull-x', '0px');
      point.style.setProperty('--pull-y', '0px');
      return;
    }

    const strength = Math.pow(1 - distance / attractionRadius, 2);
    const pull = Math.min(distance, maximumPull * strength);
    point.style.setProperty('--pull-x', `${deltaX / distance * pull}px`);
    point.style.setProperty('--pull-y', `${deltaY / distance * pull}px`);
  });
}

if (canAttractPoints.matches) {
  hero.addEventListener('pointermove', (event) => {
    pointerPosition = { x: event.clientX, y: event.clientY };
    if (attractionFrame === null) {
      attractionFrame = window.requestAnimationFrame(updatePointAttraction);
    }
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    pointerPosition = null;
    points.forEach((point) => {
      point.style.setProperty('--pull-x', '0px');
      point.style.setProperty('--pull-y', '0px');
    });
  });
}

const sectionNavigation = document.querySelector('.side-index');
const sectionLinks = Array.from(sectionNavigation.querySelectorAll('a'));
const sections = sectionLinks.map((link) => document.querySelector(link.hash));
const projectsSection = document.querySelector('.projects');
const projectCards = Array.from(document.querySelectorAll('.project'));

function updateSectionNavigation() {
  const midpoint = window.innerHeight / 2;
  const currentSection = sections.find((section) => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= midpoint && bounds.bottom > midpoint;
  }) || sections[0];

  sectionNavigation.classList.toggle('is-on-light', currentSection.id !== 'hero');
  sectionNavigation.classList.toggle('is-on-dark', currentSection.id === 'contact');
  siteHeader.classList.toggle(
    'is-difference',
    hero.getBoundingClientRect().bottom <= siteHeader.getBoundingClientRect().bottom
  );
  sectionLinks.forEach((link) => {
    const isCurrent = link.hash === `#${currentSection.id}`;
    link.classList.toggle('is-current', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

let navigationFrame = null;
window.addEventListener('scroll', () => {
  if (navigationFrame !== null) return;
  navigationFrame = window.requestAnimationFrame(() => {
    updateSectionNavigation();
    navigationFrame = null;
  });
}, { passive: true });
window.addEventListener('resize', updateSectionNavigation);
window.addEventListener('pageshow', updateSectionNavigation);
updateSectionNavigation();

const internalLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let scrollAnimation = null;

function cancelScrollAnimation() {
  if (scrollAnimation === null) return;
  window.cancelAnimationFrame(scrollAnimation);
  scrollAnimation = null;
}

function easeInOutCubic(progress) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

internalLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.hash);
    if (!target || prefersReducedMotion.matches) return;

    event.preventDefault();
    cancelScrollAnimation();

    const start = window.scrollY;
    const projectTargetIndex = projectCards.indexOf(target);
    const destination = projectTargetIndex >= 0
      ? projectsSection.offsetTop + projectTargetIndex * target.offsetHeight
      : target.getBoundingClientRect().top + start;
    const distance = destination - start;
    const duration = Math.min(1100, Math.max(700, Math.abs(distance) * 0.65));
    const startedAt = performance.now();

    function animateScroll(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      window.scrollTo({
        top: start + distance * easeInOutCubic(progress),
        behavior: 'instant'
      });

      if (progress < 1) {
        scrollAnimation = window.requestAnimationFrame(animateScroll);
      } else {
        scrollAnimation = null;
        history.pushState(null, '', link.hash);
        target.focus({ preventScroll: true });
      }
    }

    scrollAnimation = window.requestAnimationFrame(animateScroll);
  });
});

window.addEventListener('wheel', cancelScrollAnimation, { passive: true });
window.addEventListener('touchstart', cancelScrollAnimation, { passive: true });
window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
    cancelScrollAnimation();
  }
});

const sliders = Array.from(document.querySelectorAll('.slider'));

function showSlide(slider, nextIndex) {
  const slides = Array.from(slider.querySelectorAll('.slider__slide'));
  const dots = Array.from(slider.querySelectorAll('.slider__dots button'));
  const index = (nextIndex + slides.length) % slides.length;

  slides.forEach((slide, slideIndex) => {
    const isCurrent = slideIndex === index;
    slide.classList.toggle('is-current', isCurrent);
    slide.setAttribute('aria-hidden', String(!isCurrent));
  });
  dots.forEach((dot, dotIndex) => {
    const isCurrent = dotIndex === index;
    dot.classList.toggle('is-current', isCurrent);
    dot.setAttribute('aria-pressed', String(isCurrent));
  });
  slider.dataset.currentSlide = String(index);
}

sliders.forEach((slider) => {
  const dots = Array.from(slider.querySelectorAll('.slider__dots button'));
  dots.forEach((dot, index) => dot.addEventListener('click', () => showSlide(slider, index)));

  slider.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const current = Number(slider.dataset.currentSlide || 0);
    showSlide(slider, current + (event.key === 'ArrowRight' ? 1 : -1));
  });

  showSlide(slider, 0);
});

const revealItems = Array.from(document.querySelectorAll(
  '.about__intro, .about__columns, .studio__intro, .studio__support, .narrative__direction, .narrative__visual, .narrative__copy, .narrative__dot, .notable-projects__content, .studio-experiments__copy, .site-footer__top'
));

if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
  projectCards.forEach((card) => card.classList.add('is-in-view'));
} else {
  revealItems.forEach((item) => item.classList.add('reveal'));
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .16, rootMargin: '0px 0px -8% 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));

  const projectObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-in-view');
    });
  }, { threshold: .22 });
  projectCards.forEach((card) => projectObserver.observe(card));
}
