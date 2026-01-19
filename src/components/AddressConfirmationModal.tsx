import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Home, AlertCircle, Loader2, Clock, Ruler } from 'lucide-react';
import { calculateDeliveryFee, DeliveryCalculation } from '@/hooks/useDeliveryConfig';
import { toast } from 'sonner';

export interface ConfirmedAddress {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  taxaEntrega: number;
  origem: 'profile' | 'custom';
  distanciaKm?: number;
  tempoEstimado?: number;
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
  const [addressOption, setAddressOption] = useState<'profile' | 'custom'>('profile');
  
  // Custom address form state
  const [customRua, setCustomRua] = useState('');
  const [customNumero, setCustomNumero] = useState('');
  const [customBairro, setCustomBairro] = useState('');
  const [customComplemento, setCustomComplemento] = useState('');

  // Delivery calculation state
  const [isCalculating, setIsCalculating] = useState(false);
  const [profileDelivery, setProfileDelivery] = useState<DeliveryCalculation | null>(null);
  const [customDelivery, setCustomDelivery] = useState<DeliveryCalculation | null>(null);

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

  // Calculate delivery fee for profile address when modal opens
  useEffect(() => {
    if (open && hasValidProfileAddress && profileAddress?.bairro) {
      const fullAddress = `${parsedProfile.rua}, ${parsedProfile.numero}, ${profileAddress.bairro}, Florianópolis, SC`;
      setIsCalculating(true);
      calculateDeliveryFee(fullAddress)
        .then(result => {
          setProfileDelivery(result);
        })
        .finally(() => {
          setIsCalculating(false);
        });
    }
  }, [open, hasValidProfileAddress]);

  // Validate custom form
  const isCustomFormValid = customRua.trim() && customNumero.trim() && customBairro.trim();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setCustomRua('');
      setCustomNumero('');
      setCustomBairro('');
      setCustomComplemento('');
      setCustomDelivery(null);
      // Default to profile if valid
      if (hasValidProfileAddress) {
        setAddressOption('profile');
      } else {
        setAddressOption('custom');
      }
    }
  }, [open, hasValidProfileAddress]);

  const handleCalculateCustomDelivery = async () => {
    if (!isCustomFormValid) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const fullAddress = `${customRua.trim()}, ${customNumero.trim()}, ${customBairro.trim()}, Florianópolis, SC`;
    setIsCalculating(true);
    
    try {
      const result = await calculateDeliveryFee(fullAddress);
      setCustomDelivery(result);
      
      if (!result.success) {
        toast.error(result.error || 'Erro ao calcular taxa de entrega');
      }
    } catch {
      toast.error('Erro ao calcular taxa de entrega');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirmProfileAddress = () => {
    if (!hasValidProfileAddress || !profileDelivery?.success) {
      toast.error('Endereço do cadastro incompleto ou fora da área de entrega');
      return;
    }

    onConfirm({
      rua: parsedProfile.rua,
      numero: parsedProfile.numero,
      complemento: parsedProfile.complemento || undefined,
      bairro: profileAddress!.bairro!,
      taxaEntrega: profileDelivery.deliveryFee!,
      origem: 'profile',
      distanciaKm: profileDelivery.distanceKm,
      tempoEstimado: profileDelivery.estimatedMinutes
    });
  };

  const handleConfirmCustomAddress = () => {
    if (!isCustomFormValid) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!customDelivery?.success) {
      toast.error('Calcule a taxa de entrega primeiro');
      return;
    }

    onConfirm({
      rua: customRua.trim(),
      numero: customNumero.trim(),
      complemento: customComplemento.trim() || undefined,
      bairro: customBairro.trim(),
      taxaEntrega: customDelivery.deliveryFee!,
      origem: 'custom',
      distanciaKm: customDelivery.distanceKm,
      tempoEstimado: customDelivery.estimatedMinutes
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
                      
                      {isCalculating && addressOption === 'profile' ? (
                        <div className="flex items-center gap-2 mt-2 text-primary">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Calculando taxa de entrega...</span>
                        </div>
                      ) : profileDelivery?.success ? (
                        <div className="mt-3 p-3 bg-primary/10 rounded-lg space-y-1">
                          <div className="flex items-center gap-2 text-primary font-medium">
                            <Ruler className="h-4 w-4" />
                            <span>Distância: {profileDelivery.distanceKm?.toFixed(1)} km</span>
                          </div>
                          <div className="flex items-center gap-2 text-primary font-medium">
                            <Clock className="h-4 w-4" />
                            <span>Tempo estimado: ~{profileDelivery.estimatedMinutes} min</span>
                          </div>
                          <p className="text-lg font-bold text-primary">
                            Taxa de entrega: R$ {profileDelivery.deliveryFee?.toFixed(2)}
                          </p>
                        </div>
                      ) : profileDelivery?.error ? (
                        <div className="flex items-center gap-2 mt-2 text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <span>{profileDelivery.error}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>Endereço incompleto no cadastro</span>
                    </div>
                  )}
                </Label>
              </div>
              
              {addressOption === 'profile' && hasValidProfileAddress && profileDelivery?.success && (
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
                  {/* Rua */}
                  <div className="space-y-2">
                    <Label htmlFor="customRua">Rua *</Label>
                    <Input
                      id="customRua"
                      value={customRua}
                      onChange={(e) => {
                        setCustomRua(e.target.value);
                        setCustomDelivery(null);
                      }}
                      placeholder="Nome da rua"
                    />
                  </div>

                  {/* Número */}
                  <div className="space-y-2">
                    <Label htmlFor="customNumero">Número *</Label>
                    <Input
                      id="customNumero"
                      value={customNumero}
                      onChange={(e) => {
                        setCustomNumero(e.target.value);
                        setCustomDelivery(null);
                      }}
                      placeholder="Número"
                    />
                  </div>

                  {/* Bairro */}
                  <div className="space-y-2">
                    <Label htmlFor="customBairro">Bairro *</Label>
                    <Input
                      id="customBairro"
                      value={customBairro}
                      onChange={(e) => {
                        setCustomBairro(e.target.value);
                        setCustomDelivery(null);
                      }}
                      placeholder="Nome do bairro"
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

                  {/* Calculate Button */}
                  {!customDelivery && (
                    <Button 
                      onClick={handleCalculateCustomDelivery}
                      variant="outline"
                      className="w-full"
                      disabled={!isCustomFormValid || isCalculating}
                    >
                      {isCalculating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Calculando...
                        </>
                      ) : (
                        'Calcular taxa de entrega'
                      )}
                    </Button>
                  )}

                  {/* Delivery Result */}
                  {customDelivery?.success && (
                    <div className="p-3 bg-primary/10 rounded-lg space-y-1">
                      <div className="flex items-center gap-2 text-primary font-medium">
                        <Ruler className="h-4 w-4" />
                        <span>Distância: {customDelivery.distanceKm?.toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center gap-2 text-primary font-medium">
                        <Clock className="h-4 w-4" />
                        <span>Tempo estimado: ~{customDelivery.estimatedMinutes} min</span>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        Taxa de entrega: R$ {customDelivery.deliveryFee?.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {customDelivery?.error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{customDelivery.error}</span>
                    </div>
                  )}

                  <Button 
                    onClick={handleConfirmCustomAddress}
                    className="w-full"
                    size="lg"
                    disabled={!customDelivery?.success}
                  >
                    Confirmar endereço
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
