/* Presentation only. Draft state, storage, migration and outreach stay in app.js. */
(() => {
  'use strict';
  const message = document.getElementById('message');
  const button = document.getElementById('expandLetter');
  function fitLetter() {
    for (const id of ['callScript', 'socialText']) {
      const field = document.getElementById(id);
      if (field.getClientRects().length) {
        field.style.height = 'auto';
        field.style.height = `${field.scrollHeight + 2}px`;
      }
    }
    if (button.getAttribute('aria-expanded') !== 'true' || !message.getClientRects().length) return;
    const top = window.scrollY;
    message.style.height = 'auto';
    message.style.height = `${message.scrollHeight + 2}px`;
    window.scrollTo(window.scrollX, top);
  }
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? 'Return to compact editor ↑' : 'Read the full letter ↓';
    if (expanded) fitLetter();
    else {
      message.style.height = '';
      button.focus({ preventScroll: true });
      const headerBottom = document.querySelector('.masthead').getBoundingClientRect().bottom;
      const bounds = button.getBoundingClientRect();
      if (bounds.top < headerBottom + 8) window.scrollBy(0, bounds.top - headerBottom - 8);
    }
  });
  // Run after app handlers replace recipient text; expansion never edits its value.
  document.addEventListener('input', fitLetter);
  document.addEventListener('change', fitLetter);
  document.addEventListener('click', fitLetter);
  window.addEventListener('resize', fitLetter);
  document.fonts?.ready.then(fitLetter);
})();
