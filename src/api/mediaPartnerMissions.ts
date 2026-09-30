import {api} from './client';

/**
 * API Partenaire Média (chaînes WhatsApp) — missions de publication sponsorisée.
 * Namespace backend séparé du diffuseur : /api/media-partner/missions...
 * Compte sans lien avec un compte diffuseur (login distinct), donc types et écrans dédiés.
 */

export type MediaPartnerMissionStatus =
  | 'ASSIGNED'
  | 'PENDING'
  | 'SUBMITED'
  | 'SUBMISSION_ACCEPTED'
  | 'SUBMISSION_REJECTED'
  | 'EXPIRED';

export interface MediaPartnerTask {
  id: string;
  name: string;
  description?: string | null;
  startdate?: string | null;
  enddate?: string | null;
  campaign_type?: 'notoriete' | 'conversion' | string;
  media_type?: 'image' | 'video' | 'pdf' | 'text' | string;
  files?: string | null;
  url?: string | null;
  legend?: string | null;
  client_name?: string | null;
}

export interface MediaPartnerTrackingStats {
  unique_clicks: number;
}

export interface MediaPartnerMission {
  id: string;
  status: MediaPartnerMissionStatus;
  expected_gain: number;
  gain: number;
  vues: number;
  post_link?: string | null;
  click_bonus?: number | null;
  click_bonus_clicks?: number | null;
  assignment_date?: string | null;
  response_date?: string | null;
  submission_date?: string | null;
  tracking_url?: string | null;
  requires_screenshot: boolean;
  task: MediaPartnerTask;
  // Uniquement sur le détail (GET /media-partner/missions/{id}) :
  reason_title?: string | null;
  reason_description?: string | null;
  tracking_stats?: MediaPartnerTrackingStats | null;
}

export interface MediaPartnerMissionsResponse {
  disponibles: MediaPartnerMission[];
  en_cours: MediaPartnerMission[];
  terminees: MediaPartnerMission[];
  gains_cumules: number;
}

/** GET /media-partner/missions → { disponibles, en_cours, terminees, gains_cumules }. */
export async function fetchMediaPartnerMissions(): Promise<MediaPartnerMissionsResponse> {
  const {data} = await api.get<MediaPartnerMissionsResponse>('/media-partner/missions');
  return data;
}

/** GET /media-partner/missions/{id} → détail (+ reason_title/description, tracking_stats). */
export async function fetchMediaPartnerMission(id: string): Promise<MediaPartnerMission> {
  const {data} = await api.get<MediaPartnerMission>(`/media-partner/missions/${id}`);
  return data;
}

/** POST /media-partner/missions/{id}/accept — le partenaire média accepte la mission. */
export async function acceptMediaPartnerMission(id: string): Promise<{message: string}> {
  const {data} = await api.post(`/media-partner/missions/${id}/accept`);
  return data;
}

export interface MediaPartnerProofFile {
  uri: string;
  type?: string;
  fileName?: string;
}

/**
 * POST /media-partner/missions/{id}/submit — multipart/form-data.
 * - post_link : toujours requis.
 * - vues + files : requis seulement si la mission exige une capture (palier de portée le
 *   plus bas — requires_screenshot=true) ; files redevient optionnel en cas de
 *   resoumission d'une mission déjà SUBMITED (on garde la capture existante si absente).
 */
export async function submitMediaPartnerMission(
  id: string,
  params: {postLink: string; vues?: number; file?: MediaPartnerProofFile | null},
): Promise<{message: string}> {
  const form = new FormData();
  form.append('post_link', params.postLink);
  if (params.vues !== undefined) {
    form.append('vues', String(params.vues));
  }
  if (params.file) {
    form.append('files', {
      uri: params.file.uri,
      type: params.file.type ?? 'image/jpeg',
      name: params.file.fileName ?? 'preuve.jpg',
    } as any);
  }

  const {data} = await api.post(`/media-partner/missions/${id}/submit`, form, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
  return data;
}
