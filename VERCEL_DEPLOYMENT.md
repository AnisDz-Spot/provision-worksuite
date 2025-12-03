# 🚀 Deploy ProVision WorkSuite to Vercel

Complete guide to deploy your project to Vercel.

---

## Prerequisites

- [x] GitHub account (or GitLab/Bitbucket)
- [x] Vercel account (free tier works great) → [vercel.com/signup](https://vercel.com/signup)
- [x] Firebase project configured (complete FIREBASE_SETUP.md first)
- [x] Git repository for your project

---

## 🎯 Quick Deploy (5 minutes)

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ProVision WorkSuite"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/provision-worksuite.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings ✅

### Step 3: Configure Environment Variables

In Vercel dashboard, add these environment variables:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Where to find these:**

- Firebase Console → Project Settings → Your apps → SDK setup and configuration

### Step 4: Deploy

Click **"Deploy"** and wait ~2 minutes. Done! 🎉

Your app will be live at: `https://provision-worksuite-xxx.vercel.app`

---

## 🎨 Custom Domain Setup

### Option A: Use Vercel Domain (Free)

1. In Vercel dashboard → Settings → Domains
2. Click **"Edit"**
3. Choose a better name: `yourcompany-worksuite.vercel.app`

### Option B: Use Your Own Domain ($12/year)

1. Buy domain from Namecheap, GoDaddy, etc.
2. In Vercel dashboard → Settings → Domains
3. Click **"Add Domain"**
4. Enter: `worksuite.yourdomain.com`
5. Follow Vercel's DNS instructions
6. Wait 5-10 minutes for DNS propagation ✅

**Pro Tip:** Use a subdomain like `app.yourdomain.com` to keep your main site separate.

---

## 🔐 Security Checklist

Before going live, ensure:

- [ ] Firebase security rules are deployed (not in test mode!)
- [ ] `.env.local` is in `.gitignore` (already done ✅)
- [ ] All environment variables set in Vercel
- [ ] Firebase Authentication is configured properly
- [ ] Test user registration and login
- [ ] Test data creation and updates
- [ ] Check Firebase Console → Usage to monitor quotas

---

## ⚙️ Build Settings (Auto-configured)

Vercel automatically detects:

```yaml
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
Node.js Version: 18.x or 20.x (recommended)
```

**You don't need to change these!** ✅

---

## 🌍 Multi-Tenant Deployment

If you're using multi-tenant setup (multiple clients with their own Firebase):

### Option 1: Single Deployment with Subdomain Routing

1. Deploy once to Vercel
2. Add custom domains in Vercel:

   ```
   acme.yourapp.com
   beta.yourapp.com
   demo.yourapp.com
   ```

3. Configure DNS for each subdomain:

   ```
   Type: CNAME
   Name: acme
   Value: cname.vercel-dns.com
   ```

4. Add tenant configs as environment variables:
   ```bash
   # In Vercel dashboard
   TENANT_ACME_FIREBASE_API_KEY=xxx
   TENANT_BETA_FIREBASE_API_KEY=yyy
   ```

### Option 2: Separate Deployment per Client

1. Create separate Vercel projects for each client
2. Each gets its own environment variables
3. Each gets its own custom domain
4. More isolated, easier to manage per-client resources

**Recommended:** Option 1 for most use cases (easier to maintain).

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push

# Vercel automatically:
# 1. Detects the push
# 2. Builds your app
# 3. Runs tests (if configured)
# 4. Deploys to production
# 5. Sends you a deployment notification
```

**Branch Deployments:**

- `main` branch → Production (yourapp.com)
- Other branches → Preview URLs (yourapp-git-feature.vercel.app)

---

## 📊 Environment Management

### Development vs Production

```bash
# Local Development
npm run dev
# Uses: .env.local

# Vercel Production
# Uses: Environment Variables from Vercel Dashboard
```

### Best Practice: Multiple Environments

1. **Development** (local)
   - `.env.local` with test Firebase project
   - Test data, no real users

2. **Staging** (Vercel Preview)
   - Separate Firebase project for testing
   - Preview URL for QA testing

3. **Production** (Vercel)
   - Production Firebase project
   - Real users and data
   - Custom domain

**Set up different env vars per environment in Vercel:**

- Go to Settings → Environment Variables
- Choose: Production / Preview / Development

---

## 🚨 Troubleshooting

### Build Fails

**Error: "Module not found"**

```bash
# Locally, check if all dependencies are in package.json
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

**Error: "Environment variable not defined"**

- Check Vercel dashboard → Settings → Environment Variables
- Make sure all Firebase config vars are set
- Redeploy after adding variables

### App Works Locally but Not on Vercel

**Check:**

1. Environment variables are set in Vercel (not just .env.local)
2. Firebase project allows your Vercel domain
3. Browser console for errors (F12)
4. Vercel deployment logs

### Firebase "Permission Denied"

**Solutions:**

1. Deploy security rules from `firestore.rules` and `storage.rules`
2. In Firebase Console → Firestore/Storage → Rules tab
3. Update the authorized domains in Firebase:
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add: `your-app.vercel.app` and your custom domain

---

## 📈 Performance Optimization

### Enable Edge Runtime (Optional)

For faster response times globally:

```typescript
// app/api/[route]/route.ts
export const runtime = "edge";
```

### Image Optimization

Next.js automatically optimizes images. Use:

```tsx
import Image from "next/image";

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // for above-the-fold images
/>;
```

### Caching Strategy

Vercel automatically caches:

- Static files (images, CSS, JS)
- API routes with proper headers
- Static pages

---

## 💰 Vercel Pricing

### Free Tier (Hobby)

- ✅ Unlimited personal projects
- ✅ 100 GB bandwidth/month
- ✅ Custom domains
- ✅ Automatic SSL
- ✅ Analytics
- ⚠️ No commercial use
- ⚠️ No team features

### Pro Plan ($20/month)

- ✅ Commercial use allowed
- ✅ Unlimited bandwidth
- ✅ Team collaboration
- ✅ Advanced analytics
- ✅ Password protection
- ✅ Priority support

### Enterprise (Custom pricing)

- ✅ Everything in Pro
- ✅ Custom SLA
- ✅ Dedicated support
- ✅ Advanced security

**Recommendation:** Start with Free tier, upgrade to Pro when you have paying customers.

---

## 🔒 Security Headers

Add to `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## 📱 PWA Support (Optional)

To make your app installable:

```bash
npm install next-pwa
```

Then configure in `next.config.ts`. (Full guide available if needed)

---

## 🎯 Post-Deployment Checklist

After deploying:

- [ ] Test user registration
- [ ] Test login/logout
- [ ] Create a test project
- [ ] Create a test task
- [ ] Test real-time sync (open in 2 tabs)
- [ ] Test on mobile devices
- [ ] Check Firebase Console for data
- [ ] Monitor Firebase usage/quotas
- [ ] Set up error tracking (Sentry/LogRocket)
- [ ] Add analytics (Vercel Analytics or Google Analytics)
- [ ] Test all pages and features
- [ ] Check performance (Lighthouse score)
- [ ] Share with beta users 🎉

---

## 🆘 Quick Commands

```bash
# Install Vercel CLI (optional but useful)
npm install -g vercel

# Deploy from command line
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Pull environment variables from Vercel to local
vercel env pull

# Link local project to Vercel
vercel link
```

---

## 🎓 Advanced: GitHub Actions (Optional)

Automate testing before deployment:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: npm run build
      - run: npm test # if you have tests
```

---

## 📞 Need Help?

**Vercel Resources:**

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Support](https://vercel.com/support)

**Firebase + Vercel:**

- [Firebase Hosting vs Vercel](https://vercel.com/guides/firebase-hosting-to-vercel)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)

**Community:**

- Vercel Discord
- Next.js GitHub Discussions
- Stack Overflow (tag: vercel, next.js)

---

## 🚀 You're Ready!

Your app will be live at:

```
https://your-app.vercel.app
```

**Next Steps:**

1. Share with users
2. Gather feedback
3. Iterate and improve
4. Scale as you grow

**Congratulations on deploying! 🎉**
