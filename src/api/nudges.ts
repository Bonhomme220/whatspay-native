import {api} from './client';

export type NudgeType = 'critical' | 'high' | 'ambassador' | 'normal';

export interface NudgeCta {
  label: string;
  screen?: string; // missions | mission_detail | wallet | ambassador | faq | complaints
  params?: {id?: string; [k: string]: any};
}

export interface Nudge {
  id: string;
  type: NudgeType;
  dismissible: boolean;
  title: string;
  message: string;
  cta?: NudgeCta | null;
}

export interface NudgesResponse {
  modal: Nudge | null;
  banners: Nudge[];
}

/** GET /nudges — bannières + modal contextuels du diffuseur (pilotés serveur). */
export async function fetchNudges(): Promise<NudgesResponse> {
  const {data} = await api.get<NudgesResponse>('/nudges');
  return {modal: data?.modal ?? null, banners: Array.isArray(data?.banners) ? data.banners : []};
}

/** POST /incident/acknowledge — marque le modal d'incident comme vu. */
export async function acknowledgeIncident(): Promise<void> {
  await api.post('/incident/acknowledge');
}
