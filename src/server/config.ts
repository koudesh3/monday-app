import dotenv from 'dotenv';

dotenv.config();

if (!process.env.MONDAY_SIGNING_SECRET) {
    throw new Error('Missing MONDAY_SIGNING_SECRET');
}
const signingSecret = process.env.MONDAY_SIGNING_SECRET;

const port = Number(process.env.PORT ?? 8080);

export { signingSecret, port };