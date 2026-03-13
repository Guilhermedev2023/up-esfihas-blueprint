import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { User, MapPin, Phone, Edit2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const Perfil = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, session } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState<string[]>([]);
  const [userData, setUserData] = useState({
    nome: '',
    email: '',
    telefone: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: ''
  });

  useEffect(() => {
    const fetchBairros = async () => {
      const { data, error } = await supabase
        .from('bairros')
        .select('nome')
        .eq('ativo', true)
        .order('nome');
      
      if (!error && data) {
        setBairrosDisponiveis(data.map(b => b.nome));
      } else {
        setBairrosDisponiveis(['Cachoeira', 'Ponta das Canas', 'Ingleses', 'Canasvieiras', 'Jurere', 'Jurere Internacional', 'Vargem Grande']);
      }
    };
    fetchBairros();
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      // Parse existing "Rua, Numero, Complemento" format
      const parts = (user.endereco || '').split(',').map(p => p.trim());
      setUserData({
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        rua: parts[0] || '',
        numero: parts[1] || '',
        complemento: parts[2] || '',
        bairro: user.bairro || ''
      });
    }
  }, [isAuthenticated, user, navigate, authLoading]);

  const handleSave = async () => {
    if (!session?.user?.id) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    if (!userData.rua.trim() || !userData.numero.trim()) {
      toast.error('Preencha a rua e o número');
      return;
    }

    if (!userData.bairro) {
      toast.error('Selecione um bairro');
      return;
    }

    setIsSaving(true);
    
    // Build address string
    const endereco = [userData.rua.trim(), userData.numero.trim(), userData.complemento.trim()].filter(Boolean).join(', ');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: userData.nome,
          telefone: userData.telefone,
          endereco,
          bairro: userData.bairro
        })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Erro ao atualizar perfil');
        return;
      }

      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-foreground">Meu Perfil</CardTitle>
                  <CardDescription>Gerencie suas informações pessoais</CardDescription>
                </div>
              </div>
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                ) : isEditing ? (
                  <><Save className="mr-2 h-4 w-4" />Salvar</>
                ) : (
                  <><Edit2 className="mr-2 h-4 w-4" />Editar</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações Pessoais */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações Pessoais
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-foreground">Nome completo</Label>
                  {isEditing ? (
                    <Input value={userData.nome} onChange={(e) => setUserData({ ...userData, nome: e.target.value })} disabled={isSaving} />
                  ) : (
                    <p className="rounded-lg bg-muted p-3 text-foreground">{userData.nome || '-'}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-foreground">Email</Label>
                  <p className="rounded-lg bg-muted p-3 text-muted-foreground">{userData.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                {isEditing ? (
                  <Input value={userData.telefone} onChange={(e) => setUserData({ ...userData, telefone: e.target.value })} disabled={isSaving} />
                ) : (
                  <p className="rounded-lg bg-muted p-3 text-foreground">{userData.telefone || '-'}</p>
                )}
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço de Entrega
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Rua *</Label>
                  {isEditing ? (
                    <Input value={userData.rua} onChange={(e) => setUserData({ ...userData, rua: e.target.value })} placeholder="Nome da rua" disabled={isSaving} />
                  ) : (
                    <p className="rounded-lg bg-muted p-3 text-foreground">{userData.rua || '-'}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-foreground">Número *</Label>
                    {isEditing ? (
                      <Input value={userData.numero} onChange={(e) => setUserData({ ...userData, numero: e.target.value })} placeholder="Número" disabled={isSaving} />
                    ) : (
                      <p className="rounded-lg bg-muted p-3 text-foreground">{userData.numero || '-'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Complemento</Label>
                    {isEditing ? (
                      <Input value={userData.complemento} onChange={(e) => setUserData({ ...userData, complemento: e.target.value })} placeholder="Apto, bloco, etc." disabled={isSaving} />
                    ) : (
                      <p className="rounded-lg bg-muted p-3 text-foreground">{userData.complemento || '-'}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-foreground">Bairro *</Label>
                  {isEditing ? (
                    <Select value={userData.bairro} onValueChange={(value) => setUserData({ ...userData, bairro: value })} disabled={isSaving}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o bairro" />
                      </SelectTrigger>
                      <SelectContent>
                        {bairrosDisponiveis.map((bairro) => (
                          <SelectItem key={bairro} value={bairro}>{bairro}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="rounded-lg bg-muted p-3 text-foreground">{userData.bairro || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>) : 'Salvar Alterações'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Perfil;
