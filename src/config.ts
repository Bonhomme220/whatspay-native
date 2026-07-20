/**
 * Configuration globale de l'app.
 *
 * API_BASE_URL : racine de l'API Laravel (Sanctum).
 *  - Prod : https://app.whatspay.africa/api
 *  - Émulateur Android vers un backend local : http://10.0.2.2:8000/api
 *  - Appareil physique vers un PC local : http://<IP_DU_PC>:8000/api
 */
export const API_BASE_URL = 'https://app.whatspay.africa/api';

/** Nom du token Sanctum créé côté backend (login → createToken('mobile-app')). */
export const TOKEN_NAME = 'mobile-app';

/** Clés de stockage local (AsyncStorage). */
export const STORAGE_KEYS = {
  token: '@whatspay/token',
  user: '@whatspay/user',
  profil: '@whatspay/profil',
} as const;
