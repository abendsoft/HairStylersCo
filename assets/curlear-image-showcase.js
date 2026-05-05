(() => {
  const moveOneCard = (track) => {
    const firstCard = track.querySelector('.curlear-image-showcase__item');
    if (!firstCard) return;

    const step = firstCard.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
    const maxScroll = track.scrollWidth - track.clientWidth;
    const next = track.scrollLeft + step;

    if (next >= maxScroll - 1) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      track.scrollTo({ left: next, behavior: 'smooth' });
    }
  };

  const initSlider = (wrap) => {
    const track = wrap.querySelector('[data-curlear-image-slider-track]');
    if (!track) return;

    const autoplay = wrap.dataset.autoplay === 'true';
    const speed = parseInt(wrap.dataset.speed || '4000', 10);
    if (!autoplay) return;

    let timer = setInterval(() => moveOneCard(track), Math.max(2000, speed));
    wrap.addEventListener('mouseenter', () => clearInterval(timer));
    wrap.addEventListener('mouseleave', () => {
      timer = setInterval(() => moveOneCard(track), Math.max(2000, speed));
    });
  };

  document.querySelectorAll('[data-curlear-image-slider]').forEach(initSlider);
})();
