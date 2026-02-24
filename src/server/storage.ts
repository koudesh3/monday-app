/**
 * Fragrance storage
 * Manages persisted fragrance data using Monday SDK secure storage
 */

import { SecureStorage } from '@mondaycom/apps-sdk';
import { Fragrance } from './schemas';

const storage = new SecureStorage();

/**
 * Retrieves fragrances for an account
 * note: accountId is used as the multi-tenant partition key, i.e. fragrances_1234567
 */
export async function getFragrances(accountId: string): Promise<Fragrance[]> {
    const value = await storage.get<Fragrance[]>(`fragrances_${accountId}`);
    return value ?? [];
}

/**
 * Saves fragrances for an account
 */
export async function saveFragrances(fragrances: Fragrance[], accountId: string): Promise<void> {
    await storage.set(`fragrances_${accountId}`, fragrances);
}