import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const [canReset, setCanReset] = useState(false);
  const [checking, setChecking] = useState(true);
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setCanReset(true);
        setChecking(false);
      }
    });

    // Also check if we already have a recovery session (e.g. arrived with hash already processed)
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setCanReset(true);
        }
      } catch {
        // ignore
      } finally {
        // Give the auth listener a brief window to fire PASSWORD_RECOVERY
        setTimeout(() => setChecking(false), 1500);
      }
    })();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (senha !== confirmar) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: senha });
    setIsLoading(false);

    if (updateError) {
      setError(updateError.message || 'Erro ao redefinir a senha.');
      return;
    }

    toast.success('Senha redefinida com sucesso!');
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">Redefinir senha</CardTitle>
          <CardDescription className="text-base">
            Escolha uma nova senha para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checking ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !canReset ? (
            <div className="space-y-4">
              <p className="rounded-md bg-muted p-4 text-center text-sm">
                Link inválido ou expirado. Solicite uma nova recuperação.
              </p>
              <Button asChild className="w-full" size="lg">
                <Link to="/recuperar-senha">Solicitar nova recuperação</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senha">Nova senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar nova senha</Label>
                <Input
                  id="confirmar"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Redefinir senha'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RedefinirSenha;
