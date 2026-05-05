(() => {
  const goToProduct = (event, card) => {
    if (event.target.closest('a, button')) return;
    const url = card.dataset.productUrl;
    if (!url) return;
    window.location.href = url;
  };

  const stepToNext = (track) => {
    const firstCard = track.querySelector('.curlear-video-slider__card');
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

  const bindMute = (card) => {
    const muteBtn = card.querySelector('[data-curlear-mute]');
    if (!muteBtn) return;

    muteBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const label = muteBtn.querySelector('[data-curlear-mute-label]');
      const isMuted = muteBtn.dataset.muted === 'true';
      const htmlVideo = card.querySelector('video.curlear-video-slider__video');
      const ytFrame = card.querySelector('iframe[data-curlear-youtube]');

      if (htmlVideo) {
        htmlVideo.muted = !isMuted;
      }

      if (ytFrame && ytFrame.contentWindow) {
        const command = isMuted ? 'unMute' : 'mute';
        ytFrame.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: command,
            args: []
          }),
          '*'
        );
      }

      const nextMuted = !isMuted;
      muteBtn.dataset.muted = nextMuted ? 'true' : 'false';
      muteBtn.setAttribute('aria-label', nextMuted ? 'Unmute video' : 'Mute video');
      if (label) label.textContent = nextMuted ? '🔇' : '🔊';
    });
  };

  const setupMarquee = (wrap, track) => {
    const wantsMarquee = wrap.classList.contains('curlear-video-slider__wrap--marquee');
    if (!wantsMarquee) return false;

    if (track.dataset.curlearMarqueeReady !== 'true') {
      const originalCards = Array.from(track.querySelectorAll('.curlear-video-slider__card'));
      if (originalCards.length === 0) return true;

      const originalWidth = track.scrollWidth;
      originalCards.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.dataset.curlearClone = 'true';
        clone.removeAttribute('id');
        track.appendChild(clone);
      });

      track.dataset.curlearMarqueeReady = 'true';
      track.dataset.curlearMarqueeWidth = String(originalWidth);
      track.dataset.curlearMarqueeOffset = '0';
      track.style.transform = 'translate3d(0, 0, 0)';
    }

    const loopWidth = parseFloat(track.dataset.curlearMarqueeWidth || '0');
    if (loopWidth <= 0) return true;

    let paused = false;
    let lastFrame = 0;
    const marqueeSpeed = parseFloat(wrap.dataset.marqueeSpeed || '55');
    const speedPxPerMs = Math.max(10, marqueeSpeed) / 1000;

    const tick = (time) => {
      if (!lastFrame) lastFrame = time;
      const delta = Math.min(34, time - lastFrame);
      lastFrame = time;

      if (!paused) {
        let offset = parseFloat(track.dataset.curlearMarqueeOffset || '0');
        offset += delta * speedPxPerMs;

        if (offset >= loopWidth) {
          offset -= loopWidth;
        }

        track.dataset.curlearMarqueeOffset = String(offset);
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }

      window.requestAnimationFrame(tick);
    };

    wrap.addEventListener('mouseenter', () => {
      paused = true;
    });
    wrap.addEventListener('mouseleave', () => {
      paused = false;
    });
    document.addEventListener('visibilitychange', () => {
      lastFrame = 0;
    });

    window.requestAnimationFrame(tick);
    return true;
  };

  const initSlider = (wrap) => {
    const track = wrap.querySelector('[data-curlear-video-track]');
    if (!track) return;

    const marqueeEnabled = setupMarquee(wrap, track);

    wrap.querySelectorAll('.curlear-video-slider__card').forEach((card) => {
      card.addEventListener('click', (event) => goToProduct(event, card));
      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        goToProduct(event, card);
      });
      bindMute(card);
    });

    if (marqueeEnabled) return;

    const autoplay = wrap.dataset.autoplay === 'true';
    const speed = parseInt(wrap.dataset.speed || '4000', 10);
    if (!autoplay) return;

    let timer = setInterval(() => stepToNext(track), Math.max(2000, speed));
    wrap.addEventListener('mouseenter', () => clearInterval(timer));
    wrap.addEventListener('mouseleave', () => {
      timer = setInterval(() => stepToNext(track), Math.max(2000, speed));
    });
  };

  document.querySelectorAll('[data-curlear-video-slider]').forEach(initSlider);
})();
