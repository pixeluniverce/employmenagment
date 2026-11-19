import { createHash } from 'crypto';
export const token = () => createHash('sha256').update(process.env.SESSION_SECRET + ':' + process.env.ADMIN_PASSWORD).digest('hex');
