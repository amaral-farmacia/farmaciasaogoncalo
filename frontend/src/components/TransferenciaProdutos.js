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
  ArrowRightLeft,
  Plus,
  Package,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Search
} from "lucide-react";
import { toast } from "sonner";

const TransferenciaProdutos = ({ user }) => {
  const [transferencias, setTransferencias] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [formData, setFormData] = useState({
    produto_id: "",
    unidade_destino_id: "",
    quantidade: "",
    observacoes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transferenciasRes, produtosRes, unidadesRes] = await Promise.all([
        axios.get('/transferencias'),
        axios.get('/produtos'),
        axios.get('/unidades')
      ]);
      
      setTransferencias(transferenciasRes.data);
      setProdutos(produtosRes.data);
      setUnidades(unidadesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const produtoSelecionado = produtos.find(p => p.id === formData.produto_id);
      
      if (!produtoSelecionado) {
        toast.error('Produto não encontrado');
        return;
      }
      
      if (parseInt(formData.quantidade) > produtoSelecionado.quantidade) {
        toast.error('Quantidade insuficiente em estoque');
        return;
      }
      
      const transferData = {
        ...formData,
        quantidade: parseInt(formData.quantidade)
      };
      
      await axios.post('/transferencias', transferData);
      toast.success('Transferência solicitada com sucesso');
      
      setFormData({
        produto_id: "",
        unidade_destino_id: "",
        quantidade: "",
        observacoes: ""
      });
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar transferência');
    }
  };

  const confirmarTransferencia = async (id) => {
    try {
      await axios.put(`/transferencias/${id}/confirmar`);
      toast.success('Transferência confirmada');
      fetchData();
    } catch (error) {
      toast.error('Erro ao confirmar transferência');
    }
  };

  const receberTransferencia = async (id) => {
    try {
      await axios.put(`/transferencias/${id}/receber`);
      toast.success('Transferência recebida com sucesso! Produto adicionado ao estoque.');
      fetchData();
    } catch (error) {
      toast.error('Erro ao receber transferência');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'em_transito': return 'bg-blue-100 text-blue-800';
      case 'confirmada': return 'bg-orange-100 text-orange-800';
      case 'recebida': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pendente': return <Clock className="h-4 w-4" />;
      case 'em_transito': return <ArrowRightLeft className="h-4 w-4" />;
      case 'confirmada': return <Package className="h-4 w-4" />;
      case 'recebida': return <CheckCircle className="h-4 w-4" />;
      case 'cancelada': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_transito': return 'Em Trânsito';
      case 'confirmada': return 'Aguardando Recebimento';
      case 'recebida': return 'Recebida';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredTransferencias = transferencias.filter(t => {
    const matchesSearch = t.produto_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.unidade_origem_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.unidade_destino_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filtroStatus === 'todas' || t.status === filtroStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transferência de Produtos</h1>
          <p className="text-gray-600">Gerencie transferências entre unidades</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Nova Transferência
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Transferência</DialogTitle>
              <DialogDescription>
                Solicitar transferência de produto entre unidades
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="produto_id">Produto *</Label>
                <Select value={formData.produto_id} onValueChange={(value) => setFormData({...formData, produto_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.nome} (Estoque: {produto.quantidade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unidade_destino_id">Unidade Destino *</Label>
                <Select value={formData.unidade_destino_id} onValueChange={(value) => setFormData({...formData, unidade_destino_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.filter(u => u.id !== user.unidade_id).map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.nome} - {unidade.endereco}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade *</Label>
                <Input
                  id="quantidade"
                  type="number"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                  placeholder="0"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Observações sobre a transferência"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Solicitar Transferência
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-5 w-5 text-gray-500" />
              <Input
                placeholder="Buscar por produto ou unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_transito">Em Trânsito</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            
            <Badge variant="outline">
              {filteredTransferencias.length} transferência(s)
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{transferencias.length}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pendentes</p>
                <p className="text-2xl font-bold">
                  {transferencias.filter(t => t.status === 'pendente').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Confirmadas</p>
                <p className="text-2xl font-bold">
                  {transferencias.filter(t => t.status === 'confirmada').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Este Mês</p>
                <p className="text-2xl font-bold">
                  {transferencias.filter(t => 
                    new Date(t.created_at).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transferencias Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTransferencias.map((transferencia) => (
          <Card key={transferencia.id} className="shadow-lg border-0 hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg text-gray-900">{transferencia.produto_nome}</CardTitle>
                <Badge className={getStatusColor(transferencia.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(transferencia.status)}
                    {transferencia.status}
                  </div>
                </Badge>
              </div>
              <CardDescription>
                {transferencia.quantidade} unidade(s)
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Origem e Destino */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Origem:</span>
                  <span className="text-sm text-gray-600">{transferencia.unidade_origem_nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Destino:</span>
                  <span className="text-sm text-gray-600">{transferencia.unidade_destino_nome}</span>
                </div>
              </div>
              
              {/* Data */}
              <div className="text-sm text-gray-600">
                <span className="font-medium">Solicitado em:</span> {formatDate(transferencia.created_at)}
              </div>
              
              {/* Observações */}
              {transferencia.observacoes && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Obs:</span> {transferencia.observacoes}
                </div>
              )}
              
              {/* Ações */}
              <div className="flex gap-2 pt-2">
                {transferencia.status === 'pendente' && user.role === 'admin' && (
                  <Button
                    onClick={() => confirmarTransferencia(transferencia.id)}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar
                  </Button>
                )}
                
                {transferencia.status === 'confirmada' && transferencia.unidade_destino_id === user.unidade_id && (
                  <Button
                    onClick={() => receberTransferencia(transferencia.id)}
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Receber
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-10 h-8 p-0"
                  onClick={() => toast.info('Detalhes em desenvolvimento')}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTransferencias.length === 0 && !loading && (
        <div className="text-center py-12">
          <ArrowRightLeft className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || filtroStatus !== 'todas' ? 'Nenhuma transferência encontrada' : 'Nenhuma transferência registrada'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filtroStatus !== 'todas' ? 'Tente ajustar os filtros de busca' : 'Crie a primeira transferência para começar'}
          </p>
          {!searchTerm && filtroStatus === 'todas' && (
            <Button 
              onClick={() => setDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Transferência
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default TransferenciaProdutos;