import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '../config';
import {setUnauthorizedHandler} from '../api/client';
import {AuthUser, login as apiLogin, logout as apiLogout, LoginResult} from '../api/auth';
import {markChannelJoined} from '../api/kyc';

type Profil = 'DIFFUSEUR' | 'ANNONCEUR' | 'PARTENAIRE_MEDIA' | null;

interface AuthState {
  ready: boolean; // bootstrap terminé (lecture du stockage)
  token: string | null;
  user: AuthUser | null;
  profil: Profil;
  /** Étape obligatoire "Rejoindre le canal WhatsApp" en attente (posée juste après une
   * inscription diffuseur) — bloque l'accès au reste de l'app tant que non complétée. */
  pendingWhatsAppStep: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Applique une session déjà obtenue (ex : auto-login après inscription). `requireWhatsAppStep`
   * pose l'étape obligatoire ci-dessus (inscription diffuseur uniquement, pas la connexion). */
  applyAuth: (token: string, user: AuthUser, profil: Exclude<Profil, null>, opts?: {requireWhatsAppStep?: boolean}) => Promise<void>;
  completeWhatsAppStep: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profil, setProfil] = useState<Profil>(null);
  const [pendingWhatsAppStep, setPendingWhatsAppStep] = useState(false);

  const clearLocal = useCallback(async () => {
    setToken(null);
    setUser(null);
    setProfil(null);
    setPendingWhatsAppStep(false);
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.token),
      AsyncStorage.removeItem(STORAGE_KEYS.user),
      AsyncStorage.removeItem(STORAGE_KEYS.profil),
      AsyncStorage.removeItem(STORAGE_KEYS.pendingWhatsAppStep),
    ]);
  }, []);

  // Bootstrap : restaure la session depuis le stockage au démarrage. L'étape WhatsApp en
  // attente est aussi restaurée — si l'utilisateur ferme l'app avant de la compléter, elle
  // réapparaît au prochain lancement (pas d'échappatoire, décision founder 2026-10-02).
  useEffect(() => {
    (async () => {
      try {
        const [t, u, p, w] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.token),
          AsyncStorage.getItem(STORAGE_KEYS.user),
          AsyncStorage.getItem(STORAGE_KEYS.profil),
          AsyncStorage.getItem(STORAGE_KEYS.pendingWhatsAppStep),
        ]);
        if (t) {
          setToken(t);
          setUser(u ? JSON.parse(u) : null);
          setProfil((p as Profil) ?? null);
          setPendingWhatsAppStep(w === '1');
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
    async (t: string, u: AuthUser, p: Exclude<Profil, null>, opts?: {requireWhatsAppStep?: boolean}) => {
      const requireStep = !!opts?.requireWhatsAppStep;
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.token, t),
        AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(u)),
        AsyncStorage.setItem(STORAGE_KEYS.profil, p),
        requireStep
          ? AsyncStorage.setItem(STORAGE_KEYS.pendingWhatsAppStep, '1')
          : AsyncStorage.removeItem(STORAGE_KEYS.pendingWhatsAppStep),
      ]);
      setToken(t);
      setUser(u);
      setProfil(p);
      setPendingWhatsAppStep(requireStep);
    },
    [],
  );

  const completeWhatsAppStep = useCallback(async () => {
    setPendingWhatsAppStep(false);
    await AsyncStorage.removeItem(STORAGE_KEYS.pendingWhatsAppStep);
    markChannelJoined().catch(() => {});
  }, []);

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
    () => ({ready, token, user, profil, pendingWhatsAppStep, signIn, applyAuth, completeWhatsAppStep, signOut}),
    [ready, token, user, profil, pendingWhatsAppStep, signIn, applyAuth, completeWhatsAppStep, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
