import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
import Twilio from "twilio";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import nodemailer from "nodemailer";
import sharp from "sharp";
import { initSchema, saveUserCredentials, getUserCredentials, getUserByPhoneNumber, mapPhoneToUser, deleteUserCredentials, getAllUsers, getBusinessSettings as pgGetBusinessSettings, saveBusinessSettings as pgSaveBusinessSettings, upsertConversation, addMessage, listConversations, createUser, getUserByEmail, getUserById, ensurePool, updateUserFeatures, updateUserLimits, updateUserSubscription, deleteUser, getStoreSettings as pgGetStoreSettings, saveStoreSettings as pgSaveStoreSettings, getStoreByName as pgGetStoreByName, listProducts, getProductsByStore, saveProduct, deleteProduct, listOrders, createOrder, updateOrderStatus, deleteOrder, getBookingSettings, setBookingStatus, listServices, saveService, deleteService, listBookings, createBooking, updateBooking, updateBookingStatus, listStaff, getStaffById, createStaff, updateStaff, deleteStaff, listCategories, getCategoryById, saveCategory, deleteCategory, savePaymentSettings as pgSavePaymentSettings, getPaymentSettings as pgGetPaymentSettings, createPaymentTransaction, updatePaymentTransaction, getPaymentTransactionsByUserId, getPaymentTransactionByReference, updateUserPaymentsEnabled, updateBookingPaymentStatus, getBookingById, createPaymentItem, getPaymentItemsByUserId, getPaymentItemById, updatePaymentItem, deletePaymentItem } from "./db-postgres.js";


console.log("[startup] Loading env...");
// Override Railway's broken internal DATABASE_URL (postgres.railway.internal)
// with the working public proxy from .env
dotenv.config({ override: true });
dotenv.config({ path: '.env.railway' });

console.log("[startup] Env loaded, checking DATABASE_URL...");
console.log("- DATABASE_URL exists?", !!process.env.DATABASE_URL);
console.log("[startup] Initializing app...");
// Initialize Postgres schema (if DATABASE_URL is set)
await initSchema();
console.log("[debug] Raw process.env check:");
console.log("- process.env.CLAUDE_API_KEY exists?", !!process.env.CLAUDE_API_KEY);
console.log("- process.env.TWILIO_ACCOUNT_SID exists?", !!process.env.TWILIO_ACCOUNT_SID);
console.log("- PGHOST exists?", !!process.env.PGHOST);

const app = express();

// Enable CORS for frontend - must be first middleware
app.use((req, res, next) => {
  // Allow all origins (you can restrict this to specific origins in production)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-role, Accept');
  res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure multer for file uploads (memory storage for Bunny CDN)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Helper function to strip quotes from environment variables
const stripQuotes = (str) => {
  if (!str) return str;
  return str.replace(/^["']|["']$/g, '');
};

// Read secrets from environment
const CLAUDE_API_KEY = stripQuotes(process.env.CLAUDE_API_KEY);
const TWILIO_ACCOUNT_SID = stripQuotes(process.env.TWILIO_ACCOUNT_SID);
const TWILIO_AUTH_TOKEN = stripQuotes(process.env.TWILIO_AUTH_TOKEN);
const TWILIO_PHONE_NUMBER = stripQuotes(process.env.TWILIO_PHONE_NUMBER);
const BUSINESS_CONTEXT = stripQuotes(process.env.BUSINESS_CONTEXT) || "";
const BYPASS_CLAUDE =
  process.env.BYPASS_CLAUDE === "1" || process.env.BYPASS_CLAUDE === "true";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

console.log("[config] Environment check:");
console.log("- CLAUDE_API_KEY:", CLAUDE_API_KEY ? `Set (${CLAUDE_API_KEY.substring(0, 10)}...)` : "MISSING");
console.log("- TWILIO_ACCOUNT_SID:", TWILIO_ACCOUNT_SID ? `Set (${TWILIO_ACCOUNT_SID.substring(0, 10)}...)` : "MISSING");
console.log("- TWILIO_AUTH_TOKEN:", TWILIO_AUTH_TOKEN ? "Set" : "MISSING");
console.log("- TWILIO_PHONE_NUMBER:", TWILIO_PHONE_NUMBER || "MISSING");
console.log("- BYPASS_CLAUDE:", BYPASS_CLAUDE);
console.log("- JWT_SECRET:", JWT_SECRET !== "your-secret-key-change-in-production" ? "Set" : "Using default (CHANGE THIS)");

// Bunny.net Storage Service (inline implementation)
class BunnyStorage {
  constructor() {
    // Fallback to hardcoded values if env vars not available (temporary for Railway issue)
    this.storageZone = process.env.BUNNY_STORAGE_ZONE || 'chati-storage';
    this.apiKey = process.env.BUNNY_API_KEY || 'a5528ae7-6dcc-45f5-8408d7fd897c-5c24-4dee';
    this.cdnUrl = process.env.BUNNY_CDN_URL || 'https://chati-storage.b-cdn.net';
    this.storageUrl = `https://storage.bunnycdn.com/${this.storageZone}`;
    this.isConfigured = !!(this.storageZone && this.apiKey && this.cdnUrl);
    
    console.log('[Bunny Storage] Configuration:');
    console.log('  - Storage Zone:', this.storageZone);
    console.log('  - API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET');
    console.log('  - CDN URL:', this.cdnUrl);
    console.log('  - Is Configured:', this.isConfigured);
  }

  async uploadFile(fileBuffer, fileName, folder = '') {
    if (!this.isConfigured) {
      throw new Error('Bunny storage is not configured');
    }

    try {
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = folder ? `${folder}/${sanitizedFileName}` : sanitizedFileName;
      const uploadUrl = `${this.storageUrl}/${filePath}`;

      const response = await axios.put(uploadUrl, fileBuffer, {
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': 'application/octet-stream'
        }
      });

      if (response.status === 201) {
        return {
          success: true,
          url: `${this.cdnUrl}/${filePath}`,
          path: filePath
        };
      }

      throw new Error('Upload failed');
    } catch (error) {
      console.error('[Bunny Storage] Upload error:', error.message);
      throw error;
    }
  }

  async deleteFile(filePath) {
    if (!this.isConfigured) {
      throw new Error('Bunny storage is not configured');
    }

    try {
      const deleteUrl = `${this.storageUrl}/${filePath}`;
      
      const response = await axios.delete(deleteUrl, {
        headers: {
          'AccessKey': this.apiKey
        }
      });

      return response.status === 200;
    } catch (error) {
      console.error('[Bunny Storage] Delete error:', error.message);
      throw error;
    }
  }

  getCdnUrl(filePath) {
    return `${this.cdnUrl}/${filePath}`;
  }
}

const bunnyStorage = new BunnyStorage();

// Configure Gmail SMTP transporter
const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'chatisolutions@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD
  },
  connectionTimeout: 5000,
  socketTimeout: 30000
});

if (process.env.GMAIL_APP_PASSWORD) {
  console.log('[Email] ✅ Gmail SMTP configured');
} else {
  console.log('[Email] ⚠️ GMAIL_APP_PASSWORD not set - emails will not be sent');
}

// Email sending function using Gmail SMTP
async function sendWelcomeEmail(toEmail, userName) {
  console.log('[Email] Attempting to send welcome email to:', toEmail);
  
  if (process.env.DISABLE_EMAIL === 'true' || !process.env.GMAIL_APP_PASSWORD) {
    console.log('[Email] Email disabled or GMAIL_APP_PASSWORD not set - skipping email');
    return false;
  }
  
  const mailOptions = {
    from: {
      name: 'Chati Solutions Team',
      address: process.env.GMAIL_USER || 'chatisolutions@gmail.com'
    },
    to: toEmail,
    replyTo: process.env.GMAIL_USER || 'chatisolutions@gmail.com',
    subject: 'Welcome to Chati Solutions - Your Account is Ready',
    headers: {
      'X-Entity-Ref-ID': `user-${Date.now()}`,
      'List-Unsubscribe': '<mailto:chatisolutions@gmail.com?subject=unsubscribe>'
    },
    text: `Hi ${userName},

Thank you for creating an account with Chati Solutions.

Your account has been successfully set up. To activate your account and start using our platform, please select a subscription plan that fits your needs.

View available plans: https://chati.solutions/pricing

If you need assistance, our support team is available:
Phone: +255 719 958 997
Email: chatisolutions@gmail.com

Once you subscribe, your account will be activated within 24 hours.

Best regards,
The Chati Solutions Team

Chati Solutions
https://chati.solutions
© 2026 All rights reserved.

To unsubscribe, reply with "unsubscribe".`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Chati Solutions</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #25D366 0%, #20BD5A 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: 600; }
          .contact-box { background: #f9f9f9; padding: 20px; border-left: 4px solid #25D366; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; color: #666; margin-top: 20px; font-size: 12px; padding: 20px; }
          .footer a { color: #25D366; text-decoration: none; }
          ul { padding-left: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Welcome to Chati Solutions</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>Thank you for creating an account with Chati Solutions.</p>
            
            <p>Your account has been successfully set up. To activate your account and start using our platform, please select a subscription plan that fits your needs.</p>
            
            <a href="https://chati.solutions/pricing" class="button" style="color: white;">View Available Plans</a>
            
            <div class="contact-box">
              <h3 style="margin-top: 0;">Need Assistance?</h3>
              <p>Our support team is available to help:</p>
              <p><strong>Phone:</strong> +255 719 958 997<br>
              <strong>Email:</strong> chatisolutions@gmail.com</p>
            </div>
            
            <p>Once you subscribe, your account will be activated within 24 hours.</p>
            
            <p>Best regards,<br>
            <strong>The Chati Solutions Team</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Chati Solutions. All rights reserved.</p>
            <p>Visit us at <a href="https://chati.solutions">chati.solutions</a></p>
            <p style="font-size: 11px; color: #999; margin-top: 10px;">
              This email was sent to ${toEmail} because you signed up for Chati Solutions.<br>
              To unsubscribe, reply with "unsubscribe".
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    console.log('[Email] Sending email via Gmail SMTP...');
    console.log('[Email] SMTP config:', {
      user: process.env.GMAIL_USER?.replace(/(.{3}).+/g, '$1***'),
      hasPassword: !!process.env.GMAIL_APP_PASSWORD
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
    );
    
    const result = await Promise.race([
      gmailTransporter.sendMail(mailOptions),
      timeoutPromise
    ]);
    
    console.log('[Email] ✅ Email sent successfully via Gmail!');
    console.log('[Email] Message ID:', result.messageId);
    return true;
  } catch (error) {
    console.error('[Email] ❌ Failed to send email');
    console.error('[Email] Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.body
    });
    // Don't throw - let signup continue even if email fails
    return false;
  }
}

let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  console.log("[config] Twilio client initialized");
} else {
  console.log("[config] WARNING: Twilio client NOT initialized");
}

// Store conversation history per phone number
const conversationHistory = new Map();

// Store bookings and services
const bookings = [];
const services = [];
let bookingsEnabled = false;

// Store orders (scoped by userId)
const orders = [];

// Store products (scoped by userId)
const products = [];

// Clean up old conversations after 1 hour of inactivity
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [phone, data] of conversationHistory.entries()) {
    if (data.lastActivity < oneHourAgo) {
      conversationHistory.delete(phone);
      console.log(`Cleared conversation history for ${phone}`);
    }
  }
}, 10 * 60 * 1000); // Check every 10 minutes

app.post("/webhook", async (req, res) => {
  const incomingMsg = req.body.Body || req.body.body || "";
  const from = req.body.From || req.body.from || "";
  const to = req.body.To || req.body.to || "";

  console.log("Message from WhatsApp:", incomingMsg, "from:", from);

  // Send immediate acknowledgment to Twilio
  res.type("text/xml");
  res.send(`<Response></Response>`);

  // Process asynchronously with 5-7 second random delay
  const randomDelay = Math.floor(Math.random() * (7000 - 5000 + 1)) + 5000;
  setTimeout(async () => {
    try {
      // Get user credentials based on store phone number (Twilio 'To')
      const userCreds = await getUserByPhoneNumber(to);
      // Load per-user business settings from Postgres (fallback to global defaults)
      const bizSettings = (userCreds?.userId ? await pgGetBusinessSettings(userCreds.userId) : null) || businessSettings;
      
      // Load user-specific booking settings and services
      let userBookingsEnabled = false;
      let userServices = [];
      let userBookings = [];
      let userPaymentItems = [];
      let userPaymentsEnabled = false;
      
      if (userCreds?.userId) {
        try {
          const bookingSettings = await getBookingSettings(userCreds.userId);
          userBookingsEnabled = bookingSettings.enabled || false;
          userServices = await listServices(userCreds.userId);
          userBookings = await listBookings(userCreds.userId);
          
          // Load payment items if payments are enabled
          userPaymentsEnabled = userCreds?.paymentsEnabled || false;
          if (userPaymentsEnabled) {
            userPaymentItems = await getPaymentItemsByUserId(userCreds.userId);
            userPaymentItems = userPaymentItems.filter(item => item.isActive);
          }
        } catch (e) {
          console.warn('[webhook] Failed to load booking/payment settings:', e.message);
        }
      }
      
      // Fall back to environment variables if no user-specific credentials
      const USER_CLAUDE_API_KEY = userCreds?.claudeApiKey || CLAUDE_API_KEY;
      const USER_TWILIO_ACCOUNT_SID = userCreds?.twilioAccountSid || TWILIO_ACCOUNT_SID;
      const USER_TWILIO_AUTH_TOKEN = userCreds?.twilioAuthToken || TWILIO_AUTH_TOKEN;
      const USER_TWILIO_PHONE_NUMBER = userCreds?.twilioPhoneNumber || TWILIO_PHONE_NUMBER;
      const USER_BUSINESS_CONTEXT = userCreds?.businessContext || BUSINESS_CONTEXT;
      const USER_BYPASS_CLAUDE = userCreds?.bypassClaude ?? BYPASS_CLAUDE;

      // Initialize user-specific Twilio client if credentials available
      let userTwilioClient = null;
      if (USER_TWILIO_ACCOUNT_SID && USER_TWILIO_AUTH_TOKEN) {
        userTwilioClient = Twilio(USER_TWILIO_ACCOUNT_SID, USER_TWILIO_AUTH_TOKEN);
      }

      console.log(`[webhook] Using ${userCreds ? 'user-specific' : 'default'} credentials for ${from}`);

      // Check conversation limit before creating new conversation
      if (!conversationHistory.has(from) && userCreds?.userId) {
        const user = await getUserById(userCreds.userId);
        const userLimits = user?.limits || { maxConversations: 100 };
        const existingConversations = await listConversations(userCreds.userId);
        
        if (existingConversations.length >= userLimits.maxConversations) {
          console.log(`[webhook] Conversation limit reached for user ${userCreds.userId}`);
          // Send a message to the customer that the business has reached their limit
          if (userTwilioClient && USER_TWILIO_PHONE_NUMBER) {
            const fromNumber = USER_TWILIO_PHONE_NUMBER.startsWith('whatsapp:') ? USER_TWILIO_PHONE_NUMBER : `whatsapp:${USER_TWILIO_PHONE_NUMBER}`;
            const toNumber = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
            await userTwilioClient.messages.create({
              body: "We're currently at capacity and unable to start new conversations. Please try again later or contact us through another channel.",
              from: fromNumber,
              to: toNumber,
            });
          }
          return;
        }
      }
      
      // Get or create conversation history for this customer phone number
      if (!conversationHistory.has(from)) {
        conversationHistory.set(from, {
          messages: [],
          lastActivity: Date.now(),
          storeNumber: to,
          userId: userCreds?.userId || null,
        });
      }
      
      const conversation = conversationHistory.get(from);
      conversation.storeNumber = to;
      conversation.userId = userCreds?.userId || conversation.userId || null;
      conversation.lastActivity = Date.now();
      
      // Add user message to history
      conversation.messages.push({
        role: "user",
        content: incomingMsg,
      });
      // Persist conversation and message in Postgres if user is identified
      if (userCreds?.userId) {
        try {
          const convId = await upsertConversation(userCreds.userId, to, from);
          await addMessage(convId, 'user', incomingMsg);
        } catch (e) {
          console.warn('[webhook] Failed to persist user message:', e.message);
        }
      }
      
      // Keep only last 10 messages (5 exchanges) to avoid token limits
      if (conversation.messages.length > 10) {
        conversation.messages = conversation.messages.slice(-10);
      }

      let messageToSend = "";

      // Check for cancel request (English and Swahili)
      const cancelKeywords = ['cancel', 'stop', 'ghairi', 'sitisha', 'acha'];
      const isCancelRequest = cancelKeywords.some(keyword => 
        incomingMsg.toLowerCase().includes(keyword)
      );

      // Check for booking change/reschedule requests (English and Swahili)
      const changeKeywords = ['change', 'reschedule', 'modify', 'edit', 'update', 'badilisha', 'ahirisha'];
      const isChangeRequest = changeKeywords.some(keyword => 
        incomingMsg.toLowerCase().includes(keyword)
      ) && (incomingMsg.toLowerCase().includes('booking') || incomingMsg.toLowerCase().includes('appointment') || incomingMsg.toLowerCase().includes('nafasi'));

      // Check if user is asking about bookings or is in booking flow
      const bookingKeywords = ['book', 'booking', 'reserve', 'reservation', 'appointment', 'schedule', 'available'];
      const isBookingInquiry = bookingKeywords.some(keyword => 
        incomingMsg.toLowerCase().includes(keyword)
      );

      // Check if user is in active booking flow
      const userState = conversation.bookingState || null;

      // Handle cancel request during booking flow
      if (isCancelRequest && userState) {
        const lang = userState.language || conversation.language || 'en';
        messageToSend = lang === 'sw'
          ? "Sawa, nimeghairi mchakato wa booking. Je, kuna kitu kingine ninachoweza kukusaidia?"
          : "Okay, I've cancelled the booking process. Is there anything else I can help you with?";
        delete conversation.bookingState;
      } else if (isChangeRequest && conversation.lastBookingId) {
        // Handle booking change request
        const existingBooking = userBookings.find(b => b.id === conversation.lastBookingId);
        
        if (existingBooking && existingBooking.status === 'pending') {
          const service = userServices.find(s => s.id === existingBooking.serviceId);
          
          if (service) {
            // Use existing conversation language or detect from current message
            let lang = conversation.language || 'en';
            if (!conversation.language) {
              const swahiliKeywords = ['ndiyo', 'ndio', 'nafasi', 'naomba', 'nataka', 'je', 'sawa', 'ahsante', 'tafadhali', 'habari', 'badilisha', 'ahirisha'];
              const isSwahili = swahiliKeywords.some(word => incomingMsg.toLowerCase().includes(word));
              lang = isSwahili ? 'sw' : 'en';
              conversation.language = lang;
            }
            
            conversation.bookingState = {
              step: 'awaiting_edit_choice',
              serviceId: service.id,
              serviceName: service.name,
              price: service.price,
              duration: service.duration,
              availableDates: service.availableDates || [],
              editingBookingId: existingBooking.id,
              currentName: existingBooking.customerName,
              language: lang,
            };
            
            if (lang === 'sw') {
              messageToSend = `Naweza kukusaidia kubadilisha nafasi yako ya *${service.name}*.\n\n` +
                `📋 Nafasi yako ya sasa:\n` +
                `👤 Jina: ${existingBooking.customerName}\n` +
                `📅 Tarehe: ${new Date(existingBooking.dateBooked).toLocaleDateString()}\n` +
                `⏰ Saa: ${existingBooking.timeSlot}\n\n` +
                `Unataka kubadilisha nini?\n` +
                `Jibu kwa:\n` +
                `1️⃣ Jina\n` +
                `2️⃣ Tarehe na Saa\n` +
                `3️⃣ Vyote (Jina na Tarehe/Saa)`;  
            } else {
              messageToSend = `I can help you change your booking for *${service.name}*.\n\n` +
                `📋 Your current booking:\n` +
                `👤 Name: ${existingBooking.customerName}\n` +
                `📅 Date: ${new Date(existingBooking.dateBooked).toLocaleDateString()}\n` +
                `⏰ Time: ${existingBooking.timeSlot}\n\n` +
                `What would you like to change?\n` +
                `Reply with:\n` +
                `1️⃣ Name\n` +
                `2️⃣ Date and Time\n` +
                `3️⃣ Both (Name and Date/Time)`;  
            }
          } else {
            const lang = conversation.language || 'en';
            messageToSend = lang === 'sw' 
              ? "Samahani, sikuweza kupata huduma ya nafasi yako. Tafadhali wasiliana nasi moja kwa moja."
              : "Sorry, I couldn't find the service for your booking. Please contact us directly.";
          }
        } else if (existingBooking) {
          const lang = conversation.language || 'en';
          messageToSend = lang === 'sw'
            ? `Nafasi yako tayari ni ${existingBooking.status}. Tafadhali wasiliana nasi moja kwa moja kubadilisha.`
            : `Your booking is already ${existingBooking.status}. Please contact us directly to make changes.`;
        } else {
          const lang = conversation.language || 'en';
          messageToSend = lang === 'sw'
            ? "Sikuweza kupata nafasi yako ya hivi karibuni. Tafadhali toa nambari ya uhakikisho au fanya nafasi mpya."
            : "I couldn't find your recent booking. Please provide your booking ID or make a new booking.";
        }
      } else if (userState || isBookingInquiry) {
        // User is in booking flow or asking about bookings
        
        if (!userState && isBookingInquiry) {
          // Use existing conversation language or detect from current message
          if (!conversation.language) {
            const swahiliKeywords = ['ndiyo', 'ndio', 'nafasi', 'naomba', 'nataka', 'je', 'sawa', 'ahsante', 'tafadhali', 'habari'];
            const isSwahili = swahiliKeywords.some(word => incomingMsg.toLowerCase().includes(word));
            conversation.language = isSwahili ? 'sw' : 'en';
          }
          const isSwahili = conversation.language === 'sw';
          
          // Initial inquiry - check if bookings are available
          if (userBookingsEnabled && userServices.length > 0) {
            let servicesText = isSwahili 
              ? "Ndiyo, unaweza kufanya booking! 📅\n\nHizi ndizo huduma zetu:\n\n"
              : "Yes, booking is available! 📅\n\nHere are our services:\n\n";
            
            userServices.forEach((service, index) => {
              servicesText += `${index + 1}. *${service.name}*\n`;
              servicesText += `   💰 TZS ${service.price.toLocaleString()}\n`;
              servicesText += `   ⏱️ ${isSwahili ? 'Dakika' : 'minutes'} ${service.duration}\n`;
              servicesText += `   📝 ${service.description}\n`;
              if (service.availableDates && service.availableDates.length > 0) {
                const datesList = service.availableDates.slice(0, 3).map(d => {
                  const date = new Date(d);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }).join(', ');
                servicesText += `   📆 ${isSwahili ? 'Inapatikana' : 'Available'}: ${datesList}${service.availableDates.length > 3 ? '...' : ''}\n`;
              }
              servicesText += '\n';
            });
            servicesText += isSwahili 
              ? "Tafadhali jibu kwa namba ya huduma unayotaka."
              : "Please reply with the number of the service you want to book.";
            
            conversation.bookingState = { step: 'awaiting_service', language: conversation.language };
            messageToSend = servicesText;
          } else {
            if (isSwahili) {
              messageToSend = userBookingsEnabled 
                ? "Samahani, hakuna huduma za booking kwa sasa. Tafadhali rudi baadaye." 
                : "Samahani, booking haipatikani kwa sasa. Tafadhali wasiliana nasi moja kwa moja.";
            } else {
              messageToSend = userBookingsEnabled 
                ? "Sorry, we don't have any services available for booking at the moment. Please check back later." 
                : "Sorry, booking is currently not available. Please contact us directly for assistance.";
            }
          }
        } else if (userState && userState.step === 'awaiting_service') {
          // User is selecting a service
          const serviceNum = parseInt(incomingMsg.trim());
          
          if (serviceNum > 0 && serviceNum <= userServices.length) {
            const selectedService = userServices[serviceNum - 1];
            
            // Check if service has available dates
            if (!selectedService.availableDates || selectedService.availableDates.length === 0) {
              const lang = userState.language || 'en';
              messageToSend = lang === 'sw'
                ? `Samahani, ${selectedService.name} haina tarehe zinazopatikana kwa sasa. Tafadhali chagua huduma nyingine au wasiliana nasi moja kwa moja.`
                : `Sorry, ${selectedService.name} has no available dates at the moment. Please choose another service or contact us directly.`;
            } else {
              const lang = userState.language || 'en';
              conversation.bookingState = {
                step: 'awaiting_name',
                serviceId: selectedService.id,
                serviceName: selectedService.name,
                price: selectedService.price,
                duration: selectedService.duration,
                availableDates: selectedService.availableDates,
                language: lang,
              };
              
              messageToSend = lang === 'sw'
                ? `Vizuri! Umechagua *${selectedService.name}*.\n\nTafadhali niambie jina lako.`
                : `Great! You selected *${selectedService.name}*.\n\nPlease tell me your name.`;
            }
          } else {
            const lang = userState.language || conversation.language || 'en';
            messageToSend = lang === 'sw'
              ? "Tafadhali jibu kwa namba sahihi ya huduma kutoka kwenye orodha hapo juu."
              : "Please reply with a valid service number from the list above.";
          }
        } else if (userState && userState.step === 'awaiting_edit_choice') {
          // User is choosing what to edit in their booking
          const choice = incomingMsg.trim();
          const lang = userState.language || 'en';
          
          if (choice === '1') {
            // Edit name only
            conversation.bookingState = {
              ...userState,
              step: 'awaiting_edit_name',
            };
            
            messageToSend = lang === 'sw'
              ? `Tafadhali niambie jina lako jipya.`
              : `Please tell me your new name.`;
          } else if (choice === '2') {
            // Edit date and time only
            conversation.bookingState = {
              ...userState,
              step: 'awaiting_time',
            };
            
            messageToSend = lang === 'sw'
              ? `Tafadhali niambie tarehe na saa mpya unayopendelea.\n\nKwa mfano: "Januari 5 saa 2:00 PM"`
              : `Please tell me your new preferred date and time.\n\nFor example: "January 5 at 2:00 PM"`;
          } else if (choice === '3') {
            // Edit both
            conversation.bookingState = {
              ...userState,
              step: 'awaiting_edit_name',
              editBoth: true,
            };
            
            messageToSend = lang === 'sw'
              ? `Sawa! Kwanza, niambie jina lako jipya.`
              : `Okay! First, please tell me your new name.`;
          } else {
            messageToSend = lang === 'sw'
              ? "Tafadhali chagua 1, 2, au 3."
              : "Please choose 1, 2, or 3.";
          }
        } else if (userState && userState.step === 'awaiting_edit_name') {
          // User is providing new name for edit
          const customerName = incomingMsg.trim();
          const lang = userState.language || 'en';
          
          if (customerName.length > 1 && customerName.length < 50) {
            if (userState.editBoth) {
              // After name, ask for date/time
              conversation.bookingState = {
                ...userState,
                step: 'awaiting_time',
                customerName: customerName,
                editBoth: false,
              };
              
              messageToSend = lang === 'sw'
                ? `Asante ${customerName}! Sasa niambie tarehe na saa mpya.\n\nKwa mfano: "Januari 5 saa 2:00 PM"`
                : `Thank you ${customerName}! Now please tell me your new date and time.\n\nFor example: "January 5 at 2:00 PM"`;
            } else {
              // Name only edit - update booking immediately
              const bookingIndex = userBookings.findIndex(b => b.id === userState.editingBookingId);
              
              if (bookingIndex >= 0 && userCreds?.userId) {
                const oldBooking = userBookings[bookingIndex];
                
                // Update in database
                try {
                  await updateBooking(userCreds.userId, userState.editingBookingId, {
                    customerName: customerName,
                    notes: (oldBooking.notes || '') + ' | Name updated via WhatsApp'
                  });
                  
                  console.log('✅ Booking name updated in database:', userState.editingBookingId);
                } catch (e) {
                  console.error('[webhook] Failed to update booking name:', e);
                }
                
                // Update conversation customer name too
                conversation.customerName = customerName;
                
                messageToSend = lang === 'sw'
                  ? `✅ *Jina Limebadilishwa!*\n\n🆔 Nambari ya Uhakikisho: ${oldBooking.id}\n👤 Jina Jipya: ${customerName}\n\nNafasi yako imesasishwa kikamilifu!`
                  : `✅ *Name Updated!*\n\n🆔 Booking ID: ${oldBooking.id}\n👤 New Name: ${customerName}\n\nYour booking has been successfully updated!`;
                
                delete conversation.bookingState;
              } else {
                messageToSend = lang === 'sw'
                  ? "Samahani, sikuweza kupata nafasi yako. Tafadhali jaribu tena."
                  : "Sorry, I couldn't find your booking. Please try again.";
                delete conversation.bookingState;
              }
            }
          } else {
            messageToSend = lang === 'sw'
              ? "Tafadhali niambie jina lako sahihi."
              : "Please provide a valid name.";
          }
        } else if (userState && userState.step === 'awaiting_name') {
          // User is providing their name
          const customerName = incomingMsg.trim();
          const lang = userState.language || 'en';
          
          if (customerName.length > 1 && customerName.length < 50) {
            conversation.bookingState = {
              ...userState,
              step: 'awaiting_time',
              customerName: customerName,
            };
            
            // Store the customer name in conversation for display
            conversation.customerName = customerName;
            
            messageToSend = lang === 'sw'
              ? `Asante ${customerName}! Sasa niambie tarehe na saa unayotaka.\n\nMfano: "5 Januari saa 10:00 AM" au "2025-01-05 10:00 AM"`
              : `Thank you ${customerName}! Now please tell me your preferred date and time.\n\nFor example: "January 5 at 10:00 AM" or "2025-01-05 10:00 AM"`;
          } else {
            messageToSend = lang === 'sw'
              ? "Tafadhali niambie jina lako sahihi."
              : "Please provide your name.";
          }
        } else if (userState && userState.step === 'awaiting_time') {
          // User is providing date and time
          const userInput = incomingMsg.toLowerCase();
          
          // Try to parse the date and time from user input
          let selectedDate = null;
          let selectedTime = null;
          let foundDateMatch = false;
          let foundTimeMatch = false;
          
          // Enhanced date parsing - try multiple formats
          for (const availDate of userState.availableDates) {
            const dateObj = new Date(availDate);
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth();
            const day = dateObj.getDate();
            
            // Create various date format strings to match against
            const formats = [
              dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }), // "January 5"
              dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), // "January 5, 2025"
              dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), // "Jan 5"
              dateObj.toISOString().split('T')[0], // "2025-01-05"
              `${month + 1}/${day}`, // "1/5"
              `${month + 1}/${day}/${year}`, // "1/5/2025"
              `${day}/${month + 1}`, // "5/1"
              `${day}-${month + 1}`, // "5-1"
              dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), // "Monday, January 5"
            ];
            
            // Check if any format matches the user input
            for (const format of formats) {
              if (userInput.includes(format.toLowerCase())) {
                selectedDate = availDate;
                foundDateMatch = true;
                break;
              }
            }
            
            if (foundDateMatch) break;
            
            // Try to match just the day number if month/year context exists
            const dayPattern = new RegExp(`\\b${day}\\b`);
            const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
            const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
            
            if (dayPattern.test(userInput) && (userInput.includes(monthName) || userInput.includes(monthShort))) {
              selectedDate = availDate;
              foundDateMatch = true;
              break;
            }
          }
          
          // Enhanced time parsing - try multiple formats
          const timePatterns = [
            /(\d{1,2}):(\d{2})\s*(am|pm)/i,     // "10:00 AM"
            /(\d{1,2}):(\d{2})\s*([ap]m)/i,     // "10:00AM"
            /(\d{1,2})\s*(am|pm)/i,             // "10 AM"
            /(\d{1,2}):(\d{2})/,                // "10:00" (24-hour)
            /(\d{1,2})\s*([ap]\.?m\.?)/i,      // "10am" or "10 a.m."
          ];
          
          for (const pattern of timePatterns) {
            const timeMatch = incomingMsg.match(pattern);
            if (timeMatch) {
              foundTimeMatch = true;
              let hour = parseInt(timeMatch[1]);
              const minute = timeMatch[2] || '00';
              const meridiem = timeMatch[3] ? timeMatch[3].toUpperCase().replace(/\./g, '') : null;
              
              // Handle 12-hour format
              if (meridiem) {
                if (meridiem.startsWith('P') && hour < 12) hour += 12;
                if (meridiem.startsWith('A') && hour === 12) hour = 0;
                selectedTime = `${hour > 12 ? hour - 12 : hour || 12}:${minute} ${meridiem.startsWith('P') ? 'PM' : 'AM'}`;
              } else {
                // 24-hour format or assume based on hour
                if (hour >= 12) {
                  selectedTime = `${hour > 12 ? hour - 12 : 12}:${minute} PM`;
                } else {
                  selectedTime = `${hour || 12}:${minute} AM`;
                }
              }
              break;
            }
          }
          
          // If we couldn't parse, provide helpful response with available options
          if (!foundDateMatch && !foundTimeMatch) {
            const lang = userState.language || 'en';
            const datesList = userState.availableDates.map((d, i) => {
              const date = new Date(d);
              return `${i + 1}. ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}`;
            }).join('\n');
            
            const selectedService = userServices.find(s => s.id === userState.serviceId);
            const timesList = selectedService && selectedService.timeSlots && selectedService.timeSlots.length > 0
              ? selectedService.timeSlots.slice(0, 8).join(', ') + (selectedService.timeSlots.length > 8 ? '...' : '')
              : '';
            
            if (lang === 'sw') {
              messageToSend = `Samahani, sikuelewa tarehe na saa. Tafadhali toa katika muundo ulio wazi.\n\n📅 *Tarehe Zinazopatikana:*\n${datesList}${timesList ? `\n\n⏰ *Masaa Yanayopatikana:*\n${timesList}` : ''}\n\n*Mfano:* "Januari 5 saa 10:00 AM" au "2025-01-05 10:00 AM"`;
            } else {
              messageToSend = `I couldn't understand the date and time. Please provide them in a clear format.\n\n📅 *Available Dates:*\n${datesList}${timesList ? `\n\n⏰ *Available Times:*\n${timesList}` : ''}\n\n*Example:* "January 5 at 10:00 AM" or "2025-01-05 10:00 AM"`;
            }
          } else if (!foundDateMatch) {
            const lang = userState.language || 'en';
            const datesList = userState.availableDates.map((d, i) => {
              const date = new Date(d);
              return `${i + 1}. ${date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}`;
            }).join('\n');
            
            if (lang === 'sw') {
              messageToSend = `Nimepata saa yako (${selectedTime || 'saa uliyoomba'}) lakini sikuelewa tarehe.\n\n📅 *Tafadhali chagua kutoka kwa tarehe zinazopatikana:*\n\n${datesList}\n\n*Jibu tena kwa tarehe na saa, mfano:* "Januari 5 saa ${selectedTime || '10:00 AM'}"`;  
            } else {
              messageToSend = `I found your time (${selectedTime || 'your requested time'}) but couldn't understand the date.\n\n📅 *Please choose from our available dates:*\n\n${datesList}\n\n*Reply with the date and time again, for example:* "January 5 at ${selectedTime || '10:00 AM'}"`;  
            }
          } else if (!foundTimeMatch) {
            const lang = userState.language || 'en';
            const selectedService = userServices.find(s => s.id === userState.serviceId);
            const timesList = selectedService && selectedService.timeSlots && selectedService.timeSlots.length > 0
              ? selectedService.timeSlots.slice(0, 12).join(', ')
              : '9:00 AM, 10:00 AM, 11:00 AM, 12:00 PM, 1:00 PM, 2:00 PM, 3:00 PM, 4:00 PM, 5:00 PM';
            
            const dateFormatted = new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            
            if (lang === 'sw') {
              messageToSend = `Nimepata tarehe yako (${dateFormatted}) lakini sikuelewa saa.\n\n⏰ *Masaa Yanayopatikana:*\n${timesList}\n\n*Tafadhali jibu kwa tarehe na saa kamili, mfano:* "${dateFormatted} saa 10:00 AM"`;  
            } else {
              messageToSend = `I found your date (${dateFormatted}) but couldn't understand the time.\n\n⏰ *Available Times:*\n${timesList}\n\n*Please reply with the complete date and time, for example:* "${dateFormatted} at 10:00 AM"`;  
            }
          } else if (selectedDate && selectedTime) {
            // Get the selected service to validate time slots
            const selectedService = userServices.find(s => s.id === userState.serviceId);
            
            // Validate time slot availability
            if (selectedService && selectedService.timeSlots && selectedService.timeSlots.length > 0) {
              const timeAvailable = selectedService.timeSlots.some(slot => {
                // Normalize both times for comparison
                const normalizeTime = (time) => time.replace(/\s/g, '').toUpperCase();
                return normalizeTime(slot) === normalizeTime(selectedTime);
              });
              
              if (!timeAvailable) {
                const lang = userState.language || 'en';
                const availableTimes = selectedService.timeSlots.slice(0, 8).join(', ');
                const dateFormatted = new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                
                messageToSend = lang === 'sw'
                  ? `Samahani, saa ${selectedTime} haipatikani kwa ${dateFormatted}.\n\n⏰ *Masaa Yanayopatikana:*\n${availableTimes}${selectedService.timeSlots.length > 8 ? ' na zaidi' : ''}\n\n*Tafadhali chagua saa inayopatikana.*`
                  : `Sorry, ${selectedTime} is not available for ${dateFormatted}.\n\n⏰ *Available Times:*\n${availableTimes}${selectedService.timeSlots.length > 8 ? ' and more' : ''}\n\n*Please reply with your date and preferred time from the list above.*`;
                // Don't delete booking state, let them try again
              }
            }
            
            // Only proceed with booking if time is valid or no time slots configured
            const shouldProceed = !messageToSend; // If messageToSend was set, it means time was invalid
            
            if (shouldProceed && selectedDate && selectedTime) {
              // Check if this is an edit or new booking
              if (userState.editingBookingId) {
                // Update existing booking (date/time and potentially name)
                const bookingIndex = userBookings.findIndex(b => b.id === userState.editingBookingId);
                
                if (bookingIndex >= 0 && userCreds?.userId) {
                  const oldBooking = userBookings[bookingIndex];
                  
                  // Update in database
                  try {
                    await updateBooking(userCreds.userId, userState.editingBookingId, {
                      dateBooked: selectedDate,
                      timeSlot: selectedTime,
                      customerName: userState.customerName || oldBooking.customerName,
                      notes: (oldBooking.notes || '') + ' | Updated via WhatsApp'
                    });
                    
                    console.log('✅ Booking updated in database:', userState.editingBookingId);
                  } catch (e) {
                    console.error('[webhook] Failed to update booking:', e);
                  }
                  
                  // Update conversation customer name if changed
                  if (userState.customerName) {
                    conversation.customerName = userState.customerName;
                  }
                  
                  const dateFormatted = new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                  
                  const lang = userState.language || 'en';
                  
                  const updatedCustomerName = userState.customerName || oldBooking.customerName;
                  
                  if (lang === 'sw') {
                    messageToSend = `✅ *Nafasi Imebadilishwa!*\n\n` +
                      `🆔 Nambari ya Uhakikisho: ${oldBooking.id}\n` +
                      `👤 Jina: ${updatedCustomerName}\n` +
                      `📋 Huduma: ${oldBooking.serviceName}\n` +
                      `📅 Tarehe Mpya: ${dateFormatted}\n` +
                      `⏰ Saa Mpya: ${selectedTime}\n` +
                      `💰 Bei: TZS ${oldBooking.price.toLocaleString()}\n\n` +
                      `Nafasi yako imebadilishwa kikamilifu!`;
                  } else {
                    messageToSend = `✅ *Booking Updated!*\n\n` +
                      `🆔 Booking ID: ${oldBooking.id}\n` +
                      `👤 Name: ${updatedCustomerName}\n` +
                      `📋 Service: ${oldBooking.serviceName}\n` +
                      `📅 New Date: ${dateFormatted}\n` +
                      `⏰ New Time: ${selectedTime}\n` +
                      `💰 Price: TZS ${oldBooking.price.toLocaleString()}\n\n` +
                      `Your booking has been successfully updated!`;
                  }
                  
                  delete conversation.bookingState;
                  
                  delete conversation.bookingState;
                } else {
                  const lang = userState.language || 'en';
                  messageToSend = lang === 'sw' 
                    ? "Samahani, sikuweza kupata nafasi yako. Tafadhali jaribu tena au wasiliana nasi moja kwa moja."
                    : "Sorry, I couldn't find your booking. Please try again or contact us directly.";
                  delete conversation.bookingState;
                }
              } else {
                // Create new booking - NAME IS REQUIRED
                if (!userState.customerName) {
                  // This should not happen if flow is correct, but safety check
                  const lang = userState.language || 'en';
                  messageToSend = lang === 'sw'
                    ? "Tafadhali niambie jina lako kwanza."
                    : "Please provide your name first.";
                  conversation.bookingState = {
                    ...userState,
                    step: 'awaiting_name',
                  };
                  return; // Exit early to request name
                }
                
                const customerName = userState.customerName;
                
                const bookingData = {
                  customerName: customerName,
                  customerPhone: from.replace('whatsapp:', ''),
                  serviceId: userState.serviceId,
                  serviceName: userState.serviceName,
                  dateBooked: selectedDate,
                  timeSlot: selectedTime,
                  price: userState.price,
                  status: 'pending',
                  notes: 'Booked via WhatsApp',
                };
                
                // Save booking to database
                let booking;
                if (userCreds?.userId) {
                  try {
                    booking = await createBooking(userCreds.userId, bookingData);
                    console.log('✅ Booking created in database:', booking.id);
                  } catch (e) {
                    console.error('[webhook] Failed to create booking:', e);
                    messageToSend = lang === 'sw' 
                      ? "Samahani, kuna tatizo katika kuhifadhi nafasi yako. Tafadhali jaribu tena."
                      : "Sorry, there was an error saving your booking. Please try again.";
                    delete conversation.bookingState;
                    return;
                  }
                } else {
                  // Fallback: create in-memory booking if no user
                  booking = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...bookingData,
                    createdAt: new Date().toISOString(),
                  };
                  bookings.push(booking);
                  console.log('✅ Booking created (in-memory):', booking);
                }
                
                // Store booking ID in conversation for potential edits
                conversation.lastBookingId = booking.id;
                
                const dateFormatted = new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
                
                const lang = userState.language || 'en';
                
                if (lang === 'sw') {
                  messageToSend = `✅ *Uhakikisho wa Nafasi!*\n\n` +
                    `👤 Jina: ${customerName}\n` +
                    `🆔 Nambari ya Uhakikisho: ${booking.id}\n` +
                    `📋 Huduma: ${booking.serviceName}\n` +
                    `📅 Tarehe: ${dateFormatted}\n` +
                    `⏰ Saa: ${booking.timeSlot}\n` +
                    `💰 Bei: TZS ${booking.price.toLocaleString()}\n` +
                    `⏱️ Muda: Dakika ${userState.duration}\n\n` +
                    `Tunatarajia kukuona! Utapokea ujumbe wa uthibitisho hivi karibuni.\n\n` +
                    `Kubadilisha nafasi yako, tuma "badilisha nafasi" au "ahirisha".`;
                } else {
                  messageToSend = `✅ *Booking Confirmed!*\n\n` +
                    `👤 Name: ${customerName}\n` +
                    `🆔 Booking ID: ${booking.id}\n` +
                    `📋 Service: ${booking.serviceName}\n` +
                    `📅 Date: ${dateFormatted}\n` +
                    `⏰ Time: ${booking.timeSlot}\n` +
                    `💰 Price: TZS ${booking.price.toLocaleString()}\n` +
                    `⏱️ Duration: ${userState.duration} minutes\n\n` +
                    `We look forward to seeing you! You will receive a confirmation shortly.\n\n` +
                    `To change your booking, reply with "change booking" or "reschedule".`;
                }
                
                delete conversation.bookingState;
              }
            }
          }
        }
      } else {
        // Check for payment items keywords
        const paymentKeywords = ['pay', 'payment', 'lipa', 'malipo', 'order', 'order item', 'nunua', 'buy'];
        const isPaymentInquiry = paymentKeywords.some(keyword => 
          incomingMsg.toLowerCase().includes(keyword)
        );
        
        const paymentState = conversation.paymentState || null;
        let paymentHandled = false;
        
        // Handle cancel during payment flow
        if (isCancelRequest && paymentState) {
          const lang = paymentState.language || conversation.language || 'en';
          messageToSend = lang === 'sw'
            ? "Sawa, nimeghairi mchakato wa malipo. Je, kuna kitu kingine ninachoweza kukusaidia?"
            : "Okay, I've cancelled the payment process. Is there anything else I can help you with?";
          delete conversation.paymentState;
          paymentHandled = true;
        } else if (paymentState || isPaymentInquiry) {
          // Use already loaded userPaymentItems and userPaymentsEnabled
          
          if (!paymentState && isPaymentInquiry) {
            // Initial payment inquiry
            if (!conversation.language) {
              const swahiliKeywords = ['ndiyo', 'ndio', 'nafasi', 'naomba', 'nataka', 'je', 'sawa', 'ahsante', 'tafadhali', 'habari', 'lipa', 'malipo', 'nunua'];
              const isSwahili = swahiliKeywords.some(word => incomingMsg.toLowerCase().includes(word));
              conversation.language = isSwahili ? 'sw' : 'en';
            }
            const lang = conversation.language || 'en';
            
            if (userPaymentsEnabled && userPaymentItems.length > 0) {
              let itemsText = lang === 'sw'
                ? "Ndiyo, unaweza kulipa kwa huduma zetu! 💳\n\nHizi ndizo chaguzi zinazopatikana:\n\n"
                : "Yes, you can pay for our services! 💳\n\nHere are the available payment items:\n\n";
              
              userPaymentItems.forEach((item, index) => {
                itemsText += `${index + 1}. *${item.name}*\n`;
                itemsText += `   💰 ${item.currency} ${item.amount.toLocaleString()}\n`;
                itemsText += `   📝 ${item.description || 'No description'}\n\n`;
              });
              
              itemsText += lang === 'sw'
                ? "Tafadhali jibu kwa namba ya kipengele unachotaka kulipia.\n\nAu tuma *link* kupokea link ya malipo moja kwa moja."
                : "Please reply with the number of the item you want to pay for.\n\nOr send *link* to receive a direct payment link.";
              
              conversation.paymentState = { step: 'awaiting_item', language: lang };
              messageToSend = itemsText;
              paymentHandled = true;
            } else {
              messageToSend = lang === 'sw'
                ? "Samahani, hakuna vipengele vya malipo vinavyopatikana kwa sasa. Tafadhali wasiliana nasi moja kwa moja."
                : "Sorry, there are no payment items available at the moment. Please contact us directly for assistance.";
              paymentHandled = true;
            }
          } else if (paymentState && paymentState.step === 'awaiting_item') {
            const lang = paymentState.language || 'en';
            
            if (incomingMsg.toLowerCase() === 'link') {
              // Send direct payment page link
              const storeSettings = await pgGetStoreSettings(userCreds.userId);
              if (storeSettings && storeSettings.storeName) {
                const paymentUrl = `${process.env.VITE_API_URL || 'http://localhost:5173'}/shop/${storeSettings.storeName}/payments`;
                messageToSend = lang === 'sw'
                  ? `Bofya link hii kuchagua na kulipa: ${paymentUrl}`
                  : `Click this link to select and pay: ${paymentUrl}`;
              } else {
                messageToSend = lang === 'sw'
                  ? "Samahani, sikuweza kupata link ya duka. Tafadhali wasiliana nasi."
                  : "Sorry, I couldn't find the store link. Please contact us directly.";
              }
              delete conversation.paymentState;
              paymentHandled = true;
            } else {
              const itemNum = parseInt(incomingMsg.trim());
              
              if (itemNum > 0 && itemNum <= userPaymentItems.length) {
                const selectedItem = userPaymentItems[itemNum - 1];
                
                conversation.paymentState = {
                  step: 'awaiting_customer_details',
                  itemId: selectedItem.id,
                  itemName: selectedItem.name,
                  amount: selectedItem.amount,
                  currency: selectedItem.currency,
                  description: selectedItem.description,
                  language: lang,
                };
                
                messageToSend = lang === 'sw'
                  ? `Vizuri! Umechagua *${selectedItem.name}* kwa ${selectedItem.currency} ${selectedItem.amount.toLocaleString()}.\n\nTafadhali toa:\n1️⃣ Jina lako kamili\n2️⃣ Nambari ya simu (k.m. +255...)\n3️⃣ Email (hiari)`
                  : `Great! You selected *${selectedItem.name}* for ${selectedItem.currency} ${selectedItem.amount.toLocaleString()}.\n\nPlease provide:\n1️⃣ Your full name\n2️⃣ Phone number (e.g., +255...)\n3️⃣ Email (optional)`;
                paymentHandled = true;
              } else {
                messageToSend = lang === 'sw'
                  ? "Tafadhali jibu kwa namba sahihi ya kipengele kutoka kwenye orodha hapo juu."
                  : "Please reply with a valid item number from the list above.";
                paymentHandled = true;
              }
            }
          } else if (paymentState && paymentState.step === 'awaiting_customer_details') {
            const lang = paymentState.language || 'en';
            
            // Parse customer details (expecting: name, phone, email)
            const details = incomingMsg.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
            
            if (details.length < 2) {
              messageToSend = lang === 'sw'
                ? "Tafadhali toa jina na nambari ya simu kwa mpangilio huu:\nJina, Nambari ya Simu, Email (hiari)"
                : "Please provide name and phone number in this format:\nName, Phone Number, Email (optional)";
              paymentHandled = true;
            } else {
              const customerName = details[0];
              const customerPhone = details[1].startsWith('+') ? details[1] : `+${details[1]}`;
              const customerEmail = details[2] || '';
              
              try {
                // Create payment via Snippe
                const paymentRes = await fetch(`${process.env.VITE_API_URL || 'http://localhost:3000'}/api/payment/item/${paymentState.itemId}/pay`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userCreds.userId,
                  },
                  body: JSON.stringify({
                    paymentType: 'mobile',
                    customerPhone,
                    customerEmail,
                    customerName,
                  }),
                });
                
                const paymentData = await paymentRes.json();
                
                if (paymentRes.ok && paymentData.success) {
                  let confirmMsg = lang === 'sw'
                    ? `✅ *Malipo Yameanzishwa!*\n\n` +
                      `📦 Kipengele: ${paymentState.itemName}\n` +
                      `💰 Kiasi: ${paymentState.currency} ${paymentState.amount.toLocaleString()}\n` +
                      `👤 Jina: ${customerName}\n` +
                      `📱 Simu: ${customerPhone}\n\n` +
                      `🔖 Marejeo: ${paymentData.reference}\n\n` +
                      `${paymentData.message}\n\n` +
                      `Utapokea ujumbe wa USSD kwenye simu yako au bofya link:\n${paymentData.paymentUrl || 'N/A'}`
                    : `✅ *Payment Initiated!*\n\n` +
                      `📦 Item: ${paymentState.itemName}\n` +
                      `💰 Amount: ${paymentState.currency} ${paymentState.amount.toLocaleString()}\n` +
                      `👤 Name: ${customerName}\n` +
                      `📱 Phone: ${customerPhone}\n\n` +
                      `🔖 Reference: ${paymentData.reference}\n\n` +
                      `${paymentData.message}\n\n` +
                      `Click to pay: ${paymentData.paymentUrl || 'N/A'}`;
                  
                  messageToSend = confirmMsg;
                  delete conversation.paymentState;
                  paymentHandled = true;
                } else {
                  messageToSend = lang === 'sw'
                    ? `Samahani, sikuweza kuanzisha malipo. Jaribu tena au wasiliana nasi.\n\nHitilafu: ${paymentData.error || 'Unknown error'}`
                    : `Sorry, I couldn't initiate the payment. Please try again or contact us.\n\nError: ${paymentData.error || 'Unknown error'}`;
                  delete conversation.paymentState;
                  paymentHandled = true;
                }
              } catch (error) {
                console.error('[webhook] Error creating payment:', error);
                messageToSend = lang === 'sw'
                  ? "Samahani, kulikuwa na hitilafu kuchakata malipo yako. Tafadhali jaribu tena baadaye."
                  : "Sorry, there was an error processing your payment. Please try again later.";
                delete conversation.paymentState;
                paymentHandled = true;
              }
            }
          }
        }
        // Only check redirection/AI if payment wasn't handled
        if (!paymentHandled) {
          const lowerMsg = incomingMsg.toLowerCase();
          const hasRedirectionKeyword = bizSettings.keywords.some(keyword => 
            lowerMsg.includes(keyword.toLowerCase())
          );

          if (hasRedirectionKeyword && bizSettings.supportPhone) {
          // User mentioned a redirection keyword and we have support contact
          const conversation = conversationHistory.get(from) || {};
          const lang = conversation.language || 'en';
          
          if (lang === 'sw') {
            messageToSend = `Naelewa unahitaji msaada maalum. Tafadhali wasiliana na ${bizSettings.supportName} kwenye WhatsApp: ${bizSettings.supportPhone}`;
          } else {
            messageToSend = `I understand you need specialized assistance. Please contact ${bizSettings.supportName} on WhatsApp: ${bizSettings.supportPhone}`;
          }
        } else if (USER_BYPASS_CLAUDE) {
          console.log("BYPASS_CLAUDE enabled — sending canned reply");
          messageToSend = "Thanks for messaging us! We'll respond to you shortly.";
        } else if (!USER_CLAUDE_API_KEY) {
          console.error("Missing CLAUDE_API_KEY in environment");
          const conversation = conversationHistory.get(from) || {};
          const lang = conversation.language || 'en';
          messageToSend = lang === 'sw'
            ? "Samahani, nina shida kuchakata hilo sasa hivi. Timu yetu itawasiliana nawe hivi karibuni."
            : "Sorry, I'm having trouble processing that right now. Our team will get back to you shortly.";
        } else {
          try {
          // Build system prompt with business context from settings
          let systemPrompt = "You are a helpful customer service representative. Respond in the same language the customer uses. Give concise answers using complete sentences only. Limit replies to 1-3 full sentences unless the user explicitly asks for more detail.";
          
          // Use business settings for context
          if (bizSettings.businessDescription) {
            const toneMap = {
              'professional': 'professional and formal',
              'friendly': 'friendly and casual',
              'enthusiastic': 'enthusiastic and energetic',
              'helpful': 'helpful and supportive',
              'concise': 'concise and direct'
            };
            const toneDescription = toneMap[bizSettings.tone] || 'friendly';
            
            let supportContactInfo = '';
            if (bizSettings.supportPhone && bizSettings.supportName) {
              supportContactInfo = `\n\nIf asked about specific details not mentioned in the business description (like specific product brands, exact specifications, pricing details, or inventory), direct them to contact ${bizSettings.supportName} at ${bizSettings.supportPhone} for detailed information.`;
            } else if (bizSettings.supportPhone) {
              supportContactInfo = `\n\nIf asked about specific details not mentioned in the business description (like specific product brands, exact specifications, pricing details, or inventory), direct them to contact support at ${bizSettings.supportPhone} for detailed information.`;
            }
            
            systemPrompt = `You are a ${toneDescription} customer service representative for this business:\n\n${bizSettings.businessDescription}\n\nRespond helpfully to customer inquiries about the business. Respond in the same language the customer uses (English or Swahili). Give concise answers using complete sentences only. Limit replies to 1-3 full sentences unless the user explicitly asks for more detail. 

CRITICAL RULES:
1. ONLY provide information that is explicitly stated in the business description above.
2. Do NOT make up, assume, or infer specific details like product brands, models, specifications, prices, or inventory that are not mentioned.
3. If a customer asks for specific details not in the business description, politely acknowledge what you know generally and direct them to contact support for specifics.
4. Do NOT repeat or summarize the entire business description in your reply; use it only to inform your answer.${supportContactInfo}`;
          }
          
          // Add booking information if enabled
          if (userBookingsEnabled && userServices.length > 0) {
            systemPrompt += `\n\nIMPORTANT: This business has a booking system enabled. If a customer asks about bookings, appointments, reservations, or scheduling, inform them they can book by saying "I want to book" or "I'd like to make a reservation".`;
          }
          
          // Add payment items information if enabled
          if (userPaymentsEnabled && userPaymentItems.length > 0) {
            systemPrompt += `\n\nIMPORTANT: This business has a payment system enabled. If a customer asks about payments, paying, ordering, or buying, inform them they can pay by saying "I want to pay" or "I want to order".`;
          }

          console.log(`Sending ${conversation.messages.length} messages to Claude for ${from}`);

          const claudeResponse = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
              model: "claude-haiku-4-5-20251001",
              max_tokens: 310,
              system: systemPrompt,
              messages: conversation.messages,
            },
            {
              headers: {
                "x-api-key": USER_CLAUDE_API_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
              },
            }
          );

            messageToSend =
              claudeResponse.data?.content?.[0]?.text ||
              "Thanks for your message! Our team will get back to you soon.";
            
          } catch (err) {
            console.error("Error calling Claude:", err.message);
            if (err.response) {
              console.error("Claude HTTP status:", err.response.status);
              console.error("Claude response body:", JSON.stringify(err.response.data));
            }
            messageToSend = "Thanks for your message! Our team will review that and get back to you soon.";
          }
        }
        }
      }

      // Add assistant's response to conversation history (for all messages, not just Claude API)
      if (messageToSend) {
        conversation.messages.push({
          role: "assistant",
          content: messageToSend,
        });
        if (userCreds?.userId) {
          try {
            const convId = await upsertConversation(userCreds.userId, to, from);
            await addMessage(convId, 'assistant', messageToSend);
          } catch (e) {
            console.warn('[webhook] Failed to persist assistant message:', e.message);
          }
        }
      }

      // Send the message via Twilio
      if (userTwilioClient && from) {
        try {
          const toNumber = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;
          const fromNumber = USER_TWILIO_PHONE_NUMBER.startsWith('whatsapp:') ? USER_TWILIO_PHONE_NUMBER : `whatsapp:${USER_TWILIO_PHONE_NUMBER}`;
          
          console.log(`Sending message from ${fromNumber} to ${toNumber}`);
          
          await userTwilioClient.messages.create({
            body: messageToSend,
            from: fromNumber,
            to: toNumber,
          });
          console.log("✓ Message sent successfully to", toNumber);
        } catch (err) {
          console.error("✗ Error sending message via Twilio:", err.message);
        }
      } else {
        console.warn("Cannot send message - missing Twilio client or phone number");
      }
    } catch (err) {
      console.error("Error in message handler:", err);
    }
  }, randomDelay);
});// Endpoint to get all conversations
app.get("/api/conversations", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    const conversations = await listConversations(userId);
    res.json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Bookings API endpoints
app.get("/api/bookings/status", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const settings = await getBookingSettings(userId);
    res.json(settings);
  } catch (error) {
    console.error('[bookings] Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch booking status' });
  }
});

app.post("/api/bookings/toggle", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const { enabled } = req.body;
    await setBookingStatus(userId, enabled);
    console.log(`[bookings] Bookings ${enabled ? 'enabled' : 'disabled'} for user ${userId}`);
    res.json({ enabled });
  } catch (error) {
    console.error('[bookings] Error toggling:', error);
    res.status(500).json({ error: 'Failed to toggle bookings' });
  }
});

app.get("/api/bookings", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const userBookings = await listBookings(userId);
    res.json(userBookings);
  } catch (error) {
    console.error('[bookings] Error fetching:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post("/api/bookings", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const booking = await createBooking(userId, req.body);
    console.log('[bookings] New booking created:', booking.id);
    res.json(booking);
  } catch (error) {
    console.error('[bookings] Error creating:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.put("/api/bookings/:id/status", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  const { id } = req.params;
  const { status } = req.body;
  try {
    await updateBookingStatus(userId, id, status);
    console.log(`[bookings] Booking ${id} status updated to ${status}`);
    res.json({ success: true });
  } catch (error) {
    console.error('[bookings] Error updating status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Services API endpoints
app.get("/api/services", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const userServices = await listServices(userId);
    res.json(userServices);
  } catch (error) {
    console.error('[services] Error fetching:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.post("/api/services", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const service = await saveService(userId, req.body);
    console.log('[services] Service saved:', service.id);
    res.json(service);
  } catch (error) {
    console.error('[services] Error saving:', error);
    res.status(500).json({ error: 'Failed to save service' });
  }
});

app.put("/api/services", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const service = await saveService(userId, req.body);
    console.log('[services] Service updated:', service.id);
    res.json(service);
  } catch (error) {
    console.error('[services] Error updating:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

app.delete("/api/services/:id", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  const { id } = req.params;
  try {
    await deleteService(userId, id);
    console.log('[services] Service deleted:', id);
    res.json({ success: true });
  } catch (error) {
    console.error('[services] Error deleting:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// ========================================
// STAFF API
// ========================================

app.get("/api/staff", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const staff = await listStaff(userId);
    res.json(staff);
  } catch (error) {
    console.error('[staff] Error fetching:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

app.get("/api/staff/:id", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  const { id } = req.params;
  try {
    const staff = await getStaffById(id, userId);
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    res.json(staff);
  } catch (error) {
    console.error('[staff] Error fetching by id:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

app.post("/api/staff", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const staff = await createStaff(userId, req.body);
    console.log('[staff] Staff created:', staff.id);
    res.json(staff);
  } catch (error) {
    console.error('[staff] Error creating:', error);
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

app.put("/api/staff/:id", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  const { id } = req.params;
  try {
    await updateStaff(id, userId, req.body);
    const updated = await getStaffById(id, userId);
    console.log('[staff] Staff updated:', id);
    res.json(updated);
  } catch (error) {
    console.error('[staff] Error updating:', error);
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

app.delete("/api/staff/:id", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  const { id } = req.params;
  try {
    await deleteStaff(id, userId);
    console.log('[staff] Staff deleted:', id);
    res.json({ success: true });
  } catch (error) {
    console.error('[staff] Error deleting:', error);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

// ========================================
// CATEGORIES API
// ========================================

app.get("/api/categories", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const categories = await listCategories(userId);
    res.json(categories);
  } catch (error) {
    console.error('[categories] Error fetching:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get("/api/categories/by-store/:storeName", async (req, res) => {
  try {
    const { storeName } = req.params;
    const store = await pgGetStoreByName(storeName);
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const categories = await listCategories(store.userId);
    res.json(categories);
  } catch (error) {
    console.error('[categories] Error fetching by store:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get("/api/categories/:id", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  const { id } = req.params;
  try {
    const category = await getCategoryById(id, userId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('[categories] Error fetching by id:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

app.post("/api/categories", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const category = await saveCategory(userId, req.body);
    console.log('[categories] Category created:', category.id);
    res.json(category);
  } catch (error) {
    console.error('[categories] Error creating:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  const { id } = req.params;
  try {
    const category = await saveCategory(userId, { ...req.body, id });
    console.log('[categories] Category updated:', id);
    res.json(category);
  } catch (error) {
    console.error('[categories] Error updating:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  const { id } = req.params;
  try {
    await deleteCategory(id, userId);
    console.log('[categories] Category deleted:', id);
    res.json({ success: true });
  } catch (error) {
    console.error('[categories] Error deleting:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ==========================================
// Image Upload Endpoints (Bunny CDN)
// ==========================================

// Upload single image
app.post("/api/upload/image", upload.single('image'), async (req, res) => {
  try {
    if (!bunnyStorage.isConfigured) {
      return res.status(503).json({ error: 'Image upload service not configured. Please add BUNNY_STORAGE_ZONE, BUNNY_API_KEY, and BUNNY_CDN_URL to environment variables.' });
    }

    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const folder = req.body.folder || 'general';
    const timestamp = Date.now();
    const originalName = req.file.originalname.replace(/\.[^/.]+$/, ''); // Remove extension
    const fileName = `${userId}_${timestamp}_${originalName}.webp`;

    console.log('[upload] Compressing image:', req.file.originalname);

    // Compress image aggressively to 30-100kb
    let compressedBuffer;
    let quality = 75; // Starting quality
    let targetMaxSize = 100 * 1024; // 100KB target
    let targetMinSize = 30 * 1024; // 30KB minimum
    
    try {
      // First attempt: resize to max 1200px width/height and compress
      compressedBuffer = await sharp(req.file.buffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: quality })
        .toBuffer();

      console.log(`[upload] Initial compression: ${compressedBuffer.length} bytes (${(compressedBuffer.length / 1024).toFixed(2)}KB)`);

      // If still too large, reduce quality iteratively
      while (compressedBuffer.length > targetMaxSize && quality > 20) {
        quality -= 10;
        compressedBuffer = await sharp(req.file.buffer)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: quality })
          .toBuffer();
        
        console.log(`[upload] Re-compressed at quality ${quality}: ${(compressedBuffer.length / 1024).toFixed(2)}KB`);
      }

      // If still too large, reduce dimensions
      if (compressedBuffer.length > targetMaxSize) {
        let width = 800;
        while (compressedBuffer.length > targetMaxSize && width > 400) {
          compressedBuffer = await sharp(req.file.buffer)
            .resize(width, width, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ quality: 60 })
            .toBuffer();
          
          console.log(`[upload] Re-compressed at ${width}px: ${(compressedBuffer.length / 1024).toFixed(2)}KB`);
          width -= 100;
        }
      }

      console.log(`[upload] Final size: ${(compressedBuffer.length / 1024).toFixed(2)}KB (quality: ${quality})`);

    } catch (compressionError) {
      console.error('[upload] Compression error:', compressionError);
      return res.status(500).json({ 
        error: 'Failed to compress image',
        message: compressionError.message 
      });
    }

    console.log('[upload] Uploading compressed image:', fileName, 'to folder:', folder);

    const result = await bunnyStorage.uploadFile(
      compressedBuffer,
      fileName,
      folder
    );

    console.log('[upload] Upload successful:', result.url);
    res.json({
      ...result,
      originalSize: req.file.size,
      compressedSize: compressedBuffer.length,
      compressionRatio: ((1 - compressedBuffer.length / req.file.size) * 100).toFixed(2) + '%'
    });
  } catch (error) {
    console.error('[upload] Error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      message: error.message 
    });
  }
});

// Delete image
app.delete("/api/upload/image", async (req, res) => {
  try {
    if (!bunnyStorage.isConfigured) {
      return res.status(503).json({ error: 'Image upload service not configured' });
    }

    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }

    console.log('[upload] Deleting image:', filePath);
    await bunnyStorage.deleteFile(filePath);
    
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('[upload] Delete error:', error);
    res.status(500).json({ 
      error: 'Failed to delete image',
      message: error.message 
    });
  }
});

// Store settings API (per user)
const storeSettingsByUser = new Map();

function getStoreSettings(userId) {
  if (!storeSettingsByUser.has(userId)) {
    storeSettingsByUser.set(userId, {
      storeId: Math.random().toString(36).substr(2, 9),
      storeName: 'My Store',
      storePhone: '+255719958997',
      userId: userId,
    });
  }
  return storeSettingsByUser.get(userId);
}

app.get("/api/store/settings", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const settings = await pgGetStoreSettings(userId);
    res.json(settings);
  } catch (error) {
    console.error('[store] Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch store settings' });
  }
});

app.put("/api/store/settings", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  
  try {
    const { storeName, storePhone } = req.body;
    const currentSettings = await pgGetStoreSettings(userId);
    
    const updatedSettings = {
      storeId: currentSettings.storeId,
      storeName: storeName !== undefined ? storeName.trim() : currentSettings.storeName,
      storePhone: storePhone !== undefined ? storePhone.trim() : currentSettings.storePhone,
    };
    
    if (!updatedSettings.storeName || updatedSettings.storeName.length === 0) {
      return res.status(400).json({ error: 'Store name is required' });
    }
    
    const saved = await pgSaveStoreSettings(userId, updatedSettings);
    console.log('[store] Settings updated:', saved);
    res.json(saved);
  } catch (error) {
    console.error('[store] Error updating settings:', error);
    if (error.message === 'Store name already taken') {
      res.status(400).json({ error: 'Store name already taken' });
    } else {
      res.status(500).json({ error: 'Failed to update store settings' });
    }
  }
});

// Business settings (used by AI for context) - global for now
let businessSettings = {
  businessDescription: 'We are a retail shop in Dar es Salaam selling electronics and home appliances. We pride ourselves on quality products and excellent customer service.',
  tone: 'friendly',
  sampleReplies: [
    'Thank you for contacting us! How can we help you today?',
    'We appreciate your interest in our products!',
  ],
  keywords: ['refund', 'complaint', 'manager'],
  supportName: 'Customer Support',
  supportPhone: ''
};

// Get store by name (for public store access)
app.get("/api/store/by-name/:storeName", async (req, res) => {
  const { storeName } = req.params;
  try {
    const store = await pgGetStoreByName(storeName);
    if (store) {
      res.json(store);
    } else {
      res.status(404).json({ error: 'Store not found' });
    }
  } catch (error) {
    console.error('[store] Error fetching by name:', error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// Business settings API (Postgres-backed)
app.get("/api/business/settings", async (req, res) => {
  const userId = req.headers['x-user-id'];
  console.log('[business] GET request, userId:', userId);
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    let settings = await pgGetBusinessSettings(userId);
    console.log('[business] Retrieved settings:', settings);
    
    // If no settings found, try to get user's name and create default settings
    if (!settings) {
      const user = await getUserById(userId);
      if (user) {
        const defaultSettings = {
          businessName: user.name || '',
          businessDescription: '',
          tone: 'friendly',
          sampleReplies: [],
          keywords: [],
          supportName: '',
          supportPhone: '',
        };
        // Save the default settings for next time
        await pgSaveBusinessSettings(userId, defaultSettings);
        settings = defaultSettings;
        console.log('[business] Created default settings with user name:', user.name);
      } else {
        settings = businessSettings;
      }
    }
    
    res.json(settings);
  } catch (e) {
    console.error('[business] get error:', e);
    res.status(500).json({ error: 'Failed to fetch business settings' });
  }
});

app.put("/api/business/settings", async (req, res) => {
  const userId = req.headers['x-user-id'];
  console.log('[business] PUT request, userId:', userId);
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const { businessName, businessDescription, tone, sampleReplies, keywords, supportName, supportPhone } = req.body;
    console.log('[business] Request body:', { businessName, businessDescription, tone, sampleReplies, keywords, supportName, supportPhone });
    const settings = {
      businessName,
      businessDescription,
      tone,
      sampleReplies,
      keywords,
      supportName,
      supportPhone,
    };
    await pgSaveBusinessSettings(userId, settings);
    const saved = (await pgGetBusinessSettings(userId)) || businessSettings;
    console.log('[business] Settings updated for', userId, saved);
    res.json(saved);
  } catch (e) {
    console.error('[business] save error:', e);
    console.error('[business] error stack:', e.stack);
    res.status(500).json({ error: 'Failed to save business settings', details: e.message });
  }
});

// Products API
app.get("/api/products", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const products = await listProducts(userId);
    res.json(products);
  } catch (error) {
    console.error('[products] Error fetching:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get("/api/products/by-store/:storeName", async (req, res) => {
  const { storeName } = req.params;
  try {
    const products = await getProductsByStore(storeName);
    res.json(products);
  } catch (error) {
    console.error('[products] Error fetching by store:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post("/api/products", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    // Check product limit
    const user = await getUserById(userId);
    const userLimits = user?.limits || { maxProducts: 50 };
    const existingProducts = await listProducts(userId);
    
    if (existingProducts.length >= userLimits.maxProducts) {
      return res.status(403).json({ 
        error: 'Product limit reached', 
        message: `You have reached your maximum limit of ${userLimits.maxProducts} products. Please contact admin to increase your limit.`,
        currentCount: existingProducts.length,
        maxProducts: userLimits.maxProducts
      });
    }
    
    const product = await saveProduct(userId, req.body);
    console.log('[products] Product saved:', product.id);
    res.json(product);
  } catch (error) {
    console.error('[products] Error saving:', error);
    res.status(500).json({ error: 'Failed to save product' });
  }
});

app.put("/api/products/:id", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const product = await saveProduct(userId, { ...req.body, id: req.params.id });
    console.log('[products] Product updated:', product.id);
    res.json(product);
  } catch (error) {
    console.error('[products] Error updating:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  const { id } = req.params;
  try {
    await deleteProduct(userId, id);
    console.log('[products] Product deleted:', id);
    res.json({ success: true });
  } catch (error) {
    console.error('[products] Error deleting:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Orders API
app.get("/api/orders", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const userOrders = await listOrders(userId);
    res.json(userOrders);
  } catch (error) {
    console.error('[orders] Error fetching:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post("/api/orders", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  
  const { customerName, customerPhone, items, totalAmount, totalItems } = req.body;
  
  if (!customerName || !customerPhone || !items || !totalAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const order = await createOrder(userId, {
      customerName,
      customerPhone,
      items,
      totalAmount,
      totalItems,
      status: 'pending'
    });
    console.log('[orders] New order created:', order.id);
    res.json(order);
  } catch (error) {
    console.error('[orders] Error creating:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.put("/api/orders/:id", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    await updateOrderStatus(userId, id, status);
    console.log('[orders] Order status updated:', id, status);
    res.json({ success: true });
  } catch (error) {
    console.error('[orders] Error updating status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  
  const { id } = req.params;
  
  try {
    await deleteOrder(userId, id);
    console.log('[orders] Order deleted:', id);
    res.json({ success: true });
  } catch (error) {
    console.error('[orders] Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Admin API - Get all users and their data
app.get("/api/admin/users", async (req, res) => {
  const requestingUserId = req.headers['x-user-id'];
  const requestingUserRole = req.headers['x-user-role'];
  
  // Only admins can access this endpoint
  if (requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const dbUsers = await getAllUsers();
    const allUsers = [];
    
    for (const dbUser of dbUsers) {
      // Get conversations count for this user
      const conversations = await listConversations(dbUser.id);
      
      // Get credentials for phone number
      const credentials = await getUserCredentials(dbUser.id);
      
      // Get business settings
      const settings = await pgGetBusinessSettings(dbUser.id);
      
      // Get store settings for store ID
      const storeSettings = await pgGetStoreSettings(dbUser.id);
      
      // Get orders and bookings count
      const orders = await listOrders(dbUser.id);
      const bookings = await listBookings(dbUser.id);
      
      // Get products count
      const products = await listProducts(dbUser.id);
      
      allUsers.push({
        userId: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        storeName: settings?.businessName || settings?.businessDescription || 'No business name',
        storePhone: credentials?.twilioPhoneNumber || 'No phone',
        storeId: storeSettings?.storeId || dbUser.id.slice(0, 8),
        ordersCount: orders.length,
        bookingsCount: bookings.length,
        isCurrent: dbUser.id === requestingUserId,
        enabledFeatures: dbUser.enabled_features || ['conversations', 'store', 'bookings', 'staff', 'settings', 'billing'],
        limits: dbUser.limits || {
          maxConversations: 100,
          maxProducts: 50,
        },
        currentCounts: {
          conversations: conversations.length,
          products: products.length,
        },
        payDate: dbUser.pay_date || null,
        package: dbUser.package || 'starter',
        status: dbUser.status || 'active',
        promoCode: dbUser.promo_code || null,
      });
    }
    
    res.json(allUsers);
  } catch (error) {
    console.error('[admin] Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin API - Update user features
app.put("/api/admin/users/:userId/features", async (req, res) => {
  const requestingUserRole = req.headers['x-user-role'];
  
  if (requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { userId } = req.params;
  const { enabledFeatures } = req.body;
  
  if (!enabledFeatures || !Array.isArray(enabledFeatures)) {
    return res.status(400).json({ error: 'enabledFeatures must be an array' });
  }
  
  try {
    await updateUserFeatures(userId, enabledFeatures);
    console.log('[admin] User features updated:', userId, enabledFeatures);
    res.json({ success: true, userId, enabledFeatures });
  } catch (error) {
    console.error('[admin] Error updating features:', error);
    res.status(500).json({ error: 'Failed to update features' });
  }
});

// Admin API - Update user limits
app.put("/api/admin/users/:userId/limits", async (req, res) => {
  const requestingUserRole = req.headers['x-user-role'];
  
  if (requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { userId } = req.params;
  const { limits } = req.body;
  
  console.log('[admin] PUT /api/admin/users/:userId/limits:', { userId, limits });
  
  if (!limits || typeof limits !== 'object') {
    return res.status(400).json({ error: 'limits must be an object' });
  }
  
  try {
    const updatedLimits = {
      maxConversations: limits.maxConversations || 100,
      maxProducts: limits.maxProducts || 50,
    };
    console.log('[admin] Calling updateUserLimits with:', updatedLimits);
    await updateUserLimits(userId, updatedLimits);
    console.log('[admin] User limits updated:', userId, updatedLimits);
    
    // Verify the update by fetching the user
    const user = await getUserById(userId);
    console.log('[admin] Verified user limits after update:', user?.limits);
    
    res.json({ success: true, userId, limits: updatedLimits });
  } catch (error) {
    console.error('[admin] Error updating limits:', error);
    res.status(500).json({ error: 'Failed to update limits' });
  }
});

// Admin API - Update user subscription (payDate, package, status, promoCode)
app.put("/api/admin/users/:userId/subscription", async (req, res) => {
  const requestingUserRole = req.headers['x-user-role'];
  
  if (requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { userId } = req.params;
  const { payDate, package: packageName, status, promoCode } = req.body;
  
  console.log('[admin] PUT /api/admin/users/:userId/subscription:', { userId, payDate, packageName, status, promoCode });
  
  try {
    const subscriptionData = {};
    if (payDate !== undefined) subscriptionData.payDate = payDate;
    if (packageName !== undefined) subscriptionData.package = packageName;
    if (status !== undefined) subscriptionData.status = status;
    if (promoCode !== undefined) subscriptionData.promoCode = promoCode;
    
    await updateUserSubscription(userId, subscriptionData);
    console.log('[admin] User subscription updated:', userId, subscriptionData);
    
    res.json({ success: true, userId, ...subscriptionData });
  } catch (error) {
    console.error('[admin] Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Delete user endpoint
app.delete("/api/admin/users/:userId", async (req, res) => {
  const requestingUserId = req.headers['x-user-id'];
  const requestingUserRole = req.headers['x-user-role'];
  
  if (requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { userId } = req.params;
  
  // Prevent admin from deleting themselves
  if (userId === requestingUserId) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  console.log('[admin] DELETE /api/admin/users/:userId:', { userId, requestedBy: requestingUserId });
  
  try {
    await deleteUser(userId);
    console.log('[admin] User deleted successfully:', userId);
    
    res.json({ success: true, userId });
  } catch (error) {
    console.error('[admin] Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Change user password (admin only)
app.put('/api/admin/users/:userId/password', async (req, res) => {
  const requestingUserId = req.headers['x-user-id'];
  const requestingUserRole = req.headers['x-user-role'];
  
  if (!requestingUserId || requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { userId } = req.params;
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  
  console.log('[admin] PUT /api/admin/users/:userId/password:', { userId, requestedBy: requestingUserId });
  
  try {
    const pool = ensurePool();

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password in correct table (users)
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [passwordHash, userId]
    );

    if (result.rowCount === 0) {
      console.error('[admin] No user found to change password for id:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('[admin] Password changed successfully for user:', userId);
    
    res.json({ success: true, userId });
  } catch (error) {
    console.error('[admin] Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password', details: error.message });
  }
});

// Update user info (email and phone) - admin only
app.put('/api/admin/users/:userId/info', async (req, res) => {
  const requestingUserId = req.headers['x-user-id'];
  const requestingUserRole = req.headers['x-user-role'];
  
  if (!requestingUserId || requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { userId } = req.params;
  const { email, storePhone } = req.body;
  
  console.log('[admin] PUT /api/admin/users/:userId/info:', { userId, email, storePhone, requestedBy: requestingUserId });
  
  try {
    const pool = ensurePool();
    
    // Update user email in users table
    if (email) {
      const emailResult = await pool.query(
        'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
        [email, userId]
      );
      console.log('[admin] Email updated, rows affected:', emailResult.rowCount);
      
      if (emailResult.rowCount === 0) {
        console.error('[admin] No user found with id:', userId);
        return res.status(404).json({ error: 'User not found' });
      }
    }
    
    // Update store phone in store_settings table
    if (storePhone) {
      const phoneResult = await pool.query(
        'UPDATE store_settings SET store_phone = $1, updated_at = NOW() WHERE user_id = $2 RETURNING user_id',
        [storePhone, userId]
      );
      console.log('[admin] Store phone updated, rows affected:', phoneResult.rowCount);
      
      // If no store settings exist, create them
      if (phoneResult.rowCount === 0) {
        console.log('[admin] No store settings found, creating new entry');
        await pool.query(
          'INSERT INTO store_settings (user_id, store_id, store_name, store_phone) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET store_phone = $4',
          [userId, `store_${userId}`, 'My Store', storePhone]
        );
      }
    }
    
    console.log('[admin] User info updated successfully for user:', userId);
    
    res.json({ success: true, userId, email, storePhone });
  } catch (error) {
    console.error('[admin] Error updating user info:', error);
    console.error('[admin] Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update user info', details: error.message });
  }
});

// Login as user - admin only
app.post('/api/admin/users/:userId/login-as', async (req, res) => {
  const requestingUserId = req.headers['x-user-id'];
  const requestingUserRole = req.headers['x-user-role'];
  
  if (!requestingUserId || requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { userId } = req.params;
  
  console.log('[admin] POST /api/admin/users/:userId/login-as:', { userId, requestedBy: requestingUserId });
  
  try {
    // Get the user to login as (userId is the user's UUID from users table)
    const user = await getUserById(userId);
    
    if (!user) {
      console.log('[admin] User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('[admin] Found user:', { id: user.id, email: user.email, role: user.role });
    
    // Generate token for the target user
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('[admin] Generated login token for user:', userId);
    
    res.json({ token, userId: user.id });
  } catch (error) {
    console.error('[admin] Error logging in as user:', error);
    res.status(500).json({ error: 'Failed to login as user' });
  }
});

// Health check endpoint
// ========================================
// AUTHENTICATION API
// ========================================

// Signup endpoint
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name, promoCode } = req.body;
    
    console.log('[auth] Signup request for email:', email);
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    
    // Check if user already exists
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await createUser(email, passwordHash, name || email.split('@')[0], promoCode);
    
    console.log('[auth] User created:', user.id, 'with name:', user.name);
    
    // Initialize business settings with user's name as business name
    const initialSettings = {
      businessName: name || email.split('@')[0],
      businessDescription: '',
      tone: 'friendly',
      sampleReplies: [],
      keywords: [],
      supportName: '',
      supportPhone: '',
    };
    console.log('[auth] Saving initial business settings:', initialSettings);
    await pgSaveBusinessSettings(user.id, initialSettings);
    console.log('[auth] Business settings saved for user:', user.id);
    
    // Send welcome email asynchronously (don't wait for it)
    sendWelcomeEmail(email, name || email.split('@')[0])
      .then(() => console.log('[auth] Welcome email sent to:', email))
      .catch(emailError => console.error('[auth] Failed to send welcome email:', emailError));
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('[auth] User created:', user.id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        enabledFeatures: user.enabled_features || ['conversations', 'bookings'],
        limits: user.limits || { maxConversations: 100, maxProducts: 50 },
        payDate: user.pay_date || null,
        package: user.package || 'starter',
        status: user.status || 'active'
      }
    });
  } catch (error) {
    console.error('[auth] Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('[auth] Login request for email:', email);
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    
    // Get user with password hash
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Check if user is active
    if (user.status && user.status !== 'active') {
      return res.status(403).json({ error: "Your account is currently inactive. Please contact support." });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('[auth] User logged in:', user.id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        enabledFeatures: user.enabled_features || ['conversations', 'bookings'],
        limits: user.limits || { maxConversations: 100, maxProducts: 50 },
        payDate: user.pay_date || null,
        package: user.package || 'starter',
        status: user.status || 'active'
      }
    });
  } catch (error) {
    console.error('[auth] Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No token provided" });
    }
    
    const token = authHeader.substring(7);
    
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user without password
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if user is active
    if (user.status && user.status !== 'active') {
      return res.status(403).json({ error: "Your account is currently inactive. Please contact support." });
    }
    
    // Get business settings to include businessName
    const businessSettings = await pgGetBusinessSettings(user.id);
    
    console.log('[auth] /me - User from DB:', { id: user.id, limits: user.limits, payDate: user.pay_date, package: user.package, businessName: businessSettings?.businessName });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessName: businessSettings?.businessName || user.name,
        enabledFeatures: user.enabled_features || ['conversations', 'bookings'],
        limits: user.limits || { maxConversations: 100, maxProducts: 50 },
        payDate: user.pay_date || null,
        package: user.package || 'starter',
        status: user.status || 'active',
        paymentsEnabled: user.payments_enabled || false,
      }
    });
  } catch (error) {
    console.error('[auth] Token validation error:', error);
    res.status(401).json({ error: "Invalid token" });
  }
});

// ========================================
// USER CREDENTIALS MANAGEMENT API
// ========================================

// Save/Update user credentials
app.put("/api/user/credentials", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    console.log('[credentials] PUT request received:', {
      userId,
      hasClaudeKey: !!req.body.claudeApiKey,
      hasTwilioSid: !!req.body.twilioAccountSid,
      hasTwilioToken: !!req.body.twilioAuthToken,
      twilioPhone: req.body.twilioPhoneNumber
    });
    
    if (!userId) {
      console.error('[credentials] Missing userId in request');
      return res.status(401).json({ error: "User ID required" });
    }

    const {
      claudeApiKey,
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
      businessContext,
      bypassClaude
    } = req.body;

    // Save credentials to database
    await saveUserCredentials(userId, {
      claudeApiKey,
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
      businessContext,
      bypassClaude
    });

    // Map phone number to user if provided
    if (twilioPhoneNumber) {
      await mapPhoneToUser(twilioPhoneNumber, userId);
    }

    console.log('[credentials] Successfully saved credentials for user:', userId);
    res.json({ success: true, message: "Credentials saved successfully" });
  } catch (error) {
    console.error("[credentials] Error saving credentials:", error);
    res.status(500).json({ error: "Failed to save credentials", details: error.message });
  }
});

// Test email endpoint - ADMIN ONLY
app.post("/api/admin/test-email", async (req, res) => {
  const requestingUserRole = req.headers['x-user-role'];
  
  if (requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { email, name } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email address required' });
  }
  
  try {
    console.log('[test-email] Testing email configuration...');
    console.log('[test-email] Gmail App Password set:', !!process.env.GMAIL_APP_PASSWORD);
    console.log('[test-email] Email disabled:', process.env.DISABLE_EMAIL === 'true');
    
    if (!process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ 
        error: 'GMAIL_APP_PASSWORD not configured. Please set it in your environment variables.',
        gmailConfigured: false
      });
    }
    
    if (process.env.DISABLE_EMAIL === 'true') {
      return res.status(500).json({ 
        error: 'Email is disabled. Remove DISABLE_EMAIL environment variable to enable.',
        gmailConfigured: true,
        emailDisabled: true
      });
    }
    
    await sendWelcomeEmail(email, name || 'Test User');
    
    console.log('[test-email] Test email sent successfully to:', email);
    res.json({ 
      success: true, 
      message: `Test email sent to ${email}`,
      provider: 'Gmail SMTP'
    });
  } catch (error) {
    console.error('[test-email] Failed to send test email:', error);
    res.status(500).json({ 
      error: 'Failed to send test email', 
      details: error.message,
      gmailConfigured: !!process.env.GMAIL_APP_PASSWORD
    });
  }
});

// Send welcome email to existing user - admin only
app.post("/api/admin/users/send-welcome-email", async (req, res) => {
  const requestingUserRole = req.headers['x-user-role'];
  
  if (requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { userId, email, name } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email address required' });
  }
  
  try {
    console.log('[admin-email] Sending welcome email to existing user:', email);
    
    if (!process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ 
        error: 'GMAIL_APP_PASSWORD not configured. Please set it in your environment variables.',
        gmailConfigured: false
      });
    }
    
    if (process.env.DISABLE_EMAIL === 'true') {
      return res.status(500).json({ 
        error: 'Email is disabled. Remove DISABLE_EMAIL environment variable to enable.',
        gmailConfigured: true,
        emailDisabled: true
      });
    }
    
    await sendWelcomeEmail(email, name || 'User');
    
    console.log('[admin-email] Welcome email sent successfully to:', email);
    res.json({ 
      success: true, 
      message: `Welcome email sent to ${email}`
    });
  } catch (error) {
    console.error('[admin-email] Failed to send welcome email:', error);
    res.status(500).json({ 
      error: 'Failed to send welcome email', 
      details: error.message
    });
  }
});

// Get user credentials
app.get("/api/user/credentials", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const credentials = await getUserCredentials(userId);
    
    if (!credentials) {
      return res.json({ 
        hasCredentials: false,
        message: "No credentials found. Please configure your API keys in Settings." 
      });
    }

    // Return credentials (API keys are already decrypted by getUserCredentials)
    res.json({
      hasCredentials: true,
      claudeApiKey: credentials.claudeApiKey ? '****' + credentials.claudeApiKey.slice(-4) : null,
      twilioAccountSid: credentials.twilioAccountSid ? '****' + credentials.twilioAccountSid.slice(-4) : null,
      twilioAuthToken: credentials.twilioAuthToken ? '********' : null,
      twilioPhoneNumber: credentials.twilioPhoneNumber,
      businessContext: credentials.businessContext,
      bypassClaude: credentials.bypassClaude,
      updatedAt: credentials.updatedAt
    });
  } catch (error) {
    console.error("Error fetching credentials:", error);
    res.status(500).json({ error: "Failed to fetch credentials" });
  }
});

// Delete user credentials
app.delete("/api/user/credentials", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    await deleteUserCredentials(userId);
    res.json({ success: true, message: "Credentials deleted successfully" });
  } catch (error) {
    console.error("Error deleting credentials:", error);
    res.status(500).json({ error: "Failed to delete credentials" });
  }
});

// Admin: Get all users with credentials
app.get("/api/admin/users/credentials", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    
    if (!userId || userRole !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Chati Solutions API", 
    status: "running",
    version: "1.0.0"
  });
});

// Endpoint used by the Cart page to send an SMS/WhatsApp
// Currently disabled - use /webhook to receive and respond to messages instead
app.post("/send-sms", (req, res) => {
  res.status(503).json({ error: "Send SMS endpoint temporarily disabled. Messages are received and responded to via the WhatsApp webhook." });
});

// Version check endpoint
app.get("/api/version", (req, res) => {
  res.json({ 
    version: "1.3.0-postgres",
    database: process.env.DATABASE_URL ? "Postgres" : "JSON",
    timestamp: new Date().toISOString(),
    corsHeaders: "x-user-id enabled",
    buildTime: "2026-01-01T15:45:00Z"
  });
});

// ========================================
// PAYMENT SETTINGS API (per-user Snippe configuration)
// ========================================

// Save payment settings (Snippe API keys)
app.put("/api/payment/settings", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const { snippeApiKey, snippeWebhookSecret, snippeEnabled } = req.body;

    await pgSavePaymentSettings(userId, {
      snippeApiKey,
      snippeWebhookSecret,
      snippeEnabled: snippeEnabled || false,
    });

    console.log('[payment] Settings saved for user:', userId);
    res.json({ success: true, message: "Payment settings saved" });
  } catch (error) {
    console.error('[payment] Error saving settings:', error);
    res.status(500).json({ error: "Failed to save payment settings" });
  }
});

// Get payment settings
app.get("/api/payment/settings", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const settings = await pgGetPaymentSettings(userId);
    res.json({
      success: true,
      settings: settings || {
        snippeApiKey: null,
        snippeWebhookSecret: null,
        snippeEnabled: false,
      }
    });
  } catch (error) {
    console.error('[payment] Error fetching settings:', error);
    res.status(500).json({ error: "Failed to fetch payment settings" });
  }
});

// Admin: Toggle payments for a user
app.put("/api/admin/users/:userId/payments", async (req, res) => {
  const requestingUserRole = req.headers['x-user-role'];
  
  if (requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { userId } = req.params;
  const { enabled } = req.body;
  
  console.log('[admin] Toggle payments for user:', userId, enabled);
  
  try {
    await updateUserPaymentsEnabled(userId, enabled);
    res.json({ success: true, userId, paymentsEnabled: enabled });
  } catch (error) {
    console.error('[admin] Error toggling payments:', error);
    res.status(500).json({ error: 'Failed to update payment settings' });
  }
});

// ========================================
// PAYMENT ITEMS API (Custom payment items for chat)
// ========================================

// Get all payment items for a user
app.get("/api/payment/items", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const items = await getPaymentItemsByUserId(userId);
    res.json({ success: true, items });
  } catch (error) {
    console.error('[payment-items] Error fetching items:', error);
    res.status(500).json({ error: "Failed to fetch payment items" });
  }
});

// Get a single payment item by ID
app.get("/api/payment/items/:itemId", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const { itemId } = req.params;
    const item = await getPaymentItemById(itemId, userId);
    
    if (!item) {
      return res.status(404).json({ error: "Payment item not found" });
    }

    res.json({ success: true, item });
  } catch (error) {
    console.error('[payment-items] Error fetching item:', error);
    res.status(500).json({ error: "Failed to fetch payment item" });
  }
});

// Create a new payment item
app.post("/api/payment/items", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const { name, description, amount, currency, isActive } = req.body;

    if (!name || !amount) {
      return res.status(400).json({ error: "Name and amount are required" });
    }

    const item = await createPaymentItem({
      userId,
      name,
      description,
      amount: parseFloat(amount),
      currency: currency || 'TZS',
      isActive: isActive !== undefined ? isActive : true,
    });

    console.log('[payment-items] Item created:', item.id);
    res.json({ success: true, item });
  } catch (error) {
    console.error('[payment-items] Error creating item:', error);
    res.status(500).json({ error: "Failed to create payment item" });
  }
});

// Update a payment item
app.put("/api/payment/items/:itemId", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const { itemId } = req.params;
    const { name, description, amount, currency, isActive } = req.body;

    const existingItem = await getPaymentItemById(itemId, userId);
    if (!existingItem) {
      return res.status(404).json({ error: "Payment item not found" });
    }

    const updated = await updatePaymentItem(itemId, userId, {
      name,
      description,
      amount: amount ? parseFloat(amount) : undefined,
      currency,
      isActive,
    });

    if (!updated) {
      return res.status(400).json({ error: "Failed to update payment item" });
    }

    const item = await getPaymentItemById(itemId, userId);
    console.log('[payment-items] Item updated:', itemId);
    res.json({ success: true, item });
  } catch (error) {
    console.error('[payment-items] Error updating item:', error);
    res.status(500).json({ error: "Failed to update payment item" });
  }
});

// Delete a payment item
app.delete("/api/payment/items/:itemId", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const { itemId } = req.params;
    const deleted = await deletePaymentItem(itemId, userId);

    if (!deleted) {
      return res.status(404).json({ error: "Payment item not found" });
    }

    console.log('[payment-items] Item deleted:', itemId);
    res.json({ success: true, message: "Payment item deleted" });
  } catch (error) {
    console.error('[payment-items] Error deleting item:', error);
    res.status(500).json({ error: "Failed to delete payment item" });
  }
});

// Create payment for a payment item (customer-facing)
app.post("/api/payment/item/:itemId/pay", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const { itemId } = req.params;
    const { paymentType, customerPhone, customerEmail, customerName } = req.body;

    // Get payment item details
    const item = await getPaymentItemById(itemId, userId);
    if (!item) {
      return res.status(404).json({ error: "Payment item not found" });
    }

    if (!item.isActive) {
      return res.status(400).json({ error: "Payment item is not active" });
    }

    // Check if user has payments enabled
    const user = await getUserById(userId);
    if (!user?.paymentsEnabled) {
      return res.status(403).json({ error: "Payments not enabled for this account" });
    }

    // Get user's Snippe API key
    const paymentSettings = await getPaymentSettings(userId);
    if (!paymentSettings?.snippeApiKey || !paymentSettings.snippeEnabled) {
      return res.status(400).json({ error: "Snippe API key not configured. Please configure payment settings or contact admin." });
    }

    const snippeApiKey = paymentSettings.snippeApiKey;
    const reference = `ITEM-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // Create payment transaction record
    await createPaymentTransaction({
      userId,
      snippeReference: reference,
      amount: item.amount,
      currency: item.currency || 'TZS',
      paymentType,
      planType: `item:${itemId}`,
      status: 'pending',
      customerPhone,
      customerEmail,
      customerName,
      metadata: {
        itemId: item.id,
        itemName: item.name,
        itemDescription: item.description,
        type: 'payment_item',
      },
    });

    // Create Snippe payment
    const snippePayload = {
      reference,
      amount: item.amount,
      currency: item.currency || 'TZS',
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      payment_type: paymentType,
      description: item.description || item.name,
    };

    const snippeRes = await fetch('https://api.snippe.sh/v1/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${snippeApiKey}`,
      },
      body: JSON.stringify(snippePayload),
    });

    const snippeData = await snippeRes.json();

    if (!snippeRes.ok || snippeData.status !== 'success') {
      console.error('[payment] Snippe API error:', snippeData);
      return res.status(400).json({ 
        error: snippeData.message || 'Failed to create payment',
        details: snippeData 
      });
    }

    console.log('[payment] Item payment created:', reference);
    res.json({
      success: true,
      reference,
      paymentUrl: snippeData.payment_url,
      ussdCode: snippeData.ussd_code,
      message: paymentType === 'mobile' ? 'Check your phone for USSD prompt' : 'Redirect to payment page',
    });
  } catch (error) {
    console.error('[payment] Error creating item payment:', error);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

// Create payment for a booking
app.post("/api/payment/booking/:bookingId", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const { bookingId } = req.params;
    const { paymentType, customerPhone, customerEmail, customerName } = req.body;

    // Get booking details
    const booking = await getBookingById(bookingId, userId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ error: "Booking already paid" });
    }

    // Check if user has payments enabled
    const user = await getUserById(userId);
    if (!user?.payments_enabled) {
      return res.status(403).json({ error: "Payments not enabled for your account. Contact admin." });
    }

    // Get user's Snippe API key
    const settings = await pgGetPaymentSettings(userId);
    const apiKey = settings?.snippeApiKey || process.env.SNIPPE_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "Snippe API key not configured. Please configure payment settings or contact admin." });
    }

    // Create payment via Snippe API
    const snippeResponse = await fetch("https://api.snippe.sh/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `chati-booking-${bookingId}-${Date.now()}`,
      },
      body: JSON.stringify({
        amount: Math.round(booking.price),
        currency: "TZS",
        payment_type: paymentType || 'mobile',
        customer: {
          phone_number: customerPhone || booking.customerPhone,
          email: customerEmail,
          name: customerName || booking.customerName,
        },
        metadata: {
          user_id: userId,
          booking_id: bookingId,
          service_name: booking.serviceName,
        },
        callback_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/bookings?payment=pending`,
        webhook_url: `${process.env.SERVER_URL || "http://localhost:3000"}/api/payment/webhook`,
      }),
    });

    const snippeData = await snippeResponse.json();

    if (!snippeResponse.ok) {
      console.error('[snippe] Booking payment failed:', snippeData);
      return res.status(snippeResponse.status).json({
        error: snippeData.message || "Failed to create payment",
        details: snippeData,
      });
    }

    // Update booking with payment info
    await updateBookingPaymentStatus(
      userId,
      bookingId,
      'pending',
      snippeData.reference,
      snippeData.payment_url
    );

    // Save transaction
    await createPaymentTransaction({
      userId,
      snippeReference: snippeData.reference,
      amount: booking.price,
      currency: "TZS",
      paymentType: paymentType || 'mobile',
      planType: 'booking',
      status: snippeData.status || 'pending',
      customerPhone: customerPhone || booking.customerPhone,
      customerEmail,
      customerName: customerName || booking.customerName,
      metadata: { bookingId, snippeData },
    });

    console.log('[snippe] Booking payment created:', snippeData.reference);
    res.json({
      success: true,
      reference: snippeData.reference,
      status: snippeData.status,
      paymentUrl: snippeData.payment_url,
      qrCode: snippeData.qr_code,
    });
  } catch (error) {
    console.error('[snippe] Error creating booking payment:', error);
    res.status(500).json({ error: "Failed to create booking payment" });
  }
});

// ========================================
// SNIPPE PAYMENT API
// ========================================

// Create a payment via Snippe
app.post("/api/payment/create", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const { amount, paymentType, planType, customerPhone, customerEmail, customerName } = req.body;

    if (!amount || !paymentType) {
      return res.status(400).json({ error: "Amount and payment type are required" });
    }

    // Get user's Snippe API key
    const settings = await pgGetPaymentSettings(userId);
    const apiKey = settings?.snippeApiKey || process.env.SNIPPE_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "Snippe API key not configured. Please configure payment settings or contact admin." });
    }

    // Create payment via Snippe API
    const snippeResponse = await fetch("https://api.snippe.sh/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `chati-${userId}-${Date.now()}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency: "TZS",
        payment_type: paymentType,
        customer: {
          phone_number: customerPhone,
          email: customerEmail,
          name: customerName,
        },
        metadata: {
          user_id: userId,
          plan_type: planType,
        },
        callback_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/billing?payment=pending`,
        webhook_url: `${process.env.SERVER_URL || "http://localhost:3000"}/api/payment/webhook`,
      }),
    });

    const snippeData = await snippeResponse.json();

    if (!snippeResponse.ok) {
      console.error('[snippe] Payment creation failed:', snippeData);
      return res.status(snippeResponse.status).json({
        error: snippeData.message || "Failed to create payment",
        details: snippeData,
      });
    }

    // Save transaction to database
    const transaction = await createPaymentTransaction({
      userId,
      snippeReference: snippeData.reference,
      amount,
      currency: "TZS",
      paymentType,
      planType,
      status: snippeData.status || "pending",
      customerPhone,
      customerEmail,
      customerName,
      metadata: { snippeData },
    });

    console.log('[snippe] Payment created:', snippeData.reference);
    res.json({
      success: true,
      reference: snippeData.reference,
      status: snippeData.status,
      paymentUrl: snippeData.payment_url,
      qrCode: snippeData.qr_code,
      transaction,
    });
  } catch (error) {
    console.error('[snippe] Error creating payment:', error);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

// Snippe webhook handler
app.post("/api/payment/webhook", async (req, res) => {
  try {
    const { event, data } = req.body;

    console.log('[webhook] Snippe webhook received:', event, data?.reference);

    if (!data?.reference) {
      return res.status(400).json({ error: "Missing reference" });
    }

    // Update transaction status
    const statusMap = {
      "payment.completed": "completed",
      "payment.failed": "failed",
      "payment.pending": "pending",
      "payment.refunded": "refunded",
    };

    const newStatus = statusMap[event] || data.status;
    await updatePaymentTransaction(data.reference, { status: newStatus });

    // Get transaction to determine what type of payment this is
    const transaction = await getPaymentTransactionByReference(data.reference);
    if (!transaction) {
      console.log('[webhook] No transaction found for reference:', data.reference);
      return res.json({ success: true });
    }

    const { userId, planType, metadata } = transaction;

    // Handle booking payments
    if (planType === 'booking' && metadata?.booking_id) {
      const bookingId = metadata.booking_id;
      const bookingPaymentStatus = event === "payment.completed" ? 'paid' : event === "payment.failed" ? 'failed' : 'pending';
      
      await updateBookingPaymentStatus(userId, bookingId, bookingPaymentStatus, data.reference);
      console.log('[webhook] Booking payment updated:', bookingId, bookingPaymentStatus);
    }

    // Handle payment item payments
    if (planType?.startsWith('item:')) {
      const itemId = planType.replace('item:', '');
      console.log('[webhook] Payment item payment:', itemId, 'status:', event);
      // Payment item transactions are tracked but don't require additional processing
      // The item itself remains active/inactive based on user settings
    }

    // If payment completed, activate user subscription
    if (event === "payment.completed") {
      // Determine package and features based on plan type
      const planConfig = getPlanConfig(planType);
      if (planConfig) {
        const payDate = new Date().toISOString();
        await updateUserSubscription(userId, {
          payDate,
          package: planConfig.package,
          status: "active",
        });

        // Update enabled features
        const pool = ensurePool();
        if (pool) {
          await pool.query(
            'UPDATE users SET enabled_features = $1 WHERE id = $2',
            [JSON.stringify(planConfig.features), userId]
          );
        }

        console.log('[webhook] Subscription activated for user:', userId, planConfig.package);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[webhook] Error processing webhook:', error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Get user's payment transactions
app.get("/api/payment/transactions", async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const transactions = await getPaymentTransactionsByUserId(userId);
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('[payment] Error fetching transactions:', error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Helper function to get plan configuration
function getPlanConfig(planType) {
  const plans = {
    starter: {
      package: "starter",
      features: ["conversations", "settings", "billing"],
    },
    business: {
      package: "business",
      features: ["conversations", "bookings", "settings", "billing"],
    },
    store: {
      package: "store",
      features: ["store", "settings", "billing"],
    },
    "starter+store": {
      package: "starter+store",
      features: ["conversations", "store", "settings", "billing"],
    },
    "business+store": {
      package: "business+store",
      features: ["conversations", "bookings", "store", "settings", "billing"],
    },
  };
  return plans[planType] || null;
}

// Global error handlers
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Don't exit - just log
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit - just log
});

// Quick admin promotion endpoint (remove after first admin is created)
app.post("/api/admin/promote", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const pool = ensurePool();
    if (!pool) {
      return res.status(500).json({ error: 'Database unavailable' });
    }
    
    await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', email]);
    
    res.json({ success: true, message: `${email} is now an admin` });
  } catch (error) {
    console.error('[admin] Promotion error:', error);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

console.log("[startup] About to call app.listen()...");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("error", (err) => {
  console.error("[startup] Server error:", err);
  process.exit(1);
});
