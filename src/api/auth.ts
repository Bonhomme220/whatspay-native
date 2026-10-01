import {api} from './client';

export interface AuthUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
}

export interface LoginResult {
  token: string;
  profil: 'DIFFUSEUR' | 'ANNONCEUR' | 'PARTENAIRE_MEDIA';
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

/** POST /auth/forgot-password — envoie un code de réinitialisation par email. */
export async function forgotPassword(email: string): Promise<{message?: string}> {
  const {data} = await api.post('/auth/forgot-password', {email});
  return data;
}

/** POST /auth/reset-password — réinitialise via email + code reçu. */
export async function resetPassword(
  email: string,
  code: string,
  password: string,
  password_confirmation: string,
): Promise<{message?: string}> {
  const {data} = await api.post('/auth/reset-password', {
    email,
    code,
    password,
    password_confirmation,
  });
  return data;
}

/**
 * POST /auth/reset-verify-identity — vérifie l'identité (téléphone + date de
 * naissance simultanément) et renvoie un jeton court à usage unique.
 */
export async function verifyResetIdentity(
  phone: string,
  birthdate: string,
): Promise<{message?: string; token: string; firstname?: string}> {
  const {data} = await api.post('/auth/reset-verify-identity', {phone, birthdate});
  return data;
}

/** POST /auth/reset-with-identity — pose le nouveau mot de passe via le jeton d'identité. */
export async function resetPasswordWithIdentity(
  token: string,
  password: string,
  password_confirmation: string,
): Promise<{message?: string}> {
  const {data} = await api.post('/auth/reset-with-identity', {
    token,
    password,
    password_confirmation,
  });
  return data;
}

/** POST /fcm-token — enregistre le token FCM du device pour les push. */
export async function registerFcmToken(token: string): Promise<void> {
  await api.post('/fcm-token', {fcm_token: token});
}

export type MediaPartnerAccountType =
  | 'personne'
  | 'media'
  | 'marque'
  | 'communaute'
  | 'institution_religieuse';

export type MediaPartnerPublishFrequency = '1x' | '2x' | '3x' | '5x_plus';

export interface MediaPartnerCountryCoverage {
  country_id: string;
  percentage: number;
}

export interface MediaPartnerImage {
  uri: string;
  type?: string;
  fileName?: string;
}

export interface RegisterMediaPartnerPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  phonecountry_id: string;
  country_id: string;
  channel_name: string;
  channel_link: string;
  account_type: MediaPartnerAccountType;
  channel_category_id: string;
  channel_category_secondary_ids?: string[];
  lang_id: string;
  publish_frequency: MediaPartnerPublishFrequency;
  followers_count: number;
  reached_accounts_30d: number;
  payment_method_id: string;
  country_coverage: MediaPartnerCountryCoverage[];
  screenshot_channel_page: MediaPartnerImage;
  screenshot_couverture: MediaPartnerImage;
  screenshot_followers: MediaPartnerImage;
  screenshot_admin_page: MediaPartnerImage;
}

export interface RegisterMediaPartnerResult {
  message?: string;
  token?: string;
  profil?: 'PARTENAIRE_MEDIA';
  user?: AuthUser;
}

/**
 * POST /auth/register-media-partner — inscription Partenaire Média (chaîne WhatsApp),
 * multipart/form-data (identité + infos chaîne + couverture pays + 4 captures d'écran).
 * Le backend renvoie un token : le compte est connecté immédiatement, en attente de
 * validation admin (banni visible sur le dashboard Partenaire Média tant que pending).
 */
export async function registerMediaPartner(
  payload: RegisterMediaPartnerPayload,
): Promise<RegisterMediaPartnerResult> {
  const form = new FormData();
  form.append('firstname', payload.firstname);
  form.append('lastname', payload.lastname);
  form.append('email', payload.email);
  form.append('password', payload.password);
  form.append('password_confirmation', payload.password_confirmation);
  form.append('phone', payload.phone);
  form.append('phonecountry_id', payload.phonecountry_id);
  form.append('country_id', payload.country_id);
  form.append('channel_name', payload.channel_name);
  form.append('channel_link', payload.channel_link);
  form.append('account_type', payload.account_type);
  form.append('channel_category_id', payload.channel_category_id);
  (payload.channel_category_secondary_ids ?? []).forEach(id => {
    form.append('channel_category_secondary_ids[]', id);
  });
  form.append('lang_id', payload.lang_id);
  form.append('publish_frequency', payload.publish_frequency);
  form.append('followers_count', String(payload.followers_count));
  form.append('reached_accounts_30d', String(payload.reached_accounts_30d));
  form.append('payment_method_id', payload.payment_method_id);

  payload.country_coverage.forEach((row, i) => {
    form.append(`country_coverage[${i}][country_id]`, row.country_id);
    form.append(`country_coverage[${i}][percentage]`, String(row.percentage));
  });

  const appendImage = (field: string, img: MediaPartnerImage) => {
    form.append(field, {
      uri: img.uri,
      type: img.type ?? 'image/jpeg',
      name: img.fileName ?? `${field}.jpg`,
    } as any);
  };
  appendImage('screenshot_channel_page', payload.screenshot_channel_page);
  appendImage('screenshot_couverture', payload.screenshot_couverture);
  appendImage('screenshot_followers', payload.screenshot_followers);
  appendImage('screenshot_admin_page', payload.screenshot_admin_page);

  const {data} = await api.post<RegisterMediaPartnerResult>('/auth/register-media-partner', form, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
  return data;
}
