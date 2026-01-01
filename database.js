import Database from 'better-sqlite3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use /app/data for Railway volume, fallback to local for development
const DB_DIR = process.env.RAILWAY_ENVIRONMENT ? '/app/data' : __dirname;
const DB_PATH = path.join(DB_DIR, 'chati.db');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

console.log(`[database] Using database at: ${DB_PATH}`);
const db = new Database(DB_PATH);

// Encryption key - in production, use process.env.ENCRYPTION_KEY
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'chati-default-key-change-in-production-32bytes';
const ALGORITHM = 'aes-256-cbc';

// Encryption functions
function encrypt(text) {
  if (!text) return null;
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (!text) return null;
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// Initialize database schema
function initializeDatabase() {
  console.log('[database] Initializing database schema...');
  
  // User credentials table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_credentials (
      user_id TEXT PRIMARY KEY,
      claude_api_key TEXT,
      twilio_account_sid TEXT,
      twilio_auth_token TEXT,
      twilio_phone_number TEXT,
      business_context TEXT,
      bypass_claude INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Phone number to user mapping (for webhook lookup)
  db.exec(`
    CREATE TABLE IF NOT EXISTS phone_user_mapping (
      phone_number TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_credentials(user_id)
    )
  `);

  console.log('[database] Database schema initialized');
}

// Initialize on import
initializeDatabase();

// CRUD operations for user credentials
export function saveUserCredentials(userId, credentials) {
  const stmt = db.prepare(`
    INSERT INTO user_credentials (
      user_id, claude_api_key, twilio_account_sid, twilio_auth_token, 
      twilio_phone_number, business_context, bypass_claude, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      claude_api_key = excluded.claude_api_key,
      twilio_account_sid = excluded.twilio_account_sid,
      twilio_auth_token = excluded.twilio_auth_token,
      twilio_phone_number = excluded.twilio_phone_number,
      business_context = excluded.business_context,
      bypass_claude = excluded.bypass_claude,
      updated_at = CURRENT_TIMESTAMP
  `);

  return stmt.run(
    userId,
    encrypt(credentials.claudeApiKey),
    encrypt(credentials.twilioAccountSid),
    encrypt(credentials.twilioAuthToken),
    credentials.twilioPhoneNumber,
    credentials.businessContext,
    credentials.bypassClaude ? 1 : 0
  );
}

export function getUserCredentials(userId) {
  const stmt = db.prepare('SELECT * FROM user_credentials WHERE user_id = ?');
  const row = stmt.get(userId);
  
  if (!row) return null;
  
  return {
    userId: row.user_id,
    claudeApiKey: decrypt(row.claude_api_key),
    twilioAccountSid: decrypt(row.twilio_account_sid),
    twilioAuthToken: decrypt(row.twilio_auth_token),
    twilioPhoneNumber: row.twilio_phone_number,
    businessContext: row.business_context,
    bypassClaude: row.bypass_claude === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function getUserByPhoneNumber(phoneNumber) {
  // Normalize phone number (remove whatsapp: prefix if present)
  const normalizedPhone = phoneNumber.replace('whatsapp:', '');
  
  const stmt = db.prepare(`
    SELECT uc.* 
    FROM user_credentials uc
    JOIN phone_user_mapping pm ON uc.user_id = pm.user_id
    WHERE pm.phone_number = ?
  `);
  
  const row = stmt.get(normalizedPhone);
  
  if (!row) return null;
  
  return {
    userId: row.user_id,
    claudeApiKey: decrypt(row.claude_api_key),
    twilioAccountSid: decrypt(row.twilio_account_sid),
    twilioAuthToken: decrypt(row.twilio_auth_token),
    twilioPhoneNumber: row.twilio_phone_number,
    businessContext: row.business_context,
    bypassClaude: row.bypass_claude === 1
  };
}

export function mapPhoneToUser(phoneNumber, userId) {
  const stmt = db.prepare(`
    INSERT INTO phone_user_mapping (phone_number, user_id)
    VALUES (?, ?)
    ON CONFLICT(phone_number) DO UPDATE SET user_id = excluded.user_id
  `);
  
  return stmt.run(phoneNumber, userId);
}

export function deleteUserCredentials(userId) {
  // Delete phone mappings first
  db.prepare('DELETE FROM phone_user_mapping WHERE user_id = ?').run(userId);
  // Delete credentials
  return db.prepare('DELETE FROM user_credentials WHERE user_id = ?').run(userId);
}

export function getAllUsers() {
  const stmt = db.prepare('SELECT user_id, twilio_phone_number, business_context, created_at, updated_at FROM user_credentials');
  return stmt.all();
}

export default db;
