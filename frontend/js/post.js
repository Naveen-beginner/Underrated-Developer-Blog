// ==========================================================================
// UNDERRATED DEVELOPER - CLEAN EDITORIAL ARTICLE RUNTIME
// ==========================================================================

import { fetchPostByIdOrSlug, fetchAllPosts } from './api.js';

// DOM Elements
const postTitle = document.getElementById("post-title");
const postAuthor = document.getElementById("post-author");
const postDate = document.getElementById("post-date");
const postCategory = document.getElementById("post-category");
const postReadTime = document.getElementById("post-read-time");
const shortDescText = document.getElementById("short-description-text");
const mainContent = document.getElementById("main-content");
const readingProgress = document.getElementById("reading-progress");
const btnCopyLink = document.getElementById("btn-copy-link");
const btnShareTwitter = document.getElementById("btn-share-twitter");
const btnShareLinkedin = document.getElementById("btn-share-linkedin");
const btnShareBottom = document.getElementById("btn-share-bottom");
const postToast = document.getElementById("post-toast");
const toastText = document.getElementById("toast-text");

async function loadArticle() {
    const params = new URLSearchParams(window.location.search);
    let targetId = params.get("id") || params.get("slug");

    if (!targetId) {
        const all = await fetchAllPosts();
        if (all && all.length > 0) {
            targetId = all[0].slug || all[0]._id;
        }
    }

    if (!targetId) {
        mainContent.innerHTML = `<p style="padding: 40px 0; color: var(--text-dim); text-align: center;">No article found. <a href="blog.html" style="color: var(--accent-blue);">Back to articles</a></p>`;
        return;
    }

    const post = await fetchPostByIdOrSlug(targetId);

    if (!post) {
        mainContent.innerHTML = `<p style="padding: 40px 0; color: var(--text-dim); text-align: center;">Article not found. <a href="blog.html" style="color: var(--accent-blue);">Back to articles</a></p>`;
        return;
    }

    renderArticle(post);
    setupScrollProgress();
    setupSharing(post);
    updateSEO(post);
}

function renderArticle(post) {
    document.title = `${post.title} — Underrated Developer`;
    postTitle.textContent = post.title;
    postCategory.textContent = post.label || "Flutter & Dart";
    postReadTime.textContent = post.readTime || "5 min read";

    const authorName = post.author?.name || (typeof post.author === 'string' ? post.author : "Naveen Chandra Kowshik");
    postAuthor.textContent = authorName;

    if (post.publishedAt) {
        const d = new Date(post.publishedAt);
        postDate.textContent = d.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    shortDescText.textContent = post.shortDescription || "";

    mainContent.innerHTML = "";
    const sections = Array.isArray(post.sections) ? post.sections : [];

    sections.forEach((section, sIdx) => {
        const secEl = document.createElement("section");

        if (section.title) {
            const h2 = document.createElement("h2");
            h2.className = "prose-h2";
            h2.textContent = section.title;
            secEl.appendChild(h2);
        }

        const blocks = Array.isArray(section.blocks) ? section.blocks : [];
        blocks.forEach((block) => {
            const blockEl = createBlockElement(block);
            if (blockEl) secEl.appendChild(blockEl);
        });

        mainContent.appendChild(secEl);
    });

    renderAuthorSignoff(post);

    if (window.Prism) {
        window.Prism.highlightAllUnder(mainContent);
    }
}

function createBlockElement(block) {
    if (!block || !block.type) return null;

    if (block.type === "paragraph") {
        const p = document.createElement("p");
        p.className = "prose-p";
        p.innerHTML = block.data?.content || "";
        return p;
    }

    if (block.type === "subheading" || block.type === "heading") {
        const h3 = document.createElement("h3");
        h3.className = "prose-h3";
        h3.textContent = block.data?.content || "";
        return h3;
    }

    if (block.type === "code") {
        const frame = document.createElement("div");
        frame.className = "code-frame";

        const lang = block.data?.language || "dart";
        const filename = block.data?.filename || "lib/main.dart";
        const code = block.data?.code || "";

        frame.innerHTML = `
            <div class="code-frame-header">
                <div class="code-dots-row">
                    <span class="code-dot dot-red"></span>
                    <span class="code-dot dot-yellow"></span>
                    <span class="code-dot dot-green"></span>
                </div>
                <div class="code-title-tag">
                    <i class="fa-solid fa-code"></i>
                    <span>${filename}</span>
                </div>
                <div class="code-right-actions">
                    <span class="code-lang-badge">${lang}</span>
                    <button class="btn-copy-code" title="Copy snippet">
                        <span class="material-symbols-outlined" style="font-size:13px;">content_copy</span>
                        <span>Copy</span>
                    </button>
                </div>
            </div>
            <pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>
        `;

        const copyBtn = frame.querySelector(".btn-copy-code");
        copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(code).then(() => {
                copyBtn.classList.add("copied");
                copyBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size:13px;">check</span><span>Copied!</span>`;
                setTimeout(() => {
                    copyBtn.classList.remove("copied");
                    copyBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size:13px;">content_copy</span><span>Copy</span>`;
                }, 2000);
            });
        });

        return frame;
    }

    if (block.type === "list") {
        const list = document.createElement(block.data?.ordered ? "ol" : "ul");
        list.className = "prose-list";
        const items = Array.isArray(block.data?.items) ? block.data.items : [];
        items.forEach(it => {
            const li = document.createElement("li");
            li.innerHTML = it;
            list.appendChild(li);
        });
        return list;
    }

    if (block.type === "callout") {
        const callout = document.createElement("div");
        callout.className = "prose-callout";
        callout.innerHTML = `
            <div class="callout-header">
                <span class="material-symbols-outlined">tips_and_updates</span>
                <span>${block.data?.title || 'Architecture Insight'}</span>
            </div>
            <div class="callout-body">${block.data?.content || ''}</div>
        `;
        return callout;
    }

    if (block.type === "quote") {
        const quote = document.createElement("blockquote");
        quote.className = "prose-quote";
        quote.innerHTML = `
            <p class="quote-text">"${block.data?.text || ''}"</p>
            ${block.data?.citation ? `<cite class="quote-author">— ${block.data.citation}</cite>` : ''}
        `;
        return quote;
    }

    return null;
}

function setupScrollProgress() {
    window.addEventListener("scroll", () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.scrollY / (docHeight || 1)) * 100;
        readingProgress.style.width = `${Math.min(100, Math.max(0, scrolled))}%`;
    });
}

function setupSharing(post) {
    const pageUrl = window.location.href;
    const shareText = encodeURIComponent(`${post.title} — Underrated Developer`);
    const shareUrl = encodeURIComponent(pageUrl);

    btnShareTwitter.href = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
    btnShareLinkedin.href = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;

    btnCopyLink.addEventListener("click", () => copyLink(pageUrl));
    if (btnShareBottom) {
        btnShareBottom.addEventListener("click", () => copyLink(pageUrl));
    }
}

function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast("Article link copied to clipboard!");
    });
}

function showToast(msg) {
    toastText.textContent = msg;
    postToast.classList.add("show");
    setTimeout(() => {
        postToast.classList.remove("show");
    }, 2200);
}

function updateSEO(post) {
    const metaDesc = document.getElementById("meta-description");
    const canonical = document.getElementById("canonical-url");
    const ogTitle = document.getElementById("og-title");
    const ogDesc = document.getElementById("og-description");
    const ogUrl = document.getElementById("og-url");
    const twTitle = document.getElementById("tw-title");
    const twDesc = document.getElementById("tw-description");

    const desc = post.shortDescription || post.title;
    const currentUrl = `https://underrateddeveloper.com/post.html?slug=${post.slug || post._id}`;

    if (metaDesc) metaDesc.content = desc;
    if (canonical) canonical.href = currentUrl;
    if (ogTitle) ogTitle.content = post.title;
    if (ogDesc) ogDesc.content = desc;
    if (ogUrl) ogUrl.content = currentUrl;
    if (twTitle) twTitle.content = post.title;
    if (twDesc) twDesc.content = desc;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderAuthorSignoff(post) {
    const signoffCard = document.getElementById("article-signoff-card");
    if (!signoffCard) return;

    const authorName = post.author?.name || (typeof post.author === 'string' ? post.author : "Naveen");
    const isSanthosh = authorName.toLowerCase().includes("santhosh") || authorName.toLowerCase().includes("paul");
    const isBoth = authorName.toLowerCase().includes("&") || authorName.toLowerCase().includes("underrated");

    if (isSanthosh) {
        signoffCard.innerHTML = `
            <img src="assets/authors/santhosh.jpg" alt="Santhosh Paul" class="signoff-avatar" id="signoff-avatar">
            <div class="signoff-body">
                <h3 id="signoff-author-name">Santhosh Paul</h3>
                <p id="signoff-author-bio">
                    Founder &amp; Software Developer at Team 4FrndTech. Focused on Dart, Flutter, Android Studio, and production app releases on Google Play.
                </p>
                <div class="signoff-links" id="signoff-links">
                    <a href="mailto:santhoshpaul861@gmail.com"><i class="fa-solid fa-envelope"></i> Email Santhosh</a>
                    <a href="https://devfrnd.netlify.app" target="_blank" rel="noopener"><i class="fa-solid fa-globe"></i> Portfolio</a>
                    <a href="author.html#author-paul"><i class="fa-solid fa-user"></i> Founder Profile</a>
                </div>
            </div>
        `;
    } else if (isBoth) {
        signoffCard.innerHTML = `
            <img src="assets/favicons/authors-og-image.png" alt="Naveen & Santhosh Paul" class="signoff-avatar" id="signoff-avatar">
            <div class="signoff-body">
                <h3 id="signoff-author-name">Naveen &amp; Santhosh Paul</h3>
                <p id="signoff-author-bio">
                    Founders of Team 4FrndTech &amp; Underrated Developer (#WeAreUnderratedDevs). Building cross-platform Flutter engines, Play Store apps, and autonomous agents.
                </p>
                <div class="signoff-links" id="signoff-links">
                    <a href="author.html"><i class="fa-solid fa-users"></i> Meet The Founders</a>
                    <a href="https://github.com/Naveen-beginner" target="_blank" rel="noopener"><i class="fa-brands fa-github"></i> GitHub</a>
                    <a href="mailto:naveen191496@gmail.com"><i class="fa-solid fa-envelope"></i> Contact Naveen</a>
                    <a href="mailto:santhoshpaul861@gmail.com"><i class="fa-solid fa-envelope"></i> Contact Santhosh</a>
                </div>
            </div>
        `;
    } else {
        signoffCard.innerHTML = `
            <img src="assets/authors/naveen.png" alt="Naveen" class="signoff-avatar" id="signoff-avatar">
            <div class="signoff-body">
                <h3 id="signoff-author-name">Naveen</h3>
                <p id="signoff-author-bio">
                    Founder &amp; Lead Engineer at Team 4FrndTech. Deep dives on Flutter internals, Dart compilation, and Win32 desktop runtimes.
                </p>
                <div class="signoff-links" id="signoff-links">
                    <a href="https://github.com/Naveen-beginner" target="_blank" rel="noopener"><i class="fa-brands fa-github"></i> GitHub</a>
                    <a href="https://play.google.com/store/apps/dev?id=8374043554473360551" target="_blank" rel="noopener"><i class="fa-brands fa-google-play"></i> Play Store Profile</a>
                    <a href="mailto:naveen191496@gmail.com"><i class="fa-solid fa-envelope"></i> Email Naveen</a>
                    <a href="author.html#author-naveen"><i class="fa-solid fa-user"></i> Founder Profile</a>
                </div>
            </div>
        `;
    }
}

loadArticle();