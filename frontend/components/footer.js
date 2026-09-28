class AppFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer class="site-footer">
            <div class="container footer-inner">
                <div class="footer-primary-col">
                    <div class="footer-brand">
                        <img src="assets/favicons/official_logo_branding_transparent.png" alt="Underrated Developer Logo" class="footer-logo-img">
                        <div>
                            <strong>Underrated Developer</strong>
                            <span>by Team 4FrndTech • Naveen &amp; Santhosh Paul</span>
                        </div>
                    </div>
                    <p class="footer-bio">
                        Engineering journal documenting Flutter desktop engines, compiled Dart runtimes, Play Store publishing, and autonomous AI systems. Built for developers, by developers.
                    </p>
                    <div class="footer-badges">
                        <span class="tag-pill blue">Flutter &amp; Dart</span>
                        <span class="tag-pill">Team 4FrndTech</span>
                        <span class="tag-pill">#WeAreUnderratedDevs</span>
                        <span class="tag-pill">#Naveen #Paul</span>
                    </div>
                </div>

                <div class="footer-links-grid">
                    <div class="footer-col">
                        <h4>Explore</h4>
                        <a href="index.html">Home</a>
                        <a href="blog.html">Articles</a>
                        <a href="author.html">About Authors</a>
                        <a href="support.html">Contact</a>
                    </div>

                    <div class="footer-col">
                        <h4>Verified Works</h4>
                        <a href="https://play.google.com/store/apps/dev?id=8374043554473360551" target="_blank" rel="noopener">Google Play Console</a>
                        <a href="https://chromewebstore.google.com/detail/devpanel-quick-tools/famnandbemapcianiefnnhcaabhilhgj" target="_blank" rel="noopener">Chrome Web Store</a>
                        <a href="https://www.npmjs.com/package/secureform-kit" target="_blank" rel="noopener">NPM: secureform-kit</a>
                        <a href="https://github.com/Naveen-beginner" target="_blank" rel="noopener">GitHub (Naveen)</a>
                        <a href="https://devfrnd.netlify.app" target="_blank" rel="noopener">Portfolio (Santhosh)</a>
                    </div>

                    <div class="footer-col">
                        <h4>Connect</h4>
                        <a href="mailto:naveen191496@gmail.com">Email Naveen</a>
                        <a href="mailto:santhoshpaul861@gmail.com">Email Santhosh</a>
                        <a href="https://github.com/Naveen-beginner" target="_blank" rel="noopener">GitHub</a>
                        <a href="https://www.linkedin.com/in/naveen-chandra-kowshik-31a4b63a3/" target="_blank" rel="noopener">LinkedIn</a>
                    </div>
                </div>
            </div>

            <div class="container footer-sub-bar">
                <span>&copy; ${new Date().getFullYear()} Team 4FrndTech • Naveen &amp; Santhosh Paul. All rights reserved.</span>
                <div class="footer-sub-links">
                    <a href="https://underrateddev.com/">underrateddev.com</a>
                    <span>•</span>
                    <a href="https://underrateddev.com/sitemap.xml">Sitemap</a>
                </div>
            </div>
        </footer>
        `;
    }
}

customElements.define('app-footer', AppFooter);