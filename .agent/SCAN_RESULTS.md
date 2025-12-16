# Project Scan Results - Security & Auth Issues

**Date**: 2025-12-11  
**Status**: 🔴 Critical Issues Found

---

## 🔴 Critical Issues

### 1. API Routes Failing with 500 Errors

**Affected Endpoints**:

- `/api/presence/heartbeat` - POST 500
- `/api/auth/user/status` - GET 500
- `/api/auth/sessions` - GET 500
- `/api/auth/linked-accounts` - GET 500

**Root Cause**: Database connection and Prisma schema field mismatch

**Impact**:

- 2FA functionality completely broken
- Session management non-functional
- OAuth account linking broken
- User cannot access security settings

---

### 2. Prisma Schema Field Name Mismatch

**Issue**: Code references `password` but schema defines `passwordHash`

**Location**: `app/api/auth/linked-accounts/route.ts` line 92

```typescript
// ❌ Wrong - field doesn't exist
select: { id: true, password: true }

// ✅ Correct - use passwordHash
select: { id: true, passwordHash: true }
```

**Also affects**: `app/api/auth/user/status/route.ts` line 28

---

### 3. SecuritySettings Component Infinite Re-render

**Issue**: `fetchUserStatus()` called in `useEffect` without proper dependency array

**Location**: `components/settings/SecuritySettings.tsx` lines 39-41

```typescript
// ❌ Creates infinite loop
useEffect(() => {
  fetchUserStatus();
}, []);
```

**Solution**: Wrap `fetchUserStatus` in `useCallback` and include it in dependencies

---

### 4. Account Model Missing `createdAt` Field

**Issue**: `linked-accounts/route.ts` tries to select `createdAt` but it doesn't exist in the Account model

**Location**: `prisma/schema.prisma` lines 85-103

```prisma
model Account {
  // ... missing createdAt field
}
```

---

## 🟡 Medium Priority Issues

### 5. Database Connection Not Verified

The Prisma client proxy pattern means errors are deferred until actual queries run. Need to:

- Verify DATABASE_URL is set correctly
- Ensure database is accessible
- Run `npx prisma db push` to sync schema

---

### 6. Error Handling Improvements Needed

Multiple API routes catch errors but don't log the actual error details:

```typescript
catch (error) {
  log.error({ err: error }, "Failed..."); // ✅ Good
}

catch (error) {
  console.error("Error:", error); // ⚠️ Should use logger
}
```

---

## 📋 Recommended Actions

### Immediate (Required to fix 2FA):

1. ✅ Fix Prisma schema field name mismatches
2. ✅ Add missing `createdAt` field to Account model
3. ✅ Fix SecuritySettings infinite re-render
4. ✅ Verify database connection and run migration

### Soon:

5. Improve error logging consistency
6. Add database connection health check
7. Add fallback UI for when database is unavailable

---

## 🔍 Additional Findings

### Dependencies

- ✅ Prisma 7 properly configured with adapter pattern
- ✅ Logger (pino) properly set up
- ✅ NextAuth.js configured

### Schema Status

- ⚠️ Account model incomplete
- ⚠️ May need to run `prisma generate` after schema fixes
- ⚠️ Backup codes field should verify encryption

---

## Next Steps

1. Apply schema fixes
2. Run database migration
3. Test all auth endpoints
4. Verify 2FA setup flow works
5. Test session management
6. Test OAuth linking/unlinking
