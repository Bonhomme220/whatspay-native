import {api} from './client';

export interface Ref {
  id: string;
  name: string;
}

async function getList(url: string): Promise<Ref[]> {
  const {data} = await api.get<Ref[]>(url);
  return Array.isArray(data) ? data : [];
}

export const fetchCountries = () => getList('/countries');
export const fetchLocalities = (countryId: string) => getList(`/localities/by-country/${countryId}`);
export const fetchArrondissements = (localityId: string) => getList(`/localities/${localityId}/arrondissements`);
export const fetchQuartiers = (arrId: string) => getList(`/arrondissements/${arrId}/quartiers`);
export const fetchCategories = () => getList('/categories');
export const fetchContentTypes = () => getList('/contenttypes');
export const fetchLangs = () => getList('/langs');
export const fetchStudies = () => getList('/studies');
export const fetchOccupations = () => getList('/occupations');
