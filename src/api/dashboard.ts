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
  show_tiered_payout_notice?: boolean;
  tiered_payout_notice?: {days_left: number; grace_end_date: string} | null;
}

/** GET /dashboard — données de l'accueil diffuseur. */
export async function fetchDashboard(): Promise<DashboardData> {
  const {data} = await api.get<DashboardData>('/dashboard');
  return data;
}

/** L'app a affiché le modal d'annonce du barème dégressif → marque le jour (1x/jour). */
export async function markTieredPayoutNoticeShown(): Promise<void> {
  await api.post('/tiered-payout-notice/shown');
}
