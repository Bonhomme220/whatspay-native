import {api} from './client';

export interface TicketMessage {
  id: string;
  message: string;
  is_admin: boolean;
  is_ai: boolean;
  created_at?: string;
}

export interface TicketListItem {
  id: string;
  subject: string;
  status: string;
  needs_human: boolean;
  created_at?: string;
  updated_at?: string;
  last_message?: {message: string; is_admin: boolean; is_ai: boolean; created_at?: string} | null;
}

export interface TicketDetail {
  id: string;
  subject: string;
  status: string;
  needs_human: boolean;
  created_at?: string;
  messages: TicketMessage[];
}

/** GET /tickets — liste des tickets support du diffuseur. */
export async function fetchTickets(): Promise<TicketListItem[]> {
  const {data} = await api.get<TicketListItem[]>('/tickets');
  return data;
}

/** GET /tickets/{id} — détail + fil de messages. */
export async function fetchTicket(id: string): Promise<TicketDetail> {
  const {data} = await api.get<TicketDetail>(`/tickets/${id}`);
  return data;
}

/** POST /tickets — ouvre un nouveau ticket. */
export async function createTicket(subject: string, message: string): Promise<{success: boolean; id: string}> {
  const {data} = await api.post('/tickets', {subject, message});
  return data;
}

/** POST /tickets/{id}/reply — répond à un ticket. */
export async function replyTicket(id: string, message: string): Promise<void> {
  await api.post(`/tickets/${id}/reply`, {message});
}
