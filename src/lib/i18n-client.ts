/**
 * i18n Client Script - Injectable client-side internationalization
 * This script provides JavaScript code that can be injected into HTML
 */

/**
 * Generate the client-side i18n script as a string
 */
export function generateI18nScript(): string {
  return `
<script>
(function() {
  'use strict';

  // Constants
  const STORAGE_KEY = 'ui_lang';
  const COOKIE_KEY = 'ui_lang';
  const IP_CACHE_KEY = 'ip_country_cache';
  const IP_CACHE_DURATION = 24 * 60 * 60 * 1000;
  const DETECTION_TIMEOUT = 2500;
  const LANG_CHANGE_EVENT = 'ui_lang_change';

  // State
  let currentLang = 'tr';
  const listeners = new Set();

  // Translation dictionary
  const translations = {
    // Navigation
    'nav.home': { tr: 'Ana Sayfa', en: 'Home' },
    'nav.projects': { tr: 'Projeler', en: 'Projects' },
    'nav.assets': { tr: 'Varlıklar', en: 'Assets' },
    'nav.script': { tr: 'Senaryo', en: 'Script' },
    'nav.production': { tr: 'Üretim', en: 'Production' },
    'nav.settings': { tr: 'Ayarlar', en: 'Settings' },
    'nav.logout': { tr: 'Çıkış Yap', en: 'Logout' },

    // Common actions
    'common.save': { tr: 'Kaydet', en: 'Save' },
    'common.cancel': { tr: 'İptal', en: 'Cancel' },
    'common.delete': { tr: 'Sil', en: 'Delete' },
    'common.edit': { tr: 'Düzenle', en: 'Edit' },
    'common.add': { tr: 'Ekle', en: 'Add' },
    'common.create': { tr: 'Oluştur', en: 'Create' },
    'common.update': { tr: 'Güncelle', en: 'Update' },
    'common.search': { tr: 'Ara', en: 'Search' },
    'common.loading': { tr: 'Yükleniyor...', en: 'Loading...' },
    'common.error': { tr: 'Hata', en: 'Error' },
    'common.success': { tr: 'Başarılı', en: 'Success' },
    'common.confirm': { tr: 'Onayla', en: 'Confirm' },
    'common.close': { tr: 'Kapat', en: 'Close' },
    'common.back': { tr: 'Geri', en: 'Back' },
    'common.next': { tr: 'İleri', en: 'Next' },
    'common.download': { tr: 'İndir', en: 'Download' },
    'common.upload': { tr: 'Yükle', en: 'Upload' },

    // Language switcher
    'lang.switch': { tr: 'Dili Değiştir', en: 'Switch Language' },
    'lang.tr': { tr: 'Türkçe', en: 'Türkçe' },
    'lang.en': { tr: 'İngilizce', en: 'English' },

    // Authentication
    'auth.login': { tr: 'Giriş Yap', en: 'Login' },
    'auth.logout': { tr: 'Çıkış Yap', en: 'Logout' },
    'auth.username': { tr: 'Kullanıcı Adı', en: 'Username' },
    'auth.password': { tr: 'Şifre', en: 'Password' },

    // Projects
    'project.title': { tr: 'Projeler', en: 'Projects' },
    'project.new': { tr: 'Yeni Proje', en: 'New Project' },
    'project.create': { tr: 'Proje Oluştur', en: 'Create Project' },

    // Assets
    'asset.title': { tr: 'Varlıklar', en: 'Assets' },
    'asset.upload': { tr: 'Varlık Yükle', en: 'Upload Asset' },

    // Settings
    'settings.title': { tr: 'Ayarlar', en: 'Settings' },
    'settings.general': { tr: 'Genel', en: 'General' },
    'settings.about': { tr: 'Hakkında', en: 'About' },

    // Common UI
    'ui.loading': { tr: 'Yükleniyor...', en: 'Loading...' },
    'ui.noData': { tr: 'Veri bulunmuyor', en: 'No data available' },
    'ui.search': { tr: 'Ara...', en: 'Search...' },
  };

  function t(key, lang, vars) {
    const targetLang = lang || currentLang;
    const translation = translations[key];

    if (!translation) {
      console.warn('Translation missing for key:', key);
      return key;
    }

    let result = translation[targetLang] || translation.tr;

    if (vars) {
      Object.entries(vars).forEach(([varKey, value]) => {
        result = result.replace('{' + varKey + '}', String(value));
      });
    }

    return result;
  }

  function getStoredLang() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'tr' || stored === 'en') return stored;
    } catch (e) {}
    return 'tr';
  }

  function setLang(lang) {
    if (!['tr', 'en'].includes(lang)) return;

    currentLang = lang;

    try {
      localStorage.setItem(STORAGE_KEY, lang);

      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      document.cookie = COOKIE_KEY + '=' + lang + '; expires=' + expires.toUTCString() + '; path=/; SameSite=Lax';
    } catch (e) {}

    listeners.forEach(listener => listener(lang));
    window.dispatchEvent(new CustomEvent(LANG_CHANGE_EVENT, { detail: { lang } }));

    updatePageContent();
  }

  async function detectCountryFromIP() {
    try {
      const cached = sessionStorage.getItem(IP_CACHE_KEY);
      if (cached) {
        const { country, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < IP_CACHE_DURATION) {
          return country === 'TR' ? 'tr' : 'en';
        }
      }
    } catch (e) {}

    const services = ['https://ipwho.is/', 'https://ipapi.co/json/'];

    for (const service of services) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DETECTION_TIMEOUT);

        const response = await fetch(service, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        clearTimeout(timeoutId);

        if (!response.ok) continue;

        const data = await response.json();
        const country = data.country_code || data.country || data.countryCode || '';

        try {
          sessionStorage.setItem(IP_CACHE_KEY, JSON.stringify({
            country: country.toUpperCase(),
            timestamp: Date.now(),
          }));
        } catch (e) {}

        return country.toUpperCase() === 'TR' ? 'tr' : 'en';
      } catch (error) {
        continue;
      }
    }

    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('tr')) {
      return 'tr';
    }

    return 'tr';
  }

  function updatePageContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        const vars = element.getAttribute('data-i18n-vars');
        const parsedVars = vars ? JSON.parse(vars) : undefined;
        const translation = t(key, currentLang, parsedVars);

        if (element.tagName === 'INPUT' && element.placeholder) {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
      }
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(element => {
      const attrConfig = element.getAttribute('data-i18n-attr');
      if (attrConfig) {
        try {
          const config = JSON.parse(attrConfig);
          Object.entries(config).forEach(([attr, key]) => {
            const translation = t(key, currentLang);
            element.setAttribute(attr, translation);
          });
        } catch (e) {}
      }
    });
  }

  async function initializeI18n() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const detected = await detectCountryFromIP();
      if (!localStorage.getItem(STORAGE_KEY)) {
        setLang(detected);
      }
    } else {
      currentLang = getStoredLang();
      updatePageContent();
    }

    window.addEventListener(LANG_CHANGE_EVENT, updatePageContent);

    console.log('i18n system initialized with language:', currentLang);
  }

  window.i18n = {
    t,
    getCurrentLang: () => currentLang,
    setLang,
    subscribe: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeI18n);
  } else {
    initializeI18n();
  }
})();
</script>`;
}

/**
 * Generate the language switcher HTML
 */
export function generateLangSwitchHTML(): string {
  return `
<div id="lang-switch-container"></div>
<script>
(function() {
  'use strict';

  const styles = \`
    .lang-switch-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: inline-flex;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .lang-switch {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
    }
    .lang-switch:hover {
      background: rgba(0, 0, 0, 0.8);
    }
    .lang-switch-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }
    .lang-options {
      display: flex;
      gap: 2px;
    }
    .lang-option {
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      opacity: 0.6;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      font-weight: 600;
    }
    .lang-option:hover {
      opacity: 0.8;
      background: rgba(255, 255, 255, 0.1);
    }
    .lang-option.active {
      opacity: 1;
      color: #fff;
    }
    .lang-option.active[data-lang="tr"] {
      background: #e30a17;
    }
    .lang-option.active[data-lang="en"] {
      background: #0052cc;
    }
  \`;

  function t(key, lang) {
    const translations = {
      'lang.switch': { tr: 'Dili Değiştir', en: 'Switch Language' },
      'lang.tr': { tr: 'Türkçe', en: 'Türkçe' },
      'lang.en': { tr: 'İngilizce', en: 'English' },
    };
    return translations[key]?.[lang] || key;
  }

  function renderLangSwitch(lang) {
    return \`
      \${styles}
      <div class="lang-switch">
        <span class="lang-switch-label">\${t('lang.switch', lang)}</span>
        <div class="lang-options">
          <button class="lang-option \${lang === 'tr' ? 'active' : ''}" data-lang="tr" title="\${t('lang.tr', lang)}">TR</button>
          <button class="lang-option \${lang === 'en' ? 'active' : ''}" data-lang="en" title="\${t('lang.en', lang)}">EN</button>
        </div>
      </div>
    \`;
  }

  function initLangSwitch() {
    const container = document.getElementById('lang-switch-container');
    if (!container) return;

    function updateContent() {
      const currentLang = window.i18n ? window.i18n.getCurrentLang() : 'tr';
      container.innerHTML = renderLangSwitch(currentLang);

      const buttons = container.querySelectorAll('.lang-option');
      buttons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const lang = button.getAttribute('data-lang');
          if (window.i18n) {
            window.i18n.setLang(lang);
          }
        });
      });
    }

    window.addEventListener('ui_lang_change', updateContent);

    if (window.i18n) {
      window.i18n.subscribe(updateContent);
      updateContent();
    } else {
      setTimeout(updateContent, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLangSwitch);
  } else {
    initLangSwitch();
  }
})();
</script>`;
}

export default {
  generateI18nScript,
  generateLangSwitchHTML,
};