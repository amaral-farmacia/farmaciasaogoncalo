import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  Users, 
  Plus, 
  Edit,
  Trash2,
  Key,
  Shield,
  UserCheck,
  Eye,
  EyeOff,
  Settings
} from "lucide-react";
import { toast } from "sonner";

const Usuarios = ({ user }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [senhaDialogOpen, setSenhaDialogOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [mostrarSenhas, setMostrarSenhas] = useState({});
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "colaborador",
    unidade_id: ""
  });
  const [senhaData, setSenhaData] = useState({
    nova_senha: "",
    confirmar_senha: ""
  });

  useEffect(() => {
    if (user.role !== 'admin') {
      toast.error('Acesso negado. Apenas administradores podem gerenciar usuários.');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usuariosRes, unidadesRes] = await Promise.all([
        axios.get('/usuarios'),
        axios.get('/unidades')
      ]);
      setUsuarios(usuariosRes.data);
      setUnidades(unidadesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/usuarios', formData);
      toast.success('Usuário criado com sucesso');
      
      setFormData({
        username: "",
        password: "",
        full_name: "",
        role: "colaborador"
      });
      setDialogOpen(false);
      fetchUsuarios();
    } catch (error) {
      toast.error('Erro ao criar usuário');
    }
  };

  const handleAlterarSenha = async (e) => {
    e.preventDefault();
    
    if (senhaData.nova_senha !== senhaData.confirmar_senha) {
      toast.error('Senhas não conferem');
      return;
    }

    if (senhaData.nova_senha.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    try {
      await axios.put(`/usuarios/${usuarioSelecionado.id}/senha`, {
        nova_senha: senhaData.nova_senha
      });
      
      toast.success('Senha alterada com sucesso');
      setSenhaDialogOpen(false);
      setUsuarioSelecionado(null);
      setSenhaData({ nova_senha: "", confirmar_senha: "" });
    } catch (error) {
      toast.error('Erro ao alterar senha');
    }
  };

  const toggleMostrarSenha = (userId) => {
    setMostrarSenhas(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const gerarSenhaAleatoria = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let senha = '';
    for (let i = 0; i < 8; i++) {
      senha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSenhaData({ nova_senha: senha, confirmar_senha: senha });
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  const getRoleLabel = (role) => {
    return role === 'admin' ? 'Administrador' : 'Colaborador';
  };

  if (user.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Restrito</h2>
        <p className="text-gray-600">Apenas administradores podem acessar esta área.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Usuários</h1>
          <p className="text-gray-600">Administre usuários, senhas e permissões do sistema</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Adicione um novo usuário ao sistema
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Ex: maria.silva"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  placeholder="Ex: Maria Silva"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Função *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  Criar Usuário
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usuarios.map((usuario) => {
          const isCurrentUser = usuario.id === user.id;
          
          return (
            <Card key={usuario.id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-indigo-600" />
                    {usuario.full_name}
                    {isCurrentUser && <span className="text-sm text-emerald-600">(Você)</span>}
                  </CardTitle>
                  <Badge className={getRoleColor(usuario.role)}>
                    {getRoleLabel(usuario.role)}
                  </Badge>
                </div>
                <CardDescription>@{usuario.username}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Informações do Usuário */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Criado em:</span>
                      <span className="font-medium">{new Date(usuario.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                    </div>
                  </div>
                </div>
                
                {/* Senha Atual (Funcionalidade Administrativa) */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-blue-800">Senha Atual:</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMostrarSenha(usuario.id)}
                      className="h-6 w-6 p-0"
                    >
                      {mostrarSenhas[usuario.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="font-mono text-sm bg-white p-2 rounded border">
                    {mostrarSenhas[usuario.id] ? usuario.senha_display || '******' : '••••••••'}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {isCurrentUser ? 'Sua senha atual' : 'Senha do usuário (apenas para administração)'}
                  </p>
                </div>
                
                {/* Ações */}
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setUsuarioSelecionado(usuario);
                      setSenhaDialogOpen(true);
                    }}
                    variant="outline"
                    className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    {isCurrentUser ? 'Alterar Minha Senha' : 'Redefinir Senha'}
                  </Button>
                  
                  {!isCurrentUser && (
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja desativar este usuário?')) {
                          toast.info('Funcionalidade em desenvolvimento');
                        }
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Gerenciar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Alteração de Senha */}
      <Dialog open={senhaDialogOpen} onOpenChange={setSenhaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Alterar Senha
            </DialogTitle>
            <DialogDescription>
              {usuarioSelecionado && `Definir nova senha para ${usuarioSelecionado.full_name}`}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAlterarSenha} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nova_senha">Nova Senha *</Label>
              <Input
                id="nova_senha"
                type="password"
                value={senhaData.nova_senha}
                onChange={(e) => setSenhaData({...senhaData, nova_senha: e.target.value})}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmar_senha">Confirmar Senha *</Label>
              <Input
                id="confirmar_senha"
                type="password"
                value={senhaData.confirmar_senha}
                onChange={(e) => setSenhaData({...senhaData, confirmar_senha: e.target.value})}
                placeholder="Digite a senha novamente"
                required
              />
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={gerarSenhaAleatoria}
              className="w-full"
            >
              <Key className="mr-2 h-4 w-4" />
              Gerar Senha Aleatória
            </Button>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                Alterar Senha
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setSenhaDialogOpen(false);
                  setUsuarioSelecionado(null);
                  setSenhaData({ nova_senha: "", confirmar_senha: "" });
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Usuarios;