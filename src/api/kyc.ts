import {api} from './client';

export interface KycState {
  kyc_status: 'pending' | 'submitted' | 'verified' | 'rejected';
  attempt_status: 'pending' | 'manual_review' | 'resubmit' | 'approved' | 'rejected' | null;
  reason: string | null;
  required: boolean;
  deadline: string | null;
  attempts_left: number;
  verify_url: string | null;
}

/** GET /kyc/state — état de la vérification d'identité du diffuseur. */
export async function fetchKycState(): Promise<KycState> {
  const {data} = await api.get<KycState>('/kyc/state');
  return data;
}

/** POST /whatsapp-channel/shown — le prompt canal a été affiché. */
export async function markChannelShown(): Promise<void> {
  await api.post('/whatsapp-channel/shown');
}

/** POST /whatsapp-channel/joined — le diffuseur a rejoint le canal. */
export async function markChannelJoined(): Promise<void> {
  await api.post('/whatsapp-channel/joined');
}
