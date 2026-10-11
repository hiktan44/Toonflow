import { spawnSync } from 'node:child_process';
import path from 'node:path';

const result = spawnSync(process.execPath, ['--experimental-strip-types', path.resolve(__dirname, 'prepare-web.mjs')], { stdio: 'inherit' });
if (result.error) console.error('Web arayüzü hazırlama aracı başlatılamadı.');
process.exit(result.status ?? 1);
