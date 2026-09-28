// ==========================================================================
// UNDERRATED DEVELOPER - STUDIO AUTHOR RUNTIME
// Self-contained Private Studio for Team 4FrndTech (Naveen & Santhosh Paul)
// ==========================================================================

import { API_BASE, saveLocalDraftPost, pushPostToBackend, updatePostOnBackend, deletePostFromBackend, getFounderSession, clearFounderSession } from './api.js';

// Founder Guard: Verify author authentication before loading studio
const founderSession = getFounderSession();
if (!founderSession.isAuthenticated) {
    window.location.replace('author_login.html');
}

let postData = {
    _id: 'draft_' + Date.now(),
    title: "Mastering Flutter Desktop: Isolates, Win32 FFI & Native Performance",
    label: "Flutter & Dart",
    tags: ["Flutter", "Dart", "Desktop", "Windows", "FFI", "GDE Aspirant"],
    shortDescription: "A technical architectural deep-dive into building high-performance Windows desktop applications with Flutter and compiled C++ runtimes.",
    author: {
        name: founderSession.founder?.name || "Naveen Chandra Kowshik",
        username: founderSession.founder?.username || "Naveen-beginner"
    },
    sections: [
        {
            title: "Architectural Foundations of Flutter Desktop",
            blocks: [
                {
                    type: "paragraph",
                    data: {
                        content: "When engineering desktop-grade software with Flutter, the traditional mobile mental model fails. Desktop users expect <strong>instant cold startups</strong>, negligible memory footprints, and zero stutter during intense file system I/O."
                    }
                },
                {
                    type: "callout",
                    data: {
                        title: "GDE Pro Tip: Const Canonicalization",
                        content: "Always use const constructors wherever possible in complex tree structures. The Dart VM canonicalizes these instances at compile time, eliminating unnecessary garbage collector pressure."
                    }
                },
                {
                    type: "code",
                    data: {
                        language: "dart",
                        filename: "lib/core/isolate_worker.dart",
                        code: "import 'dart:isolate';\n\nclass DesktopWorker {\n  static Future<T> runInBackground<T, R>(T Function(R) task, R param) async {\n    final port = ReceivePort();\n    await Isolate.spawn(_entryPoint, [port.sendPort, task, param]);\n    return await port.first as T;\n  }\n\n  static void _entryPoint(List<dynamic> args) {\n    final sendPort = args[0] as SendPort;\n    final task = args[1] as Function;\n    final param = args[2];\n    final result = task(param);\n    sendPort.send(result);\n  }\n}"
                    }
                },
                {
                    type: "list",
                    data: {
                        ordered: false,
                        items: [
                            "Decouple long-running operations into background isolates.",
                            "Leverage Win32 C++ APIs via Dart FFI for native OS integration.",
                            "Use virtualized ListView.builder for memory-efficient list views."
                        ]
                    }
                }
            ]
        }
    ],
    published: true,
    publishedAt: new Date().toISOString()
};

// DOM Elements
const sectionsContainer = document.getElementById("sections-container");
const postTitleInput = document.getElementById("post-title");
const postDescInput = document.getElementById("post-description");
const postLabelInput = document.getElementById("post-label");
const postTagsInput = document.getElementById("post-tags");
const postAuthorInput = document.getElementById("post-author");
const postSlugInput = document.getElementById("post-slug");
const statsBadge = document.getElementById("stats-badge");
const editorPane = document.getElementById("editor-pane");
const previewPane = document.getElementById("preview-pane");
const btnModeEditor = document.getElementById("btn-mode-editor");
const btnModePreview = document.getElementById("btn-mode-preview");
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toast-msg");

function loadPostIntoEditor(post) {
    postData = post;
    postTitleInput.value = postData.title || "";
    postDescInput.value = postData.shortDescription || "";
    postLabelInput.value = postData.label || "Flutter & Dart";
    postTagsInput.value = Array.isArray(postData.tags) ? postData.tags.join(", ") : "";
    postSlugInput.value = postData.slug || "";

    const authorSelect = document.getElementById("post-author-select");
    const currentAuthorName = postData.author?.name || founderSession.founder?.name || "Naveen Chandra Kowshik";
    postAuthorInput.value = currentAuthorName;

    if (authorSelect) {
        if (currentAuthorName.includes("Santhosh")) {
            authorSelect.value = "Santhosh Paul";
        } else if (currentAuthorName.includes("Naveen")) {
            authorSelect.value = "Naveen Chandra Kowshik";
        } else {
            authorSelect.value = "custom";
            postAuthorInput.style.display = "block";
        }
    }

    const deleteBtn = document.getElementById("btn-delete-post");
    if (deleteBtn) {
        deleteBtn.style.display = (postData._id && !postData._id.startsWith("draft_")) ? "inline-flex" : "none";
    }

    renderSections();
    updateStats();
}

async function initEditor() {
    // Check URL parameters for ?id= or ?slug= to edit existing article
    const urlParams = new URLSearchParams(window.location.search);
    const editParam = urlParams.get('id') || urlParams.get('slug');
    let loadedFromApi = false;

    if (editParam) {
        try {
            const res = await fetch(`${API_BASE}/post/${encodeURIComponent(editParam)}`);
            if (res.ok) {
                const json = await res.json();
                if (json.data) {
                    loadPostIntoEditor(json.data);
                    loadedFromApi = true;
                    showToast(`Loaded article: ${json.data.title}`);
                }
            }
        } catch (e) {
            console.warn("Could not fetch remote post, checking local:", e);
        }
    }

    if (!loadedFromApi) {
        const saved = localStorage.getItem("UD_CURRENT_DRAFT");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.title) postData = parsed;
            } catch (e) {
                console.warn("Could not load stored draft", e);
            }
        }
    }

    // Founder UI & Session controls
    const activeFounderSpan = document.getElementById("active-founder-name");
    if (activeFounderSpan && founderSession.founder) {
        activeFounderSpan.textContent = `${founderSession.founder.name.split(' ')[0]} (Founder)`;
    }

    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Log out of CMS Studio?")) {
                clearFounderSession();
                window.location.href = "author_login.html";
            }
        });
    }

    const liveBlogLink = document.getElementById("link-public-blog");
    if (liveBlogLink && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        liveBlogLink.href = '../frontend/blog.html';
    }

    // Populate meta fields
    postTitleInput.value = postData.title || "";
    postDescInput.value = postData.shortDescription || "";
    postLabelInput.value = postData.label || "Flutter & Dart";
    postTagsInput.value = Array.isArray(postData.tags) ? postData.tags.join(", ") : "";
    postSlugInput.value = postData.slug || "";

    // Author selector (Team 4FrndTech dual founders)
    const authorSelect = document.getElementById("post-author-select");
    const currentAuthorName = postData.author?.name || founderSession.founder?.name || "Naveen Chandra Kowshik";
    postAuthorInput.value = currentAuthorName;

    if (authorSelect) {
        if (currentAuthorName.includes("Santhosh")) {
            authorSelect.value = "Santhosh Paul";
        } else if (currentAuthorName.includes("Naveen")) {
            authorSelect.value = "Naveen Chandra Kowshik";
        } else {
            authorSelect.value = "custom";
            postAuthorInput.style.display = "block";
        }

        authorSelect.addEventListener("change", () => {
            if (authorSelect.value === "custom") {
                postAuthorInput.style.display = "block";
                postAuthorInput.focus();
            } else {
                postAuthorInput.style.display = "none";
                postAuthorInput.value = authorSelect.value;
                const opt = authorSelect.options[authorSelect.selectedIndex];
                postData.author = {
                    name: authorSelect.value,
                    username: opt.getAttribute("data-username") || "underrated-founder"
                };
                scheduleAutosave();
            }
        });
    }

    // Input listeners
    postTitleInput.addEventListener("input", () => { postData.title = postTitleInput.value; updateStats(); scheduleAutosave(); });
    postDescInput.addEventListener("input", () => { postData.shortDescription = postDescInput.value; updateStats(); scheduleAutosave(); });
    postLabelInput.addEventListener("change", () => { postData.label = postLabelInput.value; scheduleAutosave(); });
    postTagsInput.addEventListener("input", () => {
        postData.tags = postTagsInput.value.split(",").map(t => t.trim()).filter(Boolean);
        scheduleAutosave();
    });
    postAuthorInput.addEventListener("input", () => {
        if (!postData.author) postData.author = {};
        postData.author.name = postAuthorInput.value;
        scheduleAutosave();
    });
    postSlugInput.addEventListener("input", () => {
        postData.slug = postSlugInput.value.trim();
        scheduleAutosave();
    });

    renderSections();
    updateStats();
}

function renderSections() {
    sectionsContainer.innerHTML = "";

    postData.sections.forEach((section, sIdx) => {
        const secUnit = document.createElement("div");
        secUnit.className = "section-unit";

        // Head
        const head = document.createElement("div");
        head.className = "section-head";

        const titleInput = document.createElement("input");
        titleInput.className = "section-title-input";
        titleInput.placeholder = `Section ${sIdx + 1} Heading (H2)...`;
        titleInput.value = section.title || "";
        titleInput.addEventListener("input", () => {
            section.title = titleInput.value;
            scheduleAutosave();
        });

        const controls = document.createElement("div");
        controls.className = "section-controls";

        const upBtn = createIconBtn("arrow_upward", "Move Section Up", () => moveSection(sIdx, -1));
        const downBtn = createIconBtn("arrow_downward", "Move Section Down", () => moveSection(sIdx, 1));
        const delBtn = createIconBtn("delete", "Delete Section", () => deleteSection(sIdx), true);

        controls.append(upBtn, downBtn, delBtn);
        head.append(titleInput, controls);
        secUnit.appendChild(head);

        // Blocks Box
        const blocksBox = document.createElement("div");
        blocksBox.className = "blocks-box";

        section.blocks.forEach((block, bIdx) => {
            blocksBox.appendChild(renderBlock(section, block, sIdx, bIdx));
        });

        secUnit.appendChild(blocksBox);

        // Quick Insert Menu
        const insertMenu = document.createElement("div");
        insertMenu.className = "insert-menu";

        const label = document.createElement("span");
        label.className = "insert-label";
        label.textContent = "+ Insert:";

        const addP = createInsertBtn("format_paragraph", "Paragraph", () => addBlock(sIdx, "paragraph"));
        const addCode = createInsertBtn("code", "Flutter / Dart Code", () => addBlock(sIdx, "code"), true);
        const addSub = createInsertBtn("title", "Subheading", () => addBlock(sIdx, "subheading"));
        const addList = createInsertBtn("format_list_bulleted", "List", () => addBlock(sIdx, "list"));
        const addCallout = createInsertBtn("tips_and_updates", "Pro Tip", () => addBlock(sIdx, "callout"));
        const addQuote = createInsertBtn("format_quote", "Quote", () => addBlock(sIdx, "quote"));

        insertMenu.append(label, addP, addCode, addSub, addList, addCallout, addQuote);
        secUnit.appendChild(insertMenu);

        sectionsContainer.appendChild(secUnit);
    });
}

function renderBlock(section, block, sIdx, bIdx) {
    const item = document.createElement("div");
    item.className = "content-block-item";

    const metaRow = document.createElement("div");
    metaRow.className = "block-meta-row";

    const typeLabel = document.createElement("span");
    typeLabel.className = "block-type-label";
    typeLabel.textContent = block.type.toUpperCase();

    const controls = document.createElement("div");
    controls.className = "section-controls";

    const upBtn = createIconBtn("arrow_upward", "Move Block Up", () => moveBlock(section, bIdx, -1));
    const downBtn = createIconBtn("arrow_downward", "Move Block Down", () => moveBlock(section, bIdx, 1));
    const dupBtn = createIconBtn("content_copy", "Duplicate Block", () => duplicateBlock(section, bIdx));
    const delBtn = createIconBtn("delete", "Delete Block", () => deleteBlock(section, bIdx), true);

    controls.append(upBtn, downBtn, dupBtn, delBtn);
    metaRow.append(typeLabel, controls);
    item.appendChild(metaRow);

    if (block.type === "paragraph") {
        const p = document.createElement("div");
        p.className = "editable-text";
        p.contentEditable = "true";
        p.innerHTML = block.data.content || "";
        p.addEventListener("input", () => {
            block.data.content = p.innerHTML;
            updateStats();
            scheduleAutosave();
        });
        item.appendChild(p);
    } else if (block.type === "subheading") {
        const sub = document.createElement("input");
        sub.className = "subheading-field";
        sub.placeholder = "Subheading (H3)...";
        sub.value = block.data.content || "";
        sub.addEventListener("input", () => {
            block.data.content = sub.value;
            updateStats();
            scheduleAutosave();
        });
        item.appendChild(sub);
    } else if (block.type === "code") {
        const codeBox = document.createElement("div");
        codeBox.className = "code-box-editor";

        const bar = document.createElement("div");
        bar.className = "code-bar";

        const fileInput = document.createElement("input");
        fileInput.className = "code-file-input";
        fileInput.placeholder = "lib/main.dart or pubspec.yaml";
        fileInput.value = block.data.filename || "lib/main.dart";
        fileInput.addEventListener("input", () => {
            block.data.filename = fileInput.value;
            scheduleAutosave();
        });

        const langPicker = document.createElement("select");
        langPicker.className = "code-lang-picker";
        ["dart", "yaml", "bash", "json", "javascript", "typescript", "python", "html", "css"].forEach(l => {
            const opt = document.createElement("option");
            opt.value = l;
            opt.textContent = l.toUpperCase();
            if (block.data.language === l) opt.selected = true;
            langPicker.appendChild(opt);
        });
        langPicker.addEventListener("change", () => {
            block.data.language = langPicker.value;
            scheduleAutosave();
        });

        bar.append(fileInput, langPicker);
        codeBox.appendChild(bar);

        const textarea = document.createElement("textarea");
        textarea.className = "code-input-area";
        textarea.placeholder = "// Write or paste Dart / Flutter code here...";
        textarea.value = block.data.code || "";

        textarea.addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + "  " + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 2;
                block.data.code = textarea.value;
                scheduleAutosave();
            }
        });

        textarea.addEventListener("input", () => {
            block.data.code = textarea.value;
            updateStats();
            scheduleAutosave();
        });

        codeBox.appendChild(textarea);
        item.appendChild(codeBox);
    } else if (block.type === "list") {
        const listBox = document.createElement("div");
        listBox.className = "list-items-box";

        if (!Array.isArray(block.data.items) || block.data.items.length === 0) {
            block.data.items = ["First item"];
        }

        block.data.items.forEach((it, idx) => {
            const row = document.createElement("div");
            row.className = "list-row";

            const bullet = document.createElement("span");
            bullet.className = "list-marker";
            bullet.textContent = "•";

            const input = document.createElement("input");
            input.className = "list-text-input";
            input.value = it;
            input.addEventListener("input", () => {
                block.data.items[idx] = input.value;
                scheduleAutosave();
            });

            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    block.data.items.splice(idx + 1, 0, "");
                    renderSections();
                } else if (e.key === "Backspace" && input.value === "" && block.data.items.length > 1) {
                    e.preventDefault();
                    block.data.items.splice(idx, 1);
                    renderSections();
                }
            });

            row.append(bullet, input);
            listBox.appendChild(row);
        });

        const addRowBtn = document.createElement("button");
        addRowBtn.style.cssText = "align-self:flex-start; background:none; border:none; color:var(--accent-blue); font-size:12px; font-weight:600; cursor:pointer; padding:2px 0;";
        addRowBtn.textContent = "+ Add item";
        addRowBtn.onclick = () => { block.data.items.push(""); renderSections(); };
        listBox.appendChild(addRowBtn);

        item.appendChild(listBox);
    } else if (block.type === "callout") {
        const callout = document.createElement("div");
        callout.className = "callout-box-editor";

        const title = document.createElement("input");
        title.className = "callout-head-input";
        title.placeholder = "Pro Tip Title...";
        title.value = block.data.title || "GDE Architecture Tip";
        title.addEventListener("input", () => { block.data.title = title.value; scheduleAutosave(); });

        const body = document.createElement("textarea");
        body.className = "callout-body-input";
        body.placeholder = "Write architectural insight here...";
        body.value = block.data.content || "";
        body.addEventListener("input", () => { block.data.content = body.value; scheduleAutosave(); });

        callout.append(title, body);
        item.appendChild(callout);
    } else if (block.type === "quote") {
        const quote = document.createElement("div");
        quote.className = "quote-box-editor";

        const text = document.createElement("textarea");
        text.className = "quote-input";
        text.placeholder = '"Memorable quote or key thesis..."';
        text.value = block.data.text || "";
        text.addEventListener("input", () => { block.data.text = text.value; scheduleAutosave(); });

        const cite = document.createElement("input");
        cite.className = "quote-cite";
        cite.placeholder = "— Attribution";
        cite.value = block.data.citation || "";
        cite.addEventListener("input", () => { block.data.citation = cite.value; scheduleAutosave(); });

        quote.append(text, cite);
        item.appendChild(quote);
    }

    return item;
}

// Helpers
function createIconBtn(icon, title, onClick, isDanger = false) {
    const btn = document.createElement("button");
    btn.className = `icon-btn ${isDanger ? "btn-danger" : ""}`;
    btn.title = title;
    btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:14px;">${icon}</span>`;
    btn.onclick = onClick;
    return btn;
}

function createInsertBtn(icon, label, onClick, isDart = false) {
    const btn = document.createElement("button");
    btn.className = `btn-insert ${isDart ? "btn-dart" : ""}`;
    btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:13px;">${icon}</span> ${label}`;
    btn.onclick = onClick;
    return btn;
}

function moveSection(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= postData.sections.length) return;
    const item = postData.sections.splice(index, 1)[0];
    postData.sections.splice(target, 0, item);
    renderSections();
    scheduleAutosave();
}

function deleteSection(index) {
    if (confirm("Delete this section?")) {
        postData.sections.splice(index, 1);
        renderSections();
        scheduleAutosave();
    }
}

function addBlock(sectionIdx, type) {
    const sec = postData.sections[sectionIdx];
    let newBlock = { type, data: {} };
    if (type === "paragraph" || type === "subheading") newBlock.data.content = "";
    else if (type === "code") newBlock.data = { language: "dart", filename: "lib/main.dart", code: "" };
    else if (type === "list") newBlock.data = { ordered: false, items: [""] };
    else if (type === "callout") newBlock.data = { title: "GDE Pro Tip", content: "" };
    else if (type === "quote") newBlock.data = { text: "", citation: "" };

    sec.blocks.push(newBlock);
    renderSections();
    scheduleAutosave();
}

function moveBlock(sec, idx, dir) {
    const target = idx + dir;
    if (target < 0 || target >= sec.blocks.length) return;
    const item = sec.blocks.splice(idx, 1)[0];
    sec.blocks.splice(target, 0, item);
    renderSections();
    scheduleAutosave();
}

function duplicateBlock(sec, idx) {
    const clone = JSON.parse(JSON.stringify(sec.blocks[idx]));
    sec.blocks.splice(idx + 1, 0, clone);
    renderSections();
    scheduleAutosave();
}

function deleteBlock(sec, idx) {
    sec.blocks.splice(idx, 1);
    renderSections();
    scheduleAutosave();
}

function updateStats() {
    let words = (postData.title || "").split(/\s+/).filter(Boolean).length;
    words += (postData.shortDescription || "").split(/\s+/).filter(Boolean).length;

    postData.sections.forEach(s => {
        words += (s.title || "").split(/\s+/).filter(Boolean).length;
        s.blocks.forEach(b => {
            if (b.data?.content) words += String(b.data.content).replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
            if (b.data?.code) words += String(b.data.code).split(/\s+/).filter(Boolean).length;
            if (Array.isArray(b.data?.items)) {
                b.data.items.forEach(i => words += String(i).split(/\s+/).filter(Boolean).length);
            }
        });
    });

    const mins = Math.max(1, Math.ceil(words / 200));
    postData.readTime = `${mins} min read`;
    statsBadge.textContent = `${words} words • ${mins} min read`;
}

// Inline formatting toolbar
document.querySelectorAll(".editor-toolbar .tool-btn[data-cmd]").forEach(btn => {
    btn.addEventListener("click", () => {
        const cmd = btn.getAttribute("data-cmd");
        const val = btn.getAttribute("data-val") || null;

        if (cmd === "createLink") {
            const url = prompt("Enter Link URL (e.g. https://flutter.dev):");
            if (url) document.execCommand(cmd, false, url);
        } else if (cmd === "formatBlock" && val === "<code>") {
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const codeNode = document.createElement("code");
                codeNode.style.background = "#f1f5f9";
                codeNode.style.padding = "2px 5px";
                codeNode.style.borderRadius = "3px";
                codeNode.style.fontFamily = "var(--font-mono)";
                codeNode.textContent = range.toString();
                range.deleteContents();
                range.insertNode(codeNode);
            }
        } else {
            document.execCommand(cmd, false, val);
        }
    });
});

let autosaveTimer = null;
function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
        localStorage.setItem("UD_CURRENT_DRAFT", JSON.stringify(postData));
        showToast("Draft autosaved");
    }, 2000);
}

function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
}

// Preview Rendering (Matches Clean White Reading View)
function renderPreview() {
    let html = `
    <div style="max-width: 720px; margin: 0 auto; color: #334155;">
        <span class="tag-pill blue" style="margin-bottom: 14px;">${postData.label}</span>
        <h1 style="font-size: 34px; font-weight: 800; color: #0f172a; line-height: 1.2; margin: 12px 0 16px;">
            ${postData.title}
        </h1>
        <div style="background: #f8fafc; border-left: 3px solid #0f172a; padding: 14px 18px; margin-bottom: 30px; font-size: 15px; color: #475569;">
            ${postData.shortDescription}
        </div>
    `;

    postData.sections.forEach(sec => {
        html += `<h2 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 36px 0 14px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">${sec.title}</h2>`;

        sec.blocks.forEach(b => {
            if (b.type === "paragraph") {
                html += `<p style="font-size: 16.5px; line-height: 1.8; margin-bottom: 16px;">${b.data.content}</p>`;
            } else if (b.type === "subheading") {
                html += `<h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 24px 0 10px;">${b.data.content}</h3>`;
            } else if (b.type === "code") {
                html += `
                <div style="margin: 20px 0; border-radius: 8px; overflow: hidden; background: #0f172a; border: 1px solid #1e293b;">
                    <div style="padding: 6px 12px; background: #172033; font-size: 11.5px; font-family: var(--font-mono); color: #94a3b8; display:flex; justify-content:space-between;">
                        <span>${b.data.filename || 'lib/main.dart'}</span>
                        <span style="color:#38bdf8;">${(b.data.language || 'dart').toUpperCase()}</span>
                    </div>
                    <pre style="margin:0; padding:14px; overflow-x:auto;"><code class="language-${b.data.language || 'dart'}">${escapeHtml(b.data.code || '')}</code></pre>
                </div>
                `;
            } else if (b.type === "list") {
                html += `<ul style="margin: 0 0 16px 20px; line-height: 1.7;">`;
                (b.data.items || []).forEach(it => { html += `<li>${it}</li>`; });
                html += `</ul>`;
            } else if (b.type === "callout") {
                html += `
                <div style="background: #f8fafc; border-left: 3px solid #0284c7; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                    <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${b.data.title}</div>
                    <div style="font-size: 14.5px;">${b.data.content}</div>
                </div>
                `;
            } else if (b.type === "quote") {
                html += `
                <blockquote style="border-left: 3px solid #0f172a; background: #f8fafc; padding: 10px 16px; margin: 20px 0; font-style: italic;">
                    <p style="font-size: 16px; color: #0f172a;">"${b.data.text}"</p>
                    <cite style="font-size: 12px; color: #64748b; font-style: normal;">— ${b.data.citation}</cite>
                </blockquote>
                `;
            }
        });
    });

    html += `</div>`;
    previewPane.innerHTML = html;

    if (window.Prism) {
        window.Prism.highlightAllUnder(previewPane);
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Mode Toggle
btnModeEditor.addEventListener("click", () => {
    btnModeEditor.classList.add("active");
    btnModePreview.classList.remove("active");
    editorPane.style.display = "block";
    previewPane.classList.remove("active");
});

btnModePreview.addEventListener("click", () => {
    btnModePreview.classList.add("active");
    btnModeEditor.classList.remove("active");
    editorPane.style.display = "none";
    previewPane.classList.add("active");
    renderPreview();
});

// Section Add
document.getElementById("btn-add-section").addEventListener("click", () => {
    postData.sections.push({
        title: "New Section",
        blocks: [{ type: "paragraph", data: { content: "" } }]
    });
    renderSections();
    scheduleAutosave();
});

// Save Draft
document.getElementById("btn-save-draft").addEventListener("click", () => {
    localStorage.setItem("UD_CURRENT_DRAFT", JSON.stringify(postData));
    saveLocalDraftPost(postData);
    showToast("Draft saved successfully");
});

// Export JSON
document.getElementById("btn-export-json").addEventListener("click", () => {
    const jsonStr = JSON.stringify(postData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(postData.title || "post").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported as JSON");
});

// New Post
document.getElementById("btn-new-post")?.addEventListener("click", () => {
    if (confirm("Start a clean new draft? Any unsaved edits will be cleared.")) {
        localStorage.removeItem("UD_CURRENT_DRAFT");
        window.history.replaceState({}, document.title, window.location.pathname);
        loadPostIntoEditor({
            _id: 'draft_' + Date.now(),
            title: "",
            label: "Flutter & Dart",
            tags: ["Flutter", "Dart"],
            shortDescription: "",
            author: {
                name: founderSession.founder?.name || "Naveen Chandra Kowshik",
                username: founderSession.founder?.username || "Naveen-beginner"
            },
            sections: [
                {
                    title: "Overview",
                    blocks: [{ type: "paragraph", data: { content: "" } }]
                }
            ],
            published: true,
            publishedAt: new Date().toISOString()
        });
        showToast("New article draft created");
    }
});

// Articles Browser Modal
const articlesModal = document.getElementById("articles-modal");
const articlesList = document.getElementById("articles-list");
const btnCloseModal = document.getElementById("btn-close-modal");

btnCloseModal?.addEventListener("click", () => {
    if (articlesModal) articlesModal.style.display = "none";
});

document.getElementById("btn-open-articles")?.addEventListener("click", async () => {
    if (!articlesModal || !articlesList) return;
    articlesModal.style.display = "flex";
    articlesList.innerHTML = `<div style="color:var(--text-muted); font-size:13px;">Fetching live articles...</div>`;

    try {
        let posts = [];
        try {
            const res = await fetch(`${API_BASE}/all/posts`);
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json.data)) posts = json.data;
            }
        } catch (e) {
            console.warn("API fetch error:", e);
        }

        if (posts.length === 0) {
            const local = JSON.parse(localStorage.getItem("UD_LOCAL_POSTS") || "[]");
            posts = local;
        }

        if (posts.length === 0) {
            articlesList.innerHTML = `<div style="color:var(--text-muted); font-size:13px;">No published articles found.</div>`;
            return;
        }

        articlesList.innerHTML = posts.map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; background:var(--bg-subtle); border:1px solid var(--border-base); border-radius:8px;">
                <div style="flex:1; margin-right:12px;">
                    <div style="font-weight:700; color:var(--text-primary); font-size:14px;">${p.title}</div>
                    <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">
                        <span>By ${p.author?.name || 'Founder'}</span> • <span>${p.label}</span>
                    </div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn-action load-post-btn" data-id="${p._id}" style="padding:4px 10px; font-size:11px;">Edit</button>
                    <button class="btn-action del-post-btn" data-id="${p._id}" style="padding:4px 10px; font-size:11px; color:var(--danger); border-color:rgba(239,68,68,0.3);">Del</button>
                </div>
            </div>
        `).join("");

        // Attach edit listeners
        articlesList.querySelectorAll(".load-post-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                const target = posts.find(p => p._id === id);
                if (target) {
                    loadPostIntoEditor(target);
                    articlesModal.style.display = "none";
                    showToast(`Loaded: ${target.title}`);
                }
            });
        });

        // Attach delete listeners
        articlesList.querySelectorAll(".del-post-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                const target = posts.find(p => p._id === id);
                if (confirm(`Permanently delete "${target?.title || 'article'}"?`)) {
                    await deletePostFromBackend(id);
                    showToast("Article deleted");
                    btn.closest("div[style*='display:flex']").remove();
                    if (postData._id === id) {
                        localStorage.removeItem("UD_CURRENT_DRAFT");
                        initEditor();
                    }
                }
            });
        });

    } catch (e) {
        articlesList.innerHTML = `<div style="color:var(--danger); font-size:13px;">Error loading articles: ${e.message}</div>`;
    }
});

// Delete Post button (in header)
document.getElementById("btn-delete-post")?.addEventListener("click", async () => {
    if (!postData._id || postData._id.startsWith("draft_")) return;
    if (confirm(`Permanently delete "${postData.title}" from the blog?`)) {
        const res = await deletePostFromBackend(postData._id);
        if (res.success) {
            showToast("Article deleted from live blog!");
        } else {
            showToast("Deleted locally");
        }
        localStorage.removeItem("UD_CURRENT_DRAFT");
        setTimeout(() => {
            window.location.href = "editor.html";
        }, 1000);
    }
});

// Publish / Update
document.getElementById("btn-publish-post").addEventListener("click", async () => {
    if (!postData.title || !postData.title.trim()) {
        showToast("Please provide an article title");
        return;
    }

    if (!postData.slug) {
        postData.slug = postData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    }
    postData.published = true;
    postData.publishedAt = postData.publishedAt || new Date().toISOString();

    // 1. Save locally so it appears in index.html & blog.html immediately
    saveLocalDraftPost(postData);

    // 2. Push to Cloudflare / Remote Backend API (Create vs Update)
    let pushResult = null;
    const isExisting = postData._id && !postData._id.startsWith("draft_");

    if (isExisting) {
        pushResult = await updatePostOnBackend(postData._id, postData);
    } else {
        pushResult = await pushPostToBackend(postData);
    }

    if (pushResult && pushResult.success) {
        showToast(isExisting ? "Article updated on Live Blog!" : "Published to Cloudflare Live Blog!");
    } else {
        showToast("Saved locally (Offline/Draft ready)");
    }

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const liveUrl = isLocal
        ? `../frontend/post.html?slug=${postData.slug || postData._id}`
        : `https://underrateddev.com/post.html?slug=${postData.slug || postData._id}`;

    setTimeout(() => {
        window.location.href = liveUrl;
    }, 1200);
});

initEditor();