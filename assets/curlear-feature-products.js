(() => {
  const SELECTORS = {
    root: "[data-curlear-feature-products]",
    track: "[data-curlear-feature-track]",
    slide: "[data-curlear-feature-slide]",
    dot: "[data-curlear-feature-dot]"
  };

  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));

  const getActiveIndex = (track, slides) => {
    if (!slides.length) return 0;
    const slideWidth = slides[0].getBoundingClientRect().width || 1;
    return clamp(Math.round(track.scrollLeft / slideWidth), 0, slides.length - 1);
  };

  const setActiveDot = (root, index) => {
    const dots = Array.from(root.querySelectorAll(SELECTORS.dot));
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  };

  const init = (root) => {
    const track = root.querySelector(SELECTORS.track);
    const slides = Array.from(root.querySelectorAll(SELECTORS.slide));
    const dots = Array.from(root.querySelectorAll(SELECTORS.dot));
    if (!track || !slides.length) return;

    // Reset old listeners/timers on theme editor reloads.
    if (root._curlearFeatureTimer) {
      clearInterval(root._curlearFeatureTimer);
      root._curlearFeatureTimer = null;
    }

    const scrollToIndex = (index) => {
      const target = slides[index];
      if (!target) return;
      track.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
      setActiveDot(root, index);
    };

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => scrollToIndex(index));
    });

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        setActiveDot(root, getActiveIndex(track, slides));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });

    const autoplay = root.dataset.autoplay === "true";
    const speed = parseInt(root.dataset.speed || "4000", 10);

    const next = () => {
      const current = getActiveIndex(track, slides);
      const nextIndex = (current + 1) % slides.length;
      scrollToIndex(nextIndex);
    };

    const stop = () => {
      if (root._curlearFeatureTimer) {
        clearInterval(root._curlearFeatureTimer);
        root._curlearFeatureTimer = null;
      }
    };

    const start = () => {
      if (!autoplay || slides.length < 2) return;
      stop();
      root._curlearFeatureTimer = setInterval(next, Math.max(2000, speed));
    };

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("touchstart", stop, { passive: true });
    root.addEventListener("touchend", start, { passive: true });

    // Initial state
    setActiveDot(root, 0);
    start();
  };

  const initAll = (scope = document) => {
    scope.querySelectorAll(SELECTORS.root).forEach(init);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initAll());
  } else {
    initAll();
  }

  document.addEventListener("shopify:section:load", (event) => {
    initAll(event.target);
  });
})();

