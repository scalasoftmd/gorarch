// ✅ Define it OUTSIDE any wrapper so it's GLOBAL
function switchLanguage(lang) {
  const supportedLangs = ['en', 'ro', 'ru', 'de'];

  if (supportedLangs.includes(lang)) {
    window.location.href = `/${lang}/index.html`;
  } else {
    window.location.href = `/en/index.html`;
  }
}

// ✅ Optionally detect browser language on load
document.addEventListener("DOMContentLoaded", function () {
  const userLang = navigator.language || navigator.userLanguage;
  const lang = userLang.split('-')[0];
  const supportedLangs = ['en', 'ro', 'ru', 'de'];

  if (supportedLangs.includes(lang)) {
    if (window.location.pathname === "/index.html" || window.location.pathname === "/") {
      window.location.href = `/${lang}/index.html`;
    }
  } else {
    window.location.href = `/en/index.html`;
  }
});
