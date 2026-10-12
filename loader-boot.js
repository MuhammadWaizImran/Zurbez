/* Runs before the first paint; changing pages must never restart the intro. */
(() => {
  // sessionStorage belongs to one browser tab/window: refreshes stay skipped,
  // while a newly opened browsing session receives its own first-time intro.
  const key = 'zurbez:intro-seen:v3';
  const root = document.documentElement;
  const preview = root.hasAttribute('data-intro-preview');
  let seen = false;
  try { seen = sessionStorage.getItem(key) === '1'; } catch {}
  if (seen && !preview) return;
  // Mark at the beginning so even a refresh during the animation skips it.
  if (!preview) {
    try { sessionStorage.setItem(key, '1'); } catch {}
  }
  root.classList.add('intro-pending');
  // A missing script or failed asset must never leave the shop blocked.
  window.zurbezIntroWatchdog = setTimeout(() => {
    root.classList.remove('intro-pending');
    document.getElementById('zurbez-intro')?.remove();
    document.querySelectorAll('[data-intro-inert]').forEach(el => {
      el.inert = false;
      el.removeAttribute('data-intro-inert');
    });
  }, 14000);
})();
