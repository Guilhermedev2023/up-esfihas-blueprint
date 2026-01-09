import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, LogOut, Package, MapPin, Settings, Clock } from 'lucide-react';
import AdminProdutos from '@/components/admin/AdminProdutos';
import AdminBairros from '@/components/admin/AdminBairros';
import AdminHorario from '@/components/admin/AdminHorario';

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('produtos');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/admin/login');
      } else if (!isAdmin) {
        toast.error('Você não tem permissão para acessar esta área');
        navigate('/home');
      }
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Erro ao sair: ' + error.message);
    } else {
      toast.success('Logout realizado com sucesso');
      navigate('/admin/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="produtos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Cardápio
            </TabsTrigger>
            <TabsTrigger value="bairros" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Entregas
            </TabsTrigger>
            <TabsTrigger value="horario" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="produtos">
            <AdminProdutos />
          </TabsContent>

          <TabsContent value="bairros">
            <AdminBairros />
          </TabsContent>

          <TabsContent value="horario">
            <AdminHorario />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
