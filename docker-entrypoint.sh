#!/bin/sh
set -e

echo "ProVision WorkSuite - Starting..."

# Check if database URL is set
if [ -z "$DATABASE_URL" ] && [ -z "$POSTGRES_URL" ]; then
  echo "ERROR: No database URL configured."
  echo "Set DATABASE_URL or POSTGRES_URL environment variable."
  exit 1
fi

# Use DATABASE_URL or fall back to POSTGRES_URL
export DATABASE_URL="${DATABASE_URL:-$POSTGRES_URL}"

echo "Waiting for database connection..."

# Retry logic for database connection
MAX_RETRIES=30
RETRY_COUNT=0

until npx prisma db push --skip-generate 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "ERROR: Could not connect to database after $MAX_RETRIES attempts."
    echo "Please check your DATABASE_URL configuration."
    exit 1
  fi
  
  echo "Database not ready, retrying in 2 seconds... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

echo "✓ Database schema synchronized!"
echo "Starting Next.js server..."

# Start the application
exec node server.js
