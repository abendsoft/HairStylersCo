(() => {
  const bindShowcaseVideoMute = (root) => {
    root.querySelectorAll('[data-curlear-showcase-mute]').forEach((btn) => {
      const wrap = btn.closest('.curlear-showcase-snippet__media-wrap--video');
      if (!wrap) return;
      const video = wrap.querySelector('video.curlear-showcase-snippet__media');
      if (!video) return;

      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const isMuted = btn.dataset.muted === 'true';
        video.muted = !isMuted;
        const nextMuted = !isMuted;
        btn.dataset.muted = nextMuted ? 'true' : 'false';
        btn.setAttribute('aria-label', nextMuted ? 'Unmute video' : 'Mute video');
        const label = btn.querySelector('[data-curlear-showcase-mute-label]');
        if (label) label.textContent = nextMuted ? '🔇' : '🔊';
      });
    });
  };

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

    const updateNavState = () => {
      if (!prev) return;
      prev.classList.toggle('is-hidden', track.scrollLeft <= 1);
    };

    track.addEventListener('scroll', updateNavState);
    window.addEventListener('resize', updateNavState);
    updateNavState();

    const speed = parseInt(root.dataset.speed || '4000', 10);
    let timer = setInterval(() => move(1), Math.max(2000, speed));
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', () => {
      timer = setInterval(() => move(1), Math.max(2000, speed));
    });
  };

  document.querySelectorAll('[data-curlear-showcase]').forEach((root) => {
    bindShowcaseVideoMute(root);
    initShowcase(root);
  });
})();
