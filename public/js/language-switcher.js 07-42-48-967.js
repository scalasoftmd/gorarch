document.addEventListener("DOMContentLoaded", function () {
    const userLang = navigator.language || navigator.userLanguage;
    const lang = userLang.split('-')[0]; // Get 'en' from 'en-US'
  
    const supportedLangs = ['en', 'ro', 'ru', 'de'];
  
    if (supportedLangs.includes(lang)) {
      if (window.location.pathname === "/index.html" || window.location.pathname === "/") {
        window.location.href = `/${lang}/index.html`;
      }
    } else {
      window.location.href = `/en/index.html`;
    }
  });
  