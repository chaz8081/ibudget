import { createContext } from "react";

export type AuthUser = {
  id: string;
  email?: string;
  displayName?: string;
};

export type AuthContextType = {
  session: unknown | null;
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => ({ needsConfirmation: false }),
  signOut: async () => {},
  resetPassword: async () => {},
});
