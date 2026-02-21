import { SessionUser } from './schemas';

export type Env = {
    Variables: {
        user: SessionUser;
        accountId: string;
    };
};
