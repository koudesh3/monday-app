import dotenv from 'dotenv';

dotenv.config();

if (!process.env.MONDAY_CLIENT_SECRET) {
    throw new Error('Missing MONDAY_CLIENT_SECRET');
}
if (!process.env.MONDAY_API_TOKEN) {
    throw new Error('Missing MONDAY_API_TOKEN');
}

const clientSecret = process.env.MONDAY_CLIENT_SECRET;
const mondayApiToken = process.env.MONDAY_API_TOKEN;
const port = Number(process.env.PORT ?? 8080);

export { clientSecret, mondayApiToken, port };