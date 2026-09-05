let postData = {
    title: "BUILDING THE - ABANDONED IDE",
    label: "Development",
    authors: "",
    shortDescription: "A journey through building a lightweight Flutter-based IDE for Windows.",
    sections: [],
    dyks: [],
    published: false,
    publishedAt: null
};

const mainContent = document.getElementById("main-content");
const dykContainer = document.getElementById("dyk-container");

function render() {
    renderSections();
    renderDYKs();
}

function renderSections() {
    mainContent.innerHTML = "";

    postData.sections.forEach((section, sectionIndex) => {
        const sectionElement = document.createElement("section");
        sectionElement.className = "section";

        const title = document.createElement("h2");
        title.contentEditable = true;
        title.textContent = section.title;

        title.addEventListener("input", () => {
            section.title = title.innerText;
        });

        sectionElement.appendChild(title);

        const content = document.createElement("div");
        content.className = "section-content";

        section.blocks.forEach((block, blockIndex) => {
            addBlockToUI(section, block, blockIndex, content);
        });

        sectionElement.appendChild(content);

        const toolbar = document.createElement("div");
        toolbar.className = "section-toolbar";

        const paragraphButton = document.createElement("button");
        paragraphButton.textContent = "+ Paragraph";
        paragraphButton.onclick = () => addParagraph(sectionIndex);

        const listButton = document.createElement("button");
        listButton.textContent = "+ List";
        listButton.onclick = () => addList(sectionIndex);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete Section";
        deleteButton.onclick = () => deleteSection(sectionIndex);

        toolbar.append(
            paragraphButton,
            listButton,
            deleteButton
        );

        sectionElement.appendChild(toolbar);
        mainContent.appendChild(sectionElement);
    });
}

function addBlockToUI(section, block, blockIndex, container) {
    const editorBlock = document.createElement("div");
    editorBlock.className = "editor-block";

    if (block.type === "paragraph") {
        const paragraph = document.createElement("p");
        paragraph.contentEditable = true;
        paragraph.textContent = block.data.content;

        paragraph.addEventListener("input", () => {
            block.data.content = paragraph.innerText;
        });

        editorBlock.appendChild(paragraph);
    }

    if (block.type === "list") {
        const list = document.createElement(
            block.data.ordered ? "ol" : "ul"
        );

        list.className = "editor-list";

        block.data.items.forEach((item, itemIndex) => {
            const li = document.createElement("li");
            li.contentEditable = true;
            li.textContent = item;

            li.addEventListener("input", () => {
                block.data.items[itemIndex] = li.innerText;
            });

            li.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();

                    block.data.items.splice(
                        itemIndex + 1,
                        0,
                        "New item"
                    );

                    render();
                }

                if (
                    event.key === "Backspace" &&
                    li.innerText.trim() === "" &&
                    block.data.items.length > 1
                ) {
                    event.preventDefault();

                    block.data.items.splice(itemIndex, 1);

                    render();
                }
            });

            list.appendChild(li);
        });

        editorBlock.appendChild(list);
    }

    const toolbar = document.createElement("div");
    toolbar.className = "block-toolbar";

    const upButton = document.createElement("button");
    upButton.textContent = "↑";
    upButton.onclick = () => moveBlock(section, blockIndex, -1);

    const downButton = document.createElement("button");
    downButton.textContent = "↓";
    downButton.onclick = () => moveBlock(section, blockIndex, 1);

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";

    deleteButton.onclick = () => {
        section.blocks.splice(blockIndex, 1);
        render();
    };

    toolbar.append(
        upButton,
        downButton,
        deleteButton
    );

    editorBlock.appendChild(toolbar);
    container.appendChild(editorBlock);
}

function addSection() {
    postData.sections.push({
        title: "New Section",
        blocks: []
    });

    render();
}

function deleteSection(index) {
    postData.sections.splice(index, 1);
    render();
}

function addParagraph(sectionIndex) {
    postData.sections[sectionIndex].blocks.push({
        type: "paragraph",
        data: {
            content: "New paragraph text..."
        }
    });

    render();
}

function addList(sectionIndex) {
    postData.sections[sectionIndex].blocks.push({
        type: "list",
        data: {
            ordered: false,
            items: ["New item"]
        }
    });

    render();
}

function moveBlock(section, index, direction) {
    const newIndex = index + direction;

    if (
        newIndex < 0 ||
        newIndex >= section.blocks.length
    ) {
        return;
    }

    const block = section.blocks[index];

    section.blocks[index] = section.blocks[newIndex];
    section.blocks[newIndex] = block;

    render();
}

function addDYK() {
    postData.dyks.push({
        badge: "Flutter Fact",
        number: postData.dyks.length + 1,
        title: "New fact",
        description: "Write your fact here."
    });

    renderDYKs();
}

function renderDYKs() {
    dykContainer.innerHTML = "";

    postData.dyks.forEach((dyk, index) => {
        const rightCard = document.createElement("div");
        rightCard.className = "right-card related-posts dyk";

        const card = document.createElement("div");
        card.className = "card";

        const heading = document.createElement("h2");
        heading.className = "out-heading";
        heading.textContent = "Do you know?";

        const badge = document.createElement("div");
        badge.className = "badge";
        badge.contentEditable = true;
        badge.textContent = dyk.badge;

        badge.addEventListener("input", () => {
            dyk.badge = badge.innerText;
        });

        const number = document.createElement("div");
        number.className = "fact-number";
        number.textContent = `#${index + 1}`;

        const content = document.createElement("div");
        content.className = "content";

        const title = document.createElement("h2");
        title.className = "title";
        title.contentEditable = true;
        title.textContent = dyk.title;

        title.addEventListener("input", () => {
            dyk.title = title.innerText;
        });

        const description = document.createElement("p");
        description.className = "description";
        description.contentEditable = true;
        description.textContent = dyk.description;

        description.addEventListener("input", () => {
            dyk.description = description.innerText;
        });

        content.append(title, description);

        const toolbar = document.createElement("div");
        toolbar.className = "dyk-toolbar";

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

        deleteButton.onclick = () => {
            postData.dyks.splice(index, 1);

            postData.dyks.forEach((item, i) => {
                item.number = i + 1;
            });

            renderDYKs();
        };

        toolbar.appendChild(deleteButton);

        card.append(
            heading,
            badge,
            number,
            content,
            toolbar
        );

        rightCard.appendChild(card);
        dykContainer.appendChild(rightCard);
    });
}

async function savePost() {
    postData.title =
        document.getElementById("post-title").innerText.trim();

    postData.shortDescription =
        document.getElementById("short-description").innerText.trim();

    const token = localStorage.getItem("token");

    if (!token) {
        alert("You must be logged in to create a post.");
        return;
    }

    if (!postData.title) {
        alert("Post title is required.");
        return;
    }

    if (!postData.shortDescription) {
        alert("Short description is required.");
        return;
    }

    if (!postData.label) {
        alert("Post label is required.");
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5500/api/my/create/post",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(postData)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Failed to create post."
            );
        }

        console.log("Post created:", result);

        alert("Post created successfully.");

    } catch (error) {
        console.error("Save post error:", error);

        alert(
            error.message ||
            "Something went wrong while creating the post."
        );
    }
}

render();