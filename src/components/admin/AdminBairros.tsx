import { useState } from 'react';
import { useBairros, useUpdateBairro, useCreateBairro, useDeleteBairro, Bairro } from '@/hooks/useBairros';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus, MapPin, Trash2 } from 'lucide-react';

const AdminBairros = () => {
  const { data: bairros, isLoading, error } = useBairros(true);
  const updateBairro = useUpdateBairro();
  const deleteBairro = useDeleteBairro();
  const [deletingBairro, setDeletingBairro] = useState<Bairro | null>(null);

  const createBairro = useCreateBairro();
  const [editingBairro, setEditingBairro] = useState<Bairro | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: '',
    taxa_entrega: 0,
    ativo: true,
  });
  const [newBairroForm, setNewBairroForm] = useState({
    nome: '',
    taxa_entrega: 0,
    ativo: true,
  });

  const handleToggleAtivo = async (bairro: Bairro) => {
    try {
      await updateBairro.mutateAsync({
        id: bairro.id,
        ativo: !bairro.ativo,
      });
      toast.success(`${bairro.nome} ${bairro.ativo ? 'desativado' : 'ativado'} com sucesso`);
    } catch (error) {
      toast.error('Erro ao atualizar bairro');
    }
  };

  const openEditDialog = (bairro: Bairro) => {
    setEditingBairro(bairro);
    setEditForm({
      nome: bairro.nome,
      taxa_entrega: bairro.taxa_entrega,
      ativo: bairro.ativo,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBairro) return;

    try {
      await updateBairro.mutateAsync({
        id: editingBairro.id,
        nome: editForm.nome,
        taxa_entrega: editForm.taxa_entrega,
        ativo: editForm.ativo,
      });
      toast.success('Bairro atualizado com sucesso');
      setEditingBairro(null);
    } catch (error) {
      toast.error('Erro ao atualizar bairro');
    }
  };

  const handleCreateBairro = async () => {
    if (!newBairroForm.nome.trim()) {
      toast.error('Nome do bairro é obrigatório');
      return;
    }

    try {
      await createBairro.mutateAsync({
        nome: newBairroForm.nome,
        taxa_entrega: newBairroForm.taxa_entrega,
        ativo: newBairroForm.ativo,
      });
      toast.success('Bairro adicionado com sucesso');
      setIsAddDialogOpen(false);
      setNewBairroForm({ nome: '', taxa_entrega: 0, ativo: true });
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error('Este bairro já existe');
      } else {
        toast.error('Erro ao adicionar bairro');
      }
    }
  };

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
          <p className="text-muted-foreground">Erro ao carregar bairros</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestão de Entregas</CardTitle>
            <CardDescription>
              Gerencie os bairros e taxas de entrega
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Bairro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Bairro</DialogTitle>
                <DialogDescription>
                  Adicione um novo bairro de entrega
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-nome">Nome do Bairro</Label>
                  <Input
                    id="new-nome"
                    value={newBairroForm.nome}
                    onChange={(e) => setNewBairroForm(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Centro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-taxa">Taxa de Entrega (R$)</Label>
                  <Input
                    id="new-taxa"
                    type="number"
                    step="0.50"
                    min="0"
                    value={newBairroForm.taxa_entrega}
                    onChange={(e) => setNewBairroForm(prev => ({ ...prev, taxa_entrega: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-ativo">Ativar imediatamente</Label>
                  <Switch
                    id="new-ativo"
                    checked={newBairroForm.ativo}
                    onCheckedChange={(checked) => setNewBairroForm(prev => ({ ...prev, ativo: checked }))}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleCreateBairro} disabled={createBairro.isPending}>
                    {createBairro.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Adicionar'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bairros?.map((bairro) => (
              <div
                key={bairro.id}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  bairro.ativo ? 'bg-card' : 'bg-muted/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${!bairro.ativo && 'text-muted-foreground'}`}>
                      {bairro.nome}
                    </h3>
                    <Badge variant={bairro.ativo ? 'default' : 'secondary'} className={bairro.ativo ? 'bg-green-500' : 'bg-red-500'}>
                      {bairro.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-primary">
                    Taxa: R$ {bairro.taxa_entrega.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={bairro.ativo}
                    onCheckedChange={() => handleToggleAtivo(bairro)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditDialog(bairro)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeletingBairro(bairro)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                </div>
              </div>
            ))}

            {bairros?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum bairro cadastrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingBairro} onOpenChange={() => setEditingBairro(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Bairro</DialogTitle>
            <DialogDescription>
              Altere as informações do bairro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome do Bairro</Label>
              <Input
                id="edit-nome"
                value={editForm.nome}
                onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-taxa">Taxa de Entrega (R$)</Label>
              <Input
                id="edit-taxa"
                type="number"
                step="0.50"
                min="0"
                value={editForm.taxa_entrega}
                onChange={(e) => setEditForm(prev => ({ ...prev, taxa_entrega: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-ativo">Bairro ativo</Label>
              <Switch
                id="edit-ativo"
                checked={editForm.ativo}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, ativo: checked }))}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setEditingBairro(null)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveEdit} disabled={updateBairro.isPending}>
                {updateBairro.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingBairro} onOpenChange={(open) => !open && setDeletingBairro(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover bairro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deletingBairro?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deletingBairro) return;
                try {
                  await deleteBairro.mutateAsync(deletingBairro.id);
                  toast.success(`${deletingBairro.nome} removido`);
                  setDeletingBairro(null);
                } catch {
                  toast.error('Erro ao remover bairro');
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBairros;
