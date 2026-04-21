import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import i18n from "i18next";

import * as authApi from "@/api/auth";
import { ApiError, ensureCsrf } from "@/api/client";
import type { User } from "@/types";

type AuthStatus = "loading" | "authenticated" | "guest";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (data: { email: string; password: string; full_name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function syncUILang(code: string | undefined | null) {
  if (code && i18n.language !== code) {
    void i18n.changeLanguage(code);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureCsrf();
      try {
        const me = await authApi.fetchMe();
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
          syncUILang(me.language);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          if (!cancelled) setStatus("guest");
        } else if (!cancelled) {
          setStatus("guest");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const me = await authApi.login({ email, password, remember_me: rememberMe });
    setUser(me);
    setStatus("authenticated");
    syncUILang(me.language);
  }, []);

  const signup = useCallback(async (data: { email: string; password: string; full_name?: string }) => {
    const me = await authApi.signup(data);
    setUser(me);
    setStatus("authenticated");
    syncUILang(me.language);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus("guest");
  }, []);

  const setLanguage = useCallback(async (language: string) => {
    // Оновлюємо локальний стан + i18n одразу для швидкого UX; збереження — потім.
    void i18n.changeLanguage(language);
    setUser((u) => (u ? { ...u, language } : u));
    try {
      const me = await authApi.updateMe({ language });
      setUser(me);
    } catch {
      // Ігноруємо помилки збереження — UI вже локалізовано; наступний логін узгодить.
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, login, signup, logout, setLanguage }),
    [user, status, login, signup, logout, setLanguage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
