const API_URL = "http://localhost:5500/api/my";

const recentPosts = document.getElementById("recent-posts");

async function loadRecentPosts() {
    try {
        const response = await fetch(`${API_URL}/all/posts`);

        if (!response.ok) {
            throw new Error("Failed to fetch posts");
        }

        const result = await response.json();

        const posts = result.data.slice(0, 3);

        recentPosts.innerHTML = "";

        posts.forEach(post => {

            const postCard = document.createElement("div");
            postCard.className = "post-card";

            postCard.innerHTML = `
                <div class="post-contents">

                    <span class="category-label">
                        ${post.label}
                    </span>

                    <h2 class="post-title">
                        ${post.title}
                    </h2>

                    <a href="post.html?id=${post._id}" class="post-button">
                        Read Post
                    </a>

                </div>

                <div class="image-container">

                    <img
                        src="${post.banner}"
                        alt="${post.title}"
                    >

                </div>
            `;

            recentPosts.appendChild(postCard);
        });

    } catch (error) {
        console.error("Error loading recent posts:", error);
    }
}

loadRecentPosts();