import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LogOut, Package, MapPin, Settings, Clock } from 'lucide-react';
import AdminProdutos from '@/components/admin/AdminProdutos';
import AdminEntregas from '@/components/admin/AdminEntregas';
import AdminHorario from '@/components/admin/AdminHorario';

const Admin = () => {
  const { user, signOut } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('produtos');

  // Note: Auth and admin checks are handled by AdminRoute wrapper
  // This component only renders when user is authenticated and is admin

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Erro ao sair: ' + error.message);
    } else {
      toast.success('Logout realizado com sucesso');
      navigate('/admin/login');
    }
  };

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
              {user?.email}
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
            <AdminEntregas />
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
