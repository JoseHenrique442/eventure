import { AuthContext, type AuthResult, type AuthSession } from '@/hooks/useAuth';
import { type ReactNode, useEffect, useState } from 'react';
import { API_BASE_URL, AUTH_STORAGE_KEY } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const readStoredSession = (): AuthSession | null => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(readStoredSession);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedSession = readStoredSession();
    if (!storedSession) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${storedSession.access_token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Sessão expirada');
        const { user } = await response.json();
        const refreshedSession = { ...storedSession, user };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(refreshedSession));
        setSession(refreshedSession);
      })
      .catch(() => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setSession(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const authenticate = async (endpoint: 'signup' | 'signin', body: object): Promise<AuthResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha na autenticação');

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.session));
      setSession(data.session);
      toast({
        title: endpoint === 'signup' ? 'Cadastro realizado!' : 'Login realizado!',
        description: endpoint === 'signup' ? 'Sua conta está pronta para uso.' : 'Bem-vindo de volta.',
      });
      return { data, error: null };
    } catch (caughtError) {
      const error = caughtError instanceof Error ? caughtError : new Error('Falha na autenticação');
      toast({
        title: endpoint === 'signup' ? 'Erro no cadastro' : 'Erro no login',
        description: error.message,
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const signUp = (email: string, password: string, fullName: string) =>
    authenticate('signup', { email, password, fullName });

  const signIn = (email: string, password: string) =>
    authenticate('signin', { email, password });

  const signOut = async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession(null);
    toast({ title: 'Logout realizado', description: 'Até logo!' });
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

