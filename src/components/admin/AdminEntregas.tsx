import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus, Trash2, MapPin, Clock, DollarSign, Ruler, Map } from 'lucide-react';
import { DeliveryMap } from './DeliveryMap';
import {
  useFaixasEntrega,
  useCreateFaixaEntrega,
  useUpdateFaixaEntrega,
  useDeleteFaixaEntrega,
  useConfiguracaoRestaurante,
  useUpdateConfiguracaoRestaurante,
  FaixaEntrega,
} from '@/hooks/useDeliveryConfig';

const AdminEntregas = () => {
  const { data: faixas, isLoading: loadingFaixas } = useFaixasEntrega(true);
  const { data: config, isLoading: loadingConfig } = useConfiguracaoRestaurante();
  const createFaixa = useCreateFaixaEntrega();
  const updateFaixa = useUpdateFaixaEntrega();
  const deleteFaixa = useDeleteFaixaEntrega();
  const updateConfig = useUpdateConfiguracaoRestaurante();

  const [editingFaixa, setEditingFaixa] = useState<FaixaEntrega | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('faixas');

  const [editForm, setEditForm] = useState({
    distancia_min_km: 0,
    distancia_max_km: 0,
    taxa_entrega: 0,
    tempo_estimado_min: 30,
    ativo: true,
  });

  const [newFaixaForm, setNewFaixaForm] = useState({
    distancia_min_km: 0,
    distancia_max_km: 1,
    taxa_entrega: 5,
    tempo_estimado_min: 20,
    ativo: true,
  });

  const [configForm, setConfigForm] = useState({
    endereco: '',
    cep: '',
    cidade: '',
    estado: '',
    latitude: 0,
    longitude: 0,
  });

  // Load config into form when data arrives
  useState(() => {
    if (config) {
      setConfigForm({
        endereco: config.endereco,
        cep: config.cep,
        cidade: config.cidade,
        estado: config.estado,
        latitude: config.latitude || 0,
        longitude: config.longitude || 0,
      });
    }
  });

  const handleToggleAtivo = async (faixa: FaixaEntrega) => {
    try {
      await updateFaixa.mutateAsync({
        id: faixa.id,
        ativo: !faixa.ativo,
      });
      toast.success(`Faixa ${faixa.ativo ? 'desativada' : 'ativada'} com sucesso`);
    } catch {
      toast.error('Erro ao atualizar faixa');
    }
  };

  const openEditDialog = (faixa: FaixaEntrega) => {
    setEditingFaixa(faixa);
    setEditForm({
      distancia_min_km: faixa.distancia_min_km,
      distancia_max_km: faixa.distancia_max_km,
      taxa_entrega: Number(faixa.taxa_entrega),
      tempo_estimado_min: faixa.tempo_estimado_min,
      ativo: faixa.ativo,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingFaixa) return;

    if (editForm.distancia_max_km <= editForm.distancia_min_km) {
      toast.error('A distância máxima deve ser maior que a mínima');
      return;
    }

    try {
      await updateFaixa.mutateAsync({
        id: editingFaixa.id,
        ...editForm,
      });
      toast.success('Faixa atualizada com sucesso');
      setEditingFaixa(null);
    } catch {
      toast.error('Erro ao atualizar faixa');
    }
  };

  const handleCreateFaixa = async () => {
    if (newFaixaForm.distancia_max_km <= newFaixaForm.distancia_min_km) {
      toast.error('A distância máxima deve ser maior que a mínima');
      return;
    }

    try {
      await createFaixa.mutateAsync(newFaixaForm);
      toast.success('Faixa criada com sucesso');
      setIsAddDialogOpen(false);
      setNewFaixaForm({
        distancia_min_km: 0,
        distancia_max_km: 1,
        taxa_entrega: 5,
        tempo_estimado_min: 20,
        ativo: true,
      });
    } catch {
      toast.error('Erro ao criar faixa');
    }
  };

  const handleDeleteFaixa = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta faixa?')) return;

    try {
      await deleteFaixa.mutateAsync(id);
      toast.success('Faixa excluída com sucesso');
    } catch {
      toast.error('Erro ao excluir faixa');
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    try {
      await updateConfig.mutateAsync({
        id: config.id,
        ...configForm,
      });
      toast.success('Configuração salva com sucesso');
    } catch {
      toast.error('Erro ao salvar configuração');
    }
  };

  if (loadingFaixas || loadingConfig) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="faixas">Faixas de Distância</TabsTrigger>
          <TabsTrigger value="mapa" className="flex items-center gap-1">
            <Map className="h-4 w-4" />
            Mapa
          </TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="faixas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Faixas de Entrega por Distância
                </CardTitle>
                <CardDescription>
                  Configure as taxas de entrega baseadas na distância real
                </CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Faixa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Faixa de Entrega</DialogTitle>
                    <DialogDescription>
                      Configure uma nova faixa de distância e taxa
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Distância Mínima (km)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={newFaixaForm.distancia_min_km}
                          onChange={(e) => setNewFaixaForm(prev => ({ ...prev, distancia_min_km: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Distância Máxima (km)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={newFaixaForm.distancia_max_km}
                          onChange={(e) => setNewFaixaForm(prev => ({ ...prev, distancia_max_km: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Taxa de Entrega (R$)</Label>
                        <Input
                          type="number"
                          step="0.50"
                          min="0"
                          value={newFaixaForm.taxa_entrega}
                          onChange={(e) => setNewFaixaForm(prev => ({ ...prev, taxa_entrega: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tempo Estimado (min)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newFaixaForm.tempo_estimado_min}
                          onChange={(e) => setNewFaixaForm(prev => ({ ...prev, tempo_estimado_min: parseInt(e.target.value) || 30 }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Ativar imediatamente</Label>
                      <Switch
                        checked={newFaixaForm.ativo}
                        onCheckedChange={(checked) => setNewFaixaForm(prev => ({ ...prev, ativo: checked }))}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button className="flex-1" onClick={handleCreateFaixa} disabled={createFaixa.isPending}>
                        {createFaixa.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {faixas?.map((faixa) => (
                  <div
                    key={faixa.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      faixa.ativo ? 'bg-card' : 'bg-muted/50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Ruler className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-medium ${!faixa.ativo && 'text-muted-foreground'}`}>
                          {faixa.distancia_min_km} - {faixa.distancia_max_km} km
                        </h3>
                        <Badge variant={faixa.ativo ? 'default' : 'secondary'} className={faixa.ativo ? 'bg-green-500' : 'bg-red-500'}>
                          {faixa.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          R$ {Number(faixa.taxa_entrega).toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          ~{faixa.tempo_estimado_min} min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={faixa.ativo}
                        onCheckedChange={() => handleToggleAtivo(faixa)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(faixa)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteFaixa(faixa.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}

                {faixas?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma faixa de entrega cadastrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapa" className="space-y-4">
          <DeliveryMap config={config} faixas={faixas} />
          <AdminBairros />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização do Restaurante
              </CardTitle>
              <CardDescription>
                Configure o endereço do restaurante (origem para cálculo de distância)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Endereço Completo</Label>
                <Input
                  value={config?.endereco || ''}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Rua, Número"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={config?.cep || ''}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, cep: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={config?.cidade || ''}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, cidade: e.target.value }))}
                    placeholder="Cidade"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={config?.latitude || ''}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                    placeholder="-27.4262"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={config?.longitude || ''}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                    placeholder="-48.4831"
                  />
                </div>
              </div>
              <Button onClick={handleSaveConfig} disabled={updateConfig.isPending} className="w-full">
                {updateConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar Configuração
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingFaixa} onOpenChange={() => setEditingFaixa(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Faixa de Entrega</DialogTitle>
            <DialogDescription>
              Altere as informações da faixa de distância
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Distância Mínima (km)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={editForm.distancia_min_km}
                  onChange={(e) => setEditForm(prev => ({ ...prev, distancia_min_km: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Distância Máxima (km)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={editForm.distancia_max_km}
                  onChange={(e) => setEditForm(prev => ({ ...prev, distancia_max_km: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Taxa de Entrega (R$)</Label>
                <Input
                  type="number"
                  step="0.50"
                  min="0"
                  value={editForm.taxa_entrega}
                  onChange={(e) => setEditForm(prev => ({ ...prev, taxa_entrega: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tempo Estimado (min)</Label>
                <Input
                  type="number"
                  min="1"
                  value={editForm.tempo_estimado_min}
                  onChange={(e) => setEditForm(prev => ({ ...prev, tempo_estimado_min: parseInt(e.target.value) || 30 }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Faixa ativa</Label>
              <Switch
                checked={editForm.ativo}
                onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, ativo: checked }))}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setEditingFaixa(null)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveEdit} disabled={updateFaixa.isPending}>
                {updateFaixa.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEntregas;
