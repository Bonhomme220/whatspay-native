import {api} from './client';

export interface MissionTask {
  id: string;
  name: string;
  description?: string;
  startdate?: string;
  enddate?: string;
  type?: string;
  campaign_type?: string;
  media_type?: string;
  files?: any;
  url?: string;
  legend?: string;
  is_onboarding?: boolean;
  is_civic?: boolean;
  client_name?: string;
  category?: {id: string; name: string} | null;
}

export interface Mission {
  id: string;
  status: string;
  expected_gain: number;
  gain: number;
  vues: number;
  assignment_date?: string;
  response_date?: string;
  submission_date?: string;
  tracking_url?: string;
  task?: MissionTask;
  complaint?: any;
  tracking_stats?: TrackingStats | null;
}

export interface TrackingStats {
  total_clicks: number;
  unique_clicks: number;
  conversions: number;
  conversion_rate: number;
}

export interface MissionsResponse {
  disponibles: Mission[];
  en_cours: Mission[];
  terminees: Mission[];
  gains_cumules: number;
}

/** GET /missions → { disponibles, en_cours, terminees, gains_cumules }. */
export async function fetchMissions(): Promise<MissionsResponse> {
  const {data} = await api.get<MissionsResponse>('/missions');
  return data;
}

/** GET /missions/{id} → détail d'une mission (assignment formaté). */
export async function fetchMission(id: string): Promise<Mission> {
  const {data} = await api.get<Mission>(`/missions/${id}`);
  return data;
}

/** POST /missions/{id}/accept — le diffuseur accepte de participer. */
export async function acceptMission(id: string): Promise<{message: string}> {
  const {data} = await api.post(`/missions/${id}/accept`);
  return data;
}

export interface ProofFile {
  uri: string;
  type?: string;
  fileName?: string;
}

/** POST /assignments/{id}/submit — soumission de preuve (multipart : vues + capture). */
export async function submitProof(
  assignmentId: string,
  vues: number,
  file: ProofFile,
): Promise<{success: boolean; message: string}> {
  const form = new FormData();
  form.append('vues', String(vues));
  form.append('files', {
    uri: file.uri,
    type: file.type ?? 'image/jpeg',
    name: file.fileName ?? 'preuve.jpg',
  } as any);

  const {data} = await api.post(`/assignments/${assignmentId}/submit`, form, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
  return data;
}
