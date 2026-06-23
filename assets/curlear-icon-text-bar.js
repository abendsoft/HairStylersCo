(() => {
  const initSlider = (root) => {
    const track = root.querySelector('[data-curlear-icon-text-bar-track]');
    if (!track) return;

    const moveByOneItem = (direction = 1) => {
      const firstItem = track.querySelector('.curlear-icon-text-bar__item');
      if (!firstItem) return;

      const step = firstItem.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
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

    if (root._curlearIconTimer) {
      clearInterval(root._curlearIconTimer);
      root._curlearIconTimer = null;
    }

    if (root.dataset.autoplay !== 'true') return;

    const speed = parseInt(root.dataset.speed || '4000', 10);
    const startAutoplay = () => {
      if (root._curlearIconTimer) clearInterval(root._curlearIconTimer);
      root._curlearIconTimer = setInterval(() => moveByOneItem(1), Math.max(2000, speed));
    };
    const stopAutoplay = () => {
      if (root._curlearIconTimer) {
        clearInterval(root._curlearIconTimer);
        root._curlearIconTimer = null;
      }
    };

    startAutoplay();
    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);
    root.addEventListener('touchstart', stopAutoplay, { passive: true });
    root.addEventListener('touchend', startAutoplay, { passive: true });
  };

  const boot = () => {
    document.querySelectorAll('[data-curlear-icon-text-bar]').forEach(initSlider);
  };

  boot();
  document.addEventListener('shopify:section:load', boot);
})();
