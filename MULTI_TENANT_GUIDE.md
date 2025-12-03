# 🏢 Multi-Tenant Firebase Setup Guide

This guide explains how to let each client use their own Firebase project/hosting.

---

## 🎯 Architecture Overview

### Three Deployment Models:

1. **Shared Infrastructure (Easiest)**
   - Your app hosted once
   - Each client has their own Firebase project
   - Clients identified by subdomain or URL parameter

2. **Self-Hosted (Most Flexible)**
   - Each client hosts the app themselves
   - They use their own Firebase project
   - You provide them the source code or Docker image

3. **Hybrid (Recommended)**
   - You host the app
   - Clients can choose: use your hosting OR self-host
   - Configuration managed via admin panel

---

## 📋 Option 1: Shared Hosting with Multi-Tenant Support

Your app is hosted once, but each client uses their own Firebase project.

### Setup Steps:

#### 1. Wrap your app with TenantProvider

```tsx
// app/layout.tsx
import { TenantProvider } from '@/components/tenant/TenantProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
```

#### 2. Add client configurations

Choose one method:

**Method A: Environment Variables** (for few clients)
```bash
# .env.local
# Client 1 (Acme Corp)
TENANT_ACME_FIREBASE_API_KEY=xxx
TENANT_ACME_FIREBASE_AUTH_DOMAIN=xxx
TENANT_ACME_FIREBASE_PROJECT_ID=acme-worksuite

# Client 2 (Beta Inc)
TENANT_BETA_FIREBASE_API_KEY=yyy
TENANT_BETA_FIREBASE_AUTH_DOMAIN=yyy
TENANT_BETA_FIREBASE_PROJECT_ID=beta-worksuite
```

**Method B: Database** (for many clients - RECOMMENDED)
```sql
CREATE TABLE tenants (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  firebase_api_key TEXT,
  firebase_auth_domain TEXT,
  firebase_project_id TEXT,
  firebase_storage_bucket TEXT,
  firebase_messaging_sender_id TEXT,
  firebase_app_id TEXT,
  created_at TIMESTAMP,
  is_active BOOLEAN
);
```

**Method C: Configuration File** (for testing)
Edit `app/api/tenant/[tenantId]/config/route.ts` and add your clients.

#### 3. Configure tenant identification

**Option A: Subdomain** (acme.yourapp.com)
```
acme.yourapp.com → tenantId = "acme"
beta.yourapp.com → tenantId = "beta"
```

**Option B: URL Path** (yourapp.com/tenant/acme)
```
yourapp.com/tenant/acme → tenantId = "acme"
yourapp.com/tenant/beta → tenantId = "beta"
```

**Option C: Query Parameter** (yourapp.com?tenant=acme)
```
yourapp.com?tenant=acme → tenantId = "acme"
yourapp.com?tenant=beta → tenantId = "beta"
```

#### 4. Update your components to use tenant Firebase

```tsx
// Before (single tenant)
import { db } from '@/lib/firebase';

// After (multi-tenant)
import { useTenant } from '@/components/tenant/TenantProvider';

function MyComponent() {
  const { db, auth, storage, tenantId } = useTenant();
  
  // Use db, auth, storage as before
}
```

#### 5. Client onboarding process

When a new client signs up:

1. **Client creates their Firebase project**
   - They follow the Firebase setup guide
   - They get their Firebase config

2. **Client provides you their config**
   - Via admin panel in your app
   - Or via email/secure form

3. **You add their config**
   - Add to environment variables, database, or config file
   - Assign them a tenant ID (e.g., "acme")

4. **Client accesses their instance**
   - `acme.yourapp.com`
   - OR `yourapp.com?tenant=acme`
   - OR `yourapp.com/tenant/acme`

---

## 📋 Option 2: Self-Hosted by Client

Each client hosts the app on their own infrastructure.

### Setup Steps:

#### 1. Prepare deployment package

```bash
# Build your app
npm run build

# Create deployment package
tar -czf provision-worksuite.tar.gz \
  .next/ \
  public/ \
  package.json \
  next.config.ts \
  .env.example
```

#### 2. Provide client with instructions

**Deployment Instructions for Clients:**

```markdown
# ProVision WorkSuite Deployment

## Prerequisites
- Node.js 18+
- Firebase project (free tier works)

## Steps

1. Extract the package
2. Install dependencies: `npm install`
3. Create `.env.local` with your Firebase config
4. Run: `npm run dev` (development) or `npm start` (production)

## Hosting Options
- Vercel (easiest): `vercel deploy`
- Docker: `docker build -t worksuite .`
- Traditional server: `npm run build && npm start`
```

#### 3. Docker support (optional)

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📋 Option 3: Hybrid Model (Recommended)

Combine both approaches for maximum flexibility.

### Features:

- **Default**: Clients use your hosted version with their Firebase
- **Optional**: Clients can self-host if they prefer
- **Admin Panel**: Manage client configurations
- **White-Label**: Clients can customize branding

### Implementation:

1. Implement Option 1 (multi-tenant hosting)
2. Provide Option 2 (self-hosting package) for clients who want it
3. Build admin panel to manage configurations
4. Add white-label features (logo, colors, domain)

---

## 🔐 Security Considerations

### For Multi-Tenant Hosting:

1. **Isolate tenant data**
   ```typescript
   // Always filter by tenantId
   const projects = await getAllProjects(userId, tenantId);
   ```

2. **Validate tenant access**
   ```typescript
   // Verify user belongs to tenant
   if (user.tenantId !== tenantId) {
     throw new Error('Unauthorized');
   }
   ```

3. **Rate limiting per tenant**
   ```typescript
   // Prevent one tenant from consuming all resources
   const rateLimit = new RateLimiter({ 
     windowMs: 15 * 60 * 1000,
     max: 100,
     keyGenerator: (req) => req.tenantId 
   });
   ```

### For Self-Hosted:

1. **Secure Firebase config**
   - Never commit `.env.local`
   - Use environment variables in hosting platform

2. **Keep dependencies updated**
   - Provide update notifications
   - Document update process

3. **Backup strategy**
   - Document Firebase backup procedures
   - Provide backup scripts

---

## 💰 Pricing Models

### Model 1: Per-Tenant Pricing
- Free tier: 1 tenant
- Pro: $49/month per tenant
- Enterprise: Custom pricing

### Model 2: Usage-Based
- Based on API calls, storage, users
- Each tenant pays for their Firebase usage

### Model 3: License-Based
- One-time fee for self-hosting license
- Annual support/update subscription

---

## 🚀 Client Onboarding Checklist

- [ ] Client creates Firebase project
- [ ] Client enables Firestore, Storage, Authentication
- [ ] Client provides Firebase config (secure method)
- [ ] You add config to your system
- [ ] Assign tenant ID
- [ ] Configure subdomain/URL
- [ ] Client tests access
- [ ] Migrate any existing data
- [ ] Provide training/documentation
- [ ] Set up monitoring/alerts

---

## 📊 Monitoring & Support

### For Each Client/Tenant:

1. **Monitor Firebase usage**
   - Track quotas and limits
   - Alert before exceeding free tier

2. **Error tracking**
   - Separate error logs per tenant
   - Alert on critical errors

3. **Performance monitoring**
   - Track response times per tenant
   - Identify slow queries

4. **Support tickets**
   - Tag by tenant ID
   - Track per-client issues

---

## 🛠️ Admin Panel Features

Build an admin panel to manage tenants:

```typescript
// Admin features
- View all tenants
- Add/edit/remove tenant
- Test tenant Firebase connection
- View tenant usage statistics
- Manage tenant permissions
- White-label settings per tenant
- Backup/restore tenant data
```

---

## 📞 Need Help?

Common questions:

**Q: Can clients use different Firebase plans?**
A: Yes! Each client's Firebase is independent.

**Q: What if a client wants to migrate to self-hosting later?**
A: Easy! Provide them the deployment package and their data export.

**Q: How do I handle updates?**
A: For hosted: you update once. For self-hosted: provide update packages.

**Q: Can I mix different databases (not just Firebase)?**
A: Yes, but requires more work. Firebase is easiest for this use case.

---

## 🎯 Next Steps

1. Choose your deployment model (Option 1, 2, or 3)
2. Implement tenant configuration system
3. Test with a demo client
4. Document onboarding process
5. Build admin panel (optional but recommended)
6. Set up monitoring
7. Launch! 🚀
