// ==============================================================================
// CLOUDFLARE WORKER ROUTER (worker.js)
// Edge Serverless API + Static Assets Router for Underrated Developer Blog
// (underrateddev.com)
// Cryptographically Enforced Founder JWT Authentication (HS256 Web Crypto)
// ==============================================================================

import defaultPosts from './frontend/data/posts.json' with { type: 'json' };
import { MongoClient } from 'mongodb';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json;charset=UTF-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};

function base64UrlEncode(str) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return atob(str);
}

async function signJwt(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encHeader = base64UrlEncode(JSON.stringify(header));
    const encPayload = base64UrlEncode(JSON.stringify(payload));
    const data = new TextEncoder().encode(`${encHeader}.${encPayload}`);

    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, data);
    const encSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return `${encHeader}.${encPayload}.${encSig}`;
}

async function verifyJwt(token, secret) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encHeader, encPayload, encSig] = parts;
    const data = new TextEncoder().encode(`${encHeader}.${encPayload}`);

    try {
        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const sigStr = base64UrlDecode(encSig);
        const sigBuf = new Uint8Array(sigStr.length);
        for (let i = 0; i < sigStr.length; i++) sigBuf[i] = sigStr.charCodeAt(i);

        const valid = await crypto.subtle.verify('HMAC', key, sigBuf, data);
        if (!valid) return null;

        const payload = JSON.parse(base64UrlDecode(encPayload));
        if (payload.exp && Date.now() > payload.exp) {
            return null; // Expired
        }
        return payload;
    } catch (e) {
        return null;
    }
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: CORS_HEADERS
    });
}

// In-memory runtime cache for serverless invocation lifecycle
let mongoClient = null;

async function getMongoCollection(env) {
    const uri = (env && env.MONGO_URI) || 'mongodb+srv://rakurthikowshik_db_user:lYGwM504rBJ2cqw9@cluster0.e7nzofn.mongodb.net/blog-underrated?appName=Cluster0';
    if (!mongoClient) {
        mongoClient = new MongoClient(uri, {
            maxPoolSize: 1,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });
        await mongoClient.connect();
    }
    const db = mongoClient.db('blog-underrated');
    return db.collection('posts');
}

async function getStoredPosts(env) {
    // 1. Try MongoDB Atlas directly
    try {
        const coll = await getMongoCollection(env);
        const docs = await coll.find({ published: true }).sort({ publishedAt: -1, createdAt: -1 }).toArray();
        if (Array.isArray(docs) && docs.length > 0) {
            return docs.map(doc => ({
                ...doc,
                _id: doc._id ? doc._id.toString() : doc.slug
            }));
        }
    } catch (err) {
        console.warn('MongoDB Atlas read fallback:', err.message);
    }

    // 2. Try Cloudflare KV
    if (env && env.BLOG_KV) {
        try {
            const kvPosts = await env.BLOG_KV.get('ud_published_posts', { type: 'json' });
            if (Array.isArray(kvPosts)) {
                return kvPosts;
            }
        } catch (e) {
            console.warn('KV read warning:', e);
        }
    }

    // 3. In-memory runtime cache
    return memoryPosts;
}

async function saveStoredPosts(posts, env) {
    memoryPosts = posts;

    // 1. Try MongoDB Atlas persistence
    try {
        const coll = await getMongoCollection(env);
        for (const post of posts) {
            const { _id, ...rest } = post;
            await coll.updateOne(
                { $or: [{ slug: post.slug }, { _id: String(_id) }] },
                { $set: { ...rest, slug: post.slug, updatedAt: new Date() } },
                { upsert: true }
            );
        }
    } catch (err) {
        console.warn('MongoDB Atlas write fallback:', err.message);
    }

    // 2. Try Cloudflare KV persistence
    if (env && env.BLOG_KV) {
        try {
            await env.BLOG_KV.put('ud_published_posts', JSON.stringify(posts));
        } catch (e) {
            console.warn('KV write warning:', e);
        }
    }
}

async function handleApi(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, ''); // Strip trailing slash
    const secret = (env && (env.JWT_SECRET || env.ADMIN_PASSWORD)) || 'ud_sec_4frndtech_2026';

    // 0. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: CORS_HEADERS
        });
    }

    // 1. Founder Login: POST /api/auth/my/iamtheadmin
    if (pathname.endsWith('/auth/my/iamtheadmin') && request.method === 'POST') {
        try {
            const body = await request.json();
            const { email, password } = body || {};

            if (!email || !password) {
                return jsonResponse({ success: false, message: 'Email and password required' }, 400);
            }

            const cleanEmail = email.trim().toLowerCase();

            // Registered founder emails
            const isNaveen = [
                'naveen@underrateddev.com',
                'naveen@underrateddeveloper.com',
                'naveen191496@gmail.com',
                'naveen'
            ].includes(cleanEmail);

            const isPaul = [
                'paul@underrateddev.com',
                'paul@underrateddeveloper.com',
                'santhoshpaul861@gmail.com',
                'santhosh',
                'paul'
            ].includes(cleanEmail);

            const isAllowedDomain = cleanEmail.endsWith('@underrateddev.com') || cleanEmail.endsWith('@underrateddeveloper.com');

            if (!isNaveen && !isPaul && !isAllowedDomain) {
                return jsonResponse({ success: false, message: 'Unauthorized: Not a registered founder email' }, 401);
            }

            const validPasswords = new Set([
                'underrated2026',
                '4frndtech@2026',
                '4frndtech',
                'underrateddev'
            ]);
            if (env && env.ADMIN_PASSWORD) {
                validPasswords.add(env.ADMIN_PASSWORD);
            }

            if (!validPasswords.has(password)) {
                return jsonResponse({ success: false, message: 'Invalid founder security credentials' }, 401);
            }

            const founder = {
                _id: isPaul ? 'founder_santhosh_paul' : 'founder_naveen_kowshik',
                name: isPaul ? 'Santhosh Paul' : 'Naveen Chandra Kowshik',
                username: isPaul ? 'Santhosh-Paul' : 'Naveen-beginner',
                email: cleanEmail,
                role: 'Founder',
                team: '4FrndTech'
            };

            const token = await signJwt({
                sub: founder._id,
                name: founder.name,
                username: founder.username,
                role: 'author',
                exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
            }, secret);

            return jsonResponse({
                success: true,
                message: 'Founder authentication successful',
                token,
                data: founder
            });
        } catch (e) {
            return jsonResponse({ success: false, message: 'Malformed login request' }, 400);
        }
    }

    // Helper: Authenticate JWT for protected endpoints
    async function checkAuth() {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.slice(7).trim();
        return await verifyJwt(token, secret);
    }

    // 2. Fetch All Posts (Public): GET /api/my/all/posts
    if ((pathname.endsWith('/my/all/posts') || pathname.endsWith('/api/my/all/posts')) && request.method === 'GET') {
        const tag = url.searchParams.get('tag');
        const search = url.searchParams.get('search');
        const limit = parseInt(url.searchParams.get('limit') || '50', 10);

        let posts = await getStoredPosts(env);

        if (tag && tag !== 'All') {
            const t = tag.toLowerCase();
            posts = posts.filter(p =>
                (p.label && p.label.toLowerCase() === t) ||
                (Array.isArray(p.tags) && p.tags.some(tagItem => tagItem.toLowerCase() === t))
            );
        }

        if (search) {
            const s = search.toLowerCase();
            posts = posts.filter(p =>
                (p.title && p.title.toLowerCase().includes(s)) ||
                (p.shortDescription && p.shortDescription.toLowerCase().includes(s)) ||
                (p.label && p.label.toLowerCase().includes(s))
            );
        }

        posts = posts.slice(0, limit);

        return jsonResponse({
            success: true,
            message: 'Posts fetched successfully',
            data: posts
        });
    }

    // 3. Fetch Single Post (Public): GET /api/my/post/:id
    const postMatch = pathname.match(/\/my\/post\/([^/]+)$/);
    if (postMatch && request.method === 'GET') {
        const idOrSlug = decodeURIComponent(postMatch[1]);
        const posts = await getStoredPosts(env);
        const found = posts.find(p => p._id === idOrSlug || p.slug === idOrSlug);
        if (found) {
            return jsonResponse({ success: true, data: found });
        }
        return jsonResponse({ success: false, message: 'Article not found' }, 404);
    }

    // 4. Create Post (Protected): POST /api/my/create/post
    if (pathname.endsWith('/my/create/post') && request.method === 'POST') {
        const user = await checkAuth();
        if (!user) {
            return jsonResponse({ success: false, message: 'Unauthorized: Valid founder token required' }, 401);
        }

        try {
            const newPost = await request.json();
            if (!newPost.title || !newPost.title.trim()) {
                return jsonResponse({ success: false, message: 'Title is required' }, 400);
            }

            // Auto-generate shortDescription if missing
            if (!newPost.shortDescription || !newPost.shortDescription.trim()) {
                const firstBlockText = newPost.sections && newPost.sections[0]?.blocks?.[0]?.data?.content;
                newPost.shortDescription = firstBlockText 
                    ? String(firstBlockText).replace(/<[^>]*>?/gm, '').substring(0, 160)
                    : newPost.title;
            }

            if (!newPost.label) newPost.label = 'Web Development';
            if (!newPost.tags || !Array.isArray(newPost.tags) || !newPost.tags.length) {
                newPost.tags = [newPost.label];
            }

            if (!newPost._id) newPost._id = 'post_' + Date.now();
            if (!newPost.slug) newPost.slug = newPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            newPost.published = true;
            newPost.publishedAt = newPost.publishedAt || new Date().toISOString();
            if (!newPost.author) {
                newPost.author = { name: user.name, username: user.username };
            }

            const posts = await getStoredPosts(env);
            const existingIdx = posts.findIndex(p => p._id === newPost._id || p.slug === newPost.slug);
            if (existingIdx >= 0) {
                posts[existingIdx] = { ...posts[existingIdx], ...newPost };
            } else {
                posts.unshift(newPost);
            }
            await saveStoredPosts(posts, env);

            return jsonResponse({
                success: true,
                message: 'Post created and published successfully',
                data: newPost
            }, 201);
        } catch (e) {
            return jsonResponse({ success: false, message: e.message || 'Error creating post' }, 500);
        }
    }

    // 5. Update Post (Protected): PUT /api/my/update/post/:id
    const updateMatch = pathname.match(/\/my\/update\/post\/([^/]+)$/);
    if (updateMatch && request.method === 'PUT') {
        const user = await checkAuth();
        if (!user) {
            return jsonResponse({ success: false, message: 'Unauthorized: Valid founder token required' }, 401);
        }

        const id = decodeURIComponent(updateMatch[1]);
        try {
            const body = await request.json();
            const posts = await getStoredPosts(env);
            const idx = posts.findIndex(p => p._id === id || p.slug === id);

            if (idx === -1) {
                return jsonResponse({ success: false, message: 'Post not found' }, 404);
            }

            posts[idx] = { ...posts[idx], ...body, updatedAt: new Date().toISOString() };
            await saveStoredPosts(posts, env);

            return jsonResponse({
                success: true,
                message: 'Post updated successfully',
                data: posts[idx]
            });
        } catch (e) {
            return jsonResponse({ success: false, message: 'Failed to update post' }, 500);
        }
    }

    // 6. Delete Post (Protected): DELETE /api/my/delete/post/:id
    const deleteMatch = pathname.match(/\/my\/delete\/post\/([^/]+)$/);
    if (deleteMatch && request.method === 'DELETE') {
        const user = await checkAuth();
        if (!user) {
            return jsonResponse({ success: false, message: 'Unauthorized: Valid founder token required' }, 401);
        }

        const id = decodeURIComponent(deleteMatch[1]);
        const posts = await getStoredPosts(env);
        const filtered = posts.filter(p => p._id !== id && p.slug !== id);

        if (filtered.length === posts.length) {
            return jsonResponse({ success: false, message: 'Post not found' }, 404);
        }

        await saveStoredPosts(filtered, env);
        return jsonResponse({ success: true, message: 'Post deleted successfully' });
    }

    // Default 404 for unhandled API endpoints
    return jsonResponse({
        success: false,
        message: `Endpoint ${pathname} not found on Cloudflare Edge API`
    }, 404);
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        // Intercept API routes
        if (url.pathname.startsWith('/api/')) {
            return handleApi(request, env);
        }

        // Serve static assets via Cloudflare Workers Assets
        if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
            return env.ASSETS.fetch(request);
        }

        return new Response("Asset not found", { status: 404 });
    }
};
