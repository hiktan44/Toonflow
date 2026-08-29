/**
 * i18n - Internationalization system for Toonflow
 * Provides translation dictionary and t() function
 */

import { getCurrentLang, setLang, subscribeToLangChange } from './use-lang';

// Types
type Translations = Record<string, { tr: string; en: string }>;
type TranslationKey = keyof Translations;

// Translation dictionary
export const DICT: Translations = {
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
  'common.previous': { tr: 'Önceki', en: 'Previous' },
  'common.download': { tr: 'İndir', en: 'Download' },
  'common.upload': { tr: 'Yükle', en: 'Upload' },
  'common.import': { tr: 'İçe Aktar', en: 'Import' },
  'common.export': { tr: 'Dışa Aktar', en: 'Export' },
  'common.copy': { tr: 'Kopyala', en: 'Copy' },
  'common.paste': { tr: 'Yapıştır', en: 'Paste' },
  'common.select': { tr: 'Seç', en: 'Select' },
  'common.clear': { tr: 'Temizle', en: 'Clear' },
  'common.refresh': { tr: 'Yenile', en: 'Refresh' },
  'common.preview': { tr: 'Önizleme', en: 'Preview' },
  'common.details': { tr: 'Detaylar', en: 'Details' },
  'common.actions': { tr: 'İşlemler', en: 'Actions' },
  'common.name': { tr: 'İsim', en: 'Name' },
  'common.description': { tr: 'Açıklama', en: 'Description' },
  'common.status': { tr: 'Durum', en: 'Status' },
  'common.type': { tr: 'Tür', en: 'Type' },
  'common.date': { tr: 'Tarih', en: 'Date' },
  'common.size': { tr: 'Boyut', en: 'Size' },
  'common.format': { tr: 'Format', en: 'Format' },
  'common.duration': { tr: 'Süre', en: 'Duration' },
  'common.resolution': { tr: 'Çözünürlük', en: 'Resolution' },
  'common.fps': { tr: 'Kare/s', en: 'FPS' },
  'common.bitrate': { tr: 'Bit Hızı', en: 'Bitrate' },
  'common.codec': { tr: 'Kodek', en: 'Codec' },
  
  // Language switcher
  'lang.switch': { tr: 'Dili Değiştir', en: 'Switch Language' },
  'lang.tr': { tr: 'Türkçe', en: 'Türkçe' },
  'lang.en': { tr: 'İngilizce', en: 'English' },
  'lang.auto': { tr: 'Otomatik', en: 'Auto' },
  
  // Authentication
  'auth.login': { tr: 'Giriş Yap', en: 'Login' },
  'auth.logout': { tr: 'Çıkış Yap', en: 'Logout' },
  'auth.username': { tr: 'Kullanıcı Adı', en: 'Username' },
  'auth.password': { tr: 'Şifre', en: 'Password' },
  'auth.remember': { tr: 'Beni Hatırla', en: 'Remember Me' },
  'auth.forgot': { tr: 'Şifremi Unuttum', en: 'Forgot Password' },
  'auth.invalid': { tr: 'Geçersiz kullanıcı adı veya şifre', en: 'Invalid username or password' },
  'auth.required': { tr: 'Bu alan zorunludur', en: 'This field is required' },
  
  // Projects
  'project.title': { tr: 'Projeler', en: 'Projects' },
  'project.new': { tr: 'Yeni Proje', en: 'New Project' },
  'project.create': { tr: 'Proje Oluştur', en: 'Create Project' },
  'project.edit': { tr: 'Projeyi Düzenle', en: 'Edit Project' },
  'project.delete': { tr: 'Projeyi Sil', en: 'Delete Project' },
  'project.deleteConfirm': { tr: 'Bu projeyi silmek istediğinizden emin misiniz?', en: 'Are you sure you want to delete this project?' },
  'project.name': { tr: 'Proje Adı', en: 'Project Name' },
  'project.description': { tr: 'Proje Açıklaması', en: 'Project Description' },
  'project.settings': { tr: 'Proje Ayarları', en: 'Project Settings' },
  'project.info': { tr: 'Proje Bilgileri', en: 'Project Info' },
  'project.statistics': { tr: 'Proje İstatistikleri', en: 'Project Statistics' },
  
  // Assets
  'asset.title': { tr: 'Varlıklar', en: 'Assets' },
  'asset.new': { tr: 'Yeni Varlık', en: 'New Asset' },
  'asset.upload': { tr: 'Varlık Yükle', en: 'Upload Asset' },
  'asset.image': { tr: 'Görsel', en: 'Image' },
  'asset.audio': { tr: 'Ses', en: 'Audio' },
  'asset.video': { tr: 'Video', en: 'Video' },
  'asset.generate': { tr: 'Varlık Oluştur', en: 'Generate Asset' },
  'asset.generating': { tr: 'Varlık Oluşturuluyor...', en: 'Generating Asset...' },
  'asset.download': { tr: 'Varlığı İndir', en: 'Download Asset' },
  
  // Script
  'script.title': { tr: 'Senaryo', en: 'Script' },
  'script.new': { tr: 'Yeni Senaryo', en: 'New Script' },
  'script.import': { tr: 'Senaryo İçe Aktar', en: 'Import Script' },
  'script.export': { tr: 'Senaryo Dışa Aktar', en: 'Export Script' },
  'script.edit': { tr: 'Senaryo Düzenle', en: 'Edit Script' },
  'script.scene': { tr: 'Sahne', en: 'Scene' },
  'script.dialogue': { tr: 'Diyalog', en: 'Dialogue' },
  'script.action': { tr: 'Eylem', en: 'Action' },
  'script.character': { tr: 'Karakter', en: 'Character' },
  
  // Production
  'production.title': { tr: 'Üretim', en: 'Production' },
  'production.storyboard': { tr: 'Storyboard', en: 'Storyboard' },
  'production.workbench': { tr: 'Çalışma Tezgahı', en: 'Workbench' },
  'production.flow': { tr: 'Akış', en: 'Flow' },
  'production.video': { tr: 'Video', en: 'Video' },
  'production.generate': { tr: 'Video Oluştur', en: 'Generate Video' },
  'production.preview': { tr: 'Video Önizle', en: 'Preview Video' },
  'production.addTrack': { tr: 'Parça Ekle', en: 'Add Track' },
  
  // Novel
  'novel.title': { tr: 'Roman', en: 'Novel' },
  'novel.new': { tr: 'Yeni Roman', en: 'New Novel' },
  'novel.chapter': { tr: 'Bölüm', en: 'Chapter' },
  'novel.event': { tr: 'Olay', en: 'Event' },
  
  // Art Style
  'artstyle.title': { tr: 'Sanat Stili', en: 'Art Style' },
  'artstyle.new': { tr: 'Yeni Stil', en: 'New Style' },
  'artstyle.prompt': { tr: 'Stil Açıklaması', en: 'Style Prompt' },
  
  // Settings
  'settings.title': { tr: 'Ayarlar', en: 'Settings' },
  'settings.general': { tr: 'Genel', en: 'General' },
  'settings.models': { tr: 'Modeller', en: 'Models' },
  'settings.vendor': { tr: 'Sağlayıcılar', en: 'Vendors' },
  'settings.database': { tr: 'Veritabanı', en: 'Database' },
  'settings.memory': { tr: 'Hafıza', en: 'Memory' },
  'skills.title': { tr: 'Yetenekler', en: 'Skills' },
  'settings.about': { tr: 'Hakkında', en: 'About' },
  'settings.version': { tr: 'Versiyon', en: 'Version' },
  'settings.update': { tr: 'Güncelleme Kontrolü', en: 'Check for Updates' },
  'settings.language': { tr: 'Dil', en: 'Language' },
  'settings.theme': { tr: 'Tema', en: 'Theme' },
  
  // Models
  'model.title': { tr: 'Modeller', en: 'Models' },
  'model.text': { tr: 'Metin Modelleri', en: 'Text Models' },
  'model.image': { tr: 'Görsel Modelleri', en: 'Image Models' },
  'model.video': { tr: 'Video Modelleri', en: 'Video Models' },
  'model.select': { tr: 'Model Seç', en: 'Select Model' },
  'model.test': { tr: 'Model Test Et', en: 'Test Model' },
  
  // Tasks
  'task.title': { tr: 'Görevler', en: 'Tasks' },
  'task.pending': { tr: 'Bekliyor', en: 'Pending' },
  'task.processing': { tr: 'İşleniyor', en: 'Processing' },
  'task.completed': { tr: 'Tamamlandı', en: 'Completed' },
  'task.failed': { tr: 'Başarısız', en: 'Failed' },
  'task.cancelled': { tr: 'İptal Edildi', en: 'Cancelled' },
  
  // Errors
  'error.generic': { tr: 'Bir hata oluştu', en: 'An error occurred' },
  'error.network': { tr: 'Ağ hatası oluştu', en: 'Network error occurred' },
  'error.timeout': { tr: 'İstek zaman aşımına uğradı', en: 'Request timed out' },
  'error.notfound': { tr: 'Kaynak bulunamadı', en: 'Resource not found' },
  'error.unauthorized': { tr: 'Yetkisiz erişim', en: 'Unauthorized access' },
  'error.forbidden': { tr: 'Erişim reddedildi', en: 'Access forbidden' },
  'error.server': { tr: 'Sunucu hatası', en: 'Server error' },
  'error.validation': { tr: 'Doğrulama hatası', en: 'Validation error' },
  
  // Success messages
  'success.saved': { tr: 'Kaydedildi', en: 'Saved' },
  'success.deleted': { tr: 'Silindi', en: 'Deleted' },
  'success.updated': { tr: 'Güncellendi', en: 'Updated' },
  'success.created': { tr: 'Oluşturuldu', en: 'Created' },
  'success.copied': { tr: 'Kopyalandı', en: 'Copied' },
  'success.imported': { tr: 'İçe Aktarıldı', en: 'Imported' },
  'success.exported': { tr: 'Dışa Aktarıldı', en: 'Exported' },
  
  // Dashboard
  'dashboard.title': { tr: 'Kontrol Paneli', en: 'Dashboard' },
  'dashboard.overview': { tr: 'Genel Bakış', en: 'Overview' },
  'dashboard.recent': { tr: 'Son Projeler', en: 'Recent Projects' },
  'dashboard.stats': { tr: 'İstatistikler', en: 'Statistics' },
  'dashboard.activity': { tr: 'Etkinlik', en: 'Activity' },
  
  // Panels
  'panel.properties': { tr: 'Özellikler', en: 'Properties' },
  'panel.layers': { tr: 'Katmanlar', en: 'Layers' },
  'panel.timeline': { tr: 'Zaman Çizelgesi', en: 'Timeline' },
  'panel.tools': { tr: 'Araçlar', en: 'Tools' },
  'panel.library': { tr: 'Kütüphane', en: 'Library' },
  'panel.history': { tr: 'Geçmiş', en: 'History' },
  
  // Prompts
  'prompt.title': { tr: 'İstekler', en: 'Prompts' },
  'prompt.manage': { tr: 'İstek Yönetimi', en: 'Manage Prompts' },
  'prompt.template': { tr: 'Şablon', en: 'Template' },
  'prompt.custom': { tr: 'Özel İstek', en: 'Custom Prompt' },
  
  // File Management
  'file.open': { tr: 'Dosya Aç', en: 'Open File' },
  'file.save': { tr: 'Dosyayı Kaydet', en: 'Save File' },
  'file.folder': { tr: 'Klasörü Aç', en: 'Open Folder' },
  'file.location': { tr: 'Dosya Konumu', en: 'File Location' },
};

/**
 * Translation function
 * @param key - Translation key (e.g., 'nav.home')
 * @param lang - Language code ('tr' or 'en')
 * @param vars - Variables for interpolation (optional)
 * @returns Translated string
 */
export const t = (
  key: string,
  lang?: Lang,
  vars?: Record<string, string | number>
): string => {
  const currentLang = lang || getCurrentLang();
  const translation = DICT[key];

  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key; // Return key as fallback
  }

  let result = translation[currentLang] || translation.tr; // Fallback to TR

  // Variable interpolation
  if (vars) {
    Object.entries(vars).forEach(([varKey, value]) => {
      result = result.replace(`{${varKey}}`, String(value));
    });
  }

  return result;
};

/**
 * Simple hook that provides current language and translation function
 */
export const useT = () => {
  const lang = getCurrentLang() as 'tr' | 'en';

  return {
    lang,
    setLang,
    t: (key: string, vars?: Record<string, string | number>) => t(key, lang, vars),
  };
};

/**
 * Type alias for Lang
 */
export type Lang = 'tr' | 'en';