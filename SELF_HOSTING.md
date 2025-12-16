# Self-Hosting Guide

This guide explains how to deploy ProVision WorkSuite. This application requires **Environment Variables** to be set on the server for security. Database credentials are NO LONGER configured via the UI.

## Prerequisites

- A server with **Docker** & **Docker Compose** installed.
- A **PostgreSQL Database** (e.g., Neon, AWS RDS, or local Docker container).
- A domain name (optional but recommended for SSL).

## 1. Prepare Environment Variables

Create a `.env` or `.env.local` file in the project root:

```env
# Database Connection (REQUIRED)
# Must be a valid connection string to your PostgreSQL instance
POSTGRES_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Storage Provider (REQUIRED)
# Options: 'local', 'vercel-blob', 's3'
NEXT_PUBLIC_STORAGE_PROVIDER=local

# If using S3 Storage:
S3_REGION=us-east-1
S3_BUCKET_NAME=your-bucket
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_ENDPOINT=https://s3.amazonaws.com # Optional, for Custom/MinIO
S3_PUBLIC_URL=https://cdn.yourdomain.com # Optional

# If using Vercel Blob:
BLOB_READ_WRITE_TOKEN=xxx
```

## 2. Run with Docker Compose

```bash
docker-compose up -d
```

The container will **automatically**:

1. Wait for the database to be ready
2. Run `prisma db push` to create/sync all tables
3. Start the Next.js server

You'll see in Docker logs:

```
ProVision WorkSuite - Starting...
Waiting for database connection...
✓ Database schema synchronized!
Starting Next.js server...
```

### Persistent Data (Local Mode)

If using `NEXT_PUBLIC_STORAGE_PROVIDER=local`:

- **Uploads** are stored in the `/uploads` directory mapped to a volume.
- **Database** (if utilizing the docker-compose postgres service) is stored in `postgres_data`.

## 3. First-Time Setup (Onboarding)

1. **Access the App**: Go to `http://your-server:3000`.
2. **Onboarding Screen**: You will see a "System Configuration" check.
   - Click **Verify Configuration**.
   - The system checks if `POSTGRES_URL` is valid and the DB is reachable.
3. **Registration**:
   - Once verified, you will be redirected to the **Registration Page**.
   - The **First User** to register is automatically assigned the **Global Admin** role.
   - **Note**: Registration is CLOSED after the first user. Subsequent users must be invited by the Admin.

## Troubleshooting

**"System Configuration Failed"**:

- Ensure `POSTGRES_URL` is set in your environment (e.g., in `.env` or Docker vars).
- Check database connectivity (firewalls, pg_hba.conf).

**"Registration Closed"**:

- This means a user already exists in the `User` table. Login with the existing admin account.
