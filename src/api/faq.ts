import {api} from './client';

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

/** GET /faq — questions fréquentes publiées. */
export async function fetchFaq(): Promise<Faq[]> {
  const {data} = await api.get<Faq[]>('/faq');
  return Array.isArray(data) ? data : [];
}
