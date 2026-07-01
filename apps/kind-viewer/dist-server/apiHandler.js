import { isAdminRole, readAuthFromRequest, verifyLogin } from './auth.js';
import { buildManifest, safeSlidePath } from './buildManifest.js';
import { addComment, listComments } from './comments.js';
import { getDb } from './db.js';
import { createUser, deleteUser, listUsers, updateUserSecret } from './users.js';
function sendJson(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(body));
}
async function readJsonBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!raw.trim())
        return {};
    return JSON.parse(raw);
}
function requireAuth(req, res, searchParams) {
    getDb();
    const auth = readAuthFromRequest(req, searchParams);
    if (!auth) {
        sendJson(res, 401, { error: 'unauthorized' });
        return null;
    }
    return { email: auth.email, role: auth.role };
}
function requireAdmin(req, res, searchParams) {
    const user = requireAuth(req, res, searchParams);
    if (!user)
        return null;
    if (!isAdminRole(user.role)) {
        sendJson(res, 403, { error: 'forbidden' });
        return null;
    }
    return user;
}
export async function handleApi(req, res, ctx, pathname, searchParams) {
    const method = req.method ?? 'GET';
    if (pathname === '/api/health' && method === 'GET') {
        getDb();
        sendJson(res, 200, { ok: true });
        return true;
    }
    if (pathname === '/api/auth/login' && method === 'POST') {
        getDb();
        try {
            const body = (await readJsonBody(req));
            const email = String(body.email ?? '');
            const secret = String(body.secret ?? '');
            const result = verifyLogin(email, secret);
            if (!result.ok) {
                sendJson(res, 401, { error: 'invalid credentials' });
                return true;
            }
            sendJson(res, 200, {
                ok: true,
                token: result.token,
                email: result.email,
                role: result.role,
            });
        }
        catch {
            sendJson(res, 400, { error: 'bad request' });
        }
        return true;
    }
    if (pathname === '/api/auth/verify' && method === 'GET') {
        getDb();
        const auth = readAuthFromRequest(req, searchParams);
        if (!auth) {
            sendJson(res, 401, { ok: false });
            return true;
        }
        sendJson(res, 200, { ok: true, email: auth.email, role: auth.role });
        return true;
    }
    if (pathname === '/api/slide-md' && method === 'GET') {
        getDb();
        const auth = readAuthFromRequest(req, searchParams);
        if (!auth) {
            sendJson(res, 401, { error: 'unauthorized' });
            return true;
        }
        const rel = searchParams.get('path');
        if (!rel) {
            sendJson(res, 400, { error: 'missing path' });
            return true;
        }
        const abs = safeSlidePath(ctx.deckRoot, rel);
        if (!abs) {
            sendJson(res, 400, { error: 'invalid path' });
            return true;
        }
        try {
            const langParam = searchParams.get('lang');
            const lang = langParam === 'zh' ? 'zh' : 'en';
            const { readSlideEditable } = await import('./slideMd.js');
            const payload = await readSlideEditable(ctx.deckRoot, rel, lang);
            sendJson(res, 200, payload);
        }
        catch (e) {
            sendJson(res, 500, { error: String(e?.message ?? e) });
        }
        return true;
    }
    if (pathname === '/api/slide-md' && method === 'PUT') {
        getDb();
        const auth = readAuthFromRequest(req, searchParams);
        if (!auth) {
            sendJson(res, 401, { error: 'unauthorized' });
            return true;
        }
        const rel = searchParams.get('path');
        if (!rel) {
            sendJson(res, 400, { error: 'missing path' });
            return true;
        }
        const abs = safeSlidePath(ctx.deckRoot, rel);
        if (!abs) {
            sendJson(res, 400, { error: 'invalid path' });
            return true;
        }
        try {
            const body = (await readJsonBody(req));
            const langParam = searchParams.get('lang') ?? body.lang;
            const lang = langParam === 'zh' ? 'zh' : 'en';
            const editable = String(body.editable ?? '');
            if (!editable.trim()) {
                sendJson(res, 400, { error: 'empty content' });
                return true;
            }
            const { writeSlideEditable } = await import('./slideMd.js');
            await writeSlideEditable(ctx.deckRoot, rel, lang, editable);
            sendJson(res, 200, { ok: true });
        }
        catch (e) {
            sendJson(res, 500, { error: String(e?.message ?? e) });
        }
        return true;
    }
    if (pathname === '/api/slide-block' && method === 'GET') {
        getDb();
        const auth = readAuthFromRequest(req, searchParams);
        if (!auth) {
            sendJson(res, 401, { error: 'unauthorized' });
            return true;
        }
        const rel = searchParams.get('path');
        const blockId = searchParams.get('blockId');
        if (!rel || !blockId) {
            sendJson(res, 400, { error: 'missing path or blockId' });
            return true;
        }
        const abs = safeSlidePath(ctx.deckRoot, rel);
        if (!abs) {
            sendJson(res, 400, { error: 'invalid path' });
            return true;
        }
        try {
            const lang = searchParams.get('lang') === 'zh' ? 'zh' : 'en';
            const { readSlideBlockEditable } = await import('./slideMd.js');
            const payload = await readSlideBlockEditable(ctx.deckRoot, rel, lang, blockId);
            if (!payload) {
                sendJson(res, 404, { error: 'block not found' });
                return true;
            }
            sendJson(res, 200, payload);
        }
        catch (e) {
            sendJson(res, 500, { error: String(e?.message ?? e) });
        }
        return true;
    }
    if (pathname === '/api/slide-block' && method === 'PUT') {
        getDb();
        const auth = readAuthFromRequest(req, searchParams);
        if (!auth) {
            sendJson(res, 401, { error: 'unauthorized' });
            return true;
        }
        const rel = searchParams.get('path');
        const blockId = searchParams.get('blockId');
        if (!rel || !blockId) {
            sendJson(res, 400, { error: 'missing path or blockId' });
            return true;
        }
        const abs = safeSlidePath(ctx.deckRoot, rel);
        if (!abs) {
            sendJson(res, 400, { error: 'invalid path' });
            return true;
        }
        try {
            const body = (await readJsonBody(req));
            const lang = (searchParams.get('lang') ?? body.lang) === 'zh' ? 'zh' : 'en';
            const { writeSlideBlockEditable, writeSlideBlockField } = await import('./slideMd.js');
            const ok = typeof body.field === 'string' && body.field.length > 0
                ? await writeSlideBlockField(ctx.deckRoot, rel, lang, blockId, body.field, String(body.text ?? ''))
                : await writeSlideBlockEditable(ctx.deckRoot, rel, lang, blockId, String(body.editable ?? ''));
            if (!ok) {
                sendJson(res, 404, { error: 'block not found' });
                return true;
            }
            sendJson(res, 200, { ok: true });
        }
        catch (e) {
            sendJson(res, 500, { error: String(e?.message ?? e) });
        }
        return true;
    }
    if (pathname === '/api/slide-layout' && method === 'GET') {
        getDb();
        const auth = readAuthFromRequest(req, searchParams);
        if (!auth) {
            sendJson(res, 401, { error: 'unauthorized' });
            return true;
        }
        const rel = searchParams.get('path');
        if (!rel) {
            sendJson(res, 400, { error: 'missing path' });
            return true;
        }
        const abs = safeSlidePath(ctx.deckRoot, rel);
        if (!abs) {
            sendJson(res, 400, { error: 'invalid path' });
            return true;
        }
        try {
            const lang = searchParams.get('lang') === 'zh' ? 'zh' : 'en';
            const { resolveSlideHtml } = await import('./slideRender.js');
            const { getLayoutPayload } = await import('./slideLayout.js');
            const html = await resolveSlideHtml(ctx.deckRoot, rel, lang);
            const labelsFromHtml = {};
            const re = /<(?:div|h[12])([^>]*data-kind-block="([^"]+)"[^>]*)>/gi;
            let m = re.exec(html);
            while (m) {
                const attrs = m[1];
                const id = m[2];
                const cls = attrs.match(/class="([^"]+)"/i)?.[1]?.split(/\s+/)[0] ?? 'block';
                labelsFromHtml[id] = cls;
                m = re.exec(html);
            }
            const payload = await getLayoutPayload(ctx.deckRoot, rel, lang, labelsFromHtml);
            sendJson(res, 200, payload);
        }
        catch (e) {
            sendJson(res, 500, { error: String(e?.message ?? e) });
        }
        return true;
    }
    if (pathname === '/api/slide-layout' && method === 'PUT') {
        getDb();
        const auth = readAuthFromRequest(req, searchParams);
        if (!auth) {
            sendJson(res, 401, { error: 'unauthorized' });
            return true;
        }
        const rel = searchParams.get('path');
        if (!rel) {
            sendJson(res, 400, { error: 'missing path' });
            return true;
        }
        const abs = safeSlidePath(ctx.deckRoot, rel);
        if (!abs) {
            sendJson(res, 400, { error: 'invalid path' });
            return true;
        }
        try {
            const body = (await readJsonBody(req));
            const lang = (searchParams.get('lang') ?? body.lang) === 'zh' ? 'zh' : 'en';
            const blocks = body.blocks ?? {};
            const { writeSlideLayout } = await import('./slideLayout.js');
            await writeSlideLayout(ctx.deckRoot, rel, lang, blocks, body.labels);
            sendJson(res, 200, { ok: true });
        }
        catch (e) {
            sendJson(res, 500, { error: String(e?.message ?? e) });
        }
        return true;
    }
    if (pathname === '/api/slide-layout/optimize' && method === 'POST') {
        getDb();
        const auth = readAuthFromRequest(req, searchParams);
        if (!auth) {
            sendJson(res, 401, { error: 'unauthorized' });
            return true;
        }
        const rel = searchParams.get('path');
        if (!rel) {
            sendJson(res, 400, { error: 'missing path' });
            return true;
        }
        const abs = safeSlidePath(ctx.deckRoot, rel);
        if (!abs) {
            sendJson(res, 400, { error: 'invalid path' });
            return true;
        }
        try {
            const body = (await readJsonBody(req));
            const lang = (searchParams.get('lang') ?? body.lang) === 'zh' ? 'zh' : 'en';
            const { getLayoutPayload } = await import('./slideLayout.js');
            const { optimizeSlideLayout } = await import('./layoutOptimize.js');
            const { readSlideEditable } = await import('./slideMd.js');
            const { resolveSlideHtml } = await import('./slideRender.js');
            const html = await resolveSlideHtml(ctx.deckRoot, rel, lang);
            const labelsFromHtml = {};
            const re = /<(?:div|h[12])([^>]*data-kind-block="([^"]+)"[^>]*)>/gi;
            let m = re.exec(html);
            while (m) {
                const attrs = m[1];
                const id = m[2];
                const cls = attrs.match(/class="([^"]+)"/i)?.[1]?.split(/\s+/)[0] ?? 'block';
                labelsFromHtml[id] = cls;
                m = re.exec(html);
            }
            const payload = await getLayoutPayload(ctx.deckRoot, rel, lang, labelsFromHtml);
            const blocks = body.blocks && Object.keys(body.blocks).length > 0 ? body.blocks : payload.blocks;
            const labels = { ...payload.labels, ...body.labels };
            let slideHint = '';
            try {
                const editable = await readSlideEditable(ctx.deckRoot, rel, lang);
                slideHint = editable.editable.slice(0, 800);
            }
            catch {
                slideHint = '';
            }
            const result = await optimizeSlideLayout({
                blocks,
                labels,
                lang,
                slideHint,
            });
            const { writeSlideLayout } = await import('./slideLayout.js');
            await writeSlideLayout(ctx.deckRoot, rel, lang, result.blocks, labels);
            sendJson(res, 200, result);
        }
        catch (e) {
            sendJson(res, 500, { error: String(e?.message ?? e) });
        }
        return true;
    }
    if (pathname === '/api/slide' && method === 'GET') {
        getDb();
        const auth = readAuthFromRequest(req, searchParams);
        if (!auth) {
            res.statusCode = 401;
            res.end('unauthorized');
            return true;
        }
        const rel = searchParams.get('path');
        if (!rel) {
            res.statusCode = 400;
            res.end('missing path');
            return true;
        }
        const abs = safeSlidePath(ctx.deckRoot, rel);
        if (!abs) {
            res.statusCode = 400;
            res.end('invalid path');
            return true;
        }
        try {
            const langParam = searchParams.get('lang');
            const lang = langParam === 'zh' ? 'zh' : 'en';
            const layoutProbe = searchParams.get('layoutProbe') === '1';
            const layoutEdit = searchParams.get('layoutEdit') === '1';
            const layoutApply = searchParams.get('layoutApply') === '1' || layoutEdit || layoutProbe;
            const { resolveSlideHtml } = await import('./slideRender.js');
            const html = await resolveSlideHtml(ctx.deckRoot, rel, lang, {
                layoutProbe,
                layoutApply,
                layoutEdit,
            });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.end(html);
        }
        catch (e) {
            if (e.code === 'ENOENT') {
                res.statusCode = 404;
                res.end('not found');
            }
            else {
                res.statusCode = 500;
                res.end('read error');
            }
        }
        return true;
    }
    if (pathname === '/api/admin/users' && method === 'GET') {
        if (!requireAdmin(req, res, searchParams))
            return true;
        try {
            sendJson(res, 200, { users: listUsers() });
        }
        catch (e) {
            sendJson(res, 500, { error: String(e?.message ?? e) });
        }
        return true;
    }
    if (pathname === '/api/admin/users' && method === 'POST') {
        if (!requireAdmin(req, res, searchParams))
            return true;
        try {
            const body = (await readJsonBody(req));
            const email = String(body.email ?? '');
            const secret = String(body.secret ?? '');
            const role = body.role === 'admin' ? 'admin' : 'viewer';
            const user = createUser(email, secret, role);
            sendJson(res, 201, { user });
        }
        catch (e) {
            const msg = String(e?.message ?? e);
            const status = msg === 'email exists' || msg === 'invalid email' || msg === 'invalid secret' ? 400 : 500;
            sendJson(res, status, { error: msg });
        }
        return true;
    }
    if (pathname.startsWith('/api/admin/users/') && method === 'PATCH') {
        if (!requireAdmin(req, res, searchParams))
            return true;
        const encoded = pathname.slice('/api/admin/users/'.length);
        try {
            const email = decodeURIComponent(encoded);
            const body = (await readJsonBody(req));
            const secret = String(body.secret ?? '');
            const user = updateUserSecret(email, secret);
            sendJson(res, 200, { user });
        }
        catch (e) {
            const msg = String(e?.message ?? e);
            const status = msg === 'not found' || msg === 'invalid secret' ? 400 : 500;
            sendJson(res, status, { error: msg });
        }
        return true;
    }
    if (pathname.startsWith('/api/admin/users/') && method === 'DELETE') {
        if (!requireAdmin(req, res, searchParams))
            return true;
        const encoded = pathname.slice('/api/admin/users/'.length);
        try {
            const email = decodeURIComponent(encoded);
            const removed = deleteUser(email);
            if (!removed) {
                sendJson(res, 404, { error: 'not found' });
                return true;
            }
            sendJson(res, 200, { ok: true });
        }
        catch (e) {
            sendJson(res, 500, { error: String(e?.message ?? e) });
        }
        return true;
    }
    const user = requireAuth(req, res, searchParams);
    if (!user)
        return true;
    if (pathname === '/api/manifest' && method === 'GET') {
        try {
            const slides = await buildManifest(ctx.deckRoot);
            sendJson(res, 200, { slides, scannedAt: Date.now() });
        }
        catch (e) {
            sendJson(res, 500, { error: String(e?.message ?? e) });
        }
        return true;
    }
    if (pathname === '/api/comments' && method === 'GET') {
        const slideRel = searchParams.get('path') ?? undefined;
        try {
            const comments = await listComments(slideRel);
            sendJson(res, 200, { comments });
        }
        catch (e) {
            sendJson(res, 500, { error: String(e?.message ?? e) });
        }
        return true;
    }
    if (pathname === '/api/comments' && method === 'POST') {
        try {
            const body = (await readJsonBody(req));
            const slideRel = String(body.slideRel ?? '');
            const text = String(body.body ?? '');
            const record = await addComment(slideRel, user.email, text);
            sendJson(res, 201, { comment: record });
        }
        catch (e) {
            const msg = String(e?.message ?? e);
            sendJson(res, msg === 'invalid body' || msg === 'invalid slide' ? 400 : 500, { error: msg });
        }
        return true;
    }
    return false;
}
