(() => {
  const initSlider = (wrap) => {
    if (wrap._curlearImageSliderInit) {
      if (wrap._curlearTimer) {
        clearInterval(wrap._curlearTimer);
        wrap._curlearTimer = null;
      }
    }
    wrap._curlearImageSliderInit = true;

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

    const onPrev = () => moveByOneCard(-1);
    const onNext = () => moveByOneCard(1);

    if (prevBtn) {
      prevBtn.removeEventListener('click', wrap._curlearImageOnPrev);
      wrap._curlearImageOnPrev = onPrev;
      prevBtn.addEventListener('click', onPrev);
    }

    if (nextBtn) {
      nextBtn.removeEventListener('click', wrap._curlearImageOnNext);
      wrap._curlearImageOnNext = onNext;
      nextBtn.addEventListener('click', onNext);
    }

    const autoplay = wrap.dataset.autoplay === 'true';
    const speed = parseInt(wrap.dataset.speed || '4000', 10);

    if (wrap._curlearTimer) {
      clearInterval(wrap._curlearTimer);
      wrap._curlearTimer = null;
    }

    if (!autoplay) return;

    const startAutoplay = () => {
      if (wrap._curlearTimer) clearInterval(wrap._curlearTimer);
      wrap._curlearTimer = setInterval(() => moveByOneCard(1), Math.max(2000, speed));
    };

    const stopAutoplay = () => {
      if (wrap._curlearTimer) {
        clearInterval(wrap._curlearTimer);
        wrap._curlearTimer = null;
      }
    };

    wrap.removeEventListener('mouseenter', wrap._curlearImageStopAutoplay);
    wrap.removeEventListener('mouseleave', wrap._curlearImageStartAutoplay);
    wrap.removeEventListener('touchstart', wrap._curlearImageStopAutoplay);
    wrap.removeEventListener('touchend', wrap._curlearImageStartAutoplay);

    wrap._curlearImageStopAutoplay = stopAutoplay;
    wrap._curlearImageStartAutoplay = startAutoplay;

    wrap.addEventListener('mouseenter', stopAutoplay);
    wrap.addEventListener('mouseleave', startAutoplay);
    wrap.addEventListener('touchstart', stopAutoplay, { passive: true });
    wrap.addEventListener('touchend', startAutoplay, { passive: true });

    startAutoplay();
  };

  const initAll = (root = document) => {
    root.querySelectorAll('[data-curlear-image-slider]').forEach(initSlider);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAll());
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', (event) => {
    initAll(event.target);
  });
})();
