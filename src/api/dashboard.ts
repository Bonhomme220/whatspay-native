import {api} from './client';

export interface DashboardStats {
  in_progress?: number;
  completion?: number;
  [key: string]: any;
}

export interface RecentAssignment {
  id: string;
  status: string;
  task?: {name?: string};
  [key: string]: any;
}

export interface DashboardData {
  user: any;
  stats: DashboardStats;
  recent_assignments: RecentAssignment[];
  earnings: any;
  monthly: {months: string[]; completed: number[]; gains: number[]};
  faqs: any[];
  show_whatsapp_channel_modal?: boolean;
}

/** GET /dashboard — données de l'accueil diffuseur. */
export async function fetchDashboard(): Promise<DashboardData> {
  const {data} = await api.get<DashboardData>('/dashboard');
  return data;
}
