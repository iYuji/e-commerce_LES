import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Box } from "@mui/material";
import { ensureSeed } from "./store/index";
import Layout from "./components/Layout";
import Catalogo from "./pages/Catalogo";
import CardDetail from "./pages/CardDetail";
import Carrinho from "./pages/Carrinho";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import MinhaConta from "./pages/MinhaConta";
import MeusPedidos from "./pages/MeusPedidos";
import Trocas from "./pages/Trocas";
import Cupons from "./pages/Cupons";
import Assistente from "./pages/Assistente";
import AdminCartas from "./pages/admin/AdminCartas";
import AdminClientes from "./pages/admin/AdminClientes";
import AdminEstoque from "./pages/admin/AdminEstoque";
import AdminVendas from "./pages/admin/AdminVendas";
import AdminRelatorios from "./pages/admin/AdminRelatorios";
import AdminTrocas from "./pages/admin/AdminTrocas";

function App() {
  // Ensure initial data is seeded
  React.useEffect(() => {
    ensureSeed();
  }, []);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
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
            <Route path="/admin/cartas" element={<AdminCartas />} />
            <Route path="/admin/clientes" element={<AdminClientes />} />
            <Route path="/admin/estoque" element={<AdminEstoque />} />
            <Route path="/admin/vendas" element={<AdminVendas />} />
            <Route path="/admin/relatorios" element={<AdminRelatorios />} />
            <Route path="/admin/trocas" element={<AdminTrocas />} />
          </Routes>
        </Layout>
      </Box>
    </Router>
  );
}

export default App;
