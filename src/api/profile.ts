import {api} from './client';

export interface ProfileData {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  birthdate?: string;
  vuesmoyen?: number;
  acceptance_rate?: number;
  completion_rate?: number;
  is_ambassador?: boolean;
  ambassador_code?: string;
  kyc_status?: string;
  country?: {id: string; name: string} | null;
  locality?: {id: string; name: string} | null;
  arrondissement?: {id: string; name: string} | null;
  quartier?: {id: string; name: string} | null;
  categories?: {id: string; name: string}[];
  occupation?: {id: string; name: string} | null;
  [key: string]: any;
}

/** GET /profile — profil complet du diffuseur. */
export async function fetchProfile(): Promise<ProfileData> {
  const {data} = await api.get<ProfileData>('/profile');
  return data;
}

/** POST /profile/change-password */
export async function changePassword(
  current_password: string,
  new_password: string,
  new_password_confirmation: string,
): Promise<{success: boolean; message: string}> {
  const {data} = await api.post('/profile/change-password', {
    current_password,
    new_password,
    new_password_confirmation,
  });
  return data;
}

/** POST /profile/update-location — précise arrondissement + quartier. */
export async function updateLocation(
  arrondissement_locality_id: string,
  quartier_locality_id: string,
): Promise<{success: boolean; message: string}> {
  const {data} = await api.post('/profile/update-location', {
    arrondissement_locality_id,
    quartier_locality_id,
  });
  return data;
}

/** POST /profile/delete-account — demande de suppression (motif requis). */
export async function requestDeletion(reason: string): Promise<{success: boolean; message: string}> {
  const {data} = await api.post('/profile/delete-account', {reason});
  return data;
}

/** POST /onboarding/complete — marque l'onboarding comme vu. */
export async function completeOnboarding(): Promise<void> {
  await api.post('/onboarding/complete');
}
