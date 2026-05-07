(() => {
  const moveOneCard = (track) => {
    const firstCard = track.querySelector('.curlear-image-showcase__item');
    if (!firstCard) return;

    const step = firstCard.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) return;

    if (track.scrollLeft >= maxScroll - 1) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }

    const next = track.scrollLeft + step;
    track.scrollTo({ left: Math.min(next, maxScroll), behavior: 'smooth' });
  };

  const initSlider = (wrap) => {
    const track = wrap.querySelector('[data-curlear-image-slider-track]');
    const prevBtn = wrap.querySelector('[data-curlear-image-slider-prev]');
    const nextBtn = wrap.querySelector('[data-curlear-image-slider-next]');
    if (!track) return;

    const moveByOneCard = (direction = 1) => {
      const firstCard = track.querySelector('.curlear-image-showcase__item');
      if (!firstCard) return;

      const step = firstCard.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) return;

      if (direction > 0 && track.scrollLeft >= maxScroll - 1) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }

      if (direction < 0 && track.scrollLeft <= 1) {
        track.scrollTo({ left: maxScroll, behavior: 'smooth' });
        return;
      }

      const next = track.scrollLeft + step * direction;
      track.scrollTo({ left: Math.max(0, Math.min(next, maxScroll)), behavior: 'smooth' });
    };

    if (prevBtn) prevBtn.addEventListener('click', () => moveByOneCard(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => moveByOneCard(1));

    const autoplay = wrap.dataset.autoplay === 'true';
    const speed = parseInt(wrap.dataset.speed || '4000', 10);
    if (!autoplay) return;

    let timer = setInterval(() => moveByOneCard(1), Math.max(2000, speed));
    wrap.addEventListener('mouseenter', () => clearInterval(timer));
    wrap.addEventListener('mouseleave', () => {
      timer = setInterval(() => moveByOneCard(1), Math.max(2000, speed));
    });
  };

  document.querySelectorAll('[data-curlear-image-slider]').forEach(initSlider);
})();
