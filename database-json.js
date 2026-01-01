import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PHONE_MAPPING_FILE = path.join(DATA_DIR, 'phone-mapping.json');

// Encryption key from environment or random
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('[database-json] Created data directory');
}

// Initialize files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, '{}');
  console.log('[database-json] Initialized users.json');
}

if (!fs.existsSync(PHONE_MAPPING_FILE)) {
  fs.writeFileSync(PHONE_MAPPING_FILE, '{}');
  console.log('[database-json] Initialized phone-mapping.json');
}

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
    console.error('[database-json] Decryption error:', error.message);
    return null;
  }
}

// Read/Write functions
function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[database-json] Error reading users:', error.message);
    return {};
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('[database-json] Error writing users:', error.message);
  }
}

function readPhoneMapping() {
  try {
    const data = fs.readFileSync(PHONE_MAPPING_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[database-json] Error reading phone mapping:', error.message);
    return {};
  }
}

function writePhoneMapping(mapping) {
  try {
    fs.writeFileSync(PHONE_MAPPING_FILE, JSON.stringify(mapping, null, 2));
  } catch (error) {
    console.error('[database-json] Error writing phone mapping:', error.message);
  }
}

// Save user credentials
export function saveUserCredentials(userId, credentials) {
  const users = readUsers();
  
  users[userId] = {
    claudeApiKey: encrypt(credentials.claudeApiKey),
    twilioAccountSid: encrypt(credentials.twilioAccountSid),
    twilioAuthToken: encrypt(credentials.twilioAuthToken),
    twilioPhoneNumber: credentials.twilioPhoneNumber,
    businessContext: credentials.businessContext,
    bypassClaude: credentials.bypassClaude,
    updatedAt: new Date().toISOString()
  };
  
  writeUsers(users);
  console.log(`[database-json] Saved credentials for user: ${userId}`);
}

// Get user credentials
export function getUserCredentials(userId) {
  const users = readUsers();
  const userRecord = users[userId];
  
  if (!userRecord) {
    return null;
  }
  
  return {
    claudeApiKey: decrypt(userRecord.claudeApiKey),
    twilioAccountSid: decrypt(userRecord.twilioAccountSid),
    twilioAuthToken: decrypt(userRecord.twilioAuthToken),
    twilioPhoneNumber: userRecord.twilioPhoneNumber,
    businessContext: userRecord.businessContext,
    bypassClaude: userRecord.bypassClaude,
    updatedAt: userRecord.updatedAt
  };
}

// Map phone number to user
export function mapPhoneToUser(phoneNumber, userId) {
  const mapping = readPhoneMapping();
  mapping[phoneNumber] = userId;
  writePhoneMapping(mapping);
  console.log(`[database-json] Mapped ${phoneNumber} to user ${userId}`);
}

// Get user by phone number
export function getUserByPhoneNumber(phoneNumber) {
  const mapping = readPhoneMapping();
  const userId = mapping[phoneNumber];
  
  if (!userId) {
    console.log(`[database-json] No user found for phone: ${phoneNumber}`);
    return null;
  }
  
  return getUserCredentials(userId);
}

// Delete user credentials
export function deleteUserCredentials(userId) {
  const users = readUsers();
  delete users[userId];
  writeUsers(users);
  
  // Also remove phone mappings
  const mapping = readPhoneMapping();
  const phonesToRemove = [];
  for (const [phone, uid] of Object.entries(mapping)) {
    if (uid === userId) {
      phonesToRemove.push(phone);
    }
  }
  phonesToRemove.forEach(phone => delete mapping[phone]);
  writePhoneMapping(mapping);
  
  console.log(`[database-json] Deleted credentials for user: ${userId}`);
}

// Get all users (for admin)
export function getAllUsers() {
  const users = readUsers();
  return Object.keys(users).map(userId => ({
    userId,
    twilioPhoneNumber: users[userId].twilioPhoneNumber,
    bypassClaude: users[userId].bypassClaude,
    updatedAt: users[userId].updatedAt,
    hasCredentials: true
  }));
}

console.log('[database-json] JSON database initialized');
