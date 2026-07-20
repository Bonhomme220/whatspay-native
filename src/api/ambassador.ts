import {api} from './client';

export interface AmbassadorReferral {
  id: string;
  name: string;
  joined_at?: string;
  missions?: number;
}

export interface AmbassadorData {
  is_ambassador: boolean;
  ambassador_code: string | null;
  gain_per_view: number;
  is_eligible: boolean;
  has_referrer: boolean;
  stat?: {active_referrals: number; total_referrals: number} | null;
  referrals: AmbassadorReferral[];
}

/** GET /ambassador — état du programme ambassadeur. */
export async function fetchAmbassador(): Promise<AmbassadorData> {
  const {data} = await api.get<AmbassadorData>('/ambassador');
  return data;
}

/** POST /ambassador/activate — devient ambassadeur (si éligible). */
export async function activateAmbassador(): Promise<{success: boolean; message: string; ambassador_code?: string}> {
  const {data} = await api.post('/ambassador/activate');
  return data;
}

/** POST /ambassador/enter-code — renseigne le code d'un parrain. */
export async function enterAmbassadorCode(code: string): Promise<{success: boolean; message: string}> {
  const {data} = await api.post('/ambassador/enter-code', {ambassador_code: code});
  return data;
}
