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

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  phonecountry_id: string;
  country_id: string;
  locality_id: string;
  birthdate: string; // YYYY-MM-DD
  vuesmoyen: number;
  lang_id: string;
  study_id: string;
  categories: string[];
  contentTypes: string[];
  occupation_id?: string;
  ambassador_code?: string;
  arrondissement_locality_id?: string;
  quartier_locality_id?: string;
}

export interface RegisterResult {
  token?: string;
  profil?: 'DIFFUSEUR' | 'ANNONCEUR';
  user?: AuthUser;
  message?: string;
}

/** POST /auth/register → auto-login (token) si la vérification est bypassée, sinon message. */
export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  const {data} = await api.post<RegisterResult>('/auth/register', payload);
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
