import { useState, useEffect } from 'react';
import { useBannerPromocional, useUpdateBanner } from '@/hooks/useBannerPromocional';
import { useProdutos } from '@/hooks/useProdutos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Image, Save } from 'lucide-react';

const AdminBanner = () => {
  const { data: banner, isLoading } = useBannerPromocional();
  const { data: produtos } = useProdutos(true);
  const updateBanner = useUpdateBanner();

  const [ativo, setAtivo] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const [valorPromocional, setValorPromocional] = useState('');

  useEffect(() => {
    if (banner) {
      setAtivo(banner.ativo);
      setTitulo(banner.titulo || '');
      setImagemUrl(banner.imagem_url || '');
      setProdutoId(banner.produto_id || '');
      setValorPromocional(banner.valor_promocional?.toString() || '');
    }
  }, [banner]);

  const handleSave = async () => {
    if (!banner) return;
    try {
      await updateBanner.mutateAsync({
        id: banner.id,
        ativo,
        titulo: titulo || 'Promoção',
        imagem_url: imagemUrl || null,
        produto_id: produtoId || null,
        valor_promocional: valorPromocional ? parseFloat(valorPromocional) : null,
      });
      toast.success('Banner atualizado com sucesso!');
    } catch {
      toast.error('Erro ao atualizar banner');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Banner Promocional
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="banner-ativo">Banner ativo no site</Label>
          <Switch id="banner-ativo" checked={ativo} onCheckedChange={setAtivo} />
        </div>

        <div>
          <Label htmlFor="titulo">Título do banner</Label>
          <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Promoção Especial" />
        </div>

        <div>
          <Label htmlFor="imagem">URL da imagem (opcional)</Label>
          <Input id="imagem" value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} placeholder="https://... ou /images/..." />
          {imagemUrl && (
            <img src={imagemUrl} alt="Preview" className="mt-2 h-20 rounded-lg object-cover" />
          )}
        </div>

        <div>
          <Label>Produto vinculado</Label>
          <Select value={produtoId} onValueChange={setProdutoId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um produto" />
            </SelectTrigger>
            <SelectContent>
              {produtos?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome} — R$ {p.preco.toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="valor">Valor promocional (R$)</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            value={valorPromocional}
            onChange={(e) => setValorPromocional(e.target.value)}
            placeholder="Deixe vazio para usar preço original"
          />
        </div>

        <Button onClick={handleSave} disabled={updateBanner.isPending} className="w-full">
          {updateBanner.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Banner
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminBanner;
