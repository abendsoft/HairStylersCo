(() => {
  const initSection = (root) => {
    const rows = Array.from(root.querySelectorAll('[data-curlear-showcase-row]'));
    const slides = Array.from(root.querySelectorAll('[data-curlear-showcase-slide]'));
    const prevBtn = root.querySelector('[data-curlear-showcase-prev]');
    const nextBtn = root.querySelector('[data-curlear-showcase-next]');
    const media = root.querySelector('.curlear-image-accordion-showcase__media');
    if (!slides.length) return;
    const imageIndices = slides
      .filter((slide) => slide.dataset.hasImage === 'true')
      .map((slide) => Number(slide.dataset.index));

    let activeIndex = 0;

    const anyRowOpen = () => rows.some((row) => row.open);

    const clearMediaHeightLock = () => {
      root.classList.remove('curlear-image-accordion-showcase--lock-media-height');
      root.style.removeProperty('--curlear-locked-media-height');
    };

    const syncMediaHeightLock = () => {
      if (!media || !anyRowOpen()) {
        clearMediaHeightLock();
        return;
      }

      const visibleSlide = slides.find((slide) => !slide.hidden);
      const img = visibleSlide?.querySelector('.curlear-image-accordion-showcase__image');
      if (!img || !img.naturalWidth) {
        clearMediaHeightLock();
        return;
      }

      const w = media.getBoundingClientRect().width;
      if (!w) {
        clearMediaHeightLock();
        return;
      }

      const h = Math.max(1, Math.ceil(img.naturalHeight * (w / img.naturalWidth)));
      root.style.setProperty('--curlear-locked-media-height', `${h}px`);
      root.classList.add('curlear-image-accordion-showcase--lock-media-height');
    };

    const updateRowHeights = () => {
      rows.forEach((row) => {
        const content = row.querySelector('.curlear-image-accordion-showcase__row-content');
        if (!content) return;
        row.style.setProperty('--curlear-row-max-height', `${content.scrollHeight + 28}px`);
      });
    };

    const scheduleSync = () => {
      updateRowHeights();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => syncMediaHeightLock());
      });
    };

    const render = () => {
      slides.forEach((slide, index) => {
        const isActive = index === activeIndex;
        slide.hidden = !isActive;
        slide.classList.toggle('is-active', isActive);
      });
    };

    const setActive = (index) => {
      if (index < 0 || index >= slides.length) return;
      let resolvedIndex = index;
      const requestedSlide = slides[index];
      if (requestedSlide && requestedSlide.dataset.hasImage !== 'true' && imageIndices.length > 0) {
        const lastBefore = imageIndices.filter((i) => i <= index).pop();
        resolvedIndex = typeof lastBefore === 'number' ? lastBefore : imageIndices[0];
      }
      activeIndex = resolvedIndex;
      render();
    };

    rows.forEach((row, rowIndex) => {
      row.addEventListener('toggle', () => {
        updateRowHeights();
        if (!row.open) {
          if (!anyRowOpen()) clearMediaHeightLock();
          return;
        }
        rows.forEach((other, otherIndex) => {
          if (otherIndex !== rowIndex) other.open = false;
        });
        setActive(rowIndex);
        scheduleSync();
      });
    });

    const move = (dir = 1) => {
      if (slides.length <= 1) return;
      activeIndex = (activeIndex + dir + slides.length) % slides.length;
      render();
      if (anyRowOpen()) scheduleSync();
    };

    if (prevBtn) prevBtn.addEventListener('click', () => move(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => move(1));

    let touchStartX = null;
    root.addEventListener(
      'touchstart',
      (event) => {
        touchStartX = event.changedTouches[0].clientX;
      },
      { passive: true }
    );

    root.addEventListener(
      'touchend',
      (event) => {
        if (touchStartX === null) return;
        const delta = event.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(delta) < 35) return;
        move(delta < 0 ? 1 : -1);
      },
      { passive: true }
    );

    slides.forEach((slide) => {
      slide.querySelector('.curlear-image-accordion-showcase__image')?.addEventListener('load', () => syncMediaHeightLock(), { passive: true });
    });

    const openRowIndex = rows.findIndex((row) => row.open);
    updateRowHeights();
    window.addEventListener('resize', scheduleSync);
    if (openRowIndex >= 0) {
      setActive(openRowIndex);
      scheduleSync();
    } else {
      render();
    }
  };

  document.querySelectorAll('[data-curlear-accordion-showcase]').forEach(initSection);
})();
