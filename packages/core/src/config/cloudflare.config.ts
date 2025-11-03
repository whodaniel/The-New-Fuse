import { registerAs } from '@nestjs/config';

export default registerAs('cloudflare', () => ({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiKey: process.env.CLOUDFLARE_API_KEY,
  email: process.env.CLOUDFLARE_EMAIL,
}));
