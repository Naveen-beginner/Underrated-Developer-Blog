class AppNavBar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <nav class="navbar">
        <div class="logo">
            <span class="material-symbols-outlined">deployed_code_alert</span>
            <h1>Underrated.</h1>
        </div>
        <div class="right">
            <a href="index.html">Home</a>
            <a href="blog.html">Blog</a>
            <a href="author.html">Authors</a>
            <a href="https://devfrnd.netlify.app" target="_blank">Website</a>
            <button id="hire" class="hire" onclick="location.href='support.html'">
                <span class="material-symbols-outlined">support_agent</span>
                Support
            </button>
        </div>
    </nav>
        `
        const navbar = this.querySelector(".navbar")

        window.addEventListener('scroll', () => {
            navbar.classList.toggle("scrolled", window.scrollY > 10)
        })

        const currentPage = window.location.pathname.split('/').pop()

        this.querySelectorAll('a').forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        })
    }
}

customElements.define('app-navbar', AppNavBar)