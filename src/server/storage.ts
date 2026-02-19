import { Storage } from '@mondaycom/apps-sdk';
import { Product } from './schemas';

function getStorage(token: string): Storage {
  return new Storage(token);
}

export async function getFragrances(token: string): Promise<Product[]> {
  const storage = getStorage(token);
  const { value } = await storage.get('fragrances');
  if (!value) return [];
  return JSON.parse(value as string);
}

export async function saveFragrances(fragrances: Product[], token: string): Promise<void> {
  const storage = getStorage(token);
  await storage.set('fragrances', JSON.stringify(fragrances));
}
