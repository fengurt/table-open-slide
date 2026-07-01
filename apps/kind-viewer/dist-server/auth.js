import { createHash, timingSafeEqual } from 'node:crypto';
import { findUserByEmail, verifyUserCredentials } from './users.js';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email) {
    const t = email.trim();
    return t.length >= 3 && t.length <= 254 && EMAIL_RE.test(t);
}
/** Token is bound to email + stored secret hash so rotating secret invalidates sessions. */
export function issueToken(email, secretHash) {
    const normalized = email.trim().toLowerCase();
    return createHash('sha256').update(`${normalized}|${secretHash}|kind-viewer-v2`).digest('hex');
}
export function verifyToken(email, token, secretHash) {
    if (!token || !isValidEmail(email))
        return false;
    const expected = issueToken(email, secretHash);
    try {
        const a = Buffer.from(expected, 'utf8');
        const b = Buffer.from(token, 'utf8');
        return a.length === b.length && timingSafeEqual(a, b);
    }
    catch {
        return false;
    }
}
export function verifyLogin(email, secret) {
    if (!isValidEmail(email))
        return { ok: false };
    const result = verifyUserCredentials(email, secret);
    if ('error' in result)
        return { ok: false };
    const normalized = result.user.email;
    return {
        ok: true,
        token: issueToken(normalized, result.user.secretHash),
        email: normalized,
        role: result.user.role,
    };
}
export function readAuthFromHeaders(headers) {
    const auth = headers.authorization;
    const raw = Array.isArray(auth) ? auth[0] : auth;
    if (!raw?.startsWith('Bearer '))
        return null;
    const token = raw.slice(7).trim();
    const emailHeader = headers['x-user-email'];
    const email = (Array.isArray(emailHeader) ? emailHeader[0] : emailHeader)?.trim() ?? '';
    if (!email || !token)
        return null;
    const user = findUserByEmail(email);
    if (!user)
        return null;
    if (!verifyToken(email, token, user.secretHash))
        return null;
    return { email: user.email, token, role: user.role };
}
/** Headers or `?email=&token=` — needed for iframe slide preview (no custom headers). */
export function readAuthFromRequest(req, searchParams) {
    const fromHeaders = readAuthFromHeaders(req.headers);
    if (fromHeaders)
        return fromHeaders;
    const email = searchParams.get('email')?.trim() ?? '';
    const token = searchParams.get('token')?.trim() ?? '';
    if (!email || !token)
        return null;
    const user = findUserByEmail(email);
    if (!user)
        return null;
    if (!verifyToken(email, token, user.secretHash))
        return null;
    return { email: user.email, token, role: user.role };
}
export function isAdminRole(role) {
    return role === 'admin';
}
