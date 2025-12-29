# Web Deployment Guide

This guide will help you deploy your Expo app as a website so customers can access it without app stores.

## Quick Start (Recommended: Vercel)

Vercel is the easiest and best option for Expo web apps. It's free for personal projects and automatically handles builds and deployments.

### Prerequisites

1. **GitHub Account** (free)
2. **Vercel Account** (free at vercel.com)
3. **Your code pushed to GitHub**

### Option 1: Vercel (Recommended - 5 minutes)

#### Step 1: Push to GitHub

```bash
cd AIReceptionist
git init  # if not already a git repo
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

#### Step 2: Install Vercel CLI (optional, or use web interface)

```bash
npm install -g vercel
```

#### Step 3: Deploy to Vercel

**Option A: Using Vercel Web Interface (Easiest)**
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: "Other" or "Expo"
   - **Root Directory**: `AIReceptionist` (if repo is in a subfolder)
   - **Build Command**: `cd AIReceptionist && npx expo export -p web`
   - **Output Directory**: `AIReceptionist/dist`
   - **Install Command**: `npm install`

**Option B: Using CLI**
```bash
cd AIReceptionist
vercel
```

Follow the prompts, then:
```bash
vercel --prod  # Deploy to production
```

#### Step 4: Set Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add all your `EXPO_PUBLIC_*` variables:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_VAPI_PRIVATE_KEY` (or `EXPO_PUBLIC_VAPI_API_KEY`)
- `EXPO_PUBLIC_VAPI_WEBHOOK_URL` (if needed)

**Important**: After adding variables, you need to redeploy:
```bash
vercel --prod
```

#### Step 5: Access Your Site

Vercel will give you a URL like: `https://your-app-name.vercel.app`

That's it! Your app is live. 🎉

---

## Option 2: Netlify (Alternative)

### Step 1: Create `netlify.toml`

Create this file in your `AIReceptionist` folder:

```toml
[build]
  command = "npm install && npx expo export -p web"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Step 2: Deploy

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure:
   - **Base directory**: `AIReceptionist`
   - **Build command**: `npm install && npx expo export -p web`
   - **Publish directory**: `dist`
5. Add environment variables in Site settings → Environment variables
6. Deploy!

---

## Option 3: Manual Build + Static Hosting

If you want to host on any static hosting (GitHub Pages, AWS S3, etc.):

### Step 1: Build for Web

```bash
cd AIReceptionist
npm install
npx expo export -p web
```

This creates a `dist` folder with static files.

### Step 2: Upload `dist` folder

Upload the entire `dist` folder to your hosting provider:
- **GitHub Pages**: Enable in repo settings, point to `dist` folder
- **AWS S3**: Upload to a bucket, enable static website hosting
- **Any web host**: Upload via FTP/SFTP

---

## Testing Locally Before Deploying

Test the web build locally:

```bash
cd AIReceptionist

# Build the web version
npx expo export -p web

# Serve it locally (requires a simple HTTP server)
npx serve dist
# OR
python -m http.server 8000 --directory dist
# OR
cd dist && python -m SimpleHTTPServer 8000
```

Then visit `http://localhost:8000` (or the port shown) to test.

---

## Configuration Updates Needed

### Update `app.json` for Web

Add web configuration to your `app.json`:

```json
{
  "expo": {
    "scheme": "acme",
    "name": "AIReceptionist",
    "slug": "AIReceptionist",
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/icons/favicon.png"
    }
  }
}
```

### Create `vercel.json` (Optional - for better routing)

If using Vercel, create `vercel.json` in the `AIReceptionist` folder:

```json
{
  "buildCommand": "npm install && npx expo export -p web",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Custom Domain (Optional)

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

### Netlify
1. Go to Site settings → Domain management
2. Add custom domain
3. Configure DNS

---

## Environment Variables Security

⚠️ **Important**: All `EXPO_PUBLIC_*` variables are exposed to the browser. Only include:
- ✅ Public API keys (like Supabase anon key)
- ✅ Public configuration
- ❌ Never include private keys, secrets, or server-only credentials

For private keys (like VAPI private key), consider:
- Using a backend API to proxy requests
- Using environment-specific keys
- Storing sensitive operations server-side

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules .expo dist
npm install
npx expo export -p web
```

### Routing Issues
Make sure your hosting provider is configured for client-side routing (SPA mode). The redirects in `netlify.toml` or `vercel.json` handle this.

### Environment Variables Not Working
- Make sure they're prefixed with `EXPO_PUBLIC_`
- Redeploy after adding variables
- Check they're set in production environment in Vercel/Netlify

### Styles Not Loading
Some React Native components may need web-specific polyfills. Check the Expo web documentation for specific packages.

---

## Next Steps

1. **Set up automatic deployments**: Both Vercel and Netlify automatically deploy on every git push
2. **Add analytics**: Google Analytics, Plausible, etc.
3. **Enable HTTPS**: Automatic on Vercel/Netlify
4. **Add a custom domain**: Professional branding
5. **Set up staging environment**: Test before production

---

## Recommended: Vercel Deployment Script

Add this to your `package.json`:

```json
{
  "scripts": {
    "build:web": "expo export -p web",
    "deploy:web": "npm run build:web && vercel --prod"
  }
}
```

Then deploy with:
```bash
npm run deploy:web
```

