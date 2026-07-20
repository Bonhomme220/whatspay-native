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
