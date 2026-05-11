(() => {
  const MOBILE_MAX = 989;

  const isMobileSliderMarquee = (wrap) =>
    wrap.dataset.mobileSlider === 'true' && window.innerWidth <= MOBILE_MAX;

  const goToProduct = (event, card) => {
    if (!event.target.closest('.curlear-video-slider__product')) return;
    if (event.target.closest('a, button')) return;
    const url = card.dataset.productUrl;
    if (!url) return;
    window.location.href = url;
  };

  const syncMuteUi = (muteBtn, muted) => {
    const label = muteBtn.querySelector('[data-curlear-mute-label]');
    muteBtn.dataset.muted = muted ? 'true' : 'false';
    muteBtn.setAttribute('aria-label', muted ? 'Unmute video' : 'Mute video');
    if (label) label.textContent = muted ? '🔇' : '🔊';
  };

  const postYoutubeCommand = (ytFrame, func, args = []) => {
    if (!ytFrame || !ytFrame.contentWindow) return;
    ytFrame.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    );
  };

  const unmuteAndPlayMedia = (card) => {
    const muteBtn = card.querySelector('[data-curlear-mute]');
    const htmlVideo = card.querySelector('video.curlear-video-slider__video');
    const ytFrame = card.querySelector('iframe[data-curlear-youtube]');

    if (htmlVideo) {
      htmlVideo.muted = false;
      htmlVideo.play().catch(() => {});
      if (muteBtn) syncMuteUi(muteBtn, false);
    }

    if (ytFrame) {
      postYoutubeCommand(ytFrame, 'unMute');
      postYoutubeCommand(ytFrame, 'playVideo');
      if (muteBtn) syncMuteUi(muteBtn, false);
    }
  };

  const bindMediaClick = (card) => {
    const media = card.querySelector('.curlear-video-slider__media');
    if (!media) return;

    media.addEventListener('click', (event) => {
      if (event.target.closest('[data-curlear-mute]')) return;
      event.stopPropagation();
      unmuteAndPlayMedia(card);
    });
  };

  const bindMute = (card) => {
    const muteBtn = card.querySelector('[data-curlear-mute]');
    if (!muteBtn) return;

    muteBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const isMuted = muteBtn.dataset.muted === 'true';
      const htmlVideo = card.querySelector('video.curlear-video-slider__video');
      const ytFrame = card.querySelector('iframe[data-curlear-youtube]');

      if (htmlVideo) {
        htmlVideo.muted = !isMuted;
      }

      if (ytFrame) {
        postYoutubeCommand(ytFrame, isMuted ? 'unMute' : 'mute');
      }

      syncMuteUi(muteBtn, !isMuted);
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
        if (card.dataset.curlearClone === 'true') return;
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
    const resumeBtn = wrap.querySelector('[data-curlear-marquee-resume]');
    const marqueeSpeed = parseFloat(wrap.dataset.marqueeSpeed || '55');
    const speedPxPerMs = Math.max(10, marqueeSpeed) / 1000;

    const tick = (time) => {
      if (!lastFrame) lastFrame = time;
      const delta = Math.min(34, time - lastFrame);
      lastFrame = time;

      if (isMobileSliderMarquee(wrap)) {
        track.style.transform = '';
        track.dataset.curlearMarqueeOffset = '0';
        window.requestAnimationFrame(tick);
        return;
      }

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

    const setTouchPausedState = (isPaused) => {
      paused = isPaused;
      wrap.classList.toggle('is-touch-paused', isPaused);
      if (resumeBtn) {
        resumeBtn.setAttribute('aria-hidden', isPaused ? 'false' : 'true');
      }
    };

    const pauseMarqueeForTouch = () => {
      if (isMobileSliderMarquee(wrap)) return;
      setTouchPausedState(true);
      track.style.transform = 'translate3d(0, 0, 0)';
      track.dataset.curlearMarqueeOffset = '0';
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
    wrap.addEventListener('touchstart', pauseMarqueeForTouch, { passive: true });
    if (resumeBtn) {
      resumeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        lastFrame = 0;
        setTouchPausedState(false);
      });
    }

    window.requestAnimationFrame(tick);
    return true;
  };

  const initSlider = (wrap) => {
    const track = wrap.querySelector('[data-curlear-video-track]');
    const prevBtn = wrap.querySelector('[data-curlear-video-slider-prev]');
    const nextBtn = wrap.querySelector('[data-curlear-video-slider-next]');
    if (!track) return;

    const marqueeEnabled = setupMarquee(wrap, track);
    let stopStandardAutoplay = () => {};

    wrap.querySelectorAll('.curlear-video-slider__card').forEach((card) => {
      card.addEventListener('click', (event) => goToProduct(event, card));
      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        goToProduct(event, card);
      });
      bindMute(card);
      bindMediaClick(card);
    });

    const moveByOneCard = (direction = 1) => {
      const firstCard = track.querySelector('.curlear-video-slider__card');
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

    if (prevBtn) prevBtn.addEventListener('click', () => moveByOneCard(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => moveByOneCard(1));

    const autoplay = wrap.dataset.autoplay === 'true';
    const speed = parseInt(wrap.dataset.speed || '4000', 10);
    const intervalMs = Math.max(2000, speed);

    let mobileMarqueeAutoplayTimer = null;
    const stopMobileMarqueeAutoplay = () => {
      if (mobileMarqueeAutoplayTimer) {
        clearInterval(mobileMarqueeAutoplayTimer);
        mobileMarqueeAutoplayTimer = null;
      }
    };

    const startMobileMarqueeAutoplay = () => {
      if (!marqueeEnabled || wrap.dataset.mobileSlider !== 'true' || !autoplay) return;
      if (window.innerWidth > MOBILE_MAX) return;
      if (mobileMarqueeAutoplayTimer) return;
      mobileMarqueeAutoplayTimer = setInterval(() => moveByOneCard(1), intervalMs);
    };

    if (marqueeEnabled && wrap.dataset.mobileSlider === 'true' && autoplay) {
      startMobileMarqueeAutoplay();
      window.addEventListener('resize', () => {
        if (window.innerWidth <= MOBILE_MAX) startMobileMarqueeAutoplay();
        else stopMobileMarqueeAutoplay();
      });
      wrap.addEventListener('touchstart', stopMobileMarqueeAutoplay, { passive: true });
      wrap.addEventListener('mouseenter', stopMobileMarqueeAutoplay);
      wrap.addEventListener('mouseleave', () => {
        if (window.innerWidth <= MOBILE_MAX) startMobileMarqueeAutoplay();
      });
    }

    if (marqueeEnabled) return;

    if (!autoplay) return;

    let timer = setInterval(() => moveByOneCard(1), intervalMs);
    stopStandardAutoplay = () => clearInterval(timer);
    wrap.addEventListener('mouseenter', () => clearInterval(timer));
    wrap.addEventListener('mouseleave', () => {
      timer = setInterval(() => moveByOneCard(1), intervalMs);
    });

    wrap.addEventListener('touchstart', () => {
      stopStandardAutoplay();
    }, { passive: true });
  };

  document.querySelectorAll('[data-curlear-video-slider]').forEach(initSlider);
})();
