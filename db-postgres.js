import { Pool } from 'pg';
import crypto from 'crypto';

let pool = null;
export function ensurePool() {
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
  
  // Users table for authentication
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      enabled_features JSONB DEFAULT '["conversations", "store", "bookings", "staff", "settings", "billing"]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  
  // Migration: Add enabled_features column if it doesn't exist
  await p.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS enabled_features JSONB DEFAULT '["conversations", "store", "bookings", "staff", "settings", "billing"]'::jsonb;
  `);
  
  // Migration: Add limits column if it doesn't exist
  await p.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS limits JSONB DEFAULT '{"maxConversations": 100, "maxProducts": 50}'::jsonb;
  `);
  
  // Migration: Add pay_date column if it doesn't exist
  await p.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS pay_date TIMESTAMPTZ;
  `);
  
  // Migration: Add package column if it doesn't exist
  await p.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS package TEXT DEFAULT 'starter';
  `);
  
  // Migration: Add status column if it doesn't exist
  await p.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
  `);
  
  // Migration: Add promo_code column if it doesn't exist
  await p.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS promo_code TEXT;
  `);
  
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
      business_name TEXT,
      business_description TEXT,
      tone TEXT,
      sample_replies JSONB,
      keywords JSONB,
      support_name TEXT,
      support_phone TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  
  // Migration: Add business_name column if it doesn't exist
  await p.query(`
    ALTER TABLE business_settings 
    ADD COLUMN IF NOT EXISTS business_name TEXT;
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
  
  // Store settings table
  await p.query(`
    CREATE TABLE IF NOT EXISTS store_settings (
      user_id TEXT PRIMARY KEY,
      store_id TEXT UNIQUE NOT NULL,
      store_name TEXT NOT NULL,
      store_phone TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  
  // Products table
  await p.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL,
      image TEXT,
      category TEXT,
      in_stock BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  
  // Orders table
  await p.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      items JSONB NOT NULL,
      total_amount NUMERIC(10,2) NOT NULL,
      total_items INT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  
  // Booking services table
  await p.query(`
    CREATE TABLE IF NOT EXISTS booking_services (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      duration INT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      description TEXT,
      available_dates JSONB DEFAULT '[]'::jsonb,
      time_slots JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  
  // Bookings table
  await p.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      date_booked DATE NOT NULL,
      time_slot TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  
  // Booking settings table
  await p.query(`
    CREATE TABLE IF NOT EXISTS booking_settings (
      user_id TEXT PRIMARY KEY,
      enabled BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  
  // Staff table
  await p.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      gender TEXT,
      promo_code TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
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
  const { rows } = await p.query(`
    SELECT id, email, name, role, enabled_features, limits, pay_date, package, status, promo_code, created_at 
    FROM users 
    ORDER BY created_at DESC
  `);
  return rows;
}

export async function getBusinessSettings(userId) {
  const p = ensurePool();
  if (!p) return null;
  
  console.log('[db-postgres] getBusinessSettings called for userId:', userId);
  
  const { rows } = await p.query('SELECT * FROM business_settings WHERE user_id=$1', [userId]);
  const r = rows[0];
  
  console.log('[db-postgres] Retrieved row:', r);
  
  if (!r) {
    console.log('[db-postgres] No business settings found for user');
    return null;
  }
  
  // If business_name is empty, try to get user's name as fallback
  let businessName = r.business_name || '';
  if (!businessName) {
    const userResult = await p.query('SELECT name FROM users WHERE id=$1', [userId]);
    if (userResult.rows[0]) {
      businessName = userResult.rows[0].name || '';
      console.log('[db-postgres] Using user name as fallback business name:', businessName);
    }
  }
  
  const settings = {
    businessName: businessName,
    businessDescription: r.business_description || '',
    tone: r.tone || 'friendly',
    sampleReplies: r.sample_replies || [],
    keywords: r.keywords || [],
    supportName: r.support_name || '',
    supportPhone: r.support_phone || '',
  };
  
  console.log('[db-postgres] Returning settings:', settings);
  
  return settings;
}

export async function saveBusinessSettings(userId, settings) {
  const p = ensurePool();
  if (!p) return;
  
  console.log('[db-postgres] saveBusinessSettings called:', { 
    userId, 
    businessName: settings.businessName,
    settings 
  });
  
  await p.query(`
    INSERT INTO business_settings (
      user_id, business_name, business_description, tone, sample_replies, keywords, support_name, support_phone, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      business_description = EXCLUDED.business_description,
      tone = EXCLUDED.tone,
      sample_replies = EXCLUDED.sample_replies,
      keywords = EXCLUDED.keywords,
      support_name = EXCLUDED.support_name,
      support_phone = EXCLUDED.support_phone,
      updated_at = NOW();
  `, [
    userId,
    settings.businessName || '',
    settings.businessDescription || '',
    settings.tone || 'friendly',
    JSON.stringify(settings.sampleReplies || []),
    JSON.stringify(settings.keywords || []),
    settings.supportName || '',
    settings.supportPhone || '',
  ]);
  
  console.log('[db-postgres] Business settings saved successfully');
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

// Auth functions
export async function createUser(email, passwordHash, name, promoCode = null) {
  const p = ensurePool();
  if (!p) return null;
  const id = crypto.randomBytes(16).toString('hex');
  await p.query(`
    INSERT INTO users (id, email, password_hash, name, promo_code, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  `, [id, email, passwordHash, name, promoCode]);
  return { id, email, name, role: 'user' };
}

export async function getUserByEmail(email) {
  const p = ensurePool();
  if (!p) return null;
  const { rows } = await p.query('SELECT * FROM users WHERE email=$1', [email]);
  return rows[0] || null;
}

export async function getUserById(id) {
  const p = ensurePool();
  if (!p) return null;
  const { rows } = await p.query('SELECT id, email, name, role, enabled_features, limits, pay_date, package, status, promo_code, created_at FROM users WHERE id=$1', [id]);
  return rows[0] || null;
}

export async function updateUserFeatures(userId, features) {
  const p = ensurePool();
  if (!p) return false;
  await p.query('UPDATE users SET enabled_features = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(features), userId]);
  return true;
}

export async function updateUserLimits(userId, limits) {
  console.log('[db-postgres] updateUserLimits called:', { userId, limits });
  const p = ensurePool();
  if (!p) {
    console.log('[db-postgres] No pool available');
    return false;
  }
  const limitsJson = JSON.stringify(limits);
  console.log('[db-postgres] Updating with JSON:', limitsJson);
  const result = await p.query('UPDATE users SET limits = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING limits', [limitsJson, userId]);
  console.log('[db-postgres] Update result:', result.rows[0]);
  return true;
}

export async function updateUserSubscription(userId, subscriptionData) {
  console.log('[db-postgres] updateUserSubscription called:', { userId, subscriptionData });
  const p = ensurePool();
  if (!p) {
    console.log('[db-postgres] No pool available');
    return false;
  }
  
  const updates = [];
  const values = [];
  let paramCount = 1;
  
  if (subscriptionData.payDate !== undefined) {
    updates.push(`pay_date = $${paramCount++}`);
    values.push(subscriptionData.payDate);
  }
  if (subscriptionData.package !== undefined) {
    updates.push(`package = $${paramCount++}`);
    values.push(subscriptionData.package);
  }
  if (subscriptionData.status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(subscriptionData.status);
  }
  if (subscriptionData.promoCode !== undefined) {
    updates.push(`promo_code = $${paramCount++}`);
    values.push(subscriptionData.promoCode || null);
  }
  
  if (updates.length === 0) return false;
  
  updates.push('updated_at = NOW()');
  values.push(userId);
  
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`;
  console.log('[db-postgres] Update query:', query, values);
  await p.query(query, values);
  return true;
}

export async function deleteUser(userId) {
  const p = ensurePool();
  if (!p) return false;
  
  console.log('[db-postgres] deleteUser v2 - Deleting user and all associated data:', userId);
  
  try {
    // Delete all user-related data in correct order (respecting foreign keys)
    console.log('[db-postgres] Deleting messages...');
    await p.query('DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = $1)', [userId]);
    console.log('[db-postgres] Deleting conversations...');
    await p.query('DELETE FROM conversations WHERE user_id = $1', [userId]);
    console.log('[db-postgres] Deleting bookings...');
    await p.query('DELETE FROM bookings WHERE user_id = $1', [userId]);
    console.log('[db-postgres] Deleting booking_services...');
    await p.query('DELETE FROM booking_services WHERE user_id = $1', [userId]);
    console.log('[db-postgres] Deleting orders...');
    await p.query('DELETE FROM orders WHERE user_id = $1', [userId]);
    console.log('[db-postgres] Deleting products...');
    await p.query('DELETE FROM products WHERE user_id = $1', [userId]);
    console.log('[db-postgres] Deleting staff...');
    await p.query('DELETE FROM staff WHERE user_id = $1', [userId]);
    console.log('[db-postgres] Deleting booking_settings...');
    await p.query('DELETE FROM booking_settings WHERE user_id = $1', [userId]);
    console.log('[db-postgres] Deleting store_settings...');
    await p.query('DELETE FROM store_settings WHERE user_id = $1', [userId]);
    console.log('[db-postgres] Deleting business_settings...');
    await p.query('DELETE FROM business_settings WHERE user_id = $1', [userId]);
    console.log('[db-postgres] Deleting user_credentials...');
    await p.query('DELETE FROM user_credentials WHERE user_id = $1', [userId]);
    console.log('[db-postgres] Deleting phone_user_mapping...');
    await p.query('DELETE FROM phone_user_mapping WHERE user_id = $1', [userId]);
    console.log('[db-postgres] Deleting user...');
    await p.query('DELETE FROM users WHERE id = $1', [userId]);
    
    console.log('[db-postgres] User and all associated data deleted successfully:', userId);
    return true;
  } catch (error) {
    console.error('[db-postgres] Error deleting user:', error);
    throw error;
  }
}

// ========================================
// Store Functions
// ========================================

export async function getStoreSettings(userId) {
  const p = ensurePool();
  if (!p) return null;
  const { rows } = await p.query('SELECT * FROM store_settings WHERE user_id=$1', [userId]);
  if (rows[0]) {
    return {
      storeId: rows[0].store_id,
      storeName: rows[0].store_name,
      storePhone: rows[0].store_phone || '',
    };
  }
  
  // Create initial store settings with generated ID if doesn't exist
  const storeId = crypto.randomBytes(8).toString('hex');
  await p.query(`
    INSERT INTO store_settings (user_id, store_id, store_name, store_phone, created_at, updated_at)
    VALUES ($1, $2, '', '', NOW(), NOW())
  `, [userId, storeId]);
  
  return { storeId, storeName: '', storePhone: '' };
}

export async function saveStoreSettings(userId, settings) {
  const p = ensurePool();
  if (!p) return null;
  
  // Check if store name already exists for another user
  const { rows: existing } = await p.query(
    'SELECT user_id FROM store_settings WHERE store_name=$1 AND user_id!=$2',
    [settings.storeName, userId]
  );
  
  if (existing.length > 0) {
    throw new Error('Store name already taken');
  }
  
  const storeId = settings.storeId || crypto.randomBytes(8).toString('hex');
  
  await p.query(`
    INSERT INTO store_settings (user_id, store_id, store_name, store_phone, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      store_name = EXCLUDED.store_name,
      store_phone = EXCLUDED.store_phone,
      updated_at = NOW();
  `, [userId, storeId, settings.storeName, settings.storePhone || '']);
  
  return { storeId, storeName: settings.storeName, storePhone: settings.storePhone || '' };
}

export async function getStoreByName(storeName) {
  const p = ensurePool();
  if (!p) return null;
  const { rows } = await p.query('SELECT * FROM store_settings WHERE store_name=$1', [storeName]);
  if (rows[0]) {
    return {
      userId: rows[0].user_id,
      storeId: rows[0].store_id,
      storeName: rows[0].store_name,
      storePhone: rows[0].store_phone || '',
    };
  }
  return null;
}

// Product Functions
export async function listProducts(userId) {
  const p = ensurePool();
  if (!p) return [];
  const { rows } = await p.query(
    'SELECT * FROM products WHERE user_id=$1 ORDER BY created_at DESC',
    [userId]
  );
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    price: parseFloat(r.price),
    image: r.image,
    category: r.category,
    inStock: r.in_stock,
  }));
}

export async function getProductsByStore(storeName) {
  const p = ensurePool();
  if (!p) return [];
  
  const store = await getStoreByName(storeName);
  if (!store) return [];
  
  return await listProducts(store.userId);
}

export async function saveProduct(userId, product) {
  const p = ensurePool();
  if (!p) return null;
  
  const id = product.id || crypto.randomBytes(12).toString('hex');
  
  await p.query(`
    INSERT INTO products (id, user_id, title, description, price, image, category, in_stock, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      image = EXCLUDED.image,
      category = EXCLUDED.category,
      in_stock = EXCLUDED.in_stock,
      updated_at = NOW();
  `, [id, userId, product.title, product.description, product.price, product.image, product.category, product.inStock !== false]);
  
  return { ...product, id };
}

export async function deleteProduct(userId, productId) {
  const p = ensurePool();
  if (!p) return false;
  await p.query('DELETE FROM products WHERE id=$1 AND user_id=$2', [productId, userId]);
  return true;
}

// Order Functions
export async function listOrders(userId) {
  const p = ensurePool();
  if (!p) return [];
  const { rows } = await p.query(
    'SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',
    [userId]
  );
  return rows.map(r => ({
    id: r.id,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    items: r.items,
    totalAmount: parseFloat(r.total_amount),
    totalItems: r.total_items,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function createOrder(userId, order) {
  const p = ensurePool();
  if (!p) return null;
  
  const id = crypto.randomBytes(12).toString('hex');
  
  await p.query(`
    INSERT INTO orders (id, user_id, customer_name, customer_phone, items, total_amount, total_items, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
  `, [
    id,
    userId,
    order.customerName,
    order.customerPhone,
    JSON.stringify(order.items),
    order.totalAmount,
    order.totalItems,
    order.status || 'pending'
  ]);
  
  return { ...order, id, createdAt: new Date().toISOString() };
}

export async function updateOrderStatus(userId, orderId, status) {
  const p = ensurePool();
  if (!p) return false;
  await p.query(
    'UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3',
    [status, orderId, userId]
  );
  return true;
}

// ========================================
// Booking Functions
// ========================================

export async function getBookingSettings(userId) {
  const p = ensurePool();
  if (!p) return { enabled: false };
  const { rows } = await p.query('SELECT * FROM booking_settings WHERE user_id=$1', [userId]);
  return rows[0] ? { enabled: rows[0].enabled } : { enabled: false };
}

export async function setBookingStatus(userId, enabled) {
  const p = ensurePool();
  if (!p) return false;
  await p.query(`
    INSERT INTO booking_settings (user_id, enabled, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id) DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW();
  `, [userId, enabled]);
  return true;
}

export async function listServices(userId) {
  const p = ensurePool();
  if (!p) return [];
  const { rows } = await p.query(
    'SELECT * FROM booking_services WHERE user_id=$1 ORDER BY created_at DESC',
    [userId]
  );
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    duration: r.duration,
    price: parseFloat(r.price),
    description: r.description,
    availableDates: r.available_dates || [],
    timeSlots: r.time_slots || [],
  }));
}

export async function saveService(userId, service) {
  const p = ensurePool();
  if (!p) return null;
  
  const id = service.id || crypto.randomBytes(12).toString('hex');
  
  await p.query(`
    INSERT INTO booking_services (id, user_id, name, duration, price, description, available_dates, time_slots, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      duration = EXCLUDED.duration,
      price = EXCLUDED.price,
      description = EXCLUDED.description,
      available_dates = EXCLUDED.available_dates,
      time_slots = EXCLUDED.time_slots,
      updated_at = NOW();
  `, [
    id,
    userId,
    service.name,
    service.duration,
    service.price,
    service.description,
    JSON.stringify(service.availableDates || []),
    JSON.stringify(service.timeSlots || [])
  ]);
  
  return { ...service, id };
}

export async function deleteService(userId, serviceId) {
  const p = ensurePool();
  if (!p) return false;
  await p.query('DELETE FROM booking_services WHERE id=$1 AND user_id=$2', [serviceId, userId]);
  return true;
}

export async function listBookings(userId) {
  const p = ensurePool();
  if (!p) return [];
  const { rows } = await p.query(
    'SELECT * FROM bookings WHERE user_id=$1 ORDER BY date_booked DESC, time_slot ASC',
    [userId]
  );
  return rows.map(r => ({
    id: r.id,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    serviceId: r.service_id,
    serviceName: r.service_name,
    dateBooked: r.date_booked,
    timeSlot: r.time_slot,
    price: parseFloat(r.price),
    status: r.status,
    notes: r.notes || '',
    createdAt: r.created_at,
  }));
}

export async function createBooking(userId, booking) {
  const p = ensurePool();
  if (!p) return null;
  
  const id = crypto.randomBytes(12).toString('hex');
  
  await p.query(`
    INSERT INTO bookings (id, user_id, customer_name, customer_phone, service_id, service_name, date_booked, time_slot, price, status, notes, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
  `, [
    id,
    userId,
    booking.customerName,
    booking.customerPhone,
    booking.serviceId,
    booking.serviceName,
    booking.dateBooked,
    booking.timeSlot,
    booking.price,
    booking.status || 'pending',
    booking.notes || ''
  ]);
  
  return { ...booking, id, createdAt: new Date().toISOString() };
}

export async function updateBooking(userId, bookingId, updates) {
  const p = ensurePool();
  if (!p) return false;
  
  const fields = [];
  const values = [];
  let paramCount = 1;
  
  if (updates.customerName !== undefined) {
    fields.push(`customer_name = $${paramCount++}`);
    values.push(updates.customerName);
  }
  if (updates.dateBooked !== undefined) {
    fields.push(`date_booked = $${paramCount++}`);
    values.push(updates.dateBooked);
  }
  if (updates.timeSlot !== undefined) {
    fields.push(`time_slot = $${paramCount++}`);
    values.push(updates.timeSlot);
  }
  if (updates.notes !== undefined) {
    fields.push(`notes = $${paramCount++}`);
    values.push(updates.notes);
  }
  
  if (fields.length === 0) return false;
  
  fields.push(`updated_at = NOW()`);
  values.push(bookingId, userId);
  
  await p.query(
    `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount++}`,
    values
  );
  
  return true;
}

// ========================================
// Staff Functions
// ========================================

export async function listStaff(userId) {
  const p = ensurePool();
  if (!p) return [];
  const { rows } = await p.query(
    'SELECT * FROM staff WHERE user_id=$1 ORDER BY created_at DESC',
    [userId]
  );
  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    gender: r.gender,
    promoCode: r.promo_code,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getStaffById(staffId, userId) {
  const p = ensurePool();
  if (!p) return null;
  const { rows } = await p.query(
    'SELECT * FROM staff WHERE id=$1 AND user_id=$2',
    [staffId, userId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    gender: r.gender,
    promoCode: r.promo_code,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function createStaff(userId, staffData) {
  const p = ensurePool();
  if (!p) return null;
  
  const id = crypto.randomBytes(16).toString('hex');
  await p.query(
    `INSERT INTO staff (id, user_id, name, gender, promo_code, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [id, userId, staffData.name, staffData.gender || null, staffData.promoCode || null]
  );
  
  return {
    id,
    userId,
    name: staffData.name,
    gender: staffData.gender || null,
    promoCode: staffData.promoCode || null,
  };
}

export async function updateStaff(staffId, userId, updates) {
  const p = ensurePool();
  if (!p) return false;
  
  const fields = [];
  const values = [];
  let paramCount = 1;
  
  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.gender !== undefined) {
    fields.push(`gender = $${paramCount++}`);
    values.push(updates.gender || null);
  }
  if (updates.promoCode !== undefined) {
    fields.push(`promo_code = $${paramCount++}`);
    values.push(updates.promoCode || null);
  }
  
  if (fields.length === 0) return false;
  
  fields.push(`updated_at = NOW()`);
  values.push(staffId, userId);
  
  await p.query(
    `UPDATE staff SET ${fields.join(', ')} WHERE id = $${paramCount++} AND user_id = $${paramCount++}`,
    values
  );
  
  return true;
}

export async function deleteStaff(staffId, userId) {
  const p = ensurePool();
  if (!p) return false;
  await p.query('DELETE FROM staff WHERE id=$1 AND user_id=$2', [staffId, userId]);
  return true;
}

export async function updateBookingStatus(userId, bookingId, status) {
  const p = ensurePool();
  if (!p) return false;
  await p.query(
    'UPDATE bookings SET status=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3',
    [status, bookingId, userId]
  );
  return true;
}
