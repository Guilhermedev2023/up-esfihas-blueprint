import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Home, AlertCircle } from 'lucide-react';
import { useBairros } from '@/hooks/useBairros';
import { toast } from 'sonner';

export interface ConfirmedAddress {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  taxaEntrega: number;
  origem: 'profile' | 'custom';
}

interface ProfileAddress {
  endereco?: string;
  bairro?: string;
}

interface AddressConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileAddress: ProfileAddress | null;
  onConfirm: (address: ConfirmedAddress) => void;
}

export const AddressConfirmationModal = ({
  open,
  onOpenChange,
  profileAddress,
  onConfirm
}: AddressConfirmationModalProps) => {
  const { data: bairros = [], isLoading: loadingBairros } = useBairros();
  const [addressOption, setAddressOption] = useState<'profile' | 'custom'>('profile');
  
  // Custom address form state
  const [customBairro, setCustomBairro] = useState('');
  const [customRua, setCustomRua] = useState('');
  const [customNumero, setCustomNumero] = useState('');
  const [customComplemento, setCustomComplemento] = useState('');

  // Parse profile address (format: "Rua, Número, Complemento" or "Rua, Número")
  const parseProfileAddress = () => {
    if (!profileAddress?.endereco) return { rua: '', numero: '', complemento: '' };
    
    const parts = profileAddress.endereco.split(',').map(p => p.trim());
    return {
      rua: parts[0] || '',
      numero: parts[1] || '',
      complemento: parts[2] || ''
    };
  };

  const parsedProfile = parseProfileAddress();
  
  // Check if profile address is complete
  const hasValidProfileAddress = !!(
    profileAddress?.endereco &&
    profileAddress?.bairro &&
    parsedProfile.rua &&
    parsedProfile.numero
  );

  // Get delivery fee for a bairro
  const getDeliveryFeeForBairro = (bairroNome: string): number | null => {
    const bairro = bairros.find(b => b.nome === bairroNome);
    return bairro ? bairro.taxa_entrega : null;
  };

  // Validate profile bairro is in delivery list
  const profileBairroFee = profileAddress?.bairro ? getDeliveryFeeForBairro(profileAddress.bairro) : null;
  const isProfileBairroValid = profileBairroFee !== null;

  // Validate custom form
  const isCustomFormValid = customBairro && customRua.trim() && customNumero.trim();
  const customBairroFee = customBairro ? getDeliveryFeeForBairro(customBairro) : null;

  // Reset custom form when modal opens
  useEffect(() => {
    if (open) {
      setCustomBairro('');
      setCustomRua('');
      setCustomNumero('');
      setCustomComplemento('');
      // Default to profile if valid, otherwise custom
      if (hasValidProfileAddress && isProfileBairroValid) {
        setAddressOption('profile');
      } else {
        setAddressOption('custom');
      }
    }
  }, [open, hasValidProfileAddress, isProfileBairroValid]);

  const handleConfirmProfileAddress = () => {
    if (!hasValidProfileAddress || !isProfileBairroValid) {
      toast.error('Endereço do cadastro incompleto ou bairro não atendido');
      return;
    }

    onConfirm({
      rua: parsedProfile.rua,
      numero: parsedProfile.numero,
      complemento: parsedProfile.complemento || undefined,
      bairro: profileAddress!.bairro!,
      taxaEntrega: profileBairroFee!,
      origem: 'profile'
    });
  };

  const handleConfirmCustomAddress = () => {
    if (!isCustomFormValid) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (customBairroFee === null) {
      toast.error('Infelizmente ainda não entregamos nessa região.');
      return;
    }

    onConfirm({
      rua: customRua.trim(),
      numero: customNumero.trim(),
      complemento: customComplemento.trim() || undefined,
      bairro: customBairro,
      taxaEntrega: customBairroFee,
      origem: 'custom'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-5 w-5 text-primary" />
            Confirme o endereço de entrega
          </DialogTitle>
        </DialogHeader>

        <RadioGroup 
          value={addressOption} 
          onValueChange={(value) => setAddressOption(value as 'profile' | 'custom')}
          className="space-y-4"
        >
          {/* Option 1: Profile Address */}
          <Card className={`cursor-pointer transition-all ${addressOption === 'profile' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <RadioGroupItem value="profile" id="profile" className="mt-1" />
                <Label htmlFor="profile" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Endereço do Cadastro</span>
                  </div>
                  
                  {hasValidProfileAddress ? (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>Rua:</strong> {parsedProfile.rua}</p>
                      <p><strong>Número:</strong> {parsedProfile.numero}</p>
                      {parsedProfile.complemento && (
                        <p><strong>Complemento:</strong> {parsedProfile.complemento}</p>
                      )}
                      <p><strong>Bairro:</strong> {profileAddress?.bairro}</p>
                      
                      {isProfileBairroValid ? (
                        <p className="text-primary font-medium mt-2">
                          Taxa de entrega: R$ {profileBairroFee?.toFixed(2)}
                        </p>
                      ) : (
                        <div className="flex items-center gap-2 mt-2 text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span>Infelizmente ainda não entregamos nessa região.</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>Endereço incompleto no cadastro</span>
                    </div>
                  )}
                </Label>
              </div>
              
              {addressOption === 'profile' && hasValidProfileAddress && isProfileBairroValid && (
                <Button 
                  onClick={handleConfirmProfileAddress}
                  className="w-full mt-4"
                  size="lg"
                >
                  Usar este endereço
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Option 2: Custom Address */}
          <Card className={`cursor-pointer transition-all ${addressOption === 'custom' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <RadioGroupItem value="custom" id="custom" className="mt-1" />
                <Label htmlFor="custom" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Entregar em outro endereço</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use um endereço diferente apenas para este pedido
                  </p>
                </Label>
              </div>

              {addressOption === 'custom' && (
                <div className="space-y-4 mt-4 pt-4 border-t">
                  {/* Bairro Select */}
                  <div className="space-y-2">
                    <Label htmlFor="customBairro">Bairro *</Label>
                    <Select value={customBairro} onValueChange={setCustomBairro}>
                      <SelectTrigger id="customBairro">
                        <SelectValue placeholder="Selecione o bairro" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingBairros ? (
                          <SelectItem value="loading" disabled>Carregando...</SelectItem>
                        ) : (
                          bairros.map((bairro) => (
                            <SelectItem key={bairro.id} value={bairro.nome}>
                              {bairro.nome} - R$ {bairro.taxa_entrega.toFixed(2)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rua */}
                  <div className="space-y-2">
                    <Label htmlFor="customRua">Rua *</Label>
                    <Input
                      id="customRua"
                      value={customRua}
                      onChange={(e) => setCustomRua(e.target.value)}
                      placeholder="Nome da rua"
                    />
                  </div>

                  {/* Número */}
                  <div className="space-y-2">
                    <Label htmlFor="customNumero">Número *</Label>
                    <Input
                      id="customNumero"
                      value={customNumero}
                      onChange={(e) => setCustomNumero(e.target.value)}
                      placeholder="Número"
                    />
                  </div>

                  {/* Complemento (opcional) */}
                  <div className="space-y-2">
                    <Label htmlFor="customComplemento">Complemento (opcional)</Label>
                    <Input
                      id="customComplemento"
                      value={customComplemento}
                      onChange={(e) => setCustomComplemento(e.target.value)}
                      placeholder="Apto, bloco, etc."
                    />
                  </div>

                  {customBairro && customBairroFee !== null && (
                    <p className="text-primary font-medium">
                      Taxa de entrega: R$ {customBairroFee.toFixed(2)}
                    </p>
                  )}

                  <Button 
                    onClick={handleConfirmCustomAddress}
                    className="w-full"
                    size="lg"
                    disabled={!isCustomFormValid}
                  >
                    Confirmar novo endereço
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </RadioGroup>
      </DialogContent>
    </Dialog>
  );
};
