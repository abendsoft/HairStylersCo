document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-cpd-tabs]').forEach((root) => {
    const triggers = root.querySelectorAll('[data-cpd-tab-trigger]');
    const panels = root.querySelectorAll('[data-cpd-panel]');

    if (!triggers.length || !panels.length) return;

    const activate = (tabId) => {
      triggers.forEach((trigger) => {
        const isActive = trigger.dataset.cpdTab === tabId;
        trigger.classList.toggle('is-active', isActive);
        trigger.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.cpdPanel === tabId;
        panel.classList.toggle('is-active', isActive);
        panel.hidden = !isActive;
      });
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        activate(trigger.dataset.cpdTab);
      });
    });
  });
});
