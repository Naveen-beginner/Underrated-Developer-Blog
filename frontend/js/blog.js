const API_URL = "http://localhost:5500/api/my";

const recentPosts = document.querySelector(".recent-posts");

async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/all/posts`);

        if (!response.ok) {
            throw new Error("Failed to fetch posts");
        }

        const result = await response.json();

        recentPosts.innerHTML = "";

        result.data.forEach(post => {
            const postCard = document.createElement("div");
            postCard.className = "post-card";

            const postContents = document.createElement("div");
            postContents.className = "post-contents";

            const categoryLabel = document.createElement("span");
            categoryLabel.className = "category-label";
            categoryLabel.textContent = post.label;

            const postTitle = document.createElement("h2");
            postTitle.className = "post-title";
            postTitle.textContent = post.title;

            const postButton = document.createElement("a");
            postButton.className = "post-button";
            postButton.textContent = "Read Post";
            postButton.href = `post.html?id=${post._id}`;

            postContents.append(
                categoryLabel,
                postTitle,
                postButton
            );

            const imageContainer = document.createElement("div");
            imageContainer.className = "image-container";

            const image = document.createElement("img");
            image.src = post.banner;
            image.alt = post.title;

            imageContainer.appendChild(image);

            postCard.append(
                postContents,
                imageContainer
            );

            recentPosts.appendChild(postCard);
        });

    } catch (error) {
        console.error("Error loading posts:", error);
    }
}

loadPosts();