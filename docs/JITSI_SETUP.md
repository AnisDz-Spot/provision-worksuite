# Private Jitsi Meet Setup Guide

To resolve the "Members Only" and "Connection Denied" issues encountered on the public `meet.jit.si` server, it is recommended to host your own Jitsi instance. This gives you full control over security, participants, and branding.

## Prerequisites

- A server with at least 4GB RAM (Ubuntu 22.04 recommended)
- Docker and Docker Compose installed
- A domain name (e.g., `meet.yourcompany.com`) with A records pointing to your server

## Quick Setup (Docker)

1. **Download the Jitsi Docker repository:**

   ```bash
   git clone https://github.com/jitsi/docker-jitsi-meet
   cd docker-jitsi-meet
   ```

2. **Create the configuration file:**

   ```bash
   cp env.example .env
   ```

3. **Generate secure passwords:**
   Jitsi requires several internal passwords. Run their helper script:

   ```bash
   ./gen-passwords.sh
   ```

4. **Edit the `.env` file:**
   Open the `.env` file and set the following critical values:
   - `HTTP_PORT=80`
   - `HTTPS_PORT=443`
   - `TZ=UTC`
   - `PUBLIC_URL=https://meet.yourdomain.com` (Your domain)
   - `ENABLE_AUTH=0` (Keep 0 for now to allow your Worksuite to create rooms anonymously)
   - `ENABLE_GUESTS=1`

5. **Start the containers:**
   ```bash
   docker compose up -d
   ```

## Application Configuration

Once your server is running, update your ProVision Worksuite environment variables:

1. Open your `.env` (or Vercel environment variables).
2. Update the Jitsi domain:
   ```env
   NEXT_PUBLIC_JITSI_DOMAIN=meet.yourdomain.com
   ```

## Troubleshooting

- **Firestore/XMPP Errors**: Ensure ports 443 (TCP) and 10000 (UDP) are open in your firewall.
- **SSL Issues**: Jitsi has a built-in Let's Encrypt support. Set `ENABLE_LETSENCRYPT=1` and `LETSENCRYPT_EMAIL` in the `.env` file before starting.
- **Connection Denied**: ensure `ENABLE_AUTH=0` if you want the Worksuite to handle authorization at the application level rather than the Jitsi level.
