(() => {
  const initSection = (root) => {
    const rows = Array.from(root.querySelectorAll('[data-curlear-showcase-row]'));
    if (!rows.length) return;

    const updateRowHeights = () => {
      rows.forEach((row) => {
        const content = row.querySelector('.curlear-image-accordion-showcase__row-content');
        if (!content) return;
        row.style.setProperty('--curlear-row-max-height', `${content.scrollHeight + 28}px`);
      });
    };

    rows.forEach((row, rowIndex) => {
      row.addEventListener('toggle', () => {
        updateRowHeights();
        if (!row.open) return;
        rows.forEach((other, otherIndex) => {
          if (otherIndex !== rowIndex) other.open = false;
        });
      });
    });

    updateRowHeights();
    window.addEventListener('resize', updateRowHeights);
  };

  const initAll = (scope = document) => {
    scope.querySelectorAll('[data-curlear-accordion-showcase]').forEach(initSection);
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
