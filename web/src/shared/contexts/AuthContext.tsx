import { createContext, useContext, useEffect, useState } from 'react';
import { pb } from '@/shared/lib/pocketbase';
import { type RecordModel } from 'pocketbase';

interface AuthContextType {
  user: RecordModel | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.record);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(() => {
      setUser(pb.authStore.record);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    await pb.collection('users').authWithPassword(email, pass);
  };

  const logout = () => {
    pb.authStore.clear();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
