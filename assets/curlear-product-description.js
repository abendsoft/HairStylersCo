const initCpdTabs = (root) => {
  if (root.dataset.cpdTabsInit === 'true') return;
  root.dataset.cpdTabsInit = 'true';

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
};

const initCpdFaq = (root) => {
  if (root.dataset.cpdFaqInit === 'true') return;
  root.dataset.cpdFaqInit = 'true';

  root.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-cpd-faq-trigger]');
    if (!trigger || !root.contains(trigger)) return;

    const item = trigger.closest('[data-cpd-faq-item]');
    if (!item) return;

    const wasOpen = item.classList.contains('is-open');

    root.querySelectorAll('[data-cpd-faq-item]').forEach((faqItem) => {
      faqItem.classList.remove('is-open');
      const faqTrigger = faqItem.querySelector('[data-cpd-faq-trigger]');
      if (faqTrigger) faqTrigger.setAttribute('aria-expanded', 'false');
    });

    if (!wasOpen) {
      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
};

const initCpdSection = (container = document) => {
  container.querySelectorAll('[data-cpd-tabs]').forEach(initCpdTabs);
  container.querySelectorAll('[data-cpd-faq]').forEach(initCpdFaq);
};

document.addEventListener('DOMContentLoaded', () => initCpdSection());
document.addEventListener('shopify:section:load', (event) => initCpdSection(event.target));
