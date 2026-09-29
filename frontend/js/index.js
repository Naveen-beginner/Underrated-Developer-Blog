// ==========================================================================
// UNDERRATED DEVELOPER - CLEAN EDITORIAL HOME RUNTIME
// Directly fetches and renders live database posts with Instant SWR Cache
// ==========================================================================

import { fetchAllPosts } from './api.js';

const recentPostsContainer = document.getElementById("recent-posts");
const featuredPostCard = document.getElementById("featured-post-card");

async function loadHomeContent() {
    try {
        const posts = await fetchAllPosts();
        if (posts && posts.length > 0) {
            renderFeaturedCard(posts);
            renderJournalEntries(posts);
        } else {
            renderFeaturedCard([]);
            renderJournalEntries([]);
        }
    } catch (e) {
        console.warn('Error loading home content:', e);
        renderFeaturedCard([]);
        renderJournalEntries([]);
    }
}

// Reactive SWR listener: update immediately when background sync completes
window.addEventListener('ud:posts-synced', (e) => {
    const freshPosts = e.detail;
    if (Array.isArray(freshPosts) && freshPosts.length > 0) {
        renderFeaturedCard(freshPosts);
        renderJournalEntries(freshPosts);
    }
});

function renderFeaturedCard(posts) {
    if (!featuredPostCard) return;

    if (!posts || posts.length === 0) {
        featuredPostCard.innerHTML = `
            <div class="featured-tag-row">
                <span class="tag-pill blue">Spotlight</span>
            </div>
            <h2 class="featured-title">
                No Articles Published Yet
            </h2>
            <p class="featured-excerpt">
                Articles published directly to the database will automatically be featured here.
            </p>
        `;
        return;
    }

    const featured = posts[0];
    const postHref = `post.html?slug=${featured.slug || featured._id}`;
    const authorName = featured.author?.name || (typeof featured.author === 'string' ? featured.author : 'Naveen Chandra Kowshik');
    const label = featured.label || (Array.isArray(featured.tags) && featured.tags[0]) || 'Featured Article';

    featuredPostCard.innerHTML = `
        <div class="featured-tag-row">
            <span class="tag-pill blue">${escapeHtml(label)}</span>
            <span style="font-size: 12px; color: var(--text-dim); font-family: var(--font-mono);">${escapeHtml(featured.readTime || '5 min read')}</span>
        </div>

        <h2 class="featured-title">
            <a href="${postHref}">${escapeHtml(featured.title)}</a>
        </h2>

        <p class="featured-excerpt">
            ${escapeHtml(featured.shortDescription || '')}
        </p>

        <div class="featured-meta-bar">
            <span>By ${escapeHtml(authorName)}</span>
            <a href="${postHref}" style="color: var(--text-primary); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                Read Full Post →
            </a>
        </div>
    `;
}

function renderJournalEntries(posts) {
    if (!recentPostsContainer) return;
    recentPostsContainer.innerHTML = "";

    if (!posts || posts.length === 0) {
        recentPostsContainer.innerHTML = `<p style="padding: 24px 0; color: var(--text-dim); font-size: 14px;">Articles are being prepared in the database.</p>`;
        return;
    }

    posts.forEach(post => {
        const row = document.createElement("article");
        row.className = "journal-entry-row";

        const postHref = `post.html?slug=${post.slug || post._id}`;
        const dateStr = formatDate(post.publishedAt);
        const label = post.label || (Array.isArray(post.tags) && post.tags[0]) || "Article";

        row.innerHTML = `
            <div class="journal-entry-date">
                <span>${dateStr}</span>
                <span class="tag-pill" style="font-size: 10px; width: fit-content;">${escapeHtml(label)}</span>
            </div>
            <div class="journal-entry-body">
                <h3 class="journal-entry-title">
                    <a href="${postHref}">${escapeHtml(post.title)}</a>
                </h3>
                <p class="journal-entry-desc">${escapeHtml(post.shortDescription || '')}</p>
            </div>
            <div class="journal-entry-meta">
                <span>${post.readTime || '5 min read'} →</span>
            </div>
        `;

        recentPostsContainer.appendChild(row);
    });
}

function formatDate(dateStr) {
    if (!dateStr) return "Recent";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recent";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

loadHomeContent();