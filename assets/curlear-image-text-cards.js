(() => {
  const initCards = (root) => {
    const track = root.querySelector('[data-curlear-cards-track]');
    const prevBtn = root.querySelector('[data-curlear-cards-prev]');
    const nextBtn = root.querySelector('[data-curlear-cards-next]');
    if (!track) return;
    if (root.dataset.sliderEnabled !== 'true') return;

    const step = () => {
      const first = track.querySelector('.curlear-image-text-cards__card');
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
      track.scrollTo({ left: Math.max(0, Math.min(next, maxScroll)), behavior: 'smooth' });
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

  document.querySelectorAll('[data-curlear-cards]').forEach(initCards);
})();
