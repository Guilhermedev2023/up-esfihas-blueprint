import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CreditCard, Truck, Loader2 } from 'lucide-react';
import { useConfiguracaoPagamento } from '@/hooks/useConfiguracaoPagamento';
import { toast } from 'sonner';

const AdminPagamentos = () => {
  const { configuracoes, isLoading, toggleMutation } = useConfiguracaoPagamento();

  const handleToggle = (id: string, ativo: boolean, nome: string) => {
    toggleMutation.mutate(
      { id, ativo },
      {
        onSuccess: () => toast.success(`${nome} ${ativo ? 'ativado' : 'desativado'} com sucesso`),
        onError: () => toast.error('Erro ao atualizar configuração'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const metodos = [
    {
      metodo: 'pagamento_online',
      label: 'Pagamento Online',
      descricao: 'Cartão de crédito via checkout online',
      icon: CreditCard,
    },
    {
      metodo: 'na_entrega',
      label: 'Pagamento Na Entrega',
      descricao: 'PIX, dinheiro ou maquininha na entrega',
      icon: Truck,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Formas de Pagamento</h2>
        <p className="text-muted-foreground">Ative ou desative as opções de pagamento disponíveis para os clientes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {metodos.map(({ metodo, label, descricao, icon: Icon }) => {
          const config = configuracoes.find((c) => c.metodo === metodo);
          const ativo = config?.ativo ?? true;

          return (
            <Card key={metodo} className={`transition-all ${ativo ? 'border-primary/30' : 'opacity-60'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className={`p-2 rounded-lg ${ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{descricao}</p>
                <div className="flex items-center justify-between">
                  <Label htmlFor={metodo} className="text-sm font-medium">
                    {ativo ? 'Ativado' : 'Desativado'}
                  </Label>
                  <Switch
                    id={metodo}
                    checked={ativo}
                    onCheckedChange={(checked) => {
                      if (config) handleToggle(config.id, checked, label);
                    }}
                    disabled={toggleMutation.isPending}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPagamentos;
