import { SecureStorage } from '@mondaycom/apps-sdk';
import { Product } from './schemas';

const storage = new SecureStorage();

export async function getFragrances(accountId: string): Promise<Product[]> {
  const value = await storage.get<Product[]>(`fragrances_${accountId}`);
  return value ?? [];
}

export async function saveFragrances(fragrances: Product[], accountId: string): Promise<void> {
  await storage.set(`fragrances_${accountId}`, fragrances);
}
