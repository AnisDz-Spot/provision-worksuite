# 🔥 Firebase Setup Guide for ProVision WorkSuite

## Prerequisites
- Firebase account (free tier works great)
- Node.js and npm installed

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `provision-worksuite` (or your choice)
4. Enable Google Analytics (optional)
5. Click **"Create project"**

---

## Step 2: Register Web App

1. In Firebase Console, click the **Web icon** (`</>`)
2. Register app: `ProVision WorkSuite`
3. **Copy the config object** (you'll need this!)
4. Click **"Continue to console"**

---

## Step 3: Enable Firestore Database

1. In Firebase Console sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add security rules later)
4. Select your region (choose closest to your users)
5. Click **"Enable"**

---

## Step 4: Enable Storage

### Method 1: Via Firebase Console UI
1. In Firebase Console sidebar, click **"Storage"** or **"Build"** → **"Storage"**
2. Click **"Get started"**
3. Accept default security rules (we'll update them)
4. Select same region as Firestore
5. Click **"Done"**

### Method 2: If Storage Option is Missing
If you don't see a "Get started" button, Storage might need to be enabled differently:

1. Go to Firebase Console → **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Make sure your web app is registered
4. Go back to **"Storage"** in the sidebar
5. Try clicking **"Get started"** again

### Method 3: Alternative Navigation Path
1. Click **"Build"** in the left sidebar (it's a dropdown)
2. Select **"Storage"** from the menu
3. Click **"Get started"**

### Method 4: Create via Firebase CLI (if UI doesn't work)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize Storage
firebase init storage
```

**Note:** Storage is optional for basic functionality. If you can't enable it now, you can skip it and enable file uploads later. The app will work fine with just Firestore for projects and tasks.

---

## Step 5: Enable Authentication

1. In Firebase Console sidebar, click **"Authentication"**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"**
5. Click **"Save"**

---

## Step 6: Configure Your App

1. Open `.env.local` in your project
2. Replace the values with your Firebase config:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. **Restart your dev server** for env variables to take effect:
```bash
npm run dev
```

---

## Step 7: Deploy Security Rules

### Firestore Rules

1. In Firebase Console, go to **"Firestore Database"** → **"Rules"** tab
2. Copy contents from `firestore.rules` file in your project
3. Paste into the editor
4. Click **"Publish"**

### Storage Rules

1. In Firebase Console, go to **"Storage"** → **"Rules"** tab
2. Copy contents from `storage.rules` file in your project
3. Paste into the editor
4. Click **"Publish"**

---

## Step 8: Migrate Your Data

1. Make sure you're logged in to the app
2. Add the migration tool to any page temporarily:

```tsx
// In app/page.tsx or any page
import { FirebaseMigrationTool } from '@/components/firebase/MigrationTool';

export default function Page() {
  return (
    <div>
      {/* Your existing content */}
      <FirebaseMigrationTool />
    </div>
  );
}
```

3. Open the page in your browser
4. Click **"Check LocalStorage Data"** to see what you have
5. Click **"Migrate to Firestore"** to migrate
6. Verify the migration was successful
7. **Remove the MigrationTool component** from your code

---

## Step 9: Verify Everything Works

1. Go to Firebase Console → Firestore Database
2. You should see collections: `projects`, `tasks`, `users`
3. Try creating a new project in your app
4. It should appear in Firestore instantly!
5. Try opening the app in another browser tab
6. Changes should sync in real-time 🎉

---

## Step 10: Optional - Set Up Firebase CLI

For advanced users who want to deploy rules via command line:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select: Firestore, Storage, Hosting (optional)
# Use existing project
# Accept default file names

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

## Troubleshooting

### "Permission denied" errors
- Check that security rules are published
- Make sure you're logged in with Firebase Auth
- Verify user has correct permissions

### Data not syncing
- Check browser console for errors
- Verify `.env.local` is configured correctly
- Make sure you restarted the dev server after adding env vars

### Can't upload files
- Check Storage rules are published
- Verify file size is under 10MB
- Check file type is allowed in rules

### Migration errors
- Check browser console for details
- Verify Firestore is enabled
- Try migrating smaller batches

---

## Next Steps

✅ Firebase is now set up!
✅ Your data is in the cloud
✅ Real-time sync is working

**Now you can:**
1. Replace localStorage calls with Firestore functions
2. Add file upload features
3. Enable offline support
4. Deploy to production
5. Add team collaboration features

---

## Production Checklist

Before going live:

- [ ] Set up proper Firebase Authentication (not just test mode)
- [ ] Review and tighten security rules
- [ ] Set up Firebase project for production (separate from dev)
- [ ] Configure environment variables in hosting (Vercel/Netlify)
- [ ] Enable Firebase monitoring and alerts
- [ ] Set up backup strategies
- [ ] Configure proper CORS if needed
- [ ] Add rate limiting for API calls
- [ ] Test all features with real data

---

## Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Quickstart](https://firebase.google.com/docs/firestore/quickstart)
- [Storage Quickstart](https://firebase.google.com/docs/storage/web/start)

---

**Need help?** Check the browser console for errors and Firebase Console for quota/usage.
