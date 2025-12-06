# Self-Hosting Guide

This guide explains how to deploy ProVision WorkSuite on any server (VPS, Dedicated, Cloud) using Docker. This approach gives you full control over your data and infrastructure.

## Prerequisites

- A server with **Docker** and **Docker Compose** installed.
- A **Firebase Project** (for Authentication).
- A domain name pointing to your server.

## 1. Prepare Environment Variables

Create a `.env` file in the project root (or copy `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

```env
# Database (Auto-configured in Docker, but needed if running outside)
DATABASE_URL=postgresql://provision:provision_password@postgres:5432/provision_db

# Storage Provider
# Options: 'local' (files stored on server) or 'vercel-blob' (cloud storage)
NEXT_PUBLIC_STORAGE_PROVIDER=local

# Firebase Configuration (REQUIRED)
# Get these from your Firebase Console
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 2. Run with Docker Compose

Running the application is as simple as:

```bash
docker-compose up -d
```

This will start:

- **App**: Accessible at `http://your-server-ip:3000`
- **Postgres**: Database service

### Persistent Data

- **Database**: Stored in a named volume `postgres_data`.
- **Uploads**: Stored in a named volume `uploads_data`.

## 3. Reverse Proxy (Nginx) - Recommended

For production, you should run Nginx in front of the app to handle SSL (HTTPS).

Example Nginx config:

```nginx
server {
    server_name worksuite.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Use Certbot to get free SSL certificates:

```bash
sudo certbot --nginx -d worksuite.yourdomain.com
```

## Troubleshooting

**Rebuild containers after code changes:**

```bash
docker-compose up -d --build
```

**View logs:**

```bash
docker-compose logs -f
```

**Access Database directly:**

```bash
docker exec -it provision-worksuite-db psql -U provision -d provision_db
```
