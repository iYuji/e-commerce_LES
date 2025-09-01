import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { ensureSeed } from './store/index';
import Layout from './components/Layout';

// Pages
import Catalogo from "./pages/Catalogo";
import CardDetail from "./pages/CardDetail";
import Carrinho from './pages/Carrinho';
import Checkout from './pages/Checkout';
import MinhaConta from './pages/MinhaConta';
import MeusPedidos from './pages/MeusPedidos';
import Trocas from './pages/Trocas';
import Cupons from './pages/Cupons';
import Assistente from './pages/Assistente';
import Auth from './pages/Auth';

// Admin Pages
import AdminCartas from './pages/admin/AdminCartas';
import AdminClientes from './pages/admin/AdminClientes';
import AdminVendas from './pages/admin/AdminVendas';
import AdminTrocas from './pages/admin/AdminTrocas';
import AdminEstoque from './pages/admin/AdminEstoque';
import AdminRelatorios from './pages/admin/AdminRelatorios';

function App() {
  useEffect(() => {
    ensureSeed();
  }, []);

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/catalogo" replace />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/card/:id" element={<CardDetail />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/minha-conta" element={<MinhaConta />} />
            <Route path="/meus-pedidos" element={<MeusPedidos />} />
            <Route path="/trocas" element={<Trocas />} />
            <Route path="/cupons" element={<Cupons />} />
            <Route path="/assistente" element={<Assistente />} />
            
            {/* Admin Routes */}
            <Route path="/admin/cartas" element={<AdminCartas />} />
            <Route path="/admin/clientes" element={<AdminClientes />} />
            <Route path="/admin/vendas" element={<AdminVendas />} />
            <Route path="/admin/trocas" element={<AdminTrocas />} />
            <Route path="/admin/estoque" element={<AdminEstoque />} />
            <Route path="/admin/relatorios" element={<AdminRelatorios />} />
          </Routes>
        </Layout>
      </Box>
    </Router>
  );
}

export default App;
