import {api} from './client';

export interface Complaint {
  id: string;
  status: string;
  message: string;
  admin_note?: string | null;
  created_at?: string;
  resolved_at?: string | null;
  task_name?: string;
  assignment_id?: string;
}

/** GET /complaints — réclamations du diffuseur. */
export async function fetchComplaints(): Promise<Complaint[]> {
  const {data} = await api.get<Complaint[]>('/complaints');
  return Array.isArray(data) ? data : [];
}

/** POST /missions/{id}/complaint — dépose une réclamation sur une mission. */
export async function createComplaint(
  missionId: string,
  message: string,
): Promise<{success: boolean; message: string}> {
  const {data} = await api.post(`/missions/${missionId}/complaint`, {message});
  return data;
}
