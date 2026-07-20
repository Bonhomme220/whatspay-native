import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '../config';
import {setUnauthorizedHandler} from '../api/client';
import {AuthUser, login as apiLogin, logout as apiLogout, LoginResult} from '../api/auth';

type Profil = 'DIFFUSEUR' | 'ANNONCEUR' | null;

interface AuthState {
  ready: boolean; // bootstrap terminé (lecture du stockage)
  token: string | null;
  user: AuthUser | null;
  profil: Profil;
  signIn: (email: string, password: string) => Promise<void>;
  /** Applique une session déjà obtenue (ex : auto-login après inscription). */
  applyAuth: (token: string, user: AuthUser, profil: Exclude<Profil, null>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profil, setProfil] = useState<Profil>(null);

  const clearLocal = useCallback(async () => {
    setToken(null);
    setUser(null);
    setProfil(null);
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.token),
      AsyncStorage.removeItem(STORAGE_KEYS.user),
      AsyncStorage.removeItem(STORAGE_KEYS.profil),
    ]);
  }, []);

  // Bootstrap : restaure la session depuis le stockage au démarrage.
  useEffect(() => {
    (async () => {
      try {
        const [t, u, p] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.token),
          AsyncStorage.getItem(STORAGE_KEYS.user),
          AsyncStorage.getItem(STORAGE_KEYS.profil),
        ]);
        if (t) {
          setToken(t);
          setUser(u ? JSON.parse(u) : null);
          setProfil((p as Profil) ?? null);
        }
      } catch {
        // ignore — session vide
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Déconnexion forcée sur 401 (token invalide/expiré).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearLocal();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearLocal]);

  const applyAuth = useCallback(
    async (t: string, u: AuthUser, p: Exclude<Profil, null>) => {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.token, t),
        AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(u)),
        AsyncStorage.setItem(STORAGE_KEYS.profil, p),
      ]);
      setToken(t);
      setUser(u);
      setProfil(p);
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res: LoginResult = await apiLogin(email.trim(), password);
      await applyAuth(res.token, res.user, res.profil);
    },
    [applyAuth],
  );

  const signOut = useCallback(async () => {
    await apiLogout();
    await clearLocal();
  }, [clearLocal]);

  const value = useMemo<AuthState>(
    () => ({ready, token, user, profil, signIn, applyAuth, signOut}),
    [ready, token, user, profil, signIn, applyAuth, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
