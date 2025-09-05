import { main } from './server-core.js';

/**
 * Run if executed directly (robust ESM check across platforms)
 */
void main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
