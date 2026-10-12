import { createContext, useContext } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: { full_name?: string };
}

export interface AuthSession {
  access_token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

export interface AuthResult {
  data: { user: AuthUser; session: AuthSession } | null;
  error: Error | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
