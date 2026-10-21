-- Cloudflare D1 Migration: 0002_telegram_subscribers.sql
-- Telegram notification subscribers for Hotel "Сердце Города"

CREATE TABLE IF NOT EXISTS telegram_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat_id TEXT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
