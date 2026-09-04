import { useQuery } from '@tanstack/react-query';

export type UserRole = 'admin' | 'user';

// A API local controlará as permissões; mantemos o comportamento atual da interface.
export const useUserRole = (userId?: string) => {
  return useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      return 'admin' as UserRole;
    },
    enabled: !!userId,
  });
};
