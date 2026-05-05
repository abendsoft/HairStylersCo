(() => {
  const initSlider = (wrap) => {
    const track = wrap.querySelector('[data-curlear-slider-track]');
    const progress = wrap.querySelector('[data-curlear-slider-progress]');
    if (!track || !progress) return;

    const updateProgress = () => {
      const totalSlides = track.querySelectorAll('.curlear-featured-collection__slide').length;
      if (totalSlides <= 0) {
        progress.style.width = '0%';
        return;
      }

      const minFill = 100 / totalSlides;
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) {
        progress.style.width = '100%';
        return;
      }

      const ratio = track.scrollLeft / maxScroll;
      const fill = minFill + ratio * (100 - minFill);
      progress.style.width = `${Math.min(100, Math.max(minFill, fill))}%`;
    };

    const moveOneCard = () => {
      const firstSlide = track.querySelector('.curlear-featured-collection__slide');
      if (!firstSlide) return;
      const step = firstSlide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
      const next = track.scrollLeft + step;
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (next >= maxScroll - 1) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollTo({ left: next, behavior: 'smooth' });
      }
    };

    track.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
    updateProgress();

    const autoplay = wrap.dataset.autoplay === 'true';
    const speed = parseInt(wrap.dataset.speed || '4000', 10);
    if (!autoplay) return;

    let timer = setInterval(moveOneCard, Math.max(2000, speed));
    wrap.addEventListener('mouseenter', () => clearInterval(timer));
    wrap.addEventListener('mouseleave', () => {
      timer = setInterval(moveOneCard, Math.max(2000, speed));
    });
  };

  document.querySelectorAll('[data-curlear-slider]').forEach(initSlider);
})();
