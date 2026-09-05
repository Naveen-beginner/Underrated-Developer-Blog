const API_URL = "http://localhost:5500/api/my";

const postTitle = document.getElementById("post-title");
const postAuthor = document.getElementById("post-author");
const postDate = document.getElementById("post-date");
const shortDescription = document.getElementById("short-description");
const mainContent = document.getElementById("main-content");
const dykContainer = document.getElementById("dyk-container");


async function loadPost() {

    try {

        const params = new URLSearchParams(window.location.search);
        const postId = params.get("id");

        if (!postId) {
            console.error("Post ID not found in URL");
            return;
        }

        const response = await fetch(
            `${API_URL}/post/${postId}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch post");
        }

        const result = await response.json();

        const post = result.data;

        populatePost(post);

    } catch (error) {

        console.error("Error loading post:", error);

    }

}


function populatePost(post) {

    postTitle.textContent = post.title;

    postAuthor.textContent =
        post.authors?.name || post.authors || "Unknown";

    postDate.textContent =
        post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric"
            })
            : "";

    shortDescription.querySelector("p").textContent =
        post.shortDescription;

    renderSections(post.sections);

    renderDYKs(post.dyks);

}


function renderSections(sections) {

    mainContent.innerHTML = "";

    sections.forEach(section => {

        const sectionElement = document.createElement("section");
        sectionElement.className = "section";

        const sectionTitle = document.createElement("h2");
        sectionTitle.textContent = section.title;

        sectionElement.appendChild(sectionTitle);

        section.blocks.forEach(block => {

            if (block.type === "heading") {

                const heading = document.createElement("h3");

                heading.textContent =
                    block.data.content || "";

                sectionElement.appendChild(heading);

            }

            if (block.type === "paragraph") {

                const paragraph = document.createElement("p");

                paragraph.textContent =
                    block.data.content || "";

                sectionElement.appendChild(paragraph);

            }

            if (block.type === "list") {

                const list = document.createElement(
                    block.data.ordered ? "ol" : "ul"
                );

                block.data.items.forEach(item => {

                    const li = document.createElement("li");

                    li.textContent = item;

                    list.appendChild(li);

                });

                sectionElement.appendChild(list);

            }

        });

        mainContent.appendChild(sectionElement);

    });

}


function renderDYKs(dyks) {

    dykContainer.innerHTML = "";

    dyks.forEach((dyk, index) => {

        const rightCard = document.createElement("div");
        rightCard.className = "right-card related-posts dyk";

        const card = document.createElement("div");
        card.className = "card";

        const heading = document.createElement("h2");
        heading.className = "out-heading";
        heading.textContent = "Do you know?";

        const badge = document.createElement("div");
        badge.className = "badge";
        badge.textContent = dyk.badge;

        const number = document.createElement("div");
        number.className = "fact-number";
        number.textContent = `#${index + 1}`;

        const content = document.createElement("div");
        content.className = "content";

        const title = document.createElement("h2");
        title.className = "title";
        title.textContent = dyk.title;

        const description = document.createElement("p");
        description.className = "description";
        description.textContent = dyk.description;

        content.append(
            title,
            description
        );

        card.append(
            heading,
            badge,
            number,
            content
        );

        rightCard.appendChild(card);

        dykContainer.appendChild(rightCard);

    });

}


loadPost();