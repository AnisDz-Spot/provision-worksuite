# ProVision WorkSuite - Client Deployment Guide

This guide explains how to deploy ProVision WorkSuite for your clients with minimal client interaction.

## Deployment Model

**For Clients**: ProVision WorkSuite is a **web application** - no installation needed. Clients simply receive a URL and login credentials.

**For You (Deployer)**: You'll create a Vercel deployment with its own database for each client.

---

## Quick Deployment (Per Client)

### 1. Fork or Clone Repository

```bash
git clone https://github.com/AnisDz-Spot/provision-worksuite.git client-name-worksuite
cd client-name-worksuite
```

### 2. Deploy to Vercel

**Option A: Using Vercel CLI** (Recommended)

```bash
npm i -g vercel
vercel
# Follow prompts:
# - Project name: client-name-worksuite
# - Which scope: your-team
# - Link to existing project: N
```

**Option B: Using Vercel Dashboard**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository
3. Project name: `client-name-worksuite`
4. Click "Deploy"

### 3. Add Database (Automatic Setup)

In your Vercel project dashboard:

1. **Storage** tab → **Create Database** → **Postgres**
   - Name: `client-name-db`
   - Region: Choose closest to client
   - Click "Create"
   - ✅ Environment variables (`POSTGRES_URL`, etc.) are **automatically added**

2. **Storage** tab → **Create Store** → **Blob**
   - Name: `client-name-storage`
   - Click "Create"
   - ✅ `BLOB_READ_WRITE_TOKEN` is **automatically added**

### 4. Initialize Database Schema

1. In Vercel dashboard → **Storage** → Click your Postgres database
2. Click **"Query"** tab
3. Copy the entire content from `lib/db/schema.sql` in your code
4. Paste into query editor
5. Click **"Run"** to execute
6. ✅ Tables created: `users`, `projects`, `tasks`, `time_logs`

### 5. Test Deployment

Visit: `https://client-name-worksuite.vercel.app/test-database`

- Click "Test Connection & Get Projects" → Should show green ✅
- Upload a test file → Should show green ✅

If both pass, your deployment is ready!

### 6. Provide to Client

Send client:

- **App URL**: `https://client-name-worksuite.vercel.app`
- **Instructions**: "Visit the URL, click Register, and create your account"
- **Support**: Your contact information

---

## Environment Variables (Handled Automatically)

When you add Vercel Postgres and Blob storage, these are **automatically configured**:

```env
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

**You don't need to set these manually!** Vercel handles the connection.

---

## Custom Domain (Optional)

To use client's custom domain:

1. Vercel Dashboard → **Settings** → **Domains**
2. Add domain: `worksuite.clientdomain.com`
3. Follow DNS setup instructions
4. Vercel provides SSL certificate automatically

---

## Multi-Client Management

**Recommended Structure**:

- 1 GitHub repository (template)
- 1 Vercel project per client
- Each project has its own database
- Each database is isolated (no shared data)

**Scaling**:

- Vercel Free: Up to 3 projects
- Vercel Pro ($20/mo): Unlimited projects
- Neon Postgres: 10GB free per database
- Vercel Blob: 1GB free per storage

---

## Client Onboarding Flow

1. **You**: Deploy + setup database (5 minutes)
2. **You**: Test at `/test-database` endpoint
3. **You**: Send client the URL
4. **Client**: Visits URL → Registers account
5. **Client**: Starts using the app (no IT knowledge needed)

---

## Maintenance

**Updates**: Push to GitHub → Vercel auto-deploys to all client projects (if using same repo)

**Backups**: Neon Postgres has automatic daily backups (7 days retention on free tier)

**Monitoring**: Vercel dashboard shows:

- Deployment status
- Error logs
- Analytics
- Database usage

---

## Cost Per Client

**Vercel Pro** ($20/month for your account):

- Unlimited client deployments
- Custom domains
- Analytics

**Per Client** (Free Tier):

- Vercel hosting: Free
- Postgres (Neon): Free (up to 10GB)
- Blob storage: Free (up to 1GB)
- SSL certificates: Free
- **Total: $0** per client on free tier

**Paid Scaling** (if client exceeds free tier):

- Neon Pro: $19/mo (more storage/compute)
- Blob overage: $0.15/GB
- Only charge client if they exceed limits

---

## FAQ

**Q: Do clients need to install anything?**
A: No. It's a web app - they just need a browser and internet.

**Q: Can clients access the database directly?**
A: No. Only your app can access it (via Vercel-managed environment variables).

**Q: How do I give clients admin access?**
A: Implement role-based access in the app (already designed for multi-tenant). First user to register becomes admin.

**Q: What if a client wants their own hosting?**
A: Deploy to their Vercel account instead of yours. They'll need to:

1. Create Vercel account
2. Add payment method
3. You deploy to their account (they pay the bills)

**Q: How do I update all clients at once?**
A: Push to GitHub → Vercel auto-deploys to all projects using that repo.

**Q: Data migration from demo?**
A: Demo data is in `data/*.json`. For production, clients start fresh or you import via the API.

---

## Security Checklist

✅ Each client has isolated database (no cross-contamination)  
✅ Environment variables are secret (not in code)  
✅ HTTPS enabled by default (Vercel SSL)  
✅ Authentication required (Firebase Auth)  
✅ SQL injection protected (parameterized queries)  
✅ File uploads validated (size + type limits)

---

## Support

For deployment issues:

- Check Vercel deployment logs
- Test at `/test-database` endpoint
- Check environment variables are set
- Verify database schema was executed

For client support:

- Login issues → Check Firebase Auth setup
- App bugs → Check browser console
- Slow performance → Check Vercel analytics

---

**Need Help?** Check Vercel documentation or contact your development team.
