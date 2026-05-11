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
    let activePointerId = null;

    const removeDocumentListeners = () => {
      document.removeEventListener('pointermove', onDocumentPointerMove);
      document.removeEventListener('pointerup', onDocumentPointerEnd);
      document.removeEventListener('pointercancel', onDocumentPointerEnd);
    };

    const onDocumentPointerMove = (event) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      setPosition(event.clientX);
      event.preventDefault();
    };

    const onDocumentPointerEnd = (event) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      dragging = false;
      activePointerId = null;
      removeDocumentListeners();
    };

    const onPointerDown = (event) => {
      if (dragging) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      activePointerId = event.pointerId;
      setPosition(event.clientX);
      event.preventDefault();

      document.addEventListener('pointermove', onDocumentPointerMove, { passive: false });
      document.addEventListener('pointerup', onDocumentPointerEnd);
      document.addEventListener('pointercancel', onDocumentPointerEnd);
    };

    handle.addEventListener('pointerdown', onPointerDown);
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

    const move = (dir = 1, smooth = true) => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) return;
      const amount = step();
      if (amount <= 0) return;

      const behavior = smooth ? 'smooth' : 'auto';

      if (dir > 0 && track.scrollLeft >= maxScroll - 1) {
        track.scrollTo({ left: 0, behavior });
        return;
      }
      if (dir < 0 && track.scrollLeft <= 1) {
        track.scrollTo({ left: maxScroll, behavior });
        return;
      }

      const next = track.scrollLeft + amount * dir;
      track.scrollTo({ left: clamp(next, 0, maxScroll), behavior });
    };

    if (prevBtn) prevBtn.addEventListener('click', () => move(-1, true));
    if (nextBtn) nextBtn.addEventListener('click', () => move(1, true));

    if (root.dataset.autoSlide !== 'true') return;
    const speed = parseInt(root.dataset.speed || '4000', 10);
    let timer = setInterval(() => move(1, false), Math.max(2000, speed));
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', () => {
      timer = setInterval(() => move(1), Math.max(2000, speed));
    });
  };

  document.querySelectorAll('[data-curlear-comparison-card]').forEach(initComparisonCard);
  document.querySelectorAll('[data-curlear-comparison-gallery]').forEach(initSectionSlider);
})();
