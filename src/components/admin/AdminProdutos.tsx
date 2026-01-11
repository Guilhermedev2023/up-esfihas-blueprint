import { useState } from 'react';
import { useProdutos, useUpdateProduto, useCreateProduto, Produto } from '@/hooks/useProdutos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Pencil, Search, Filter, AlertTriangle, Plus } from 'lucide-react';

const CATEGORIAS = [
  'Unitárias',
  'Combos 5un',
  'Combos 10un',
  'Doces Unitárias',
  'Doces Combos',
  'Bebidas'
];

const AdminProdutos = () => {
  const { data: produtos, isLoading, error } = useProdutos(true);
  const updateProduto = useUpdateProduto();
  const createProduto = useCreateProduto();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [produtoToDeactivate, setProdutoToDeactivate] = useState<Produto | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: '',
    descricao: '',
    preco: 0,
    ativo: true,
  });
  const [newProdutoForm, setNewProdutoForm] = useState({
    nome: '',
    descricao: '',
    preco: 0,
    categoria: '',
    imagem: '',
  });

  const handleAddProduto = async () => {
    if (!newProdutoForm.nome.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }
    if (!newProdutoForm.categoria) {
      toast.error('Selecione uma categoria');
      return;
    }
    if (newProdutoForm.preco <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }

    try {
      await createProduto.mutateAsync({
        nome: newProdutoForm.nome.trim(),
        descricao: newProdutoForm.descricao.trim() || null,
        preco: newProdutoForm.preco,
        categoria: newProdutoForm.categoria,
        imagem: newProdutoForm.imagem.trim() || null,
        ativo: true,
      });
      toast.success('Produto adicionado com sucesso!');
      setIsAddDialogOpen(false);
      setNewProdutoForm({
        nome: '',
        descricao: '',
        preco: 0,
        categoria: '',
        imagem: '',
      });
    } catch (error) {
      toast.error('Erro ao adicionar produto');
    }
  };

  const handleToggleAtivo = async (produto: Produto) => {
    // If deactivating, show confirmation dialog
    if (produto.ativo) {
      setProdutoToDeactivate(produto);
      return;
    }
    // If activating, proceed directly
    await confirmToggleAtivo(produto);
  };

  const confirmToggleAtivo = async (produto: Produto) => {
    try {
      await updateProduto.mutateAsync({
        id: produto.id,
        ativo: !produto.ativo,
      });
      toast.success(`${produto.nome} ${produto.ativo ? 'desativado' : 'ativado'} com sucesso! O cardápio foi atualizado.`);
      setProdutoToDeactivate(null);
    } catch (error) {
      toast.error('Erro ao atualizar produto');
    }
  };

  const openEditDialog = (produto: Produto) => {
    setEditingProduto(produto);
    setEditForm({
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: produto.preco,
      ativo: produto.ativo,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduto) return;

    try {
      await updateProduto.mutateAsync({
        id: editingProduto.id,
        nome: editForm.nome,
        descricao: editForm.descricao,
        preco: editForm.preco,
        ativo: editForm.ativo,
      });
      toast.success('Produto atualizado com sucesso');
      setEditingProduto(null);
    } catch (error) {
      toast.error('Erro ao atualizar produto');
    }
  };

  const filteredProdutos = produtos?.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || produto.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const allCategories = [...new Set([...CATEGORIAS, ...(produtos?.map(p => p.categoria) || [])])];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Erro ao carregar produtos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestão do Cardápio</CardTitle>
            <CardDescription>
              Gerencie os produtos, preços e disponibilidade do cardápio
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {allCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products List */}
          <div className="space-y-3">
            {filteredProdutos?.map((produto) => (
              <div
                key={produto.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  produto.ativo ? 'bg-card' : 'bg-muted/50'
                }`}
              >
                {produto.imagem && (
                  <img
                    src={produto.imagem}
                    alt={produto.nome}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium truncate ${!produto.ativo && 'text-muted-foreground'}`}>
                      {produto.nome}
                    </h3>
                    <Badge variant={produto.ativo ? 'default' : 'secondary'} className={produto.ativo ? 'bg-green-500' : 'bg-red-500'}>
                      {produto.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {produto.categoria}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    R$ {produto.preco.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={produto.ativo}
                    onCheckedChange={() => handleToggleAtivo(produto)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditDialog(produto)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredProdutos?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduto} onOpenChange={() => setEditingProduto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Altere as informações do produto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={editForm.nome}
                onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Input
                id="edit-descricao"
                value={editForm.descricao}
                onChange={(e) => setEditForm(prev => ({ ...prev, descricao: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-preco">Preço (R$)</Label>
              <Input
                id="edit-preco"
                type="number"
                step="0.01"
                min="0"
                value={editForm.preco}
                onChange={(e) => setEditForm(prev => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-ativo">Produto ativo</Label>
              <Switch
                id="edit-ativo"
                checked={editForm.ativo}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, ativo: checked }))}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setEditingProduto(null)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveEdit} disabled={updateProduto.isPending}>
                {updateProduto.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deactivation */}
      <AlertDialog open={!!produtoToDeactivate} onOpenChange={() => setProdutoToDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Desativação
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você tem certeza que deseja desativar <strong>"{produtoToDeactivate?.nome}"</strong>?
              </p>
              <p className="text-amber-600 font-medium">
                ⚠️ Este item não será mais exibido no cardápio para os clientes.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => produtoToDeactivate && confirmToggleAtivo(produtoToDeactivate)}
              className="bg-red-600 hover:bg-red-700"
              disabled={updateProduto.isPending}
            >
              {updateProduto.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmar Desativação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo produto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-nome">Nome *</Label>
              <Input
                id="new-nome"
                placeholder="Ex: Esfiha de Carne"
                value={newProdutoForm.nome}
                onChange={(e) => setNewProdutoForm(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-descricao">Descrição</Label>
              <Textarea
                id="new-descricao"
                placeholder="Descrição do produto..."
                value={newProdutoForm.descricao}
                onChange={(e) => setNewProdutoForm(prev => ({ ...prev, descricao: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-preco">Preço (R$) *</Label>
              <Input
                id="new-preco"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newProdutoForm.preco || ''}
                onChange={(e) => setNewProdutoForm(prev => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-categoria">Categoria *</Label>
              <Select 
                value={newProdutoForm.categoria} 
                onValueChange={(value) => setNewProdutoForm(prev => ({ ...prev, categoria: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-imagem">URL da Imagem (opcional)</Label>
              <Input
                id="new-imagem"
                placeholder="/images/nome-da-imagem.jpg"
                value={newProdutoForm.imagem}
                onChange={(e) => setNewProdutoForm(prev => ({ ...prev, imagem: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco se não tiver imagem
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleAddProduto} 
                disabled={createProduto.isPending}
              >
                {createProduto.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Adicionar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProdutos;
