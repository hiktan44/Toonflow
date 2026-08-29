/**
 * useLang() - Client-side language detection and management
 * Implements IP-based detection with localStorage preference override
 */

type Lang = 'tr' | 'en';
type LangDetector = () => Promise<Lang>;

// Constants
const STORAGE_KEY = 'ui_lang';
const COOKIE_KEY = 'ui_lang';
const IP_CACHE_KEY = 'ip_country_cache';
const IP_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const DETECTION_TIMEOUT = 2500; // 2.5s timeout

// Event for language changes
export const LANG_CHANGE_EVENT = 'ui_lang_change';

// Global state
let currentLang: Lang = 'tr';
let listeners: Set<(lang: Lang) => void> = new Set();

/**
 * Detect country from IP with timeout and caching
 */
const detectCountryFromIP: LangDetector = async (): Promise<Lang> => {
  // Check cache first
  const cached = sessionStorage.getItem(IP_CACHE_KEY);
  if (cached) {
    const { country, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < IP_CACHE_DURATION) {
      return country === 'TR' ? 'tr' : 'en';
    }
  }

  // Try multiple IP detection services with timeout
  const services = [
    'https://ipwho.is/',
    'https://ipapi.co/json/',
    'https://api.ipify.org?format=json',
  ];

  for (const service of services) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DETECTION_TIMEOUT);

      const response = await fetch(service, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      const country = data.country_code || data.country || data.countryCode || '';
      
      // Cache the result
      sessionStorage.setItem(IP_CACHE_KEY, JSON.stringify({
        country: country.toUpperCase(),
        timestamp: Date.now(),
      }));

      return country.toUpperCase() === 'TR' ? 'tr' : 'en';
    } catch (error) {
      console.debug(`IP detection failed for ${service}:`, error);
      continue;
    }
  }

  // Fallback to browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('tr')) {
    return 'tr';
  }
  
  // Default to Turkish
  return 'tr';
};

/**
 * Get language from localStorage or detect from IP
 */
const getInitialLanguage = (): Lang => {
  // Priority 1: User preference in localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'tr' || stored === 'en') {
    return stored;
  }

  // Priority 2: Cookie preference
  const cookieMatch = document.cookie.match(`(^|;)\\s*${COOKIE_KEY}\\s*=\\s*([^;]+)`);
  if (cookieMatch) {
    const cookieLang = cookieMatch.pop();
    if (cookieLang === 'tr' || cookieLang === 'en') {
      // Sync to localStorage
      localStorage.setItem(STORAGE_KEY, cookieLang);
      return cookieLang;
    }
  }

  // Priority 3: Will be set by IP detection on mount
  return 'tr'; // Default
};

/**
 * Set language and persist it
 */
export const setLang = (lang: Lang): void => {
  if (!['tr', 'en'].includes(lang)) return;

  currentLang = lang;

  // Persist to localStorage
  localStorage.setItem(STORAGE_KEY, lang);

  // Set cookie (1 year)
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_KEY}=${lang}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

  // Notify listeners
  listeners.forEach(listener => listener(lang));

  // Dispatch custom event for other contexts
  window.dispatchEvent(new CustomEvent(LANG_CHANGE_EVENT, { detail: { lang } }));
};

/**
 * Main hook for language management
 */
export const useLang = (): {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
} => {
  // Initialize language on first call
  if (currentLang === 'tr' && !localStorage.getItem(STORAGE_KEY)) {
    // Need to detect from IP
    detectCountryFromIP().then(detectedLang => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setLang(detectedLang);
      }
    });
  }

  return {
    lang: currentLang,
    setLang,
    t: (key: string, vars?: Record<string, string | number>) => {
      // This will be connected to the i18n.t function
      // For now, return the key as-is
      return key;
    }
  };
};

/**
 * Subscribe to language changes
 */
export const subscribeToLangChange = (callback: (lang: Lang) => void): (() => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

/**
 * Helper to pick value based on language
 */
export const pickByLang = <T>(lang: Lang, tr: T, en: T): T => {
  return lang === 'tr' ? tr : en;
};

/**
 * Get current language synchronously
 */
export const getCurrentLang = (): Lang => currentLang;

/**
 * Initialize language detection (call on app mount)
 */
export const initializeLanguage = async (): Promise<Lang> => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    const detected = await detectCountryFromIP();
    setLang(detected);
    return detected;
  }
  return getInitialLanguage();
};