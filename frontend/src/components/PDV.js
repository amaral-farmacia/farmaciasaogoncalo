import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  DollarSign,
  Calculator,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  X
} from "lucide-react";
import { toast } from "sonner";

const PDV = ({ user }) => {
  const [carrinho, setCarrinho] = useState([]);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [loading, setLoading] = useState(false);
  const [buscandoProduto, setBuscandoProduto] = useState(false);
  const inputRef = useRef(null);
  
  // Clube de Vantagens
  const [descontoClube, setDescontoClube] = useState(null);
  const [verificandoClube, setVerificandoClube] = useState(false);
  
  // Impressão de Cupom
  const [showCupom, setShowCupom] = useState(false);
  const [dadosVenda, setDadosVenda] = useState(null);
  const cupomRef = useRef(null);

  useEffect(() => {
    fetchClientes();
    fetchProdutos();
    // Focus no input de código de barras
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Filtrar produtos baseado na busca
    if (codigoBarras.length > 0) {
      const filtrados = produtos.filter(produto => 
        produto.nome.toLowerCase().includes(codigoBarras.toLowerCase()) ||
        produto.codigo_barras.includes(codigoBarras)
      );
      setProdutosFiltrados(filtrados);
      setMostrarSugestoes(filtrados.length > 0);
    } else {
      setProdutosFiltrados([]);
      setMostrarSugestoes(false);
    }
  }, [codigoBarras, produtos]);

  const fetchProdutos = async () => {
    try {
      const response = await axios.get('/produtos');
      setProdutos(response.data);
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await axios.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    }
  };

  // Verificar desconto do Clube de Vantagens
  const verificarDescontoClube = async (clienteId) => {
    if (!clienteId) {
      setDescontoClube(null);
      return;
    }
    
    setVerificandoClube(true);
    try {
      const response = await axios.get(`/clube-vantagens/verificar-cliente/${clienteId}`);
      if (response.data.tem_desconto) {
        setDescontoClube(response.data);
        toast.success(`🎉 ${response.data.message}`, { duration: 4000 });
      } else {
        setDescontoClube(null);
      }
    } catch (error) {
      setDescontoClube(null);
    } finally {
      setVerificandoClube(false);
    }
  };

  // Quando cliente é selecionado, verificar Clube de Vantagens
  const handleClienteChange = (clienteId) => {
    setClienteSelecionado(clienteId);
    verificarDescontoClube(clienteId);
  };

  const buscarProduto = async () => {
    if (!codigoBarras.trim()) return;
    
    setBuscandoProduto(true);
    try {
      const response = await axios.get(`/produtos/buscar/${codigoBarras}`);
      const produto = response.data;
      adicionarProdutoCarrinho(produto);
    } catch (error) {
      toast.error('Produto não encontrado');
    } finally {
      setBuscandoProduto(false);
    }
  };

  const adicionarProdutoCarrinho = (produto) => {
    // Verificar se produto já está no carrinho
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
      if (itemExistente.quantidade < produto.quantidade) {
        setCarrinho(carrinho.map(item =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        ));
        toast.success('Quantidade atualizada no carrinho');
      } else {
        toast.error('Estoque insuficiente');
      }
    } else {
      if (produto.quantidade > 0) {
        setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
        toast.success('Produto adicionado ao carrinho');
      } else {
        toast.error('Produto sem estoque');
      }
    }
    
    setCodigoBarras("");
    setMostrarSugestoes(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const alterarQuantidade = (id, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerItem(id);
      return;
    }
    
    // Encontrar o produto original no estoque para verificar disponibilidade
    const produtoOriginal = produtos.find(p => p.id === id);
    if (!produtoOriginal) {
      toast.error('Produto não encontrado');
      return;
    }
    
    if (novaQuantidade > produtoOriginal.quantidade) {
      toast.error(`Quantidade solicitada (${novaQuantidade}) maior que o estoque disponível (${produtoOriginal.quantidade})`);
      return;
    }
    
    setCarrinho(carrinho.map(item =>
      item.id === id
        ? { ...item, quantidade: novaQuantidade }
        : item
    ));
    
    toast.success(`Quantidade alterada para ${novaQuantidade}`);
  };

  const removerItem = (id) => {
    setCarrinho(carrinho.filter(item => item.id !== id));
    toast.success('Item removido do carrinho');
  };

  const calcularSubtotal = () => {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  };

  const calcularDesconto = () => {
    if (descontoClube && descontoClube.tem_desconto) {
      return calcularSubtotal() * (descontoClube.percentual_desconto / 100);
    }
    return 0;
  };

  const calcularTotal = () => {
    return calcularSubtotal() - calcularDesconto();
  };

  const calcularTroco = () => {
    const total = calcularTotal();
    const pago = parseFloat(valorPago) || 0;
    return Math.max(0, pago - total);
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }
    
    if (!metodoPagamento) {
      toast.error('Selecione o método de pagamento');
      return;
    }
    
    if (metodoPagamento === 'fiado' && !clienteSelecionado) {
      toast.error('Selecione um cliente para venda fiada');
      return;
    }
    
    const total = calcularTotal();
    const pago = parseFloat(valorPago) || 0;
    
    if (metodoPagamento !== 'fiado' && pago < total) {
      toast.error('Valor pago insuficiente');
      return;
    }
    
    setLoading(true);
    try {
      const vendaData = {
        cliente_id: clienteSelecionado || null,
        items: carrinho.map(item => ({
          produto_id: item.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco
        })),
        metodo_pagamento: metodoPagamento,
        valor_pago: metodoPagamento === 'fiado' ? 0 : pago,
        desconto_clube: descontoClube ? calcularDesconto() : 0,
        subtotal: calcularSubtotal()
      };
      
      const response = await axios.post('/vendas', vendaData);
      
      // Preparar dados para o cupom
      const clienteNome = clienteSelecionado 
        ? clientes.find(c => c.id === clienteSelecionado)?.nome || "Cliente"
        : "Consumidor Final";
      
      const dadosCupom = {
        id: response.data?.id || Date.now().toString(),
        data: new Date(),
        items: carrinho.map(item => ({
          nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco,
          subtotal: item.preco * item.quantidade
        })),
        subtotal: calcularSubtotal(),
        desconto: descontoClube ? calcularDesconto() : 0,
        total: total,
        metodo_pagamento: metodoPagamento,
        valor_pago: pago,
        troco: calcularTroco(),
        cliente: clienteNome,
        vendedor: user.full_name
      };
      
      setDadosVenda(dadosCupom);
      setShowCupom(true);
      
      // Limpar carrinho e campos
      setCarrinho([]);
      setClienteSelecionado("");
      setMetodoPagamento("");
      setValorPago("");
      setDescontoClube(null);
      
      toast.success(`Venda realizada com sucesso! ${metodoPagamento !== 'fiado' ? `Troco: R$ ${calcularTroco().toFixed(2)}` : ''}`);
      
    } catch (error) {
      toast.error('Erro ao finalizar venda');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para imprimir o cupom
  const imprimirCupom = () => {
    const conteudoCupom = cupomRef.current;
    if (!conteudoCupom) return;
    
    const janela = window.open('', '_blank', 'width=300,height=600');
    janela.document.write(`
      <html>
        <head>
          <title>Cupom - Farmácia São Gonçalo</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 280px;
              margin: 0 auto;
              padding: 10px;
            }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h1 { font-size: 16px; margin: 0; }
            .header p { margin: 2px 0; font-size: 10px; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .item-name { flex: 1; }
            .item-qty { width: 40px; text-align: center; }
            .item-price { width: 70px; text-align: right; }
            .totals { margin-bottom: 10px; }
            .total-line { display: flex; justify-content: space-between; margin: 3px 0; }
            .total-final { font-weight: bold; font-size: 14px; border-top: 1px dashed #000; padding-top: 5px; }
            .footer { text-align: center; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
            @media print { body { width: 100%; } }
          </style>
        </head>
        <body>
          ${conteudoCupom.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    janela.document.close();
  };
  
  const fecharCupom = () => {
    setShowCupom(false);
    setDadosVenda(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'dinheiro': return <Banknote className="w-4 h-4" />;
      case 'pix': return <Smartphone className="w-4 h-4" />;
      case 'debito':
      case 'credito': return <CreditCard className="w-4 h-4" />;
      case 'fiado': return <User className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          PDV - Ponto de Venda
        </h1>
        <p className="text-gray-600">
          Realize vendas de forma rápida e eficiente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Busca de Produtos */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-cyan-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-emerald-600" />
                Buscar Produto
              </CardTitle>
              <CardDescription>
                Digite o código de barras ou nome do produto
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                <div className="flex gap-3">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Código de barras ou nome do produto"
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        buscarProduto();
                      }
                    }}
                    className="text-lg h-12"
                    disabled={buscandoProduto}
                  />
                  <Button
                    onClick={buscarProduto}
                    disabled={buscandoProduto || !codigoBarras.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6"
                  >
                    {buscandoProduto ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Sugestões de Produtos */}
                {mostrarSugestoes && (
                  <div className="absolute top-full left-0 right-12 z-10 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                    {produtosFiltrados.map((produto) => (
                      <div
                        key={produto.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => adicionarProdutoCarrinho(produto)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{produto.nome}</p>
                            <p className="text-sm text-gray-600">Código: {produto.codigo_barras}</p>
                            <p className="text-sm text-emerald-600">{formatCurrency(produto.preco)}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs">
                              {produto.quantidade} un.
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Carrinho */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                Carrinho de Compras ({carrinho.length} itens)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {carrinho.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Carrinho vazio</p>
                  <p className="text-sm">Escaneie um produto para começar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {carrinho.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.nome}</h3>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(item.preco)} x {item.quantidade} = {formatCurrency(item.preco * item.quantidade)}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          Disponível: {produtos.find(p => p.id === item.id)?.quantidade || 0} un.
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {/* Controles de Quantidade */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => alterarQuantidade(item.id, Math.max(1, item.quantidade - 1))}
                            className="w-8 h-8 p-0"
                            disabled={item.quantidade <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <Input
                            type="number"
                            min="1"
                            max={produtos.find(p => p.id === item.id)?.quantidade || 1}
                            value={item.quantidade}
                            onChange={(e) => {
                              const novaQtd = parseInt(e.target.value) || 1;
                              if (novaQtd >= 1) {
                                alterarQuantidade(item.id, novaQtd);
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.target.blur();
                              }
                            }}
                            className="w-16 h-8 text-center font-medium text-sm border-gray-300"
                            title="Digite a quantidade ou use as setas"
                          />
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                            className="w-8 h-8 p-0"
                            disabled={item.quantidade >= (produtos.find(p => p.id === item.id)?.quantidade || 0)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Botões Rápidos */}
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => alterarQuantidade(item.id, Math.min(item.quantidade + 5, produtos.find(p => p.id === item.id)?.quantidade || 0))}
                            className="h-6 px-2 text-xs"
                            disabled={item.quantidade >= (produtos.find(p => p.id === item.id)?.quantidade || 0)}
                            title="Adicionar 5 unidades"
                          >
                            +5
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => alterarQuantidade(item.id, Math.min(item.quantidade + 10, produtos.find(p => p.id === item.id)?.quantidade || 0))}
                            className="h-6 px-2 text-xs"
                            disabled={item.quantidade >= (produtos.find(p => p.id === item.id)?.quantidade || 0)}
                            title="Adicionar 10 unidades"
                          >
                            +10
                          </Button>
                        </div>
                        
                        {/* Botão de remover */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removerItem(item.id)}
                          className="w-8 h-8 p-0 mt-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Finalização */}
        <div className="space-y-6">
          <Card className="shadow-lg border-0 sticky top-6">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-gray-700" />
                Finalizar Venda
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Total */}
              <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 rounded-lg border border-emerald-200">
                {descontoClube && descontoClube.tem_desconto ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calcularSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span>Desconto Clube ({descontoClube.percentual_desconto}%):</span>
                      <span>-{formatCurrency(calcularDesconto())}</span>
                    </div>
                    <div className="border-t border-emerald-200 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-700 font-medium">Total:</span>
                        <span className="text-2xl font-bold text-emerald-900">
                          {formatCurrency(calcularTotal())}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-emerald-700 mb-1">Total da Venda</p>
                    <p className="text-3xl font-bold text-emerald-900">
                      {formatCurrency(calcularTotal())}
                    </p>
                  </div>
                )}
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Cliente (opcional)
                </label>
                <Select value={clienteSelecionado} onValueChange={handleClienteChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome} - {cliente.cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Indicador de verificação do Clube */}
                {verificandoClube && (
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    Verificando Clube de Vantagens...
                  </div>
                )}
                
                {/* Badge do Clube de Vantagens */}
                {descontoClube && descontoClube.tem_desconto && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-800">Clube de Vantagens</p>
                        <p className="text-xs text-yellow-700">
                          {descontoClube.cliente.nome} • #{descontoClube.posicao_ranking} no ranking
                        </p>
                      </div>
                      <Badge className="bg-green-500 text-white">
                        -{descontoClube.percentual_desconto}%
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Método de Pagamento */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Método de Pagamento *
                </label>
                <Select value={metodoPagamento} onValueChange={setMetodoPagamento}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4" />
                        Dinheiro
                      </div>
                    </SelectItem>
                    <SelectItem value="pix">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        PIX
                      </div>
                    </SelectItem>
                    <SelectItem value="debito">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Cartão Débito
                      </div>
                    </SelectItem>
                    <SelectItem value="credito">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Cartão Crédito
                      </div>
                    </SelectItem>
                    <SelectItem value="fiado">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Fiado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Valor Pago */}
              {metodoPagamento && metodoPagamento !== 'fiado' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Valor Pago
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                    className="text-lg h-12"
                  />
                  
                  {valorPago && calcularTroco() > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700">Troco:</p>
                      <p className="text-xl font-bold text-green-900">
                        {formatCurrency(calcularTroco())}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Botão Finalizar */}
              <Button
                onClick={finalizarVenda}
                disabled={loading || carrinho.length === 0}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    {metodoPagamento && getPaymentIcon(metodoPagamento)}
                    <span className="ml-2">Finalizar Venda</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Dialog de Impressão do Cupom */}
      <Dialog open={showCupom} onOpenChange={setShowCupom}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Venda Finalizada!
            </DialogTitle>
            <DialogDescription>
              Deseja imprimir o cupom para o cliente?
            </DialogDescription>
          </DialogHeader>
          
          {dadosVenda && (
            <div className="space-y-4">
              {/* Preview do Cupom */}
              <div 
                ref={cupomRef}
                className="bg-white border rounded-lg p-4 font-mono text-xs max-h-96 overflow-y-auto"
              >
                <div className="header text-center border-b border-dashed pb-2 mb-2">
                  <h1 className="font-bold text-sm">FARMÁCIA SÃO GONÇALO</h1>
                  <p className="text-[10px]">CNPJ: 12.345.678/0001-00</p>
                  <p className="text-[10px]">Rua Principal, 123 - Centro</p>
                  <p className="text-[10px]">Tel: (77) 99999-1111</p>
                </div>
                
                <div className="text-center mb-2">
                  <p className="text-[10px]">CUPOM NÃO FISCAL</p>
                  <p className="text-[10px]">
                    {dadosVenda.data.toLocaleDateString('pt-BR')} {dadosVenda.data.toLocaleTimeString('pt-BR')}
                  </p>
                </div>
                
                <div className="border-b border-dashed pb-2 mb-2">
                  <p className="text-[10px]">Cliente: {dadosVenda.cliente}</p>
                  <p className="text-[10px]">Vendedor: {dadosVenda.vendedor}</p>
                </div>
                
                <div className="items border-b border-dashed pb-2 mb-2">
                  <div className="flex justify-between font-bold mb-1">
                    <span className="flex-1">ITEM</span>
                    <span className="w-8 text-center">QTD</span>
                    <span className="w-16 text-right">VALOR</span>
                  </div>
                  {dadosVenda.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-0.5">
                      <span className="flex-1 truncate pr-1">{item.nome}</span>
                      <span className="w-8 text-center">{item.quantidade}</span>
                      <span className="w-16 text-right">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="totals space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(dadosVenda.subtotal)}</span>
                  </div>
                  {dadosVenda.desconto > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto Clube:</span>
                      <span>-{formatCurrency(dadosVenda.desconto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t border-dashed pt-1">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(dadosVenda.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pagamento:</span>
                    <span className="capitalize">{dadosVenda.metodo_pagamento}</span>
                  </div>
                  {dadosVenda.metodo_pagamento !== 'fiado' && (
                    <>
                      <div className="flex justify-between">
                        <span>Valor Pago:</span>
                        <span>{formatCurrency(dadosVenda.valor_pago)}</span>
                      </div>
                      {dadosVenda.troco > 0 && (
                        <div className="flex justify-between font-bold">
                          <span>Troco:</span>
                          <span>{formatCurrency(dadosVenda.troco)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="footer text-center border-t border-dashed pt-2 mt-2">
                  <p className="text-[10px]">Obrigado pela preferência!</p>
                  <p className="text-[10px]">Volte sempre!</p>
                  <p className="text-[10px] mt-1">********************************</p>
                </div>
              </div>
              
              {/* Botões de Ação */}
              <div className="flex gap-3">
                <Button
                  onClick={imprimirCupom}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Cupom
                </Button>
                <Button
                  variant="outline"
                  onClick={fecharCupom}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Não Imprimir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDV;