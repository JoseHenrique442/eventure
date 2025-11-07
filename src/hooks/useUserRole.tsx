import { useQuery } from '@tanstack/react-query';

export type UserRole = 'admin' | 'user';

// Temporário: usar role hardcoded 'admin' para testes
// TODO: Implementar endpoint de roles no backend MySQL
export const useUserRole = (userId?: string) => {
  return useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // Por enquanto, retorna 'admin' para permitir criar eventos
      // Quando o backend MySQL tiver suporte a roles, substituir por:
      // return await fetch(`http://localhost:3001/api/users/role`).then(r => r.json())
      
      return 'admin' as UserRole;
    },
    enabled: !!userId,
  });
};
