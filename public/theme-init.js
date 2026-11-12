(function () {
  var theme =
    window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  try {
    var stored = localStorage.getItem('garagemja-theme');
    if (stored === 'dark' || stored === 'light') theme = stored;
  } catch (_) {}

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
