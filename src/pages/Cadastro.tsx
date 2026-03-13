import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

const Cadastro = () => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    rua: '',
    numero: '',
    bairro: '',
    complemento: '',
    senha: '',
    confirmarSenha: ''
  });

  const [bairrosDisponiveis, setBairrosDisponiveis] = useState<string[]>([]);
  const [aceitoTermos, setAceitoTermos] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

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
        setBairrosDisponiveis(['Cachoeira', 'Ponta das Canas', 'Ingleses', 'Canasvieiras', 'Jurerê', 'Vargem Grande']);
      }
    };
    fetchBairros();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.telefone.trim()) {
      toast.error('O telefone é obrigatório');
      return;
    }

    if (!formData.rua.trim() || !formData.numero.trim()) {
      toast.error('Preencha a rua e o número');
      return;
    }

    if (!formData.bairro) {
      toast.error('Selecione um bairro');
      return;
    }

    if (formData.senha.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (!aceitoTermos) {
      toast.error('Você deve aceitar os Termos de Uso');
      return;
    }

    setLoading(true);

    const { data: existingPhone } = await supabase
      .from('profiles')
      .select('id')
      .eq('telefone', formData.telefone.trim())
      .limit(1);

    if (existingPhone && existingPhone.length > 0) {
      toast.error('Este número de telefone já está cadastrado em outra conta.');
      setLoading(false);
      return;
    }

    // Build address string: "Rua, Número, Complemento"
    const endereco = [formData.rua.trim(), formData.numero.trim(), formData.complemento.trim()].filter(Boolean).join(', ');

    const success = await register({
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
      endereco,
      bairro: formData.bairro,
      senha: formData.senha
    });

    setLoading(false);

    if (success) {
      navigate('/home');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">Criar Conta</CardTitle>
          <CardDescription className="text-base">
            Cadastre-se para fazer seu pedido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" name="nome" placeholder="Digite seu nome" value={formData.nome} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" name="telefone" type="tel" placeholder="(XX) XXXXX-XXXX" value={formData.telefone} onChange={handleChange} required disabled={loading} />
            </div>

            {/* Address fields */}
            <div className="space-y-2">
              <Label htmlFor="rua">Rua *</Label>
              <Input id="rua" name="rua" placeholder="Nome da rua" value={formData.rua} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="numero">Número *</Label>
                <Input id="numero" name="numero" placeholder="Número" value={formData.numero} onChange={handleChange} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input id="complemento" name="complemento" placeholder="Apto, bloco, etc." value={formData.complemento} onChange={handleChange} disabled={loading} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro *</Label>
              <select
                id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} required disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione seu bairro</option>
                {bairrosDisponiveis.map((bairro) => (
                  <option key={bairro} value={bairro}>{bairro}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="Digite seu email" value={formData.email} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" name="senha" type="password" placeholder="Mínimo 6 caracteres" value={formData.senha} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar senha</Label>
              <Input id="confirmarSenha" name="confirmarSenha" type="password" placeholder="Digite a senha novamente" value={formData.confirmarSenha} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="termos" checked={aceitoTermos} onCheckedChange={(checked) => setAceitoTermos(checked as boolean)} disabled={loading} />
              <label htmlFor="termos" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Aceito os Termos de Uso
              </label>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta...</>) : 'Criar Conta'}
            </Button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">
                Já tem uma conta? Faça login
              </Link>
            </div>
          </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cadastro;
