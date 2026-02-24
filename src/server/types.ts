/**
 * Hono environment types
 * Defines context variables available in request handlers
 */

import { SessionUser } from './schemas';

/**
 * Request context variables
 */
export type Env = {
    Variables: {
        user: SessionUser;
        accountId: string;
    };
};
