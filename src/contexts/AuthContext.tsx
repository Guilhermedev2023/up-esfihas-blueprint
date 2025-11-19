import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface User {
  id: string;
  nome: string;
  email: string;
  telefone: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  bairro: string;
  senha: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find((u: any) => u.email === email && u.senha === password);

    if (foundUser) {
      const userData = {
        id: foundUser.id,
        nome: foundUser.nome,
        email: foundUser.email,
        telefone: foundUser.telefone
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success('Login realizado com sucesso');
      return true;
    }

    toast.error('Email ou senha incorretos');
    return false;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.some((u: any) => u.email === data.email)) {
      toast.error('Email já cadastrado');
      return false;
    }

    const newUser = {
      id: Date.now().toString(),
      ...data
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    const userData = {
      id: newUser.id,
      nome: newUser.nome,
      email: newUser.email,
      telefone: newUser.telefone
    };
    
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    toast.success('Cadastro realizado com sucesso');
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
