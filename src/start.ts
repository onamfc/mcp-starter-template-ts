import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { main } from './server-core.js';

/**
 * Run if executed directly (robust ESM check across platforms)
 */
const isMain = (() => {
  try {
    if (!process.argv[1]) return false; // not launched directly
    const thisFile = fileURLToPath(import.meta.url);
    const invoked = path.resolve(process.argv[1]);
    return path.resolve(thisFile) === invoked;
  } catch {
    return false;
  }
})();

if (isMain) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
