-- Migration: Add FCM token column to users table
-- This stores the Firebase Cloud Messaging device token for push notifications

ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;
CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users(fcm_token) WHERE fcm_token IS NOT NULL;
COMMENT ON COLUMN users.fcm_token IS 'Firebase Cloud Messaging token for push notifications';
