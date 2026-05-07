(() => {
  const initShowcase = (root) => {
    const track = root.querySelector('[data-curlear-showcase-track]');
    const prev = root.querySelector('[data-curlear-showcase-prev]');
    const next = root.querySelector('[data-curlear-showcase-next]');
    if (!track) return;
    if (root.dataset.sliderActive !== 'true') return;

    const step = () => {
      const first = track.querySelector('.curlear-showcase-snippet__item');
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

      const nextPos = track.scrollLeft + amount * dir;
      track.scrollTo({ left: Math.max(0, Math.min(nextPos, maxScroll)), behavior: 'smooth' });
    };

    if (prev) prev.addEventListener('click', () => move(-1));
    if (next) next.addEventListener('click', () => move(1));

    const speed = parseInt(root.dataset.speed || '4000', 10);
    let timer = setInterval(() => move(1), Math.max(2000, speed));
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', () => {
      timer = setInterval(() => move(1), Math.max(2000, speed));
    });
  };

  document.querySelectorAll('[data-curlear-showcase]').forEach(initShowcase);
})();
