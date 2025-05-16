import { useAtom } from 'jotai';
import { userAtom } from '../atoms/user';
import { UserType } from '@/services/user';

export const useUser = () => {
  const [user, setUser] = useAtom(userAtom);

  const initializeUser = (user: UserType) => {
    setUser(user);
  };

  const clearUser = () => {
    setUser(null);
  };

  return {
    user,
    initializeUser,
    clearUser,
  };
}
