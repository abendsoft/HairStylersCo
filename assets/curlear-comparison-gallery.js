(() => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const initComparisonCard = (card) => {
    const secondImage = card.querySelector('[data-curlear-second]');
    const handle = card.querySelector('[data-curlear-handle]');
    if (!secondImage || !handle) return;

    // Always start every card at exact 50/50 split.
    card.style.setProperty('--curlear-compare-pos', '50%');

    const setPosition = (x) => {
      const rect = card.getBoundingClientRect();
      const ratio = clamp((x - rect.left) / rect.width, 0, 1);
      const percent = ratio * 100;
      card.style.setProperty('--curlear-compare-pos', `${percent}%`);
    };

    let dragging = false;

    const onPointerDown = (event) => {
      dragging = true;
      handle.setPointerCapture(event.pointerId);
      setPosition(event.clientX);
      event.preventDefault();
    };

    const onPointerMove = (event) => {
      if (!dragging) return;
      setPosition(event.clientX);
    };

    const onPointerUp = () => {
      dragging = false;
    };

    handle.addEventListener('pointerdown', onPointerDown);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('pointerup', onPointerUp);
    handle.addEventListener('pointercancel', onPointerUp);
  };

  const initSectionSlider = (root) => {
    const track = root.querySelector('[data-curlear-comparison-track]');
    const prevBtn = root.querySelector('[data-curlear-comparison-prev]');
    const nextBtn = root.querySelector('[data-curlear-comparison-next]');
    if (!track) return;
    if (root.dataset.sliderEnabled !== 'true') return;

    const step = () => {
      const first = track.querySelector('.curlear-comparison-gallery__card');
      if (!first) return 0;
      return first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
    };

    const move = (dir = 1) => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) return;
      const amount = step();
      if (amount <= 0) return;

      if (dir > 0 && track.scrollLeft >= maxScroll - 1) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      if (dir < 0 && track.scrollLeft <= 1) {
        track.scrollTo({ left: maxScroll, behavior: 'smooth' });
        return;
      }

      const next = track.scrollLeft + amount * dir;
      track.scrollTo({ left: clamp(next, 0, maxScroll), behavior: 'smooth' });
    };

    if (prevBtn) prevBtn.addEventListener('click', () => move(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => move(1));

    if (root.dataset.autoSlide !== 'true') return;
    const speed = parseInt(root.dataset.speed || '4000', 10);
    let timer = setInterval(() => move(1), Math.max(2000, speed));
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', () => {
      timer = setInterval(() => move(1), Math.max(2000, speed));
    });
  };

  document.querySelectorAll('[data-curlear-comparison-card]').forEach(initComparisonCard);
  document.querySelectorAll('[data-curlear-comparison-gallery]').forEach(initSectionSlider);
})();
