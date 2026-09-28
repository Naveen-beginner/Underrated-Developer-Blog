// ==========================================================================
// UNDERRATED DEVELOPER - CLEAN EDITORIAL HOME RUNTIME
// ==========================================================================

import { fetchAllPosts } from './api.js';

const recentPostsContainer = document.getElementById("recent-posts");

async function loadHomeContent() {
    if (!recentPostsContainer) return;

    try {
        const posts = await fetchAllPosts();
        renderJournalEntries(posts);
    } catch (e) {
        console.error("Failed to load journal entries:", e);
    }
}

function renderJournalEntries(posts) {
    if (!recentPostsContainer) return;
    recentPostsContainer.innerHTML = "";

    if (!posts || posts.length === 0) {
        recentPostsContainer.innerHTML = `<p style="padding: 24px 0; color: var(--text-dim); font-size: 14px;">Articles are being prepared.</p>`;
        return;
    }

    posts.forEach(post => {
        const row = document.createElement("article");
        row.className = "journal-entry-row";

        const postHref = `post.html?slug=${post.slug || post._id}`;
        const dateStr = formatDate(post.publishedAt);
        const label = post.label || "Flutter & Dart";

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
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

loadHomeContent();