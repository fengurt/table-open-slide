import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
const KEY_LEN = 32;
export function hashSecret(secret) {
    const salt = randomBytes(16);
    const hash = scryptSync(secret, salt, KEY_LEN);
    return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}
export function verifySecret(secret, stored) {
    const parts = stored.split(':');
    if (parts.length !== 3 || parts[0] !== 'scrypt')
        return false;
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    const actual = scryptSync(secret, salt, KEY_LEN);
    try {
        return expected.length === actual.length && timingSafeEqual(expected, actual);
    }
    catch {
        return false;
    }
}
