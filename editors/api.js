// ==========================================================================
// UNDERRATED DEVELOPER - STUDIO API CLIENT & SYNC RUNTIME
// Self-contained module for Private Netlify CMS Studio
// Connects directly to Cloudflare production API or local dev backend
// ==========================================================================

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Cloudflare production API or local server
const DEFAULT_API_ROOT = IS_LOCAL
    ? 'http://localhost:5500/api'
    : 'https://underrateddeveloper.com/api';

export const API_BASE = localStorage.getItem('UD_API_URL') || `${DEFAULT_API_ROOT}/my`;
export const AUTH_API_BASE = localStorage.getItem('UD_AUTH_URL') || `${DEFAULT_API_ROOT}/auth/my`;

/**
 * Retrieve local drafts from browser storage
 */
export function getLocalDrafts() {
    try {
        const stored = localStorage.getItem('UD_LOCAL_POSTS');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Failed to read local posts:', e);
        return [];
    }
}

/**
 * Save draft locally to localStorage
 */
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

/**
 * Push post to Cloudflare / Remote Backend API
 */
export async function pushPostToBackend(postData) {
    const token = localStorage.getItem('token') || localStorage.getItem('UD_FOUNDER_TOKEN');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const res = await fetch(`${API_BASE}/create/post`, {
            method: 'POST',
            headers,
            body: JSON.stringify(postData)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || `Server responded with ${res.status}`);
        }

        const data = await res.json();
        return { success: true, data };
    } catch (err) {
        console.warn('API push notice:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Founder Auth / Session Management
 */
export function getFounderSession() {
    const token = localStorage.getItem('token') || localStorage.getItem('UD_FOUNDER_TOKEN');
    const founder = localStorage.getItem('UD_ACTIVE_FOUNDER');
    return {
        isAuthenticated: Boolean(token),
        token,
        founder: founder ? JSON.parse(founder) : null
    };
}

export function setFounderSession(token, founderData) {
    if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('UD_FOUNDER_TOKEN', token);
    }
    if (founderData) {
        localStorage.setItem('UD_ACTIVE_FOUNDER', JSON.stringify(founderData));
    }
}

export function clearFounderSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('UD_FOUNDER_TOKEN');
    localStorage.removeItem('UD_ACTIVE_FOUNDER');
}
