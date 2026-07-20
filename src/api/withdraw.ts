import {api} from './client';

export type WithdrawMethod = 'mobile_money' | 'bank';

export interface WithdrawResult {
  success: boolean;
  message: string;
  transaction_id?: string | null;
  has_pending?: boolean;
}

export interface WithdrawPayload {
  amount: number;
  withdrawal_method: WithdrawMethod;
  phone?: string;
  bank_account?: string;
  bank_name?: string;
  account_holder?: string;
}

/** POST /withdraw — demande de retrait (mobile money ou banque). */
export async function requestWithdraw(payload: WithdrawPayload): Promise<WithdrawResult> {
  const {data} = await api.post<WithdrawResult>('/withdraw', payload);
  return data;
}
