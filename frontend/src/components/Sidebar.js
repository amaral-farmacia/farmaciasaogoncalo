import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package,
  Users,
  LogOut,
  Cross,
  User,
  Percent,
  BarChart3,
  FileText,
  Receipt,
  Calculator,
  PackagePlus,
  ArrowRightLeft,
  Building2,
  TrendingUp,
  ClipboardList,
  AlertTriangle
} from "lucide-react";

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();

  const menuItems = [
    ...(user.role === 'admin' ? [
      { path: "/", icon: LayoutDashboard, label: "Dashboard" }
    ] : []),
    { path: "/pdv", icon: ShoppingCart, label: "PDV (Vendas)" },
    { path: "/produtos", icon: Package, label: "Produtos" },
    { path: "/entrada-mercadorias", icon: PackagePlus, label: "Entrada de Mercadorias" },
    { path: "/transferencias", icon: ArrowRightLeft, label: "Transferências" },
    { path: "/clientes", icon: Users, label: "Clientes" },
    { path: "/promocoes", icon: Percent, label: "Promoções" },
    ...(user.role === 'admin' ? [
      { path: "/relatorios", icon: BarChart3, label: "Relatórios" },
      { path: "/dashboard-unidades", icon: Building2, label: "Dashboard Unidades" }
    ] : []),
    { path: "/relatorio-lucro", icon: TrendingUp, label: "Relatório de Lucro" },
    { path: "/boletos", icon: Receipt, label: "Boletos" },
    { path: "/fechamento", icon: Calculator, label: "Fechamento" },
    ...(user.role === 'admin' ? [
      { path: "/dre", icon: ClipboardList, label: "DRE" },
      { path: "/fiados-vencidos", icon: AlertTriangle, label: "Fiados Vencidos" },
      { path: "/usuarios", icon: User, label: "Usuários" },
      { path: "/notas-fiscais", icon: FileText, label: "NFe" }
    ] : [])
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-lg shadow-md p-1 flex items-center justify-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_medrx-system-5/artifacts/xbj0hm2x_logo%20farmacia.jpeg" 
              alt="Farmácia São Gonçalo"
              className="w-full h-full object-contain rounded-md"
            />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">São Gonçalo</h2>
            <p className="text-sm text-gray-500">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive(item.path) ? "default" : "ghost"}
                className={`w-full justify-start h-12 ${
                  isActive(item.path)
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.full_name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user.role}
            </p>
          </div>
        </div>
        
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;