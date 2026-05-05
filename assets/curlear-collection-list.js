(() => {
  const initSlider = (wrap) => {
    const track = wrap.querySelector('[data-curlear-collection-slider-track]');
    if (!track) return;

    const moveOneCard = () => {
      const firstCard = track.querySelector('.curlear-collection-list__item');
      if (!firstCard) return;
      const step = firstCard.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
      const next = track.scrollLeft + step;
      const maxScroll = track.scrollWidth - track.clientWidth;

      if (next >= maxScroll - 1) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollTo({ left: next, behavior: 'smooth' });
      }
    };

    const autoplay = wrap.dataset.autoplay === 'true';
    const speed = parseInt(wrap.dataset.speed || '4000', 10);
    if (!autoplay) return;

    let timer = setInterval(moveOneCard, Math.max(2000, speed));
    wrap.addEventListener('mouseenter', () => clearInterval(timer));
    wrap.addEventListener('mouseleave', () => {
      timer = setInterval(moveOneCard, Math.max(2000, speed));
    });
  };

  document.querySelectorAll('[data-curlear-collection-slider]').forEach(initSlider);
})();
