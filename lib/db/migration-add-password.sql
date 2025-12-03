-- Migration: Add password_hash column to existing users table
-- Run this in your Neon database Query tab if you already executed the old schema

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
