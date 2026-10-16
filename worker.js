// ==============================================================================
// CLOUDFLARE WORKER ROUTER (worker.js)
// Edge Serverless API + Static Assets Router for Underrated Developer Blog
// (underrateddev.com)
// Cryptographically Enforced Founder JWT Authentication (HS256 Web Crypto)
// High-Performance Multi-Layer Caching (Edge CDN + Worker Memory + Client SWR)
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

function jsonResponse(data, status = 200, customHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...CORS_HEADERS,
            ...customHeaders
        }
    });
}

// In-memory runtime cache for serverless invocation lifecycle
let memoryPosts = Array.isArray(defaultPosts) && defaultPosts.length > 0 ? [...defaultPosts] : [];
let lastFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory cache in worker isolate

async function fetchPostsFromMongo(env) {
    const uri = (env && env.MONGO_URI) || 'mongodb+srv://rakurthikowshik_db_user:lYGwM504rBJ2cqw9@cluster0.e7nzofn.mongodb.net/blog-underrated?appName=Cluster0';
    const client = new MongoClient(uri, {
        maxPoolSize: 1,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000,
        socketTimeoutMS: 5000,
    });

    try {
        await client.connect();
        const db = client.db('blog-underrated');
        const docs = await db.collection('posts').find({ published: true }).sort({ publishedAt: -1, createdAt: -1 }).toArray();
        return docs;
    } finally {
        try {
            await client.close();
        } catch (_) {}
    }
}

async function persistPostsToMongo(posts, env) {
    const uri = (env && env.MONGO_URI) || 'mongodb+srv://rakurthikowshik_db_user:lYGwM504rBJ2cqw9@cluster0.e7nzofn.mongodb.net/blog-underrated?appName=Cluster0';
    const client = new MongoClient(uri, {
        maxPoolSize: 1,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000,
        socketTimeoutMS: 5000,
    });

    try {
        await client.connect();
        const db = client.db('blog-underrated');
        const coll = db.collection('posts');
        for (const post of posts) {
            if (!post.slug) continue;
            const { _id, ...rest } = post;
            await coll.updateOne(
                { slug: post.slug },
                { $set: { ...rest, slug: post.slug, updatedAt: new Date() } },
                { upsert: true }
            );
        }
    } finally {
        try {
            await client.close();
        } catch (_) {}
    }
}

async function getStoredPosts(env, forceRefresh = false) {
    const now = Date.now();
    // Return memory cache if fresh and populated
    if (!forceRefresh && memoryPosts.length > 0 && (now - lastFetchedAt) < CACHE_TTL_MS) {
        return memoryPosts;
    }

    // 1. Try MongoDB Atlas directly
    try {
        const docs = await fetchPostsFromMongo(env);
        if (Array.isArray(docs) && docs.length > 0) {
            const mapped = docs.map(doc => ({
                ...doc,
                _id: doc._id ? String(doc._id) : (doc.slug || 'post_' + Math.random().toString(36).slice(2))
            }));
            memoryPosts = mapped;
            lastFetchedAt = Date.now();
            return memoryPosts;
        }
    } catch (err) {
        console.warn('MongoDB Atlas read fallback:', err.message);
    }

    // 2. Try Cloudflare KV
    if (env && env.BLOG_KV) {
        try {
            const kvPosts = await env.BLOG_KV.get('ud_published_posts', { type: 'json' });
            if (Array.isArray(kvPosts) && kvPosts.length > 0) {
                memoryPosts = kvPosts;
                return kvPosts;
            }
        } catch (e) {
            console.warn('KV read warning:', e);
        }
    }

    // 3. Fallback to in-memory runtime cache (or pre-bundled seed posts)
    if (memoryPosts.length > 0) {
        return memoryPosts;
    }
    if (Array.isArray(defaultPosts) && defaultPosts.length > 0) {
        memoryPosts = [...defaultPosts];
        return memoryPosts;
    }

    return [];
}

async function saveStoredPosts(posts, env) {
    memoryPosts = posts;
    lastFetchedAt = Date.now();

    // 1. Try MongoDB Atlas persistence
    try {
        await persistPostsToMongo(posts, env);
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

async function notifySearchEngines(post) {
    if (!post || !post.slug) return;
    const postUrl = `https://underrateddev.com/post?slug=${encodeURIComponent(post.slug)}`;
    const blogUrl = `https://underrateddev.com/blog`;
    const sitemapUrl = `https://underrateddev.com/sitemap.xml`;

    // 1. IndexNow API (Instant crawl notification for Bing, Yandex, Seznam, Naver)
    try {
        await fetch('https://api.indexnow.org/IndexNow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                host: 'underrateddev.com',
                key: '4frndtech-ud-indexnow-2026',
                keyLocation: 'https://underrateddev.com/4frndtech-ud-indexnow-2026.txt',
                urlList: [postUrl, blogUrl, sitemapUrl]
            })
        });
        console.log('IndexNow ping delivered for:', postUrl);
    } catch (e) {
        console.warn('IndexNow notice:', e.message);
    }

    // 2. Google Sitemap Ping
    try {
        await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
        console.log('Google sitemap ping delivered');
    } catch (e) {
        console.warn('Google ping notice:', e.message);
    }
}

async function handleApi(request, env, ctx) {
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

    try {
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
                const t = tag.toLowerCase().trim();
                posts = posts.filter(p => {
                    if (!p) return false;
                    const matchLabel = typeof p.label === 'string' && p.label.toLowerCase() === t;
                    const matchTags = Array.isArray(p.tags) && p.tags.some(tagItem =>
                        tagItem && typeof tagItem === 'string' && tagItem.toLowerCase() === t
                    );
                    return matchLabel || matchTags;
                });
            }

            if (search && search.trim()) {
                const s = search.toLowerCase().trim();
                posts = posts.filter(p => {
                    if (!p) return false;
                    const titleMatch = typeof p.title === 'string' && p.title.toLowerCase().includes(s);
                    const descMatch = typeof p.shortDescription === 'string' && p.shortDescription.toLowerCase().includes(s);
                    const labelMatch = typeof p.label === 'string' && p.label.toLowerCase().includes(s);
                    const tagMatch = Array.isArray(p.tags) && p.tags.some(tagItem =>
                        tagItem && typeof tagItem === 'string' && tagItem.toLowerCase().includes(s)
                    );
                    return titleMatch || descMatch || labelMatch || tagMatch;
                });
            }

            posts = posts.slice(0, limit);

            return jsonResponse({
                success: true,
                message: 'Posts fetched successfully',
                data: posts
            }, 200, {
                'Cache-Control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=86400, stale-if-error=86400'
            });
        }

        // 3. Fetch Single Post (Public): GET /api/my/post/:id
        const postMatch = pathname.match(/\/my\/post\/([^/]+)$/);
        if (postMatch && request.method === 'GET') {
            const idOrSlug = decodeURIComponent(postMatch[1]).trim();
            const posts = await getStoredPosts(env);
            const lowerTarget = idOrSlug.toLowerCase();

            const found = posts.find(p => {
                if (!p) return false;
                const idMatches = p._id && (p._id === idOrSlug || String(p._id).toLowerCase() === lowerTarget);
                const slugMatches = p.slug && (p.slug === idOrSlug || String(p.slug).toLowerCase() === lowerTarget);
                return idMatches || slugMatches;
            });

            if (found) {
                return jsonResponse({ success: true, data: found }, 200, {
                    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400, stale-if-error=86400'
                });
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

                const posts = await getStoredPosts(env, true);
                const existingIdx = posts.findIndex(p => p._id === newPost._id || p.slug === newPost.slug);
                if (existingIdx >= 0) {
                    posts[existingIdx] = { ...posts[existingIdx], ...newPost };
                } else {
                    posts.unshift(newPost);
                }
                await saveStoredPosts(posts, env);

                // Auto-notify search engines for instantaneous crawling
                const notifyPromise = notifySearchEngines(newPost);
                if (ctx && typeof ctx.waitUntil === 'function') {
                    ctx.waitUntil(notifyPromise);
                } else {
                    notifyPromise.catch(() => {});
                }

                return jsonResponse({
                    success: true,
                    message: 'Post created and published successfully',
                    data: newPost
                }, 201, {
                    'Cache-Control': 'no-store'
                });
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
                const posts = await getStoredPosts(env, true);
                const idx = posts.findIndex(p => p._id === id || p.slug === id);

                if (idx === -1) {
                    return jsonResponse({ success: false, message: 'Post not found' }, 404);
                }

                posts[idx] = { ...posts[idx], ...body, updatedAt: new Date().toISOString() };
                await saveStoredPosts(posts, env);

                // Auto-notify search engines for instantaneous recrawling
                const notifyPromise = notifySearchEngines(posts[idx]);
                if (ctx && typeof ctx.waitUntil === 'function') {
                    ctx.waitUntil(notifyPromise);
                } else {
                    notifyPromise.catch(() => {});
                }

                return jsonResponse({
                    success: true,
                    message: 'Post updated successfully',
                    data: posts[idx]
                }, 200, {
                    'Cache-Control': 'no-store'
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
            const posts = await getStoredPosts(env, true);
            const filtered = posts.filter(p => p._id !== id && p.slug !== id);

            if (filtered.length === posts.length) {
                return jsonResponse({ success: false, message: 'Post not found' }, 404);
            }

            await saveStoredPosts(filtered, env);
            return jsonResponse({ success: true, message: 'Post deleted successfully' }, 200, {
                'Cache-Control': 'no-store'
            });
        }

        // Default 404 for unhandled API endpoints
        return jsonResponse({
            success: false,
            message: `Endpoint ${pathname} not found on Cloudflare Edge API`
        }, 404);
    } catch (globalApiError) {
        console.error('Unhandled Edge API Error intercepted:', globalApiError);
        // Resilient fallback for GET requests so users NEVER experience a 500 error page
        if (request.method === 'GET') {
            if (pathname.includes('/my/all/posts')) {
                return jsonResponse({
                    success: true,
                    message: 'Posts served from resilient edge memory fallback',
                    data: memoryPosts.length > 0 ? memoryPosts : (defaultPosts || [])
                }, 200, {
                    'Cache-Control': 'public, max-age=10, stale-while-revalidate=86400'
                });
            }
            if (pathname.includes('/my/post/')) {
                const target = decodeURIComponent(pathname.split('/').pop()).toLowerCase();
                const pool = memoryPosts.length > 0 ? memoryPosts : (defaultPosts || []);
                const found = pool.find(p => p && (String(p._id).toLowerCase() === target || String(p.slug).toLowerCase() === target));
                if (found) {
                    return jsonResponse({ success: true, data: found }, 200);
                }
            }
        }

        return jsonResponse({
            success: false,
            message: 'Edge API resilient recovery executed',
            error: globalApiError.message
        }, 500);
    }
}

function formatIsoDate(d) {
    try {
        if (!d) return new Date().toISOString().split('T')[0];
        if (typeof d === 'string') return d.split('T')[0];
        if (d instanceof Date) return d.toISOString().split('T')[0];
        return new Date(d).toISOString().split('T')[0];
    } catch (_) {
        return new Date().toISOString().split('T')[0];
    }
}

async function handleSitemap(request, env) {
    const origin = 'https://underrateddev.com';
    const posts = await getStoredPosts(env);
    const today = new Date().toISOString().split('T')[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${origin}/author</loc>
    <lastmod>2026-09-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${origin}/support</loc>
    <lastmod>2026-09-28</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
${posts.filter(p => p && p.slug).map(p => {
    const postDate = formatIsoDate(p.updatedAt || p.publishedAt);
    return `  <url>
    <loc>${origin}/post?slug=${encodeURIComponent(p.slug)}</loc>
    <lastmod>${postDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
}).join('\n')}
</urlset>`;

    return new Response(xml, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml; charset=UTF-8',
            'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400'
        }
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderPostBlocksToHtml(sections) {
    if (!Array.isArray(sections)) return '';
    return sections.map(sec => {
        let secHtml = '';
        if (sec.title) {
            secHtml += `<h2 class="prose-h2">${escapeHtml(sec.title)}</h2>`;
        }
        if (Array.isArray(sec.blocks)) {
            sec.blocks.forEach(block => {
                if (!block || !block.type) return;
                const data = block.data || {};
                if (block.type === 'paragraph') {
                    secHtml += `<p class="prose-p">${data.content || ''}</p>`;
                } else if (block.type === 'subheading' || block.type === 'heading') {
                    secHtml += `<h3 class="prose-h3">${escapeHtml(data.content || '')}</h3>`;
                } else if (block.type === 'code') {
                    const lang = data.language || 'dart';
                    const filename = data.filename || 'lib/main.dart';
                    secHtml += `<div class="code-frame"><div class="code-frame-header"><div class="code-title-tag"><span>${escapeHtml(filename)}</span></div></div><pre><code class="language-${escapeHtml(lang)}">${escapeHtml(data.code || '')}</code></pre></div>`;
                } else if (block.type === 'list') {
                    const tag = data.ordered ? 'ol' : 'ul';
                    const items = Array.isArray(data.items) ? data.items.map(it => `<li>${it}</li>`).join('') : '';
                    secHtml += `<${tag} class="prose-list">${items}</${tag}>`;
                } else if (block.type === 'callout') {
                    secHtml += `<div class="prose-callout"><div class="callout-header"><span>${escapeHtml(data.title || 'Architecture Insight')}</span></div><div class="callout-body">${data.content || ''}</div></div>`;
                } else if (block.type === 'quote') {
                    secHtml += `<blockquote class="prose-quote"><p class="quote-text">"${escapeHtml(data.text || '')}"</p>${data.citation ? `<cite class="quote-author">— ${escapeHtml(data.citation)}</cite>` : ''}</blockquote>`;
                }
            });
        }
        return `<section>${secHtml}</section>`;
    }).join('');
}

async function handlePostPage(request, env) {
    const url = new URL(request.url);

    // If request has .html extension, permanently 301 redirect to clean URL /post
    if (url.pathname.endsWith('.html')) {
        const cleanUrl = new URL(request.url);
        cleanUrl.pathname = cleanUrl.pathname.replace(/\.html$/, '');
        return Response.redirect(cleanUrl.toString(), 301);
    }

    const slugOrId = (url.searchParams.get('slug') || url.searchParams.get('id') || '').trim();

    // Fetch the raw post.html template from static assets
    let templateResponse;
    try {
        const assetUrl = new URL('/post.html', request.url);
        templateResponse = await env.ASSETS.fetch(new Request(assetUrl));
    } catch (e) {
        return new Response("Asset not found", { status: 404 });
    }

    if (!templateResponse || !templateResponse.ok) {
        return templateResponse;
    }

    if (!slugOrId) {
        return templateResponse;
    }

    // Find the post
    const posts = await getStoredPosts(env);
    const lower = slugOrId.toLowerCase();
    const post = posts.find(p => p && ((p.slug && p.slug.toLowerCase() === lower) || (p._id && String(p._id).toLowerCase() === lower)));

    if (!post) {
        return templateResponse;
    }

    const title = `${post.title} — Underrated Developer`;
    const desc = post.shortDescription || post.title;
    const postCanonical = `https://underrateddev.com/post?slug=${encodeURIComponent(post.slug || post._id)}`;
    const authorName = post.author?.name || (typeof post.author === 'string' ? post.author : 'Naveen Chandra Kowshik');
    const readTime = post.readTime || '5 min read';
    const category = post.label || (Array.isArray(post.tags) && post.tags[0]) || 'Flutter & Dart';
    const contentHtml = renderPostBlocksToHtml(post.sections);

    // Compute word count for search engines
    let totalWords = 0;
    if (Array.isArray(post.sections)) {
        post.sections.forEach(s => {
            if (s.title) totalWords += s.title.split(/\s+/).filter(Boolean).length;
            if (Array.isArray(s.blocks)) {
                s.blocks.forEach(b => {
                    const text = b.data?.content || b.data?.code || b.data?.text || '';
                    totalWords += String(text).replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
                });
            }
        });
    }
    const wordCount = Math.max(250, totalWords);
    const publishedDate = post.publishedAt || new Date().toISOString();
    const modifiedDate = post.updatedAt || publishedDate;

    // Comprehensive Schema.org BlogPosting + BreadcrumbList Graph
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "@id": `${postCanonical}#article`,
                "isPartOf": {
                    "@type": "WebSite",
                    "@id": "https://underrateddev.com/#website",
                    "name": "Underrated Developer",
                    "url": "https://underrateddev.com/"
                },
                "headline": post.title,
                "description": desc,
                "url": postCanonical,
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": postCanonical
                },
                "author": {
                    "@type": "Person",
                    "name": authorName,
                    "url": "https://underrateddev.com/author"
                },
                "publisher": {
                    "@type": "Organization",
                    "@id": "https://underrateddev.com/#organization",
                    "name": "Underrated Developer",
                    "url": "https://underrateddev.com/",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://underrateddev.com/assets/favicons/official_logo_branding_transparent.png"
                    }
                },
                "datePublished": publishedDate,
                "dateModified": modifiedDate,
                "articleSection": category,
                "keywords": Array.isArray(post.tags) ? post.tags.join(', ') : category,
                "wordCount": wordCount,
                "inLanguage": "en-US",
                "image": "https://underrateddev.com/assets/branding.png"
            },
            {
                "@type": "BreadcrumbList",
                "@id": `${postCanonical}#breadcrumb`,
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://underrateddev.com/"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Articles",
                        "item": "https://underrateddev.com/blog"
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": post.title,
                        "item": postCanonical
                    }
                ]
            }
        ]
    };

    const extraArticleMeta = `
    <meta property="article:published_time" content="${publishedDate}">
    <meta property="article:modified_time" content="${modifiedDate}">
    <meta property="article:section" content="${escapeHtml(category)}">
    <meta property="article:author" content="${escapeHtml(authorName)}">
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
`;

    if (typeof HTMLRewriter === 'undefined') {
        let html = await templateResponse.text();
        html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
        html = html.replace(/id="canonical-url" href=".*?"/, `id="canonical-url" href="${postCanonical}"`);
        html = html.replace(/id="og-title" content=".*?"/, `id="og-title" content="${escapeHtml(title)}"`);
        html = html.replace(/id="og-description" content=".*?"/, `id="og-description" content="${escapeHtml(desc)}"`);
        html = html.replace(/id="og-url" content=".*?"/, `id="og-url" content="${postCanonical}"`);
        html = html.replace(/<h1 class="article-headline" id="post-title">.*?<\/h1>/, `<h1 class="article-headline" id="post-title">${escapeHtml(post.title)}</h1>`);
        html = html.replace(/<div class="article-prose" id="main-content">[\s\S]*?<\/div>/, `<div class="article-prose" id="main-content">${contentHtml}</div>`);
        html = html.replace('</head>', `${extraArticleMeta}\n</head>`);
        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=UTF-8',
                'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
            }
        });
    }

    let rewriter = new HTMLRewriter()
        .on('title', { element(e) { e.setInnerContent(escapeHtml(title)); } })
        .on('meta[name="description"]', { element(e) { e.setAttribute('content', desc); } })
        .on('#canonical-url', { element(e) { e.setAttribute('href', postCanonical); } })
        .on('#og-title', { element(e) { e.setAttribute('content', title); } })
        .on('#og-description', { element(e) { e.setAttribute('content', desc); } })
        .on('#og-url', { element(e) { e.setAttribute('content', postCanonical); } })
        .on('#tw-title', { element(e) { e.setAttribute('content', title); } })
        .on('#tw-description', { element(e) { e.setAttribute('content', desc); } })
        .on('#post-title', { element(e) { e.setInnerContent(escapeHtml(post.title)); } })
        .on('#post-category', { element(e) { e.setInnerContent(escapeHtml(category)); } })
        .on('#post-read-time', { element(e) { e.setInnerContent(escapeHtml(readTime)); } })
        .on('#post-author', { element(e) { e.setInnerContent(escapeHtml(authorName)); } })
        .on('#short-description-text', { element(e) { e.setInnerContent(escapeHtml(desc)); } })
        .on('#main-content', { element(e) { e.setInnerContent(contentHtml, { html: true }); } })
        .on('head', {
            element(e) {
                e.append(extraArticleMeta, { html: true });
            }
        });

    return rewriter.transform(templateResponse);
}

export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);

            // 1. Intercept API routes
            if (url.pathname.startsWith('/api/')) {
                return await handleApi(request, env, ctx);
            }

            // 2. Dynamic Live Sitemap (Always includes all MongoDB posts & clean URLs)
            if (url.pathname === '/sitemap.xml') {
                return await handleSitemap(request, env);
            }

            // 3. IndexNow Key Verification Endpoint
            if (url.pathname === '/4frndtech-ud-indexnow-2026.txt') {
                return new Response('4frndtech-ud-indexnow-2026', {
                    headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
                });
            }

            // 4. Permanent 301 redirects for legacy .html paths
            if (url.pathname === '/index.html') {
                return Response.redirect(`${url.origin}/`, 301);
            }
            if (url.pathname === '/blog.html') {
                return Response.redirect(`${url.origin}/blog${url.search}`, 301);
            }
            if (url.pathname === '/author.html') {
                return Response.redirect(`${url.origin}/author${url.search}`, 301);
            }
            if (url.pathname === '/support.html') {
                return Response.redirect(`${url.origin}/support${url.search}`, 301);
            }
            if (url.pathname === '/post.html') {
                return Response.redirect(`${url.origin}/post${url.search}`, 301);
            }

            // 5. SEO Pre-rendered Article View (Full metadata + body HTML for search crawlers)
            if (url.pathname === '/post') {
                return await handlePostPage(request, env);
            }

            // 6. Serve static assets via Cloudflare Workers Assets
            if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
                return await env.ASSETS.fetch(request);
            }

            return new Response("Asset not found", { status: 404 });
        } catch (fetchErr) {
            console.error('Worker Fetch Uncaught Error:', fetchErr);
            return new Response(JSON.stringify({
                success: false,
                message: "Cloudflare Worker handled recovery",
                error: fetchErr.message
            }), {
                status: 500,
                headers: CORS_HEADERS
            });
        }
    }
};
