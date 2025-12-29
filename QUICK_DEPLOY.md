# Quick Deploy Guide (5 Minutes)

## Deploy to Vercel (Easiest)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 2: Deploy via Vercel Website
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Select your repository
5. Vercel auto-detects Expo projects - just click "Deploy"!
6. Add environment variables:
   - Go to Project → Settings → Environment Variables
   - Add all `EXPO_PUBLIC_*` variables from your `.env` file
   - Redeploy after adding variables

### Step 3: Access Your Site
Your app will be live at: `https://your-app-name.vercel.app`

**Done!** 🎉

---

## Or Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd AIReceptionist
vercel

# Deploy to production
vercel --prod
```

---

## Test Locally First

```bash
cd AIReceptionist
npm run build:web
npx serve dist
```

Visit the URL shown to test before deploying.

---

For detailed instructions, see `WEB_DEPLOYMENT.md`

