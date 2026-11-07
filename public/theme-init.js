(function () {
  var theme = 'light';

  try {
    theme = localStorage.getItem('garagemja-theme') === 'dark' ? 'dark' : 'light';
  } catch (_) {}

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
