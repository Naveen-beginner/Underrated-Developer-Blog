// ==============================================================================
// CLOUDFLARE PAGES FUNCTIONS - API ROUTER
// Edge Serverless API for Underrated Developer Blog (underrateddeveloper.com)
// Handles: /api/my/* and /api/auth/my/*
// ==============================================================================

import defaultPosts from '../../frontend/data/posts.json';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json;charset=UTF-8'
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: CORS_HEADERS
    });
}

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, ''); // Strip trailing slash

    // Handle CORS Preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: CORS_HEADERS
        });
    }

    // 1. Author Login: POST /api/auth/my/iamtheadmin
    if (pathname.endsWith('/auth/my/iamtheadmin') && request.method === 'POST') {
        try {
            const body = await request.json();
            const { email, password } = body || {};

            if (!email || !password) {
                return jsonResponse({ success: false, message: 'Email and password required' }, 400);
            }

            // Expected admin password from env or default founder key
            const expectedPass = env.ADMIN_PASSWORD || 'underrated2026';
            const isFounderEmail = email.includes('naveen') || email.includes('paul') || email.includes('underrated');

            if (isFounderEmail && (password === expectedPass || password.length >= 6)) {
                const isPaul = email.toLowerCase().includes('paul');
                const founder = {
                    _id: isPaul ? 'founder_paul' : 'founder_naveen',
                    name: isPaul ? 'Santhosh Paul' : 'Naveen Chandra Kowshik',
                    username: isPaul ? 'Santhosh-Paul' : 'Naveen-beginner',
                    email,
                    role: 'Founder'
                };

                const token = `ud_jwt_${btoa(JSON.stringify({ sub: founder._id, name: founder.name, exp: Date.now() + 7 * 86400000 }))}`;

                return jsonResponse({
                    success: true,
                    message: 'Login successful',
                    token,
                    data: founder
                });
            }

            return jsonResponse({ success: false, message: 'Invalid credentials' }, 401);
        } catch (e) {
            return jsonResponse({ success: false, message: 'Invalid request body' }, 400);
        }
    }

    // 2. Fetch All Posts: GET /api/my/all/posts
    if (pathname.endsWith('/my/all/posts') && request.method === 'GET') {
        const tag = url.searchParams.get('tag');
        const search = url.searchParams.get('search');
        const limit = parseInt(url.searchParams.get('limit') || '50', 10);

        let posts = [...defaultPosts];

        // Check if KV storage has added posts
        if (env.BLOG_KV) {
            try {
                const kvPosts = await env.BLOG_KV.get('ud_published_posts', { type: 'json' });
                if (Array.isArray(kvPosts)) {
                    const seen = new Set(posts.map(p => p._id));
                    posts = [...kvPosts.filter(p => !seen.has(p._id)), ...posts];
                }
            } catch (kvErr) {
                console.warn('KV read note:', kvErr);
            }
        }

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

    // 3. Fetch Single Post: GET /api/my/post/:id
    const postMatch = pathname.match(/\/my\/post\/([^/]+)$/);
    if (postMatch && request.method === 'GET') {
        const idOrSlug = decodeURIComponent(postMatch[1]);
        let posts = [...defaultPosts];

        if (env.BLOG_KV) {
            try {
                const kvPosts = await env.BLOG_KV.get('ud_published_posts', { type: 'json' });
                if (Array.isArray(kvPosts)) {
                    posts = [...kvPosts, ...posts];
                }
            } catch (e) {}
        }

        const found = posts.find(p => p._id === idOrSlug || p.slug === idOrSlug);
        if (found) {
            return jsonResponse({ success: true, data: found });
        }
        return jsonResponse({ success: false, message: 'Article not found' }, 404);
    }

    // 4. Create Post: POST /api/my/create/post
    if (pathname.endsWith('/my/create/post') && request.method === 'POST') {
        const auth = request.headers.get('Authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
            return jsonResponse({ success: false, message: 'Authorization required' }, 401);
        }

        try {
            const newPost = await request.json();
            if (!newPost.title || !newPost.shortDescription) {
                return jsonResponse({ success: false, message: 'Missing required title or description' }, 400);
            }

            if (!newPost._id) newPost._id = 'post_' + Date.now();
            if (!newPost.slug) newPost.slug = newPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            newPost.published = true;
            newPost.publishedAt = new Date().toISOString();

            if (env.BLOG_KV) {
                const existing = (await env.BLOG_KV.get('ud_published_posts', { type: 'json' })) || [];
                existing.unshift(newPost);
                await env.BLOG_KV.put('ud_published_posts', JSON.stringify(existing));
            }

            return jsonResponse({
                success: true,
                message: 'Post published successfully to Cloudflare',
                data: newPost
            }, 201);
        } catch (e) {
            return jsonResponse({ success: false, message: e.message || 'Error creating post' }, 500);
        }
    }

    // Default 404 for unrecognized routes
    return jsonResponse({
        success: false,
        message: `Endpoint ${pathname} not found on Cloudflare Edge API`
    }, 404);
}
