import axios, {AxiosError, AxiosInstance} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL, STORAGE_KEYS} from '../config';

/**
 * Client HTTP centralisé.
 * - Injecte le Bearer token Sanctum sur chaque requête.
 * - Émet un événement de déconnexion sur 401 (token invalide/expiré).
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {Accept: 'application/json'},
});

// Callback branché par l'AuthContext pour forcer la déconnexion sur 401.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(cb: (() => void) | null) {
  onUnauthorized = cb;
}

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Extrait un message d'erreur lisible d'une réponse API Laravel. */
export function apiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  const err = error as AxiosError<any>;
  const data = err?.response?.data;
  if (data?.message) return data.message;
  // Erreurs de validation Laravel : { errors: { champ: [msg] } }
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first[0]) return String(first[0]);
  }
  if (err?.message === 'Network Error') return 'Connexion impossible. Vérifie ta connexion internet.';
  return fallback;
}
