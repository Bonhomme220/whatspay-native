import {api} from './client';

export interface GainTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  reference?: string;
  receipt_url?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
}

export interface GainsResponse {
  balance: number;
  total_gain: number;
  total_debits: number;
  this_month: number;
  last_month: number;
  campagnes_terminees: number;
  total_vues: number;
  en_cours: number;
  par_vue: number;
  pending_withdrawal: number;
  transactions: GainTransaction[];
}

/** GET /gains — solde, cumuls et historique des transactions. */
export async function fetchGains(): Promise<GainsResponse> {
  const {data} = await api.get<GainsResponse>('/gains');
  return data;
}
