import {api} from './client';

/** POST /account/reactivation/submit — demande de réactivation (public, par email). */
export async function submitReactivation(
  email: string,
  reason: string,
): Promise<{success: boolean; message: string}> {
  const {data} = await api.post('/account/reactivation/submit', {email, reason});
  return data;
}

export interface ReactivationStatus {
  disable_type?: string | null;
  disable_until?: string | null;
  disabled_reason?: string | null;
  can_request?: boolean;
  cant_request_reason?: string | null;
  pending_request?: {id: string; reason: string; status: string} | null;
}

/** GET /account/reactivation/status — état de désactivation (public, par email). */
export async function reactivationStatus(email: string): Promise<ReactivationStatus> {
  const {data} = await api.get<ReactivationStatus>('/account/reactivation/status', {
    params: {email},
  });
  return data;
}
