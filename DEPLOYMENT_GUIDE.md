# Deployment Guide for underrateddeveloper.com

This guide provides the complete blueprint to launch your blog live on your purchased domain **`underrateddeveloper.com`** with free SSL, global edge CDN, and zero maintenance.

---

## Architecture Overview

Your blog is architected with a **dual-layer resilient engine**:
1. **Frontend & CMS Studio (`/frontend` & `/editors`)**:
   - Static, zero-latency HTML5 / CSS3 / ES Modules with Prism.js syntax highlighting.
   - Works immediately via global Edge CDN (Vercel, Netlify, or Cloudflare Pages).
   - Bundles `frontend/data/posts.json` + browser `localStorage` draft sync so it **never goes down**, even if the backend database is unreachable or waking up.
2. **Backend Engine (`/backend`)**:
   - Express 5 + Mongoose REST API for dynamic remote database storage (MongoDB Atlas).
   - Deployable in 1-click on Render.com or Railway.app free tiers.

---

## Option 1: Instant Vercel Deployment (Recommended — 3 Minutes)

Vercel provides edge caching, automatic free SSL, and instant domain mapping.

### Step 1: Push Code to GitHub
Ensure your repository is pushed to your GitHub account (`https://github.com/Naveen-beginner`):
```bash
git add .
git commit -m "feat: complete overhaul of underrated developer blog and notion cms"
git push origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** > **"Project"**.
3. Select your repository `Underrated-Developer-Blog`.
4. Keep the root directory as `./` (the included `vercel.json` automatically configures routes).
5. Click **"Deploy"**.

### Step 3: Link Your Custom Domain (`underrateddeveloper.com`)
1. In your Vercel Project Dashboard, navigate to **Settings** > **Domains**.
2. Type `underrateddeveloper.com` and click **Add**.
3. Choose the recommended redirect: `underrateddeveloper.com` (redirects `www.underrateddeveloper.com` to apex).
4. Vercel will show the exact DNS records to configure at your domain registrar (GoDaddy, Namecheap, Hostinger, Cloudflare):
   - **Type A**: `@` -> `76.76.21.21`
   - **Type CNAME**: `www` -> `cname.vercel-dns.com`
5. Once saved in your registrar, SSL is automatically generated within 2-5 minutes!

---

## Option 2: Deploy Backend to Render.com (Optional for Cloud MongoDB)

If you wish to store published articles on a remote cloud database instead of static JSON:

1. Create a free database on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to [render.com](https://render.com) and create a **Web Service**.
3. Connect your GitHub repository and set the **Root Directory** to `backend`.
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Add Environment Variables:
   - `PORT`: `5500`
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/blog-underrated`
   - `JWT_SECRET`: `<random-secret-key>`
7. Copy the Render API URL (e.g. `https://underrated-api.onrender.com/api/my`) and in your CMS Studio, click the **API Config** button at the top toolbar to save it!

---

## Testing Locally Right Now

To preview your updated blog and CMS Studio locally:

1. Start a local static HTTP server from the project directory:
   ```bash
   npx serve .
   ```
2. Open in your browser:
   - **Blog Home**: `http://localhost:3000/frontend/index.html`
   - **Articles Feed**: `http://localhost:3000/frontend/blog.html`
   - **Notion/Medium Studio**: `http://localhost:3000/editors/editor.html`
   - **Article Reader**: `http://localhost:3000/frontend/post.html`

To run the backend server concurrently:
```bash
cd backend
npm install
npm run start (or node server.js)
```
