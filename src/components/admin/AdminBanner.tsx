import { useState, useEffect, useRef, useCallback } from 'react';
import { useBannerPromocional, useUpdateBanner } from '@/hooks/useBannerPromocional';
import { useProdutos } from '@/hooks/useProdutos';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Image as ImageIcon, Save, Upload, X } from 'lucide-react';

const ACCEPTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const AdminBanner = () => {
  const { data: banner, isLoading } = useBannerPromocional();
  const { data: produtos } = useProdutos(true);
  const updateBanner = useUpdateBanner();

  const [ativo, setAtivo] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const [valorPromocional, setValorPromocional] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (banner) {
      setAtivo(banner.ativo);
      setTitulo(banner.titulo || '');
      setImagemUrl(banner.imagem_url || '');
      setProdutoId(banner.produto_id || '');
      setValorPromocional(banner.valor_promocional?.toString() || '');
    }
  }, [banner]);

  const uploadImage = async (file: File) => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      toast.error('Formato não aceito. Use PNG, JPG ou WebP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setImagemUrl(data.publicUrl);
      toast.success('Imagem carregada!');
    } catch {
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadImage(file);
  }, []);

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
          <ImageIcon className="h-5 w-5" />
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

        {/* Image upload */}
        <div>
          <Label>Imagem do banner</Label>
          <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleFileChange} className="hidden" />

          {imagemUrl ? (
            <div className="mt-2 space-y-2">
              <div className="relative w-full rounded-lg overflow-hidden border border-border">
                <img src={imagemUrl} alt="Preview" className="w-full h-auto object-cover max-h-48" />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <Upload className="h-4 w-4 mr-2" /> Substituir
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => setImagemUrl('')} disabled={isUploading}>
                  <X className="h-4 w-4 mr-2" /> Remover
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-2 cursor-pointer rounded-lg border-2 border-dashed p-6 flex flex-col items-center gap-2 transition-colors min-h-[120px] ${isDragOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'} ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">Arraste a imagem ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG ou WebP (máx. 5MB)</p>
                </>
              )}
            </div>
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
