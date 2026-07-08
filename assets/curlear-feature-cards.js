(() => {
  const MOBILE_QUERY = '(max-width: 749px)';

  const initSlider = (root) => {
    const track = root.querySelector('[data-curlear-feature-cards-track]');
    if (!track) return;

    const mobileMedia = window.matchMedia(MOBILE_QUERY);

    const moveByOneItem = (direction = 1) => {
      if (!mobileMedia.matches) return;

      const firstItem = track.querySelector('.curlear-feature-cards__card');
      if (!firstItem) return;

      const gap = parseFloat(getComputedStyle(track).gap || getComputedStyle(track).columnGap || 0);
      const step = firstItem.getBoundingClientRect().width + gap;
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

    const stopAutoplay = () => {
      if (root._curlearFeatureCardsTimer) {
        clearInterval(root._curlearFeatureCardsTimer);
        root._curlearFeatureCardsTimer = null;
      }
    };

    const startAutoplay = () => {
      stopAutoplay();
      if (!mobileMedia.matches || root.dataset.autoplay !== 'true') return;

      const speed = parseInt(root.dataset.speed || '4000', 10);
      root._curlearFeatureCardsTimer = setInterval(() => moveByOneItem(1), Math.max(2000, speed));
    };

    if (root._curlearFeatureCardsStop) {
      root.removeEventListener('mouseenter', root._curlearFeatureCardsStop);
      root.removeEventListener('mouseleave', root._curlearFeatureCardsStart);
      root.removeEventListener('touchstart', root._curlearFeatureCardsStop);
      root.removeEventListener('touchend', root._curlearFeatureCardsStart);
    }

    root._curlearFeatureCardsStart = startAutoplay;
    root._curlearFeatureCardsStop = stopAutoplay;

    startAutoplay();
    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);
    root.addEventListener('touchstart', stopAutoplay, { passive: true });
    root.addEventListener('touchend', startAutoplay, { passive: true });

    if (!root._curlearFeatureCardsMediaBound) {
      const onMediaChange = () => {
        track.scrollTo({ left: 0, behavior: 'auto' });
        stopAutoplay();
        startAutoplay();
      };

      if (mobileMedia.addEventListener) {
        mobileMedia.addEventListener('change', onMediaChange);
      } else {
        mobileMedia.addListener(onMediaChange);
      }

      root._curlearFeatureCardsMediaBound = true;
    }
  };

  const boot = () => {
    document.querySelectorAll('[data-curlear-feature-cards]').forEach(initSlider);
  };

  boot();
  document.addEventListener('shopify:section:load', boot);
})();
