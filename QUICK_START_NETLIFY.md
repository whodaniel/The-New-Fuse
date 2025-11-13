# Quick Start: Deploy to Netlify in 5 Minutes

This is the fastest way to get The New Fuse deployed to Netlify.

## Prerequisites

- Netlify account
- GitHub repository connected
- Backend API deployed (get the URL)

## Step 1: Connect to Netlify (2 minutes)

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** → Choose `whodaniel/fuse`
4. Netlify will auto-detect `netlify.toml` ✅

## Step 2: Set Environment Variables (2 minutes)

Click **"Show advanced"** and add these variables:

```
NODE_ENV=production
VITE_API_URL=https://your-backend-api-url.com
VITE_WS_URL=wss://your-backend-api-url.com
```

⚠️ **Replace with your actual backend URL!**

## Step 3: Deploy (1 minute)

1. Click **"Deploy site"**
2. Wait for build to complete (~3-5 minutes)
3. Get your URL: `https://your-app.netlify.app`

## Done! 🎉

Your app is now live. Visit your Netlify URL to see it in action.

## Next Steps

- Test the deployment
- Set up custom domain
- Configure monitoring

See [DEPLOY_TO_NETLIFY.md](./DEPLOY_TO_NETLIFY.md) for detailed instructions.
