import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ProductImageUploadProps {
  currentImageUrl?: string | null;
  onImageChange: (url: string | null) => void;
}

const ACCEPTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ProductImageUpload = ({ currentImageUrl, onImageChange }: ProductImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return 'Formato não aceito. Use apenas PNG ou JPG/JPEG.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande. Máximo 5MB.';
    }
    return null;
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return null;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    const url = await uploadImage(file);
    if (url) {
      onImageChange(url);
      toast.success('Imagem carregada com sucesso!');
    } else {
      setPreviewUrl(currentImageUrl || null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleRemoveImage = async () => {
    // If there was an uploaded image, try to delete it from storage
    if (previewUrl && previewUrl.includes('product-images')) {
      try {
        const urlPath = new URL(previewUrl).pathname;
        const filePath = urlPath.split('/product-images/')[1];
        if (filePath) {
          await supabase.storage.from('product-images').remove([filePath]);
        }
      } catch (err) {
        console.error('Error removing image:', err);
      }
    }
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        onChange={handleInputChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative">
          <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border border-border">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-center mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClick}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Substituir
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemoveImage}
              disabled={isUploading}
            >
              <X className="h-4 w-4 mr-2" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative cursor-pointer rounded-lg border-2 border-dashed p-6
            flex flex-col items-center justify-center gap-2
            transition-colors min-h-[160px]
            ${isDragOver 
              ? 'border-primary bg-primary/10' 
              : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
            }
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          {isUploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Arraste a imagem aqui ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG ou JPG (máx. 5MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Image guidelines */}
      <div className="rounded-lg bg-muted/50 p-3 border border-border">
        <p className="text-xs font-medium text-foreground mb-1">
          📷 Formato ideal da imagem:
        </p>
        <ul className="text-xs text-muted-foreground space-y-0.5">
          <li>• Proporção: <strong>1:1 (quadrada)</strong></li>
          <li>• Resolução recomendada: <strong>800x800 px</strong></li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2 italic">
          Isso evita cortes errados, distorção no mobile e layout quebrado no cardápio.
        </p>
      </div>
    </div>
  );
};

export default ProductImageUpload;