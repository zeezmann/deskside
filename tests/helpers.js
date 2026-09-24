import { pathToFileURL } from 'node:url';
import path from 'node:path';

export const TOOLKIT = pathToFileURL(
  path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'index.html')
).href;

/**
 * The toolkit is meant to work with the network unplugged. Any request that is
 * not file:// or blob:// means something external crept in, which would break
 * it on a machine with no internet and is the one regression that matters most.
 */
export function guardOffline(page, sink) {
  page.on('request', r => {
    const u = r.url();
    if (!u.startsWith('file:') && !u.startsWith('blob:') && !u.startsWith('data:')) {
      sink.push('external request: ' + u);
    }
  });
  page.on('pageerror', e => sink.push('page error: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') sink.push('console error: ' + m.text()); });
}

export async function open(page, sink) {
  guardOffline(page, sink);
  await page.goto(TOOLKIT);
  // Top-level const does not attach to window, so check the binding itself.
  await page.waitForFunction(() => typeof SCRIPTS !== 'undefined' && document.querySelector('.nav button'));
}
