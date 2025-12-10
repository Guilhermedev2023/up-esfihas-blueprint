import { ShoppingCart, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const { itemCount } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full bg-card border-b border-border shadow-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/home" className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">UP ESFIHAS</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/carrinho">
            <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-muted">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="font-semibold">
                  {user?.nome}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/perfil')}>
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-foreground hover:bg-muted"
              onClick={() => navigate('/login')}
            >
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
