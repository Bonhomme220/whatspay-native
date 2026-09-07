import {api} from './client';

export interface Ref {
  id: string;
  name: string;
}

async function getList(url: string): Promise<Ref[]> {
  const {data} = await api.get<any>(url);
  // Certains endpoints (localités/arrondissements/quartiers) renvoient
  // { success, data: [...], total } au lieu d'un tableau brut.
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export interface CountryRef extends Ref {
  phone_code?: string | null;
}

export const fetchCountries = () => getList('/countries');

/** Pays avec indicatif téléphonique (pour le préfixe du numéro). */
export const fetchCountriesWithCode = async (): Promise<CountryRef[]> => {
  const {data} = await api.get<CountryRef[]>('/countries');
  return Array.isArray(data) ? data : [];
};
export const fetchLocalities = (countryId: string) => getList(`/localities/by-country/${countryId}`);
export const fetchArrondissements = (localityId: string) => getList(`/localities/${localityId}/arrondissements`);
export const fetchQuartiers = (arrId: string) => getList(`/arrondissements/${arrId}/quartiers`);
export const fetchCategories = () => getList('/categories');
export const fetchContentTypes = () => getList('/contenttypes');
export const fetchLangs = () => getList('/langs');
export const fetchStudies = () => getList('/studies');
export const fetchOccupations = () => getList('/occupations');
