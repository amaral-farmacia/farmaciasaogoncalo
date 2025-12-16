import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import PDV from "./components/PDV";
import Produtos from "./components/Produtos";
import Clientes from "./components/Clientes";
import Promocoes from "./components/Promocoes";
import Relatorios from "./components/Relatorios";
import Usuarios from "./components/Usuarios";
import NotasFiscais from "./components/NotasFiscais";
import Boletos from "./components/Boletos";
import FechamentoCaixa from "./components/FechamentoCaixa";
import EntradaMercadorias from "./components/EntradaMercadorias";
import TransferenciaProdutos from "./components/TransferenciaProdutos";
import DashboardUnidades from "./components/DashboardUnidades";
import RelatorioLucro from "./components/RelatorioLucro";
import DRE from "./components/DRE";
import FiadosVencidos from "./components/FiadosVencidos";
import Sidebar from "./components/Sidebar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Setup axios defaults
axios.defaults.baseURL = API;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('/auth/login', { username, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      toast.success(`Bem-vindo, ${userData.full_name}!`);
      return true;
    } catch (error) {
      toast.error('Credenciais inválidas');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logout realizado com sucesso');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        {!user ? (
          <Routes>
            <Route path="/login" element={<Login onLogin={login} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        ) : (
          <div className="flex h-screen bg-gray-50">
            <Sidebar user={user} onLogout={logout} />
            <div className="flex-1 overflow-auto">
              <Routes>
                {user.role === 'admin' ? (
                  <Route path="/" element={<Dashboard user={user} />} />
                ) : (
                  <Route path="/" element={<PDV user={user} />} />
                )}
                <Route path="/pdv" element={<PDV user={user} />} />
                <Route path="/produtos" element={<Produtos user={user} />} />
                <Route path="/clientes" element={<Clientes user={user} />} />
                <Route path="/promocoes" element={<Promocoes user={user} />} />
                <Route path="/boletos" element={<Boletos user={user} />} />
                <Route path="/fechamento" element={<FechamentoCaixa user={user} />} />
                <Route path="/entrada-mercadorias" element={<EntradaMercadorias user={user} />} />
                <Route path="/transferencias" element={<TransferenciaProdutos user={user} />} />
                {user.role === 'admin' && (
                  <>
                    <Route path="/relatorios" element={<Relatorios user={user} />} />
                    <Route path="/relatorio-lucro" element={<RelatorioLucro user={user} />} />
                    <Route path="/dashboard-unidades" element={<DashboardUnidades user={user} />} />
                    <Route path="/usuarios" element={<Usuarios user={user} />} />
                    <Route path="/notas-fiscais" element={<NotasFiscais user={user} />} />
                    <Route path="/dre" element={<DRE user={user} />} />
                    <Route path="/fiados-vencidos" element={<FiadosVencidos user={user} />} />
                  </>
                )}
                {/* Relatório de lucro para colaboradores também */}
                <Route path="/relatorio-lucro" element={<RelatorioLucro user={user} />} />
                <Route path="*" element={<Navigate to={user.role === 'admin' ? "/" : "/pdv"} />} />
              </Routes>
            </div>
          </div>
        )}
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default App;