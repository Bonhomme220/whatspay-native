import {api} from './client';

/**
 * API Partenaire Média (chaînes WhatsApp) — profil de chaîne + recapture mensuelle.
 * Namespace backend séparé du diffuseur : /api/media-partner/profile, /api/media-partner/recapture.
 * Compte sans lien avec un compte diffuseur (login distinct), donc types et écrans dédiés.
 */

export type MediaPartnerStatus = 'actif' | 'inactif' | 'off';
export type MediaPartnerRecaptureStatus = 'pending' | 'approved' | 'rejected';

export interface MediaPartnerTier {
  label: string;
  flat_price: number;
}

export interface MediaPartnerProfileCountryCoverage {
  country_id: string;
  country: string;
  percentage: number;
}

export interface MediaPartnerCurrentMonthRecapture {
  status: MediaPartnerRecaptureStatus;
  submitted_at: string;
  rejection_reason?: string | null;
}

export interface MediaPartnerProfile {
  channel_name: string;
  status: MediaPartnerStatus;
  onboarding_status: 'approved' | string;
  followers_count: number;
  reached_accounts_30d: number;
  current_tier: MediaPartnerTier | null;
  last_recapture_at: string | null;
  consecutive_missed_recaptures: number;
  country_coverage: MediaPartnerProfileCountryCoverage[];
  current_month_recapture: MediaPartnerCurrentMonthRecapture | null;
  /** Informatif seulement (jours 5-10 du mois) — le backend accepte la soumission tout le mois. */
  recapture_window_open: boolean;
  /** true si aucune recapture ce mois-ci, ou si la dernière a été rejetée (resoumission nécessaire). */
  recapture_needed: boolean;
}

/** GET /media-partner/profile → chiffres actuels de la chaîne + état de la recapture du mois. */
export async function fetchMediaPartnerProfile(): Promise<MediaPartnerProfile> {
  const {data} = await api.get<MediaPartnerProfile>('/media-partner/profile');
  return data;
}

export interface MediaPartnerRecaptureCoverageRow {
  country_id: string;
  percentage: number;
}

export interface MediaPartnerRecaptureImage {
  uri: string;
  type?: string;
  fileName?: string;
}

/**
 * POST /media-partner/recapture — multipart/form-data.
 * followers, reached_accounts_30d, country_coverage[i][country_id]/[percentage] (>= 1 ligne),
 * screenshot_channel_page/screenshot_couverture/screenshot_followers (3 images requises).
 */
export async function submitMediaPartnerRecapture(params: {
  followers: number;
  reachedAccounts30d: number;
  countryCoverage: MediaPartnerRecaptureCoverageRow[];
  screenshotChannelPage: MediaPartnerRecaptureImage;
  screenshotCouverture: MediaPartnerRecaptureImage;
  screenshotFollowers: MediaPartnerRecaptureImage;
}): Promise<{message: string}> {
  const form = new FormData();
  form.append('followers', String(params.followers));
  form.append('reached_accounts_30d', String(params.reachedAccounts30d));

  params.countryCoverage.forEach((row, i) => {
    form.append(`country_coverage[${i}][country_id]`, row.country_id);
    form.append(`country_coverage[${i}][percentage]`, String(row.percentage));
  });

  const appendImage = (field: string, img: MediaPartnerRecaptureImage) => {
    form.append(field, {
      uri: img.uri,
      type: img.type ?? 'image/jpeg',
      name: img.fileName ?? `${field}.jpg`,
    } as any);
  };
  appendImage('screenshot_channel_page', params.screenshotChannelPage);
  appendImage('screenshot_couverture', params.screenshotCouverture);
  appendImage('screenshot_followers', params.screenshotFollowers);

  const {data} = await api.post<{message: string}>('/media-partner/recapture', form, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
  return data;
}
