// ==========================================================================
// CENTRALIZED API PROVIDER - UNDERRATED DEVELOPER BLOG
// Directly connects to Database / Cloudflare Edge API
// ==========================================================================

const DEFAULT_API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5500/api/my'
    : '/api/my';

export const API_BASE = localStorage.getItem('UD_API_URL') || DEFAULT_API_BASE;

/**
 * Fetch all published articles directly from the database API
 */
export async function fetchAllPosts(tag = null, search = null) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        let url = `${API_BASE}/all/posts`;
        const params = new URLSearchParams();
        if (tag && tag !== 'All') params.append('tag', tag);
        if (search) params.append('search', search);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data && data.success && Array.isArray(data.data)) {
                return filterPosts(data.data, tag, search);
            }
        }
    } catch (err) {
        console.warn('Database API notice:', err.message);
    }

    // Resilient fallback to static data store if offline
    try {
        const dataPath = window.location.pathname.includes('/editors/') ? '../frontend/data/posts.json' : 'data/posts.json';
        const res = await fetch(dataPath);
        if (res.ok) {
            const posts = await res.json();
            if (Array.isArray(posts)) {
                return filterPosts(posts, tag, search);
            }
        }
    } catch (err) {
        console.error('Failed to load posts fallback:', err);
    }

    return [];
}

/**
 * Fetch single article by Mongo ID or Slug directly from database API
 */
export async function fetchPostByIdOrSlug(idOrSlug) {
    if (!idOrSlug) return null;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${API_BASE}/post/${encodeURIComponent(idOrSlug)}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const result = await res.json();
            if (result && result.success && result.data) {
                return result.data;
            }
            if (result && result.data) {
                return result.data;
            }
        }
    } catch (err) {
        console.warn('Database query notice:', err.message);
    }

    // Fallback to static posts file
    try {
        const dataPath = window.location.pathname.includes('/editors/') ? '../frontend/data/posts.json' : 'data/posts.json';
        const res = await fetch(dataPath);
        if (res.ok) {
            const posts = await res.json();
            if (Array.isArray(posts)) {
                const match = posts.find(p => p._id === idOrSlug || p.slug === idOrSlug);
                if (match) return match;
            }
        }
    } catch (err) {
        console.error('Failed to query static fallback store:', err);
    }

    return null;
}

function filterPosts(posts, tag, search) {
    if (!Array.isArray(posts)) return [];
    let list = posts;

    if (tag && tag !== 'All') {
        const tLower = tag.toLowerCase();
        list = list.filter(p => {
            const matchLabel = p.label && p.label.toLowerCase() === tLower;
            const matchTags = Array.isArray(p.tags) && p.tags.some(t => String(t).toLowerCase() === tLower);
            return matchLabel || matchTags;
        });
    }

    if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(p =>
            (p.title && p.title.toLowerCase().includes(q)) ||
            (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
            (p.label && p.label.toLowerCase().includes(q)) ||
            (Array.isArray(p.tags) && p.tags.some(t => String(t).toLowerCase().includes(q)))
        );
    }

    return list;
}
