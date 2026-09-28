// ==========================================================================
// UNDERRATED DEVELOPER - CLEAN EDITORIAL BLOG FEED RUNTIME
// ==========================================================================

import { fetchAllPosts } from './api.js';

const postsContainer = document.getElementById("posts-container");
const searchInput = document.getElementById("search-input");
const filterBtns = document.querySelectorAll(".filter-btn-clean");
const postsCountLabel = document.getElementById("posts-count-label");

let activeTag = "All";
let searchQuery = "";

async function initBlogFeed() {
    const params = new URLSearchParams(window.location.search);
    const initialTag = params.get("tag");
    const initialSearch = params.get("search");

    if (initialTag) {
        activeTag = initialTag;
        filterBtns.forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-tag")?.toLowerCase() === initialTag.toLowerCase());
        });
    }

    if (initialSearch && searchInput) {
        searchQuery = initialSearch;
        searchInput.value = initialSearch;
    }

    setupFilters();
    setupSearch();
    await loadAndRenderPosts();
}

async function loadAndRenderPosts() {
    if (!postsContainer) return;

    postsContainer.innerHTML = `
        <div style="padding: 40px 0; text-align: center; color: var(--text-dim); font-size: 14px;">
            Loading articles...
        </div>
    `;

    const posts = await fetchAllPosts(activeTag, searchQuery);
    renderFeed(posts);
}

function renderFeed(posts) {
    if (!postsContainer) return;
    postsContainer.innerHTML = "";

    if (postsCountLabel) {
        postsCountLabel.textContent = `Showing ${posts.length} ${posts.length === 1 ? 'article' : 'articles'}`;
    }

    if (!posts || posts.length === 0) {
        postsContainer.innerHTML = `
            <div style="padding: 50px 0; text-align: center; color: var(--text-muted);">
                <p style="font-size: 16px; margin-bottom: 8px; color: var(--text-primary); font-weight: 600;">No articles found</p>
                <p style="font-size: 14px;">Try a different keyword or category.</p>
            </div>
        `;
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
                <h2 class="journal-entry-title">
                    <a href="${postHref}">${escapeHtml(post.title)}</a>
                </h2>
                <p class="journal-entry-desc">${escapeHtml(post.shortDescription || '')}</p>
            </div>
            <div class="journal-entry-meta">
                <span>${post.readTime || '5 min read'} →</span>
            </div>
        `;

        postsContainer.appendChild(row);
    });
}

function setupFilters() {
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeTag = btn.getAttribute("data-tag") || "All";
            loadAndRenderPosts();
        });
    });
}

function setupSearch() {
    if (!searchInput) return;
    let timer = null;
    searchInput.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            searchQuery = searchInput.value;
            loadAndRenderPosts();
        }, 250);
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

initBlogFeed();