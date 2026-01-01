import { Pool } from 'pg';
import crypto from 'crypto';

let pool = null;
function ensurePool() {
  if (pool) return pool;
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    // Try constructing from PG* envs (Railway may expose these)
    const host = process.env.PGHOST;
    const port = process.env.PGPORT || '5432';
    const user = process.env.PGUSER;
    const pass = process.env.PGPASSWORD;
    const db   = process.env.PGDATABASE || process.env.PGDB || 'railway';
    if (host && user && pass && db) {
      const url = `postgres://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${encodeURIComponent(db)}?sslmode=require`;
      console.log('[postgres] Constructed DATABASE_URL from PG* envs');
      pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
      return pool;
    }
    console.warn('[postgres] DATABASE_URL not set and PG* envs missing. Postgres features will be disabled.');
    return null;
  }
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  return pool;
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'chati-default-key-change-in-production-32bytes';
const ALGORITHM = 'aes-256-cbc';

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
    const [ivHex, encHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

export async function initSchema() {
  const p = ensurePool();
  if (!p) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_credentials (
      user_id TEXT PRIMARY KEY,
      claude_api_key TEXT,
      twilio_account_sid TEXT,
      twilio_auth_token TEXT,
      twilio_phone_number TEXT,
      business_context TEXT,
      bypass_claude BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await p.query(`
    CREATE TABLE IF NOT EXISTS phone_user_mapping (
      phone_number TEXT PRIMARY KEY,
      user_id TEXT NOT NULL
    );
  `);
  await p.query(`
    CREATE TABLE IF NOT EXISTS business_settings (
      user_id TEXT PRIMARY KEY,
      business_description TEXT,
      tone TEXT,
      sample_replies JSONB,
      keywords JSONB,
      support_name TEXT,
      support_phone TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await p.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      customer_number TEXT NOT NULL,
      store_number TEXT NOT NULL,
      last_activity TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await p.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      ts TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('[postgres] schema initialized');
}

export async function saveUserCredentials(userId, credentials) {
  const p = ensurePool();
  if (!p) return;
  await p.query(`
    INSERT INTO user_credentials (
      user_id, claude_api_key, twilio_account_sid, twilio_auth_token,
      twilio_phone_number, business_context, bypass_claude, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      claude_api_key = EXCLUDED.claude_api_key,
      twilio_account_sid = EXCLUDED.twilio_account_sid,
      twilio_auth_token = EXCLUDED.twilio_auth_token,
      twilio_phone_number = EXCLUDED.twilio_phone_number,
      business_context = EXCLUDED.business_context,
      bypass_claude = EXCLUDED.bypass_claude,
      updated_at = NOW();
  `, [
    userId,
    encrypt(credentials.claudeApiKey),
    encrypt(credentials.twilioAccountSid),
    encrypt(credentials.twilioAuthToken),
    credentials.twilioPhoneNumber,
    credentials.businessContext,
    !!credentials.bypassClaude,
  ]);
}

export async function getUserCredentials(userId) {
  const p = ensurePool();
  if (!p) return null;
  const { rows } = await p.query('SELECT * FROM user_credentials WHERE user_id=$1', [userId]);
  const r = rows[0];
  if (!r) return null;
  return {
    userId: r.user_id,
    claudeApiKey: decrypt(r.claude_api_key),
    twilioAccountSid: decrypt(r.twilio_account_sid),
    twilioAuthToken: decrypt(r.twilio_auth_token),
    twilioPhoneNumber: r.twilio_phone_number,
    businessContext: r.business_context,
    bypassClaude: !!r.bypass_claude,
    updatedAt: r.updated_at,
  };
}

export async function mapPhoneToUser(phoneNumber, userId) {
  const p = ensurePool();
  if (!p) return;
  await p.query(`
    INSERT INTO phone_user_mapping (phone_number, user_id)
    VALUES ($1,$2)
    ON CONFLICT (phone_number) DO UPDATE SET user_id = EXCLUDED.user_id;
  `, [phoneNumber.replace(/^whatsapp:/, ''), userId]);
}

export async function getUserByPhoneNumber(phoneNumber) {
  const p = ensurePool();
  if (!p) return null;
  const normalized = phoneNumber.replace(/^whatsapp:/, '');
  const { rows } = await p.query(`
    SELECT uc.* FROM user_credentials uc
    JOIN phone_user_mapping pm ON uc.user_id = pm.user_id
    WHERE pm.phone_number = $1
  `, [normalized]);
  const r = rows[0];
  if (!r) return null;
  return {
    userId: r.user_id,
    claudeApiKey: decrypt(r.claude_api_key),
    twilioAccountSid: decrypt(r.twilio_account_sid),
    twilioAuthToken: decrypt(r.twilio_auth_token),
    twilioPhoneNumber: r.twilio_phone_number,
    businessContext: r.business_context,
    bypassClaude: !!r.bypass_claude,
  };
}

export async function deleteUserCredentials(userId) {
  const p = ensurePool();
  if (!p) return;
  await p.query('DELETE FROM phone_user_mapping WHERE user_id=$1', [userId]);
  await p.query('DELETE FROM user_credentials WHERE user_id=$1', [userId]);
}

export async function getAllUsers() {
  const p = ensurePool();
  if (!p) return [];
  const { rows } = await p.query('SELECT user_id, twilio_phone_number, business_context, updated_at FROM user_credentials');
  return rows;
}

export async function getBusinessSettings(userId) {
  const p = ensurePool();
  if (!p) return null;
  const { rows } = await p.query('SELECT * FROM business_settings WHERE user_id=$1', [userId]);
  const r = rows[0];
  if (!r) return null;
  return {
    businessDescription: r.business_description || '',
    tone: r.tone || 'friendly',
    sampleReplies: r.sample_replies || [],
    keywords: r.keywords || [],
    supportName: r.support_name || '',
    supportPhone: r.support_phone || '',
  };
}

export async function saveBusinessSettings(userId, settings) {
  const p = ensurePool();
  if (!p) return;
  await p.query(`
    INSERT INTO business_settings (
      user_id, business_description, tone, sample_replies, keywords, support_name, support_phone, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      business_description = EXCLUDED.business_description,
      tone = EXCLUDED.tone,
      sample_replies = EXCLUDED.sample_replies,
      keywords = EXCLUDED.keywords,
      support_name = EXCLUDED.support_name,
      support_phone = EXCLUDED.support_phone,
      updated_at = NOW();
  `, [
    userId,
    settings.businessDescription || '',
    settings.tone || 'friendly',
    settings.sampleReplies || [],
    settings.keywords || [],
    settings.supportName || '',
    settings.supportPhone || '',
  ]);
}

export async function upsertConversation(userId, storeNumber, customerNumber) {
  const p = ensurePool();
  if (!p) return null;
  const id = `${customerNumber}-${storeNumber}`;
  await p.query(`
    INSERT INTO conversations (id, user_id, customer_number, store_number, last_activity)
    VALUES ($1,$2,$3,$4,NOW())
    ON CONFLICT (id) DO UPDATE SET last_activity = NOW();
  `, [id, userId, customerNumber.replace(/^whatsapp:/, ''), storeNumber.replace(/^whatsapp:/, '')]);
  return id;
}

export async function addMessage(conversationId, sender, text) {
  const p = ensurePool();
  if (!p) return;
  const id = crypto.randomBytes(12).toString('hex');
  await p.query(`
    INSERT INTO messages (id, conversation_id, sender, text, ts)
    VALUES ($1,$2,$3,$4,NOW());
  `, [id, conversationId, sender, text]);
}

export async function listConversations(userId) {
  const p = ensurePool();
  if (!p) return [];
  const { rows } = await p.query(`
    SELECT c.id, c.customer_number, c.store_number, c.last_activity,
      (SELECT text FROM messages m WHERE m.conversation_id=c.id ORDER BY ts DESC LIMIT 1) AS last_text,
      (SELECT ts FROM messages m WHERE m.conversation_id=c.id ORDER BY ts DESC LIMIT 1) AS last_ts
    FROM conversations c
    WHERE c.user_id=$1
    ORDER BY c.last_activity DESC;
  `, [userId]);

  const conversations = [];
  for (const r of rows) {
    const lastDigits = (r.customer_number || '').replace(/\D/g,'').slice(-4);
    const { rows: msgRows } = await p.query(`SELECT id, sender, text, ts FROM messages WHERE conversation_id=$1 ORDER BY ts ASC`, [r.id]);
    conversations.push({
      id: `whatsapp:${r.customer_number}`,
      customerNumber: r.customer_number,
      customerName: `Customer ${lastDigits}`,
      lastMessage: (r.last_text || '').slice(0,50) + ((r.last_text||'').length>50?'...':''),
      timestamp: r.last_ts ? new Date(r.last_ts).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}) : '',
      unread: 0,
      messages: msgRows.map(m => ({
        id: m.id,
        text: m.text,
        sender: m.sender === 'user' ? 'customer' : 'ai',
        timestamp: new Date(m.ts).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}),
      })),
    });
  }
  return conversations;
}
