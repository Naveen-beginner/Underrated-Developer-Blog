# Complete Deployment Blueprint: Cloudflare & Netlify

This guide details the exact architecture and deployment steps for **Underrated Developer Blog** (`underrateddeveloper.com`).

---

## 🏛 Architecture Separation

The system is strictly divided into two distinct environments to guarantee security, privacy, and maximum edge performance:

| Component | Platform | URL / Domain | Visibility | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Public Blog (Frontend)** | **Cloudflare Pages** | `underrateddeveloper.com` | **100% Public** | High-performance developer blog, articles, and founder profiles |
| **Backend API** | **Cloudflare Pages / Functions** | `underrateddeveloper.com/api` | **Edge API** | Edge serverless API routes (`/api/my/*` & `/api/auth/my/*`) |
| **CMS Studio (Editor)** | **Netlify** | `underrated-studio.netlify.app` | **Strictly Private** | Private authoring studio for **Naveen** & **Santhosh Paul** (Team 4FrndTech) |

---

## 🚀 Part 1: Deploy Public Blog & Backend on Cloudflare

Cloudflare Pages hosts the public frontend at global edge CDN with zero latency and handles the backend API via serverless Pages Functions (`functions/api/[[route]].js`).

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "feat: configure cloudflare edge deployment and private netlify cms"
git push origin main
```

### Step 2: Create Cloudflare Pages Project
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the sidebar, navigate to **Compute (Workers) > Workers & Pages** (or **Pages**).
3. Click **Create Application** > **Pages** > **Connect to Git**.
4. Select your repository `Underrated-Developer-Blog`.
5. Configure the Build settings:
   - **Framework preset**: `None`
   - **Build command**: *(leave blank)*
   - **Build output directory**: `frontend`
   - **Root directory**: `/` (leave as root so `functions/` is detected)
6. Click **Save and Deploy**.

> [!NOTE]
> Cloudflare Pages will automatically detect `functions/api/[[route]].js` and host your backend API directly on `https://underrateddeveloper.com/api/...` with zero configuration!

### Step 3: Link Custom Domain (`underrateddeveloper.com`)
1. In your Cloudflare Pages project, go to the **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Enter `underrateddeveloper.com` (and optionally `www.underrateddeveloper.com`).
4. Since your domain is already on Cloudflare DNS, Cloudflare will automatically activate SSL and route traffic within 60 seconds!

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
