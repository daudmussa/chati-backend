import crypto from 'node:crypto';
import makeWASocket, {
  Browsers,
  BufferJSON,
  DisconnectReason,
  initAuthCreds,
  makeCacheableSignalKeyStore,
  proto,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { ensurePool } from '../db-postgres.js';

const sessions = new Map();
const QR_TTL_MS = 45_000;
let cachedEncryptionSecret = null;
let cachedEncryptionKey = null;

function requireEncryptionKey() {
  const secret = process.env.BAILEYS_SESSION_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    const error = new Error('Set BAILEYS_SESSION_ENCRYPTION_KEY to a random secret of at least 32 characters before connecting WhatsApp numbers.');
    error.code = 'BAILEYS_ENCRYPTION_NOT_CONFIGURED';
    throw error;
  }
  if (secret !== cachedEncryptionSecret) {
    cachedEncryptionSecret = secret;
    cachedEncryptionKey = crypto.scryptSync(secret, 'chati-baileys-auth-v1', 32);
  }
  return cachedEncryptionKey;
}

function encryptAuthValue(value, context) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', requireEncryptionKey(), iv);
  cipher.setAAD(Buffer.from(context));
  const serialized = JSON.stringify(value, BufferJSON.replacer);
  const ciphertext = Buffer.concat([cipher.update(serialized, 'utf8'), cipher.final()]);
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), ciphertext.toString('hex')].join(':');
}

function decryptAuthValue(encrypted, context) {
  const [ivHex, tagHex, ciphertextHex] = encrypted.split(':');
  if (!ivHex || !tagHex || !ciphertextHex) throw new Error('Stored WhatsApp session data is invalid.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', requireEncryptionKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
  return JSON.parse(plaintext, BufferJSON.reviver);
}

function getPool() {
  const pool = ensurePool();
  if (!pool) {
    const error = new Error('PostgreSQL is required for persistent WhatsApp sessions.');
    error.code = 'BAILEYS_DATABASE_UNAVAILABLE';
    throw error;
  }
  return pool;
}

async function setConnectionStatus(connectionId, status, lastError = null) {
  const pool = getPool();
  await pool.query(
    `UPDATE baileys_connections
     SET status = $2, last_error = $3,
       connected_at = CASE WHEN $2 = 'connected' THEN COALESCE(connected_at, NOW()) ELSE connected_at END,
       updated_at = NOW()
     WHERE id = $1`,
    [connectionId, status, lastError ? String(lastError).slice(0, 500) : null],
  );
}

async function loadAuthCreds(connectionId) {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT encrypted_data FROM baileys_auth_creds WHERE connection_id = $1',
    [connectionId],
  );
  return rows[0] ? decryptAuthValue(rows[0].encrypted_data, `creds:${connectionId}`) : initAuthCreds();
}

async function saveAuthCreds(connectionId, creds) {
  const pool = getPool();
  const encryptedData = encryptAuthValue(creds, `creds:${connectionId}`);
  await pool.query(
    `INSERT INTO baileys_auth_creds (connection_id, encrypted_data, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (connection_id) DO UPDATE SET encrypted_data = EXCLUDED.encrypted_data, updated_at = NOW()`,
    [connectionId, encryptedData],
  );
}

function createSignalKeyStore(connectionId) {
  const pool = getPool();
  return {
    async get(type, ids) {
      if (!ids.length) return {};
      const { rows } = await pool.query(
        `SELECT key_id, encrypted_data FROM baileys_auth_keys
         WHERE connection_id = $1 AND key_type = $2 AND key_id = ANY($3::text[])`,
        [connectionId, type, ids],
      );
      const data = {};
      for (const row of rows) {
        let value = decryptAuthValue(row.encrypted_data, `key:${connectionId}:${type}:${row.key_id}`);
        if (type === 'app-state-sync-key' && value) {
          value = proto.Message.AppStateSyncKeyData.fromObject(value);
        }
        data[row.key_id] = value;
      }
      return data;
    },

    async set(data) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const [type, values] of Object.entries(data)) {
          for (const [keyId, value] of Object.entries(values || {})) {
            if (value === null || value === undefined) {
              await client.query(
                'DELETE FROM baileys_auth_keys WHERE connection_id = $1 AND key_type = $2 AND key_id = $3',
                [connectionId, type, keyId],
              );
              continue;
            }
            const encryptedData = encryptAuthValue(value, `key:${connectionId}:${type}:${keyId}`);
            await client.query(
              `INSERT INTO baileys_auth_keys (connection_id, key_type, key_id, encrypted_data, updated_at)
               VALUES ($1, $2, $3, $4, NOW())
               ON CONFLICT (connection_id, key_type, key_id)
               DO UPDATE SET encrypted_data = EXCLUDED.encrypted_data, updated_at = NOW()`,
              [connectionId, type, keyId, encryptedData],
            );
          }
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async clear() {
      await pool.query('DELETE FROM baileys_auth_keys WHERE connection_id = $1', [connectionId]);
    },
  };
}

async function getConnectionRow(connectionId) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, user_id AS "userId", phone_number AS "phoneNumber", status
     FROM baileys_connections WHERE id = $1`,
    [connectionId],
  );
  return rows[0] || null;
}

function runtimeFor(connectionId) {
  let runtime = sessions.get(connectionId);
  if (!runtime) {
    runtime = {
      socket: null,
      qrDataUrl: null,
      qrExpiresAt: 0,
      reconnectTimer: null,
      reconnectAttempt: 0,
      startPromise: null,
      closing: false,
      credsQueue: Promise.resolve(),
    };
    sessions.set(connectionId, runtime);
  }
  return runtime;
}

async function openSocket(connectionId, runtime) {
  const row = await getConnectionRow(connectionId);
  if (!row) return;
  const creds = await loadAuthCreds(connectionId);
  await saveAuthCreds(connectionId, creds);
  const keys = createSignalKeyStore(connectionId);
  const socket = makeWASocket({
    auth: { creds, keys: makeCacheableSignalKeyStore(keys) },
    browser: Browsers.ubuntu('Chrome'),
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });
  runtime.socket = socket;
  runtime.closing = false;
  await setConnectionStatus(connectionId, 'connecting');

  socket.ev.on('creds.update', update => {
    Object.assign(creds, update);
    runtime.credsQueue = runtime.credsQueue
      .then(() => saveAuthCreds(connectionId, creds))
      .catch(error => console.error(`[baileys] Could not persist auth credentials for ${connectionId}:`, error.message));
  });

  socket.ev.on('connection.update', update => {
    if (update.qr) {
      runtime.qrExpiresAt = Date.now() + QR_TTL_MS;
      QRCode.toDataURL(update.qr, { width: 280, margin: 1, errorCorrectionLevel: 'M' })
        .then(dataUrl => {
          if (runtime.socket !== socket || runtime.closing) return;
          runtime.qrDataUrl = dataUrl;
          return setConnectionStatus(connectionId, 'qr_ready');
        })
        .catch(error => console.error(`[baileys] QR generation failed for ${connectionId}:`, error.message));
    }

    if (update.connection === 'open') {
      runtime.qrDataUrl = null;
      runtime.qrExpiresAt = 0;
      runtime.reconnectAttempt = 0;
      if (runtime.reconnectTimer) clearTimeout(runtime.reconnectTimer);
      runtime.reconnectTimer = null;
      void setConnectionStatus(connectionId, 'connected').catch(error => {
        console.error(`[baileys] Could not save connected status for ${connectionId}:`, error.message);
      });
      return;
    }

    if (update.connection !== 'close' || runtime.closing) return;
    runtime.socket = null;
    runtime.qrDataUrl = null;
    const statusCode = update.lastDisconnect?.error?.output?.statusCode;
    const loggedOut = statusCode === DisconnectReason.loggedOut;
    const unrecoverable = loggedOut || statusCode === DisconnectReason.forbidden || statusCode === DisconnectReason.badSession;

    if (unrecoverable) {
      const status = loggedOut ? 'logged_out' : 'failed';
      void setConnectionStatus(connectionId, status, loggedOut ? null : `WhatsApp connection rejected (${statusCode}).`)
        .catch(error => console.error(`[baileys] Could not save closed status for ${connectionId}:`, error.message));
      if (loggedOut) {
        void clearAuthState(connectionId).catch(error => {
          console.error(`[baileys] Could not clear logged-out auth for ${connectionId}:`, error.message);
        });
      }
      return;
    }

    void setConnectionStatus(connectionId, 'reconnecting').catch(error => {
      console.error(`[baileys] Could not save reconnecting status for ${connectionId}:`, error.message);
    });
    if (runtime.reconnectTimer) clearTimeout(runtime.reconnectTimer);
    const waitMs = Math.min(30_000, 1_500 * (2 ** runtime.reconnectAttempt));
    runtime.reconnectAttempt += 1;
    runtime.reconnectTimer = setTimeout(() => {
      runtime.reconnectTimer = null;
      void startBaileysConnection(connectionId).catch(error => {
        console.error(`[baileys] Reconnect failed for ${connectionId}:`, error.message);
      });
    }, waitMs);
  });
}

export async function startBaileysConnection(connectionId) {
  requireEncryptionKey();
  const runtime = runtimeFor(connectionId);
  if (runtime.socket || runtime.startPromise) return;
  runtime.startPromise = openSocket(connectionId, runtime);
  try {
    await runtime.startPromise;
  } finally {
    runtime.startPromise = null;
  }
}

export async function createBaileysConnection(userId, phoneNumber) {
  requireEncryptionKey();
  const pool = getPool();
  const client = await pool.connect();
  const id = crypto.randomUUID();
  const maxConnections = Math.max(1, Number(process.env.BAILEYS_MAX_CONNECTIONS_PER_USER) || 5);
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [userId]);
    const { rows: countRows } = await client.query(
      `SELECT COUNT(*)::int AS count FROM baileys_connections
       WHERE user_id = $1 AND status NOT IN ('logged_out', 'disconnected', 'failed')`,
      [userId],
    );
    if (countRows[0].count >= maxConnections) {
      const error = new Error(`You can connect up to ${maxConnections} WhatsApp numbers for now.`);
      error.code = 'BAILEYS_CONNECTION_LIMIT';
      throw error;
    }
    await client.query(
      `INSERT INTO baileys_connections (id, user_id, phone_number, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'starting', NOW(), NOW())`,
      [id, userId, phoneNumber],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      error.code = 'BAILEYS_NUMBER_EXISTS';
      error.message = 'That number already has a connection entry. Disconnect it first or use the existing connection.';
    }
    throw error;
  } finally {
    client.release();
  }

  try {
    await startBaileysConnection(id);
  } catch (error) {
    await setConnectionStatus(id, 'failed', error.message).catch(() => undefined);
    throw error;
  }
  return listBaileysConnections(userId).then(connections => connections.find(connection => connection.id === id));
}

export async function listBaileysConnections(userId) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, phone_number AS "phoneNumber", status, last_error AS "lastError",
      connected_at AS "connectedAt", created_at AS "createdAt", updated_at AS "updatedAt"
     FROM baileys_connections WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
}

export async function getBaileysConnectionQr(userId, connectionId) {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT id FROM baileys_connections WHERE id = $1 AND user_id = $2',
    [connectionId, userId],
  );
  if (!rows[0]) return null;
  const runtime = sessions.get(connectionId);
  if (!runtime?.qrDataUrl || runtime.qrExpiresAt <= Date.now()) return { status: 'expired' };
  return { status: 'qr_ready', qrDataUrl: runtime.qrDataUrl, expiresAt: new Date(runtime.qrExpiresAt).toISOString() };
}

async function clearAuthState(connectionId) {
  const pool = getPool();
  await pool.query('DELETE FROM baileys_auth_creds WHERE connection_id = $1', [connectionId]);
  await pool.query('DELETE FROM baileys_auth_keys WHERE connection_id = $1', [connectionId]);
}

export async function disconnectBaileysConnection(userId, connectionId) {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT id FROM baileys_connections WHERE id = $1 AND user_id = $2',
    [connectionId, userId],
  );
  if (!rows[0]) return false;

  const runtime = sessions.get(connectionId);
  if (runtime) {
    runtime.closing = true;
    runtime.qrDataUrl = null;
    if (runtime.reconnectTimer) clearTimeout(runtime.reconnectTimer);
    runtime.reconnectTimer = null;
    const socket = runtime.socket;
    runtime.socket = null;
    sessions.delete(connectionId);
    if (socket) {
      try {
        await socket.logout();
      } catch {
        socket.end(undefined);
      }
    }
  }
  await pool.query('DELETE FROM baileys_connections WHERE id = $1 AND user_id = $2', [connectionId, userId]);
  return true;
}

export async function initializeBaileysConnections() {
  if (!process.env.BAILEYS_SESSION_ENCRYPTION_KEY || process.env.BAILEYS_SESSION_ENCRYPTION_KEY.length < 32) {
    console.warn('[baileys] Session restore skipped: BAILEYS_SESSION_ENCRYPTION_KEY is not configured.');
    return;
  }
  const pool = ensurePool();
  if (!pool) return;
  const { rows } = await pool.query(
    `SELECT id FROM baileys_connections
     WHERE status NOT IN ('logged_out', 'disconnected') ORDER BY created_at`,
  );
  for (const row of rows) {
    try {
      await startBaileysConnection(row.id);
    } catch (error) {
      console.error(`[baileys] Could not restore connection ${row.id}:`, error.message);
      await setConnectionStatus(row.id, 'failed', error.message).catch(() => undefined);
    }
  }
  console.log(`[baileys] Restoring ${rows.length} saved WhatsApp connection(s).`);
}
