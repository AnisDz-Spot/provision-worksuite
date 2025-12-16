-- Migration: Add created_at to accounts table
-- Date: 2025-12-11
-- Purpose: Fix /api/auth/linked-accounts endpoint

-- Add createdAt column to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'accounts'
ORDER BY ordinal_position;
