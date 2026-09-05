const hero = document.getElementById('hero');
const points = Array.from(document.querySelectorAll('.hotspot'));

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
