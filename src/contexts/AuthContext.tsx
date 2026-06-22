import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  bairro: string | null;
}

interface AuthContextType {
  user: Profile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
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
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user profile from database
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Use setTimeout to avoid potential race conditions with Supabase
          setTimeout(async () => {
            const profile = await fetchProfile(currentSession.user.id);
            setUser(profile);
            setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      
      if (existingSession?.user) {
        const profile = await fetchProfile(existingSession.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error('Erro ao fazer login: ' + error.message);
        }
        return false;
      }

      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        setUser(profile);
        toast.success('Login realizado com sucesso');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login');
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            nome: data.nome,
            full_name: data.nome,
            telefone: data.telefone,
            endereco: data.endereco,
            bairro: data.bairro
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Email já cadastrado');
        } else if (error.message.includes('Database error saving new user')) {
          toast.error('Não foi possível criar a conta. Verifique se o telefone já está cadastrado.');
        } else {
          toast.error('Erro ao cadastrar: ' + error.message);
        }
        return false;
      }

      if (authData.session?.user) {
        setSession(authData.session);
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 500));
        const profile = await fetchProfile(authData.session.user.id);
        setUser(profile);
        toast.success('Cadastro realizado com sucesso');
        return true;
      }

      if (authData.user) {
        toast.success('Cadastro realizado com sucesso');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Erro ao cadastrar');
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      localStorage.removeItem('cart');
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      login, 
      register, 
      logout, 
      isAuthenticated: !!session && !!user,
      loading 
    }}>
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
