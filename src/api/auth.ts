import {api} from './client';

export interface AuthUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
}

export interface LoginResult {
  token: string;
  profil: 'DIFFUSEUR' | 'ANNONCEUR';
  user: AuthUser;
}

/** POST /auth/login → { token, profil, user }. Lève l'erreur Axios en cas d'échec. */
export async function login(email: string, password: string): Promise<LoginResult> {
  const {data} = await api.post<LoginResult>('/auth/login', {email, password});
  return data;
}

/** POST /auth/logout (révoque le token courant côté serveur). Best-effort. */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // On déconnecte localement quoi qu'il arrive.
  }
}

/** POST /fcm-token — enregistre le token FCM du device pour les push. */
export async function registerFcmToken(token: string): Promise<void> {
  await api.post('/fcm-token', {fcm_token: token});
}
