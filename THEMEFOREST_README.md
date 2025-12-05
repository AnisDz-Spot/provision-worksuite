# Provision WorkSuite – Installation & Setup Guide

Welcome to Provision WorkSuite! This guide will help you deploy, configure, and launch your app in any environment (Vercel, Netlify, traditional server, or local).

---

## 1. Requirements

- Node.js 18+
- npm or yarn
- PostgreSQL (or compatible SQL DB for Prisma)
- (Optional) Vercel Blob token for file uploads

---

## 2. Quick Start (Local/Traditional Server)

1. **Clone & Install:**
   ```sh
   git clone <your-repo-url>
   cd provision-worksuite
   npm install
   ```
2. **Configure Environment:**
   - Copy `.env.example` to `.env` and set your `DATABASE_URL` and any other required variables.
3. **Push Schema:**
   ```sh
   npx prisma db push
   npx prisma generate
   ```
4. **Run the App:**
   ```sh
   npm run dev
   ```
5. **Onboard:**
   - Visit `/settings/database` to activate your license and configure your DB.

---

## 3. Deploy to Vercel/Netlify (Serverless)

1. **Deploy the repo** (Vercel/Netlify dashboard or CLI).
2. **Set Environment Variables:**
   - `DATABASE_URL` (your Postgres connection string)
   - (Optional) `VERCEL_BLOB_READ_WRITE_TOKEN` for file uploads
3. **Push Schema (IMPORTANT!):**
   - Run this command **locally** or in your CI/CD pipeline:
     ```sh
     DATABASE_URL=your_connection_string npx prisma db push
     ```
   - This step is required because serverless functions cannot run Prisma CLI at runtime.
4. **Onboard:**
   - Visit `/settings/database` to activate your license and configure your DB.

---

## 4. Buyer FAQ

- **Q: Why can't I initialize the DB from the app?**
  - A: Serverless platforms (like Vercel) do not allow running Prisma CLI at runtime. Always run `npx prisma db push` before deploying.
- **Q: How do I update the schema?**
  - A: Update your `prisma/schema.prisma`, then run `npx prisma db push` and redeploy.
- **Q: Where do I get a license?**
  - A: Your license is provided with your ThemeForest purchase or by your admin.

---

## 5. Support

- For help, see the included documentation, or contact support at [your-support-email].

---

## 6. Credits & Licensing

- See `LICENSE` and `/docs/attributions.md` for third-party credits.

---

Enjoy your new SaaS WorkSuite!
