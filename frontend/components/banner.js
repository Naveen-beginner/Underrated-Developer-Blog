class OfferBanner extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <div class="offer-banner">
        <span class="material-symbols-outlined">campaign</span>
        <p>Blog under development 🏗️🚧</p>
        </div>
        `

        const offer_banner = this.querySelector('.offer-banner')

        window.addEventListener('scroll', () => {
            offer_banner.classList.toggle('scrolled', window.scrollY > 10)
        })
    }
}

customElements.define('offer-banner', OfferBanner)