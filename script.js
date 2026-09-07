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
const magneticPoints = Array.from(document.querySelectorAll(
  '.hotspot, .studio__dot, .narrative__direction-dot, .narrative__dot, .narrative__copy-dot, .site-footer__mark span, .side-index a, .slider__dots button'
));
let attractionFrame = null;
let pointerPosition = null;

function updatePointAttraction() {
  attractionFrame = null;
  if (!pointerPosition) return;

  magneticPoints.forEach((point) => {
    const isNarrativePoint = point.matches(
      '.narrative__direction-dot, .narrative__dot, .narrative__copy-dot'
    );
    const attractionRadius = isNarrativePoint ? 230 : 150;
    const maximumPull = point.classList.contains('hotspot') ? 6 : (isNarrativePoint ? 21 : 12);
    const bounds = point.getBoundingClientRect();
    const translation = getComputedStyle(point).translate.split(' ');
    const pointX = bounds.left + bounds.width / 2 - (parseFloat(translation[0]) || 0);
    const pointY = bounds.top + bounds.height / 2 - (parseFloat(translation[1]) || 0);
    const deltaX = pointerPosition.x - pointX;
    const deltaY = pointerPosition.y - pointY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance === 0 || distance >= attractionRadius) {
      point.style.setProperty('--pull-x', '0px');
      point.style.setProperty('--pull-y', '0px');
      return;
    }

    const strength = Math.pow(1 - distance / attractionRadius, isNarrativePoint ? 1.15 : 2);
    const pull = Math.min(distance, maximumPull * strength);
    point.style.setProperty('--pull-x', `${deltaX / distance * pull}px`);
    point.style.setProperty('--pull-y', `${deltaY / distance * pull}px`);
  });
}

if (canAttractPoints.matches) {
  document.addEventListener('pointermove', (event) => {
    pointerPosition = { x: event.clientX, y: event.clientY };
    if (attractionFrame === null) {
      attractionFrame = window.requestAnimationFrame(updatePointAttraction);
    }
  }, { passive: true });

  const resetAttraction = () => {
    pointerPosition = null;
    magneticPoints.forEach((point) => {
      point.style.setProperty('--pull-x', '0px');
      point.style.setProperty('--pull-y', '0px');
    });
  };
  document.documentElement.addEventListener('pointerleave', resetAttraction);
  window.addEventListener('blur', resetAttraction);
  window.addEventListener('scroll', resetAttraction, { passive: true });
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
  }) || null;

  sectionNavigation.classList.toggle('is-on-light', currentSection?.id !== 'hero');
  sectionNavigation.classList.toggle('is-on-dark', currentSection?.id === 'contact');
  siteHeader.classList.toggle(
    'is-difference',
    hero.getBoundingClientRect().bottom <= siteHeader.getBoundingClientRect().bottom
  );
  sectionLinks.forEach((link) => {
    const isCurrent = currentSection && link.hash === `#${currentSection.id}`;
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
  '.about__intro, .about__columns, .studio__intro, .studio__support, .narrative__direction, .narrative__visual, .narrative__copy, .narrative__summary, .narrative__dot, .offer__label, .offer__card, .offer__contact, .projects__label, .projects__intro-copy, .notable-projects__content, .studio-experiments__copy, .site-footer__top'
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

const perspectiveSection = document.querySelector('.perspective');
const perspectiveText = document.querySelector('.perspective__text');
let perspectiveFrame = null;

function updatePerspectiveClarity() {
  const bounds = perspectiveSection.getBoundingClientRect();
  const travel = Math.max(1, bounds.height - window.innerHeight);
  const progress = Math.max(0, Math.min(1, -bounds.top / travel));
  const easedProgress = progress * progress * (3 - 2 * progress);

  perspectiveText.style.setProperty('--perspective-blur', `${(18 * (1 - easedProgress)).toFixed(2)}px`);
  perspectiveText.style.setProperty('--perspective-opacity', (.42 + .58 * easedProgress).toFixed(3));
  perspectiveText.style.setProperty('--perspective-scale', (.985 + .015 * easedProgress).toFixed(4));
  perspectiveFrame = null;
}

function requestPerspectiveUpdate() {
  if (perspectiveFrame !== null) return;
  perspectiveFrame = window.requestAnimationFrame(updatePerspectiveClarity);
}

if (perspectiveSection && perspectiveText) {
  if (prefersReducedMotion.matches) {
    perspectiveText.style.setProperty('--perspective-blur', '0px');
    perspectiveText.style.setProperty('--perspective-opacity', '1');
    perspectiveText.style.setProperty('--perspective-scale', '1');
  } else {
    window.addEventListener('scroll', requestPerspectiveUpdate, { passive: true });
    window.addEventListener('resize', requestPerspectiveUpdate);
    requestPerspectiveUpdate();
  }
}
