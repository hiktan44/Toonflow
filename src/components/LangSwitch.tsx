/**
 * LangSwitch - Language switcher component
 * Works as a web component for maximum compatibility
 */

// Types
type Lang = 'tr' | 'en';

// State management
let currentLang: Lang = 'tr';
const listeners: Set<(lang: Lang) => void> = new Set();

// Constants
const STORAGE_KEY = 'ui_lang';
const LANG_CHANGE_EVENT = 'ui_lang_change';

/**
 * Get current language from storage
 */
const getStoredLang = (): Lang => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'tr' || stored === 'en') return stored;
  } catch (e) {
    console.debug('localStorage not available');
  }
  return 'tr'; // Default
};

/**
 * Set language and notify listeners
 */
const setLangState = (lang: Lang): void => {
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    console.debug('localStorage not available');
  }
  listeners.forEach(listener => listener(lang));
  window.dispatchEvent(new CustomEvent(LANG_CHANGE_EVENT, { detail: { lang } }));
};

// Initialize current language
currentLang = getStoredLang();

/**
 * Simple translation dictionary
 */
const translations: Record<string, Record<string, string>> = {
  'lang.switch': { tr: 'Dili Değiştir', en: 'Switch Language' },
  'lang.tr': { tr: 'Türkçe', en: 'Türkçe' },
  'lang.en': { tr: 'İngilizce', en: 'English' },
};

/**
 * Get translation
 */
const t = (key: string, lang: Lang = currentLang): string => {
  return translations[key]?.[lang] || key;
};

// Styles for the component
const styles = `
  <style>
    .lang-switch-container {
      display: inline-flex;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .lang-switch {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: var(--lang-switch-bg, rgba(255, 255, 255, 0.1));
      border: 1px solid var(--lang-switch-border, rgba(255, 255, 255, 0.2));
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
    }
    .lang-switch:hover {
      background: var(--lang-switch-hover-bg, rgba(255, 255, 255, 0.15));
    }
    .lang-switch-label {
      color: var(--lang-switch-label-color, rgba(255, 255, 255, 0.7));
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
      color: var(--lang-option-color, rgba(255, 255, 255, 0.8));
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
      background: var(--lang-tr-bg, #e30a17);
    }
    .lang-option.active[data-lang="en"] {
      background: var(--lang-en-bg, #0052cc);
    }
  </style>
`;

/**
 * Render the language switcher HTML
 */
const renderLangSwitch = (lang: Lang): string => {
  return `
    ${styles}
    <div class="lang-switch-container">
      <div class="lang-switch" role="button" aria-label="${t('lang.switch', lang)}">
        <span class="lang-switch-label">${t('lang.switch', lang)}</span>
        <div class="lang-options">
          <button
            class="lang-option ${lang === 'tr' ? 'active' : ''}"
            data-lang="tr"
            aria-label="${t('lang.tr', lang)}"
            title="${t('lang.tr', lang)}"
          >
            TR
          </button>
          <button
            class="lang-option ${lang === 'en' ? 'active' : ''}"
            data-lang="en"
            aria-label="${t('lang.en', lang)}"
            title="${t('lang.en', lang)}"
          >
            EN
          </button>
        </div>
      </div>
    </div>
  `;
};

/**
 * Initialize language switcher in a container
 */
export const initLangSwitch = (containerId: string = 'lang-switch-container'): void => {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Language switcher container '${containerId}' not found`);
    return;
  }

  // Initial render
  const updateContent = () => {
    container.innerHTML = renderLangSwitch(currentLang);

    // Attach event listeners
    const buttons = container.querySelectorAll('.lang-option');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const lang = (button as HTMLElement).getAttribute('data-lang') as Lang;
        if (lang === 'tr' || lang === 'en') {
          setLangState(lang);
        }
      });
    });
  };

  // Subscribe to language changes
  const unsubscribe = () => {
    listeners.delete(updateContent);
  };

  listeners.add(updateContent);

  // Also listen for custom events
  window.addEventListener(LANG_CHANGE_EVENT, updateContent);

  // Initial render
  updateContent();

  // Store cleanup function for potential removal
  (container as any)._langSwitchCleanup = () => {
    unsubscribe();
    window.removeEventListener(LANG_CHANGE_EVENT, updateContent);
  };
};

/**
 * Self-contained web component
 */
export class LangSwitchElement extends HTMLElement {
  private cleanup: (() => void) | null = null;

  connectedCallback() {
    initLangSwitch();
    this.cleanup = (this as any)._langSwitchCleanup || null;
  }

  disconnectedCallback() {
    if (this.cleanup) {
      this.cleanup();
    }
  }
}

// Register the web component
if (typeof customElements !== 'undefined' && !customElements.get('lang-switch')) {
  customElements.define('lang-switch', LangSwitchElement);
}

/**
 * Simple initialization script
 */
export const injectLangSwitch = (target: HTMLElement | string): void => {
  const container = typeof target === 'string'
    ? document.querySelector(target) as HTMLElement
    : target;

  if (!container) {
    console.error('Cannot inject language switcher: target not found');
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.id = 'lang-switch-container';
  container.appendChild(wrapper);

  initLangSwitch('lang-switch-container');
};

/**
 * Export current language for other modules
 */
export const getCurrentLang = (): Lang => currentLang;

/**
 * Export language setter for other modules
 */
export const setLang = (lang: Lang): void => setLangState(lang);

/**
 * Subscribe to language changes
 */
export const subscribeToLangChange = (callback: (lang: Lang) => void): (() => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

// Auto-initialize if DOM is ready and container exists
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('lang-switch-container')) {
        initLangSwitch('lang-switch-container');
      }
    });
  } else {
    if (document.getElementById('lang-switch-container')) {
      initLangSwitch('lang-switch-container');
    }
  }
}

export default initLangSwitch;