import { ensureSeed } from './store.js';
import { startRouter, route } from './router.js';
import { initTheme, updateAuthNav, updateCartNav, toggleTheme } from './theme.js';

// pages (user)
import { pageCatalogo } from './pages/user/catalogo.js';
import { pageCardDetail } from './pages/user/card-detail.js';
import { pageCarrinho } from './pages/user/carrinho.js';
import { pageCheckout } from './pages/user/checkout.js';
import { pageMinhaConta } from './pages/user/minha-conta.js';
import { pageMeusPedidos } from './pages/user/meus-pedidos.js';
import { pageTrocas } from './pages/user/trocas.js';
import { pageCupons } from './pages/user/cupons.js';
import { pageAssistente } from './pages/user/assistente.js';
import { pageNotFound } from './pages/user/not-found.js';
// pages (admin)
import { pageAdminCartas } from './pages/admin/cartas.js';
import { pageAdminClientes } from './pages/admin/clientes.js';
import { pageAdminVendas } from './pages/admin/vendas.js';
import { pageAdminTrocas } from './pages/admin/trocas.js';
import { pageAdminEstoque } from './pages/admin/estoque.js';
import { pageAdminRelatorios } from './pages/admin/relatorios.js';

// Initialize
ensureSeed();
initTheme();
updateAuthNav();
updateCartNav();

window.addEventListener('cart:change', () => updateCartNav());
window.addEventListener('session:change', () => updateAuthNav());

// Theme toggle
document.getElementById('btn-toggle-theme')?.addEventListener('click', toggleTheme);

// Routes
route('/catalogo', pageCatalogo);
route('/carrinho', pageCarrinho);
route('/checkout', pageCheckout);
route('/auth', pageAuth);
route('/minha-conta', authRequired(pageMinhaConta));
route('/meus-pedidos', authRequired(pageMeusPedidos));
route('/trocas', authRequired(pageTrocas));
route('/cupons', pageCupons);
route('/admin/cartas', pageAdminCartas);
route('/admin/clientes', pageAdminClientes);
route('/admin/vendas', pageAdminVendas);
route('/admin/trocas', pageAdminTrocas);
route('/admin/estoque', pageAdminEstoque);
route('/admin/relatorios', pageAdminRelatorios);
route('/assistente', pageAssistente);

// Start router
startRouter(pageCardDetail, pageNotFound);

// Simple auth wrappers (client-side only)
import { readStore, SESSION_KEY } from './store.js';
function isLogged() { const s = readStore(SESSION_KEY, { userId: null }); return !!s.userId; }
function authRequired(page) {
  return (ctx) => { if (!isLogged()) { location.hash = '#/auth'; return; } page(ctx); };
}
import { pageAuth } from './pages/auth.js';
