# Complete Deployment Blueprint: Cloudflare & Netlify

This guide details the exact architecture and deployment steps for **Underrated Developer Blog** (`https://underrateddev.com/`).

---

## 🏛 Architecture Separation

The system is strictly divided into two distinct environments to guarantee security, privacy, and maximum edge performance:

| Component | Platform | URL / Domain | Visibility | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Public Blog (Frontend)** | **Cloudflare Pages** | `https://underrateddev.com/` | **100% Public** | High-performance developer blog, articles, and founder profiles |
| **Backend API** | **Cloudflare Pages / Functions** | `https://underrateddev.com/api` | **Edge API** | Edge serverless API routes (`/api/my/*` & `/api/auth/my/*`) |
| **CMS Studio (Editor)** | **Netlify** | `underrated-studio.netlify.app` | **Strictly Private** | Private authoring studio for **Naveen** & **Santhosh Paul** (Team 4FrndTech) |

---

## 🚀 Part 1: Deploy Public Blog & Backend on Cloudflare

Cloudflare hosts the public frontend at global edge CDN with zero latency and handles the backend API via Cloudflare Worker runtime (`worker.js` + `wrangler.toml`).

### Method A: Automated Cloudflare Dashboard Deploy (Git Connected)
1. In Cloudflare Dashboard, go to **Compute (Workers) > Workers & Pages**.
2. Click **Create Application** > **Connect to Git** > select `Underrated-Developer-Blog`.
3. If setting up as **Pages**:
   - **Framework preset**: `None`
   - **Build command**: *(leave blank — DO NOT put `npx wrangler deploy` here!)*
   - **Build output directory**: `frontend`
4. If setting up as **Workers (Builds)**:
   - Cloudflare will automatically read [wrangler.toml](file:///C:/Users/KOWSHIK/Music/Underrated-Developer-Blog/wrangler.toml) and execute `npx wrangler deploy` to deploy `worker.js` and serve `./frontend` assets.

### Method B: Terminal Deploy via Wrangler CLI
Deploy instantly at any time from your local terminal:
```bash
npx wrangler deploy
```
This reads `wrangler.toml`, compiles `worker.js`, and uploads `./frontend` static assets with zero errors!


### Step 3: Link Custom Domain (`underrateddev.com`)
1. In your Cloudflare Pages project, go to the **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Enter `underrateddev.com` (and optionally `www.underrateddev.com`).

### Step 4: Set SSL/TLS Encryption Mode to "Full" (CRITICAL)
If you ever see `ERR_TOO_MANY_REDIRECTS`, it is caused by Cloudflare's default SSL mode:
1. In Cloudflare Dashboard, select your domain.
2. Go to **SSL/TLS** in the left navigation sidebar.
3. Change the encryption mode from **Flexible** to **Full** (or **Full (Strict)**).

> [!WARNING]
> Never leave Cloudflare SSL on "Flexible" with Cloudflare Pages! Under "Flexible", Cloudflare communicates with Cloudflare Pages over plain HTTP (port 80), but Cloudflare Pages automatically forces HTTPS (port 443), creating an infinite loop (`ERR_TOO_MANY_REDIRECTS`). Switching to **Full** or **Full (Strict)** resolves this immediately.

---

## 🔒 Part 2: Deploy Private CMS Studio on Netlify

The CMS Studio in `editors/` is completely decoupled and self-contained with its own API client, assets, and security guard. It is deployed to Netlify as a **strictly private founder-only site**.

### Step 1: Connect Repository to Netlify
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **Add new site** > **Import an existing project** > **GitHub**.
3. Select `Underrated-Developer-Blog`.
4. Netlify will read the included `netlify.toml`:
   - **Base directory**: *(leave blank)*
   - **Publish directory**: `editors`
   - **Build command**: *(leave blank)*
5. Click **Deploy Underrated-Developer-Blog**.

### Step 2: Verify Privacy & Access
- **No Search Crawling**: `editors/robots.txt` and `netlify.toml` headers block all search engine indexing (`X-Robots-Tag: noindex, nofollow, noarchive`).
- **Founder Portal**: The root route automatically redirects to `/author_login.html`.
- **Founder Security Guard**: Attempting to load `/editor.html` directly without an active founder session immediately redirects to the login screen.
- **Team 4FrndTech Authentication**: Founders **Naveen Chandra Kowshik** and **Santhosh Paul** can log in, switch active profiles, create articles, and publish directly to the live Cloudflare production blog!

---

## 🛠 Local Development & Testing

You can test both the public blog and private CMS locally at any time:

### Start Local Static Server
```bash
# From repository root:
npx serve .
```
- **Public Blog**: `http://localhost:3000/frontend/index.html`
- **Private Studio**: `http://localhost:3000/editors/author_login.html`

### (Optional) Run Node.js Express Backend
```bash
cd backend
npm install
node server.js
```
The backend will run on `http://localhost:5500` with full CORS enabled for both localhost and production origins.
