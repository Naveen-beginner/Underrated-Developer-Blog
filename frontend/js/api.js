// ==========================================================================
// CENTRALIZED API PROVIDER - UNDERRATED DEVELOPER BLOG
// High-Performance Client Caching (Stale-While-Revalidate + Offline Resilient)
// Directly connects to Cloudflare Edge API & MongoDB Atlas
// ==========================================================================

const DEFAULT_API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5500/api/my'
    : '/api/my';

export const API_BASE = localStorage.getItem('UD_API_URL') || DEFAULT_API_BASE;

// Client Cache Keys
const CACHE_KEY_POSTS = 'UD_CACHE_POSTS_V2';
const CACHE_KEY_TIME = 'UD_CACHE_TIME_V2';
const CACHE_PREFIX_POST = 'UD_CACHE_POST_';
const SWR_STALE_TTL_MS = 30 * 1000; // 30 seconds soft TTL before background refresh

// In-memory runtime reference for instant intra-page navigation
let memoryPostsCache = null;

/**
 * Retrieve cached posts synchronously from localStorage or memory
 */
export function getLocalCachedPosts() {
    if (Array.isArray(memoryPostsCache) && memoryPostsCache.length > 0) {
        return memoryPostsCache;
    }
    try {
        const raw = localStorage.getItem(CACHE_KEY_POSTS);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                memoryPostsCache = parsed;
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Local cache read error:', e);
    }
    return null;
}

/**
 * Save posts to client cache (localStorage + memory)
 */
function setLocalCachedPosts(posts) {
    if (!Array.isArray(posts)) return;
    memoryPostsCache = posts;
    try {
        localStorage.setItem(CACHE_KEY_POSTS, JSON.stringify(posts));
        localStorage.setItem(CACHE_KEY_TIME, String(Date.now()));
        // Pre-cache individual posts for instant single-article rendering
        for (const p of posts) {
            if (!p) continue;
            if (p.slug) {
                try { localStorage.setItem(`${CACHE_PREFIX_POST}${p.slug.toLowerCase()}`, JSON.stringify(p)); } catch (_) {}
            }
            if (p._id) {
                try { localStorage.setItem(`${CACHE_PREFIX_POST}${String(p._id).toLowerCase()}`, JSON.stringify(p)); } catch (_) {}
            }
        }
    } catch (e) {
        console.warn('Local cache write error:', e);
    }
}

/**
 * Invalidate client cache (useful after authoring or updating posts)
 */
export function invalidateClientCache() {
    memoryPostsCache = null;
    try {
        localStorage.removeItem(CACHE_KEY_POSTS);
        localStorage.removeItem(CACHE_KEY_TIME);
    } catch (_) {}
}

/**
 * Fetch all published articles with Stale-While-Revalidate background caching
 * Principles of System Design:
 * 1. 0ms initial render if cached data exists
 * 2. Background revalidation to keep client in sync
 * 3. Graceful degradation: never fails if server responds with 500
 */
export async function fetchAllPosts(tag = null, search = null) {
    const cachedPosts = getLocalCachedPosts();
    const lastSyncTime = parseInt(localStorage.getItem(CACHE_KEY_TIME) || '0', 10);
    const isCacheStale = !lastSyncTime || (Date.now() - lastSyncTime > SWR_STALE_TTL_MS);

    // If we have cached posts, kick off background revalidation and return cached posts immediately!
    if (cachedPosts && cachedPosts.length > 0) {
        if (isCacheStale) {
            // Revalidate in background without blocking UI
            triggerBackgroundPostsSync();
        }
        return filterPosts(cachedPosts, tag, search);
    }

    // No cache yet (first visit) - perform direct fetch with resilient timeout
    try {
        const fresh = await fetchPostsFromNetwork();
        if (fresh && fresh.length > 0) {
            setLocalCachedPosts(fresh);
            return filterPosts(fresh, tag, search);
        }
    } catch (err) {
        console.warn('Network fetch failed, attempting static seed fallback:', err.message);
    }

    // Static fallback to pre-bundled posts.json
    const staticPosts = await fetchStaticFallback();
    if (staticPosts && staticPosts.length > 0) {
        setLocalCachedPosts(staticPosts);
        return filterPosts(staticPosts, tag, search);
    }

    return [];
}

/**
 * Internal network fetch for all posts with robust timeout
 */
async function fetchPostsFromNetwork() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
        const res = await fetch(`${API_BASE}/all/posts`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data && data.success && Array.isArray(data.data)) {
                return data.data;
            }
        } else {
            console.warn(`API returned status ${res.status}`);
        }
    } catch (err) {
        clearTimeout(timeoutId);
        console.warn('Network fetch error:', err.message);
    }
    return null;
}

/**
 * Trigger background revalidation of posts
 */
let isSyncing = false;
async function triggerBackgroundPostsSync() {
    if (isSyncing) return;
    isSyncing = true;
    try {
        const fresh = await fetchPostsFromNetwork();
        if (fresh && fresh.length > 0) {
            const oldPosts = getLocalCachedPosts();
            setLocalCachedPosts(fresh);

            // Notify UI if data changed
            const hasChanged = !oldPosts || JSON.stringify(oldPosts) !== JSON.stringify(fresh);
            if (hasChanged) {
                window.dispatchEvent(new CustomEvent('ud:posts-synced', { detail: fresh }));
            }
        }
    } catch (err) {
        console.warn('Background sync error:', err);
    } finally {
        isSyncing = false;
    }
}

/**
 * Fetch single article by Mongo ID or Slug with instant cache-first lookup
 */
export async function fetchPostByIdOrSlug(idOrSlug) {
    if (!idOrSlug) return null;
    const lowerKey = String(idOrSlug).toLowerCase().trim();

    // 1. Check direct post cache in localStorage
    try {
        const directCached = localStorage.getItem(`${CACHE_PREFIX_POST}${lowerKey}`);
        if (directCached) {
            const parsed = JSON.parse(directCached);
            if (parsed && (parsed.slug || parsed._id)) {
                // Revalidate in background to keep views/updates fresh
                triggerBackgroundSinglePostSync(idOrSlug);
                return parsed;
            }
        }
    } catch (_) {}

    // 2. Check all-posts cache
    const cachedPosts = getLocalCachedPosts();
    if (cachedPosts) {
        const match = cachedPosts.find(p =>
            p && ((p.slug && p.slug.toLowerCase() === lowerKey) || (p._id && String(p._id).toLowerCase() === lowerKey))
        );
        if (match) {
            triggerBackgroundSinglePostSync(idOrSlug);
            return match;
        }
    }

    // 3. Network fetch
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(`${API_BASE}/post/${encodeURIComponent(idOrSlug)}`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const result = await res.json();
            const post = result?.data;
            if (post) {
                // Cache it locally
                try {
                    localStorage.setItem(`${CACHE_PREFIX_POST}${lowerKey}`, JSON.stringify(post));
                    if (post.slug) localStorage.setItem(`${CACHE_PREFIX_POST}${post.slug.toLowerCase()}`, JSON.stringify(post));
                    if (post._id) localStorage.setItem(`${CACHE_PREFIX_POST}${String(post._id).toLowerCase()}`, JSON.stringify(post));
                } catch (_) {}
                return post;
            }
        }
    } catch (err) {
        console.warn('Network fetch single post error:', err.message);
    }

    // 4. Static fallback
    const staticPosts = await fetchStaticFallback();
    if (staticPosts) {
        const match = staticPosts.find(p =>
            p && ((p.slug && p.slug.toLowerCase() === lowerKey) || (p._id && String(p._id).toLowerCase() === lowerKey))
        );
        if (match) return match;
    }

    return null;
}

/**
 * Background single post revalidation
 */
async function triggerBackgroundSinglePostSync(idOrSlug) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${API_BASE}/post/${encodeURIComponent(idOrSlug)}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
            const result = await res.json();
            const post = result?.data;
            if (post) {
                const lowerKey = String(idOrSlug).toLowerCase().trim();
                localStorage.setItem(`${CACHE_PREFIX_POST}${lowerKey}`, JSON.stringify(post));
            }
        }
    } catch (_) {}
}

/**
 * Resilient fallback to static data store
 */
async function fetchStaticFallback() {
    try {
        const dataPath = window.location.pathname.includes('/editors/') ? '../frontend/data/posts.json' : 'data/posts.json';
        const res = await fetch(dataPath);
        if (res.ok) {
            const posts = await res.json();
            if (Array.isArray(posts) && posts.length > 0) {
                return posts;
            }
        }
    } catch (err) {
        console.warn('Static data fallback error:', err);
    }
    return null;
}

/**
 * Filter posts by category tag and search query safely
 */
export function filterPosts(posts, tag, search) {
    if (!Array.isArray(posts)) return [];
    let list = posts.filter(Boolean);

    if (tag && tag !== 'All') {
        const tLower = String(tag).toLowerCase().trim();
        list = list.filter(p => {
            const matchLabel = typeof p.label === 'string' && p.label.toLowerCase() === tLower;
            const matchTags = Array.isArray(p.tags) && p.tags.some(t => String(t).toLowerCase() === tLower);
            return matchLabel || matchTags;
        });
    }

    if (search && String(search).trim()) {
        const q = String(search).trim().toLowerCase();
        list = list.filter(p => {
            const titleMatch = typeof p.title === 'string' && p.title.toLowerCase().includes(q);
            const descMatch = typeof p.shortDescription === 'string' && p.shortDescription.toLowerCase().includes(q);
            const labelMatch = typeof p.label === 'string' && p.label.toLowerCase().includes(q);
            const tagMatch = Array.isArray(p.tags) && p.tags.some(t => String(t).toLowerCase().includes(q));
            return titleMatch || descMatch || labelMatch || tagMatch;
        });
    }

    return list;
}
