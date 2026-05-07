(() => {
  const selectors = {
    root: "[data-curlear-testimonial-slider]",
    slides: "[data-curlear-slide]",
    current: "[data-curlear-current]",
    prev: "[data-curlear-prev]",
    next: "[data-curlear-next]"
  };

  const initSlider = (root) => {
    const slides = Array.from(root.querySelectorAll(selectors.slides));
    const currentEl = root.querySelector(selectors.current);
    const prevBtn = root.querySelector(selectors.prev);
    const nextBtn = root.querySelector(selectors.next);

    if (!slides.length || !currentEl) return;

    let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
    let timerId = null;
    const autoPlay = root.dataset.autoplay === "true";
    const speed = Number(root.dataset.speed) || 4000;

    if (activeIndex < 0) activeIndex = 0;

    const render = () => {
      slides.forEach((slide, index) => {
        const isActive = index === activeIndex;
        slide.classList.toggle("is-active", isActive);
        slide.hidden = !isActive;
      });
      currentEl.textContent = String(activeIndex + 1);
    };

    const next = () => {
      activeIndex = (activeIndex + 1) % slides.length;
      render();
    };

    const prev = () => {
      activeIndex = (activeIndex - 1 + slides.length) % slides.length;
      render();
    };

    const stopAuto = () => {
      if (timerId) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    const startAuto = () => {
      if (!autoPlay || slides.length < 2) return;
      stopAuto();
      timerId = window.setInterval(next, speed);
    };

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        prev();
        startAuto();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        next();
        startAuto();
      });
    }

    root.addEventListener("mouseenter", stopAuto);
    root.addEventListener("mouseleave", startAuto);

    render();
    startAuto();
  };

  document.querySelectorAll(selectors.root).forEach(initSlider);
})();
