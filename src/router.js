import { render } from './utils.js';
import { setSession } from './store.js';

const routes = new Map();

export function route(path, handler) { routes.set(path, handler); }

export function parseHash() {
  const h = location.hash.replace(/^#/, '') || '/catalogo';
  const [pathname, rawQuery] = h.split('?');
  const segments = pathname.split('/').filter(Boolean);
  return { pathname: '/' + segments.join('/'), segments, query: Object.fromEntries(new URLSearchParams(rawQuery || '')) };
}

export function navigate(path) { location.hash = path; }

export function startRouter(cardDetailHandler, notFoundHandler) {
  function dispatch() {
    const { pathname, segments, query } = parseHash();
    if (segments[0] === 'carta' && segments[1]) return cardDetailHandler(segments[1]);
  if (pathname === '/logout') { setSession({ userId: null }); navigate('#/auth'); return; }
    const handler = routes.get(pathname) || notFoundHandler;
    handler({ segments, query });
  }
  window.addEventListener('hashchange', dispatch);
  dispatch();
}

export { render };
