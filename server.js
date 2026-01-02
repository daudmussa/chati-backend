import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
import Twilio from "twilio";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { initSchema, saveUserCredentials, getUserCredentials, getUserByPhoneNumber, mapPhoneToUser, deleteUserCredentials, getAllUsers, getBusinessSettings as pgGetBusinessSettings, saveBusinessSettings as pgSaveBusinessSettings, upsertConversation, addMessage, listConversations, createUser, getUserByEmail, getUserById, ensurePool, updateUserFeatures, updateUserLimits, getStoreSettings as pgGetStoreSettings, saveStoreSettings as pgSaveStoreSettings, getStoreByName as pgGetStoreByName, listProducts, getProductsByStore, saveProduct, deleteProduct, listOrders, createOrder, updateOrderStatus, getBookingSettings, setBookingStatus, listServices, saveService, deleteService, listBookings, createBooking, updateBookingStatus } from "./db-postgres.js";

console.log("[startup] Loading env...");
dotenv.config();
dotenv.config({ path: '.env.railway' });

// Railway fallback: set DATABASE_URL directly if not present
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  process.env.DATABASE_URL = 'postgresql://postgres:GiWEMBYWQdFsbVaydlZcNpuAOhIqYXMt@trolley.proxy.rlwy.net:23856/railway';
  console.log("[startup] Set DATABASE_URL from hardcoded Railway fallback (public proxy)");
}

console.log("[startup] Env loaded, checking DATABASE_URL...");
console.log("- DATABASE_URL exists?", !!process.env.DATABASE_URL);
console.log("- DATABASE_URL value:", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET');
console.log("[startup] Initializing app...");
// Initialize Postgres schema (if DATABASE_URL is set)
await initSchema();
console.log("[debug] Raw process.env check:");
console.log("- process.env.CLAUDE_API_KEY exists?", !!process.env.CLAUDE_API_KEY);
console.log("- process.env.TWILIO_ACCOUNT_SID exists?", !!process.env.TWILIO_ACCOUNT_SID);
console.log("- First 20 chars of CLAUDE_API_KEY:", process.env.CLAUDE_API_KEY?.substring(0, 20));
console.log("- PGHOST exists?", !!process.env.PGHOST);

const app = express();

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-role');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
console.log("- JWT_SECRET:", JWT_SECRET !== "your-secret-key-change-in-production" ? "Set" : "Using default (CHANGE THIS)")

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

  // Process asynchronously with 33 second delay
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
      if (userCreds?.userId) {
        try {
          const bookingSettings = await getBookingSettings(userCreds.userId);
          userBookingsEnabled = bookingSettings.enabled || false;
          userServices = await listServices(userCreds.userId);
          userBookings = await listBookings(userCreds.userId);
        } catch (e) {
          console.warn('[webhook] Failed to load booking settings:', e.message);
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

      if (isChangeRequest && conversation.lastBookingId) {
        // Handle booking change request
        const existingBooking = userBookings.find(b => b.id === conversation.lastBookingId);
        
        if (existingBooking && existingBooking.status === 'pending') {
          const service = userServices.find(s => s.id === existingBooking.serviceId);
          
          if (service) {
            // Detect language from conversation
            const swahiliKeywords = ['ndiyo', 'ndio', 'nafasi', 'naomba', 'nataka', 'je', 'sawa', 'ahsante', 'tafadhali', 'habari', 'badilisha', 'ahirisha'];
            const isSwahili = swahiliKeywords.some(word => incomingMsg.toLowerCase().includes(word));
            const lang = isSwahili ? 'sw' : 'en';
            
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
            const swahiliKeywords = ['ndiyo', 'ndio', 'nafasi', 'naomba', 'nataka', 'je', 'sawa', 'ahsante', 'tafadhali', 'habari', 'badilisha', 'ahirisha'];
            const isSwahili = swahiliKeywords.some(word => incomingMsg.toLowerCase().includes(word));
            messageToSend = isSwahili 
              ? "Samahani, sikuweza kupata huduma ya nafasi yako. Tafadhali wasiliana nasi moja kwa moja."
              : "Sorry, I couldn't find the service for your booking. Please contact us directly.";
          }
        } else if (existingBooking) {
          const swahiliKeywords = ['ndiyo', 'ndio', 'nafasi', 'naomba', 'nataka', 'je', 'sawa', 'ahsante', 'tafadhali', 'habari', 'badilisha', 'ahirisha'];
          const isSwahili = swahiliKeywords.some(word => incomingMsg.toLowerCase().includes(word));
          messageToSend = isSwahili
            ? `Nafasi yako tayari ni ${existingBooking.status}. Tafadhali wasiliana nasi moja kwa moja kubadilisha.`
            : `Your booking is already ${existingBooking.status}. Please contact us directly to make changes.`;
        } else {
          const swahiliKeywords = ['ndiyo', 'ndio', 'nafasi', 'naomba', 'nataka', 'je', 'sawa', 'ahsante', 'tafadhali', 'habari', 'badilisha', 'ahirisha'];
          const isSwahili = swahiliKeywords.some(word => incomingMsg.toLowerCase().includes(word));
          messageToSend = isSwahili
            ? "Sikuweza kupata nafasi yako ya hivi karibuni. Tafadhali toa nambari ya uhakikisho au fanya nafasi mpya."
            : "I couldn't find your recent booking. Please provide your booking ID or make a new booking.";
        }
      } else if (userState || isBookingInquiry) {
        // User is in booking flow or asking about bookings
        
        if (!userState && isBookingInquiry) {
          // Detect language (simple detection based on common Swahili words)
          const swahiliKeywords = ['ndiyo', 'ndio', 'nafasi', 'naomba', 'nataka', 'je', 'sawa', 'ahsante', 'tafadhali', 'habari'];
          const isSwahili = swahiliKeywords.some(word => incomingMsg.toLowerCase().includes(word));
          conversation.language = isSwahili ? 'sw' : 'en';
          
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
              
              if (bookingIndex >= 0) {
                const oldBooking = userBookings[bookingIndex];
                bookings[bookingIndex] = {
                  ...oldBooking,
                  customerName: customerName,
                  notes: oldBooking.notes + ' | Name updated via WhatsApp',
                };
                
                console.log('✅ Booking name updated:', bookings[bookingIndex]);
                
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
                
                if (bookingIndex >= 0) {
                  const oldBooking = userBookings[bookingIndex];
                  bookings[bookingIndex] = {
                    ...oldBooking,
                    dateBooked: selectedDate,
                    timeSlot: selectedTime,
                    // Update name if it was changed during edit flow
                    customerName: userState.customerName || oldBooking.customerName,
                    notes: oldBooking.notes + ' | Updated via WhatsApp',
                  };
                  
                  console.log('✅ Booking updated:', bookings[bookingIndex]);
                  
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
                  
                  if (lang === 'sw') {
                    messageToSend = `✅ *Nafasi Imebadilishwa!*\n\n` +
                      `🆔 Nambari ya Uhakikisho: ${oldBooking.id}\n` +
                      `👤 Jina: ${bookings[bookingIndex].customerName}\n` +
                      `📋 Huduma: ${oldBooking.serviceName}\n` +
                      `📅 Tarehe Mpya: ${dateFormatted}\n` +
                      `⏰ Saa Mpya: ${selectedTime}\n` +
                      `💰 Bei: TZS ${oldBooking.price.toLocaleString()}\n\n` +
                      `Nafasi yako imebadilishwa kikamilifu!`;
                  } else {
                    messageToSend = `✅ *Booking Updated!*\n\n` +
                      `🆔 Booking ID: ${oldBooking.id}\n` +
                      `👤 Name: ${bookings[bookingIndex].customerName}\n` +
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
        // Check for redirection keywords BEFORE processing with AI
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
            
            systemPrompt = `You are a ${toneDescription} customer service representative for this business:\n\n${bizSettings.businessDescription}\n\nRespond helpfully to customer inquiries about the business. Respond in the same language the customer uses (English or Swahili). Give concise answers using complete sentences only. Limit replies to 1-3 full sentences unless the user explicitly asks for more detail. IMPORTANT: Do NOT repeat or summarize the business description above in your reply; use it only to inform your answer.`;
          }
          
          // Add booking information if enabled
          if (userBookingsEnabled && userServices.length > 0) {
            systemPrompt += `\n\nIMPORTANT: This business has a booking system enabled. If a customer asks about bookings, appointments, reservations, or scheduling, inform them they can book by saying "I want to book" or "I'd like to make a reservation".`;
          }

          console.log(`Sending ${conversation.messages.length} messages to Claude for ${from}`);

          const claudeResponse = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
              model: "claude-3-haiku-20240307",
              max_tokens: 150,
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
            messageToSend = "Thanks for your message! Our team will review that and get back to you soon.";
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
          const fromNumber = `whatsapp:${USER_TWILIO_PHONE_NUMBER}`;
          
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
  }, 33000);
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
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  try {
    const settings = (await pgGetBusinessSettings(userId)) || businessSettings;
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
      
      allUsers.push({
        userId: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        storeName: settings?.businessName || settings?.businessDescription || 'No business name',
        storePhone: credentials?.twilioPhoneNumber || 'No phone',
        storeId: dbUser.id.slice(0, 8),
        ordersCount: 0, // TODO: Add orders table
        bookingsCount: 0, // TODO: Add bookings table
        totalRevenue: 0,
        isCurrent: dbUser.id === requestingUserId,
        enabledFeatures: dbUser.enabled_features || ['conversations', 'store', 'bookings', 'settings', 'billing'],
        limits: {
          maxConversations: 100,
          maxProducts: 50,
        },
        currentCounts: {
          conversations: conversations.length,
          products: 0, // TODO: Add products table
        },
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
  
  if (!limits || typeof limits !== 'object') {
    return res.status(400).json({ error: 'limits must be an object' });
  }
  
  try {
    const updatedLimits = {
      maxConversations: limits.maxConversations || 100,
      maxProducts: limits.maxProducts || 50,
    };
    await updateUserLimits(userId, updatedLimits);
    console.log('[admin] User limits updated:', userId, updatedLimits);
    res.json({ success: true, userId, limits: updatedLimits });
  } catch (error) {
    console.error('[admin] Error updating limits:', error);
    res.status(500).json({ error: 'Failed to update limits' });
  }
});

// Health check endpoint
// ========================================
// AUTHENTICATION API
// ========================================

// Signup endpoint
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
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
    const user = await createUser(email, passwordHash, name || email.split('@')[0]);
    
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
        enabledFeatures: user.enabled_features || ['conversations', 'store', 'bookings', 'settings', 'billing']
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
        enabledFeatures: user.enabled_features || ['conversations', 'store', 'bookings', 'settings', 'billing']
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
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        enabledFeatures: user.enabled_features || ['conversations', 'store', 'bookings', 'settings', 'billing']
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
