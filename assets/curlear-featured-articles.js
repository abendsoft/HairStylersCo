(() => {
  const stepWidth = (track) => {
    const card = track.querySelector('.curlear-featured-articles__card');
    if (!card) return 0;
    return card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
  };

  const initSlider = (root) => {
    if (root.dataset.layout !== 'slider') return;
    const track = root.querySelector('[data-cfa-track]');
    const prev = root.querySelector('[data-cfa-prev]');
    const next = root.querySelector('[data-cfa-next]');
    if (!track) return;

    const move = (dir = 1) => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) return;
      const step = stepWidth(track);
      if (step <= 0) return;

      if (dir > 0 && track.scrollLeft >= maxScroll - 2) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      if (dir < 0 && track.scrollLeft <= 2) {
        track.scrollTo({ left: maxScroll, behavior: 'smooth' });
        return;
      }

      const nextPos = track.scrollLeft + step * dir;
      track.scrollTo({ left: Math.max(0, Math.min(nextPos, maxScroll)), behavior: 'smooth' });
    };

    const updateNav = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (!prev || !next) return;
      if (maxScroll <= 2) {
        prev.classList.add('is-hidden');
        next.classList.add('is-hidden');
        return;
      }
      prev.classList.toggle('is-hidden', track.scrollLeft <= 2);
      next.classList.toggle('is-hidden', track.scrollLeft >= maxScroll - 2);
    };

    if (prev) prev.addEventListener('click', () => move(-1));
    if (next) next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', updateNav, { passive: true });
    window.addEventListener('resize', updateNav);
    updateNav();
  };

  document.querySelectorAll('[data-curlear-featured-articles]').forEach(initSlider);
})();
