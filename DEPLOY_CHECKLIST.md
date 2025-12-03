# 🚀 Quick Deploy Checklist

Follow these steps to deploy to Vercel:

## ✅ Pre-Deployment (Do this first)

### 1. Complete Firebase Setup
- [ ] Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Enable Firestore Database
- [ ] Enable Authentication (Email/Password)
- [ ] Enable Storage (optional - can skip for now)
- [ ] Copy Firebase config values

### 2. Prepare Environment Variables
Copy these from Firebase Console → Project Settings:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 🚀 Deployment Steps

### Step 1: Commit Your Code

```bash
# Add all files
git add .

# Commit
git commit -m "Ready for deployment"
```

### Step 2: Push to GitHub

**Option A: Create new repo on GitHub first, then:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/provision-worksuite.git
git branch -M main
git push -u origin main
```

**Option B: Use GitHub CLI:**
```bash
# Install: https://cli.github.com/
gh repo create provision-worksuite --public --source=. --remote=origin --push
```

### Step 3: Deploy to Vercel

**Option A: Via Vercel Website (Easiest)**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub repo
4. Click "Import"
5. Add environment variables (Firebase config from Step 2 above)
6. Click "Deploy"
7. Wait 2-3 minutes ⏳
8. Done! 🎉

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? provision-worksuite
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# (paste your value when prompted)
# Repeat for all 6 Firebase env vars

# Deploy to production
vercel --prod
```

---

## 🔐 After Deployment

### 1. Add Vercel Domain to Firebase

1. Go to Firebase Console → Authentication → Settings
2. Click "Authorized domains"
3. Add your Vercel URL: `your-app.vercel.app`
4. Add your custom domain if you have one

### 2. Deploy Security Rules

1. Go to Firebase Console → Firestore Database → Rules
2. Copy content from `firestore.rules` file
3. Paste and click "Publish"

4. Go to Storage → Rules (if you enabled Storage)
5. Copy content from `storage.rules` file
6. Paste and click "Publish"

### 3. Test Your Deployment

- [ ] Visit your Vercel URL
- [ ] Try to register a new user
- [ ] Try to login
- [ ] Create a test project
- [ ] Check Firebase Console - data should appear
- [ ] Test in mobile browser
- [ ] Test all main features

---

## 🎨 Optional: Add Custom Domain

1. In Vercel dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `worksuite.yourdomain.com`
4. Follow DNS instructions
5. Wait 5-10 minutes for propagation
6. Update Firebase authorized domains

---

## ⚠️ Troubleshooting

**Build fails?**
- Check Vercel deployment logs
- Make sure all dependencies are in package.json
- Try `npm run build` locally first

**"Permission denied" in Firebase?**
- Deploy security rules (see step 2 above)
- Check authorized domains in Firebase

**Environment variables not working?**
- Make sure they're added in Vercel dashboard
- Redeploy after adding variables
- Names must match exactly (case-sensitive)

---

## 📞 Need Help?

- Full guide: `VERCEL_DEPLOYMENT.md`
- Firebase setup: `FIREBASE_SETUP.md`
- Multi-tenant setup: `MULTI_TENANT_GUIDE.md`

---

**Your app will be live at:**
```
https://provision-worksuite-[random].vercel.app
```

You can rename it in Vercel dashboard → Settings → Domains.

**Ready to deploy? Let's go! 🚀**
