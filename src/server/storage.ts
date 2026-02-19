import { Product } from './schemas';

export async function getFragrances(_token: string): Promise<Product[]> {
  throw new Error('not implemented');
}

export async function saveFragrances(_fragrances: Product[], _token: string): Promise<void> {
  throw new Error('not implemented');
}
