// Centralized API & Data Provider for Underrated Developer Blog
// Seamlessly connects to Backend API with zero-downtime Static & LocalStorage Fallback

const DEFAULT_API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5500/api/my'
    : '/api/my';

export const API_BASE = localStorage.getItem('UD_API_URL') || DEFAULT_API_BASE;

export async function fetchAllPosts(tag = null, search = null) {
    // 1. Try Backend API first
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

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
                return mergeWithLocalDrafts(data.data, tag, search);
            }
        }
    } catch (err) {
        console.warn('Backend API unreachable, using resilient offline static store:', err.message);
    }

    // 2. Fallback to bundled data/posts.json
    try {
        const dataPath = window.location.pathname.includes('/editors/') ? '../frontend/data/posts.json' : 'data/posts.json';
        const res = await fetch(dataPath);
        if (res.ok) {
            let posts = await res.json();
            return filterPosts(mergeWithLocalDrafts(posts, tag, search), tag, search);
        }
    } catch (err) {
        console.error('Failed to load static posts:', err);
    }

    // 3. Fallback to localStorage drafts only
    return filterPosts(getLocalDrafts(), tag, search);
}

export async function fetchPostByIdOrSlug(idOrSlug) {
    if (!idOrSlug) return null;

    // Check localStorage created posts first
    const localPosts = getLocalDrafts();
    const localMatch = localPosts.find(p => p._id === idOrSlug || p.slug === idOrSlug);
    if (localMatch) return localMatch;

    // Try backend API
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(`${API_BASE}/post/${idOrSlug}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const result = await res.json();
            if (result && result.data) return result.data;
        }
    } catch (err) {
        console.warn('Backend API unreachable for post query:', err.message);
    }

    // Fallback to static posts.json
    try {
        const dataPath = window.location.pathname.includes('/editors/') ? '../frontend/data/posts.json' : 'data/posts.json';
        const res = await fetch(dataPath);
        if (res.ok) {
            const posts = await res.json();
            const match = posts.find(p => p._id === idOrSlug || p.slug === idOrSlug);
            if (match) return match;
        }
    } catch (err) {
        console.error('Failed to locate post in static store:', err);
    }

    return null;
}

function getLocalDrafts() {
    try {
        const stored = localStorage.getItem('UD_LOCAL_POSTS');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

export function saveLocalDraftPost(post) {
    try {
        const posts = getLocalDrafts();
        const existingIdx = posts.findIndex(p => p._id === post._id || (p.slug && p.slug === post.slug));
        if (existingIdx >= 0) {
            posts[existingIdx] = post;
        } else {
            posts.unshift(post);
        }
        localStorage.setItem('UD_LOCAL_POSTS', JSON.stringify(posts));
        return true;
    } catch (e) {
        console.error('Failed to save local post:', e);
        return false;
    }
}

function mergeWithLocalDrafts(posts, tag, search) {
    const local = getLocalDrafts();
    if (!local || local.length === 0) return posts;

    const seenIds = new Set(posts.map(p => p._id));
    const merged = [...local.filter(p => !seenIds.has(p._id)), ...posts];
    return merged;
}

function filterPosts(posts, tag, search) {
    let list = posts;
    if (tag && tag !== 'All') {
        const tLower = tag.toLowerCase();
        list = list.filter(p => {
            const matchLabel = p.label && p.label.toLowerCase() === tLower;
            const matchTags = Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase() === tLower);
            return matchLabel || matchTags;
        });
    }

    if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(p =>
            (p.title && p.title.toLowerCase().includes(q)) ||
            (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
            (p.label && p.label.toLowerCase().includes(q)) ||
            (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)))
        );
    }

    return list;
}
