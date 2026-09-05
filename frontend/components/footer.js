class AppFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer>
        <div class="branding">
            <span class="material-symbols-outlined">deployed_code_alert</span>
            <h1>Underrated.</h1>
        </div>
        <div class="footer-links">
            <div class="footer-col footer-links-regular">
                <a href="index.html">Home</a>
                <a href="blog.html">Blog</a>
                <a href="author.html">About</a>
                <a href="mailto:santhoshpaul861@gmail.com">Contact</a>
                <a href="support.html">Support</a>
            </div>
            <div class="footer-col footer-links-network">
                <a href="https://devfrnd.netlify.app" target="_blank">Website</a>
                <a href="https://github.com/Naveen-beginner" target="_blank">Github</a>
                <a href="https://play.google.com/store/apps/dev?id=8374043554473360551" target="_blank">Playstore</a>
                <a href="https://chromewebstore.google.com/detail/devpanel-quick-tools/famnandbemapcianiefnnhcaabhilhgj"  target="_blank">Chrome Extensions</a>
                <a href="https://www.npmjs.com/package/secureform-kit" target="_blank">NPM</a>
            </div>
            <div class="footer-col footer-links-social">
                <a href="maito:santhoshpaul861@gmail.com">Mail</a>
                <a href="https://www.linkedin.com/in/naveen-chandra-kowshik-31a4b63a3/" target="_blank">Linkedin</a>
                <a href="#" target="_blank">Discord</a>
            </div>
        </div>
    </footer>
        `
    }
}

customElements.define('app-footer', AppFooter)