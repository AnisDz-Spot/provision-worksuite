# 🎯 Quick Reference: One-Click Database Setup

## For End Users (Clients)

### ✅ Setup (30 seconds)

1. Get Neon database URL from: https://neon.tech/
2. Create `.env.local` file:
   ```env
   POSTGRES_URL=postgresql://username:password@host/database
   ```
3. Run: `npm install && npm run dev`
4. Done! ✅

---

## For Developers

### 📦 What's Configured

| Component | Technology                 | Purpose                 |
| --------- | -------------------------- | ----------------------- |
| ORM       | Prisma 7                   | Database access         |
| Adapter   | `@prisma/adapter-neon`     | Serverless optimization |
| Driver    | `@neondatabase/serverless` | Neon-specific features  |
| Config    | `prisma.config.ts`         | Centralized DB settings |
| Migration | Auto on build              | Zero manual steps       |

### 🔧 Key Files

```
prisma.config.ts         ← Database URL configuration
lib/prisma.ts           ← Neon adapter + lazy loading
prisma/schema.prisma    ← Data models (NO url here)
scripts/migrate.js      ← Auto-migration script
.env.local             ← Local database URL
```

### 🚀 Deploy Commands

**Vercel**: `vercel --prod` (auto-detects everything)  
**Railway**: Push to main branch (auto-deploys)  
**Render**: Connect repo (auto-builds)  
**Docker**: `docker-compose up` (migration in entrypoint)

---

## Common Tasks

### Add New Model

```prisma
// In prisma/schema.prisma
model NewThing {
  id   Int    @id @default(autoincrement())
  name String
}
```

Then: `npx prisma migrate dev --name add_new_thing`

### Change Database URL

**Option 1** (Environment):

```bash
# Update .env.local
POSTGRES_URL=new_url_here

# Restart server
```

**Option 2** (UI):

1. Settings → Data Source
2. Enter new URL
3. Save (auto-reconnects)

### Reset Database

```bash
npx prisma migrate reset
```

---

## Troubleshooting

| Error               | Cause                  | Fix                                |
| ------------------- | ---------------------- | ---------------------------------- |
| "No datasource url" | Missing `POSTGRES_URL` | Add to .env.local                  |
| "Cannot connect"    | Wrong URL or firewall  | Check URL format, test connection  |
| "Migration failed"  | DB schema locked       | Ensure no other migrations running |
| "ws module error"   | Missing dependency     | Run `npm install`                  |

---

## Performance Tips

✅ **DO**:

- Use Neon pooled URL (ends with `-pooler`)
- Enable connection pooling on database
- Use serverless adapter for edge deployments

❌ **DON'T**:

- Mix regular and pooled URLs
- Remove adapter (loses serverless benefits)
- Manually run migrations on production

---

## Platform-Specific Notes

### Vercel

- ✅ Auto-detects Prisma
- ✅ Runs `postinstall` (generates client)
- ✅ Build includes migration
- Add `POSTGRES_URL` in Environment Variables

### Railway

- ✅ Auto-installs dependencies
- ✅ Migrations run on deploy
- Add `POSTGRES_URL` in Variables tab

### Render

- ✅ Detects Next.js
- ✅ Runs build command with migration
- Add `POSTGRES_URL` in Environment

### Docker

- ✅ Entrypoint runs migration
- ✅ Health check included
- Set `POSTGRES_URL` in docker-compose.yml or .env

---

**Remember**: Clients only need the `POSTGRES_URL`. Everything else is automatic!

For full details, see `.agent/ONE_CLICK_DB_SETUP.md`
