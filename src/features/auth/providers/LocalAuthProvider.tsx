import React, { useEffect, useState, useCallback } from "react";
import * as Storage from "@/utils/storage";
import * as Crypto from "expo-crypto";
import { generateId } from "@/utils/uuid";
import { AuthContext, type AuthUser } from "../AuthContext";

const USERS_KEY = "ibudget_local_users";
const SESSION_KEY = "ibudget_local_session";
const SALT_LENGTH = 16;

type StoredUser = AuthUser & { passwordHash: string; salt: string };

async function hashPassword(password: string, salt: string): Promise<string> {
  const salted = salt + password;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salted);
}

async function getStoredUsers(): Promise<StoredUser[]> {
  const raw = await Storage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveStoredUsers(users: StoredUser[]): Promise<void> {
  await Storage.setItem(USERS_KEY, JSON.stringify(users));
}

export function LocalAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Storage.getItem(SESSION_KEY).then((raw) => {
      if (raw) {
        setUser(JSON.parse(raw));
      }
      setIsLoading(false);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const users = await getStoredUsers();
    const candidate = users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (!candidate) throw new Error("Invalid email or password");

    const hash = await hashPassword(password, candidate.salt);
    if (hash !== candidate.passwordHash)
      throw new Error("Invalid email or password");

    const found = candidate;

    const localUser: AuthUser = {
      id: found.id,
      email: found.email,
      displayName: found.displayName,
    };
    await Storage.setItem(SESSION_KEY, JSON.stringify(localUser));
    setUser(localUser);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const users = await getStoredUsers();
      if (
        users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
      ) {
        throw new Error("An account with this email already exists");
      }

      const salt = Array.from(
        Crypto.getRandomBytes(SALT_LENGTH),
        (b) => b.toString(16).padStart(2, "0")
      ).join("");
      const passwordHash = await hashPassword(password, salt);

      const newUser: StoredUser = {
        id: generateId(),
        email,
        displayName,
        passwordHash,
        salt,
      };
      await saveStoredUsers([...users, newUser]);

      const localUser: AuthUser = {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
      };
      await Storage.setItem(SESSION_KEY, JSON.stringify(localUser));
      setUser(localUser);
    },
    []
  );

  const signOut = useCallback(async () => {
    await Storage.deleteItem(SESSION_KEY);
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (_email: string) => {
    // No-op in local mode
  }, []);

  const session = user ? { user } : null;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
