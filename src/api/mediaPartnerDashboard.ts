import {api} from './client';
import {MediaPartnerMissionStatus} from './mediaPartnerMissions';
import {MediaPartnerStatus, MediaPartnerTier} from './mediaPartnerProfile';

/**
 * API Partenaire Média — accueil (chiffres de la chaîne, missions récentes, solde, FAQ).
 * Namespace backend séparé du diffuseur : /api/media-partner/dashboard.
 */

export interface MediaPartnerDashboardMission {
  id: string;
  task_name: string | null;
  status: MediaPartnerMissionStatus;
  gain: number;
  assignment_date: string | null;
}

export interface MediaPartnerDashboardFaq {
  id: string;
  question: string;
  answer: string;
}

export interface MediaPartnerDashboardMissionsStats {
  total: number;
  in_progress: number;
  completed: number;
}

export interface MediaPartnerDashboardData {
  channel_name: string;
  status: MediaPartnerStatus;
  current_tier: MediaPartnerTier | null;
  reached_accounts_30d: number;
  consecutive_missed_recaptures: number;
  recapture_needed: boolean;
  recapture_window_open: boolean;
  balance: number;
  missions_stats: MediaPartnerDashboardMissionsStats;
  recent_missions: MediaPartnerDashboardMission[];
  faqs: MediaPartnerDashboardFaq[];
}

/** GET /media-partner/dashboard → accueil du partenaire média. */
export async function fetchMediaPartnerDashboard(): Promise<MediaPartnerDashboardData> {
  const {data} = await api.get<MediaPartnerDashboardData>('/media-partner/dashboard');
  return data;
}
