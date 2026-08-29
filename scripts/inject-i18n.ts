/**
 * Inject i18n functionality into the existing web UI
 * This script modifies the index.html to include internationalization support
 */

import fs from 'fs';
import path from 'path';

const WEB_DIR = path.resolve(process.cwd(), 'data', 'web');
const INDEX_HTML = path.join(WEB_DIR, 'index.html');
const BACKUP_HTML = path.join(WEB_DIR, 'index.html.backup');

// Import the i18n client functions
const { generateI18nScript, generateLangSwitchHTML } = require('../src/lib/i18n-client');

// Generate the scripts
const clientScriptJS = generateI18nScript();
const langSwitchHTML = generateLangSwitchHTML();

/**
 * Inject i18n into index.html
 */
async function injectI18n(): Promise<void> {
  console.log('🌍 Injecting i18n system into web UI...');

  // Check if web directory exists
  if (!fs.existsSync(WEB_DIR)) {
    console.error('❌ Web directory not found:', WEB_DIR);
    process.exit(1);
  }

  // Check if index.html exists
  if (!fs.existsSync(INDEX_HTML)) {
    console.error('❌ index.html not found:', INDEX_HTML);
    process.exit(1);
  }

  // Create backup
  if (!fs.existsSync(BACKUP_HTML)) {
    console.log('📦 Creating backup of original index.html...');
    fs.copyFileSync(INDEX_HTML, BACKUP_HTML);
  }

  // Read the current index.html
  let htmlContent = fs.readFileSync(INDEX_HTML, 'utf8');

  // Check if already injected
  if (htmlContent.includes('i18n system initialized')) {
    console.log('✅ i18n system already injected. Skipping.');
    return;
  }

  // Inject the i18n script
  console.log('📝 Injecting i18n client script...');
  htmlContent = htmlContent.replace('</head>', clientScriptJS + '</head>');

  // Inject the language switcher
  console.log('📝 Injecting language switcher...');
  htmlContent = htmlContent.replace('</body>', langSwitchHTML + '</body>');

  // Write the modified content
  fs.writeFileSync(INDEX_HTML, htmlContent, 'utf8');

  console.log('✅ i18n system successfully injected!');
  console.log(`📁 Modified file: ${INDEX_HTML}`);
  console.log(`📁 Backup file: ${BACKUP_HTML}`);
}

// Run the injection
injectI18n().catch(error => {
  console.error('❌ Error during i18n injection:', error);
  process.exit(1);
});