import { SecureStorage } from '@mondaycom/apps-sdk';
import { Fragrance } from './schemas';

const storage = new SecureStorage();

export async function getFragrances(accountId: string): Promise<Fragrance[]> {
  const value = await storage.get<Fragrance[]>(`fragrances_${accountId}`);
  return value ?? [];
}

export async function saveFragrances(fragrances: Fragrance[], accountId: string): Promise<void> {
  await storage.set(`fragrances_${accountId}`, fragrances);
}
