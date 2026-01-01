import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
import Twilio from "twilio";
import { saveUserCredentials, getUserCredentials, getUserByPhoneNumber, mapPhoneToUser, deleteUserCredentials, getAllUsers } from "./database.js";

console.log("[startup] Loading env...");
dotenv.config();
console.log("[startup] Env loaded, initializing app...");
console.log("[debug] Raw process.env check:");
console.log("- process.env.CLAUDE_API_KEY exists?", !!process.env.CLAUDE_API_KEY);
console.log("- process.env.TWILIO_ACCOUNT_SID exists?", !!process.env.TWILIO_ACCOUNT_SID);
console.log("- First 20 chars of CLAUDE_API_KEY:", process.env.CLAUDE_API_KEY?.substring(0, 20));

const app = express();

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id');
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

console.log("[config] Environment check:");
console.log("- CLAUDE_API_KEY:", CLAUDE_API_KEY ? `Set (${CLAUDE_API_KEY.substring(0, 10)}...)` : "MISSING");
console.log("- TWILIO_ACCOUNT_SID:", TWILIO_ACCOUNT_SID ? `Set (${TWILIO_ACCOUNT_SID.substring(0, 10)}...)` : "MISSING");
console.log("- TWILIO_AUTH_TOKEN:", TWILIO_AUTH_TOKEN ? "Set" : "MISSING");
console.log("- TWILIO_PHONE_NUMBER:", TWILIO_PHONE_NUMBER || "MISSING");
console.log("- BYPASS_CLAUDE:", BYPASS_CLAUDE);

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

  console.log("Message from WhatsApp:", incomingMsg, "from:", from);

  // Send immediate acknowledgment to Twilio
  res.type("text/xml");
  res.send(`<Response></Response>`);

  // Process asynchronously with 33 second delay
  setTimeout(async () => {
    try {
      // Get user credentials based on incoming phone number
      const userCreds = getUserByPhoneNumber(from);
      
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

      // Get or create conversation history for this phone number
      if (!conversationHistory.has(from)) {
        conversationHistory.set(from, {
          messages: [],
          lastActivity: Date.now(),
        });
      }
      
      const conversation = conversationHistory.get(from);
      conversation.lastActivity = Date.now();
      
      // Add user message to history
      conversation.messages.push({
        role: "user",
        content: incomingMsg,
      });
      
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
        const existingBooking = bookings.find(b => b.id === conversation.lastBookingId);
        
        if (existingBooking && existingBooking.status === 'pending') {
          const service = services.find(s => s.id === existingBooking.serviceId);
          
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
          if (bookingsEnabled && services.length > 0) {
            let servicesText = isSwahili 
              ? "Ndiyo, unaweza kufanya booking! 📅\n\nHizi ndizo huduma zetu:\n\n"
              : "Yes, booking is available! 📅\n\nHere are our services:\n\n";
            
            services.forEach((service, index) => {
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
              messageToSend = bookingsEnabled 
                ? "Samahani, hakuna huduma za booking kwa sasa. Tafadhali rudi baadaye." 
                : "Samahani, booking haipatikani kwa sasa. Tafadhali wasiliana nasi moja kwa moja.";
            } else {
              messageToSend = bookingsEnabled 
                ? "Sorry, we don't have any services available for booking at the moment. Please check back later." 
                : "Sorry, booking is currently not available. Please contact us directly for assistance.";
            }
          }
        } else if (userState && userState.step === 'awaiting_service') {
          // User is selecting a service
          const serviceNum = parseInt(incomingMsg.trim());
          
          if (serviceNum > 0 && serviceNum <= services.length) {
            const selectedService = services[serviceNum - 1];
            
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
              const bookingIndex = bookings.findIndex(b => b.id === userState.editingBookingId);
              
              if (bookingIndex >= 0) {
                const oldBooking = bookings[bookingIndex];
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
            
            const selectedService = services.find(s => s.id === userState.serviceId);
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
            const selectedService = services.find(s => s.id === userState.serviceId);
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
            const selectedService = services.find(s => s.id === userState.serviceId);
            
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
                const bookingIndex = bookings.findIndex(b => b.id === userState.editingBookingId);
                
                if (bookingIndex >= 0) {
                  const oldBooking = bookings[bookingIndex];
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
                
                const booking = {
                  id: Math.random().toString(36).substr(2, 9),
                  customerName: customerName,
                  customerPhone: from.replace('whatsapp:', ''),
                  serviceId: userState.serviceId,
                  serviceName: userState.serviceName,
                  dateBooked: selectedDate,
                  timeSlot: selectedTime,
                  price: userState.price,
                  status: 'pending',
                  notes: 'Booked via WhatsApp',
                  createdAt: new Date().toISOString(),
                };
                
                bookings.push(booking);
                console.log('✅ Booking created:', booking);
                
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
        const hasRedirectionKeyword = businessSettings.keywords.some(keyword => 
          lowerMsg.includes(keyword.toLowerCase())
        );

        if (hasRedirectionKeyword && businessSettings.supportPhone) {
          // User mentioned a redirection keyword and we have support contact
          const conversation = conversationHistory.get(from) || {};
          const lang = conversation.language || 'en';
          
          if (lang === 'sw') {
            messageToSend = `Naelewa unahitaji msaada maalum. Tafadhali wasiliana na ${businessSettings.supportName} kwenye WhatsApp: ${businessSettings.supportPhone}`;
          } else {
            messageToSend = `I understand you need specialized assistance. Please contact ${businessSettings.supportName} on WhatsApp: ${businessSettings.supportPhone}`;
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
          if (businessSettings.businessDescription) {
            const toneMap = {
              'professional': 'professional and formal',
              'friendly': 'friendly and casual',
              'enthusiastic': 'enthusiastic and energetic',
              'helpful': 'helpful and supportive',
              'concise': 'concise and direct'
            };
            const toneDescription = toneMap[businessSettings.tone] || 'friendly';
            
            systemPrompt = `You are a ${toneDescription} customer service representative for this business:\n\n${businessSettings.businessDescription}\n\nRespond helpfully to customer inquiries about the business. Respond in the same language the customer uses (English or Swahili). Give concise answers using complete sentences only. Limit replies to 1-3 full sentences unless the user explicitly asks for more detail. IMPORTANT: Do NOT repeat or summarize the business description above in your reply; use it only to inform your answer.`;
          }
          
          // Add booking information if enabled
          if (bookingsEnabled && services.length > 0) {
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
app.get("/api/conversations", (req, res) => {
  try {
    const conversations = [];
    
    for (const [phoneNumber, data] of conversationHistory.entries()) {
      if (data.messages.length === 0) continue;
      
      // Get customer name from conversation data or use phone number fallback
      const lastDigits = phoneNumber.replace(/\D/g, '').slice(-4);
      const customerName = data.customerName || `Customer ${lastDigits}`;
      
      // Format messages
      const messages = data.messages.map((msg, index) => ({
        id: `${phoneNumber}-${index}`,
        text: msg.content,
        sender: msg.role === 'user' ? 'customer' : 'ai',
        timestamp: new Date(data.lastActivity).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }),
      }));
      
      // Get last message
      const lastMessage = data.messages[data.messages.length - 1];
      
      // Calculate time ago
      const timeDiff = Date.now() - data.lastActivity;
      let timeAgo = '';
      if (timeDiff < 60000) {
        timeAgo = 'Just now';
      } else if (timeDiff < 3600000) {
        timeAgo = `${Math.floor(timeDiff / 60000)} min ago`;
      } else if (timeDiff < 86400000) {
        timeAgo = `${Math.floor(timeDiff / 3600000)} hour${Math.floor(timeDiff / 3600000) > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = `${Math.floor(timeDiff / 86400000)} day${Math.floor(timeDiff / 86400000) > 1 ? 's' : ''} ago`;
      }
      
      conversations.push({
        id: phoneNumber,
        customerNumber: phoneNumber.replace('whatsapp:', ''),
        customerName: customerName,
        lastMessage: lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : ''),
        timestamp: timeAgo,
        unread: 0, // We don't track unread for now
        messages: messages,
      });
    }
    
    // Sort by last activity (most recent first)
    conversations.sort((a, b) => {
      const timeA = conversationHistory.get(a.id).lastActivity;
      const timeB = conversationHistory.get(b.id).lastActivity;
      return timeB - timeA;
    });
    
    res.json(conversations);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Bookings API endpoints
app.get("/api/bookings/status", (req, res) => {
  res.json({ enabled: bookingsEnabled });
});

app.post("/api/bookings/toggle", (req, res) => {
  bookingsEnabled = req.body.enabled;
  console.log(`Bookings ${bookingsEnabled ? 'enabled' : 'disabled'}`);
  res.json({ enabled: bookingsEnabled });
});

app.get("/api/bookings", (req, res) => {
  res.json(bookings);
});

app.post("/api/bookings", (req, res) => {
  const booking = {
    ...req.body,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
  };
  bookings.push(booking);
  console.log('New booking created:', booking);
  res.json(booking);
});

app.put("/api/bookings/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const booking = bookings.find(b => b.id === id);
  
  if (booking) {
    booking.status = status;
    console.log(`Booking ${id} status updated to ${status}`);
    res.json(booking);
  } else {
    res.status(404).json({ error: 'Booking not found' });
  }
});

// Services API endpoints
app.get("/api/services", (req, res) => {
  res.json(services);
});

app.post("/api/services", (req, res) => {
  const service = req.body;
  const existingIndex = services.findIndex(s => s.id === service.id);
  
  if (existingIndex >= 0) {
    services[existingIndex] = service;
  } else {
    services.push(service);
  }
  
  console.log('Service saved:', service);
  res.json(service);
});

app.put("/api/services", (req, res) => {
  const service = req.body;
  const index = services.findIndex(s => s.id === service.id);
  
  if (index >= 0) {
    services[index] = service;
    console.log('Service updated:', service);
    res.json(service);
  } else {
    res.status(404).json({ error: 'Service not found' });
  }
});

app.delete("/api/services/:id", (req, res) => {
  const { id } = req.params;
  const index = services.findIndex(s => s.id === id);
  
  if (index >= 0) {
    services.splice(index, 1);
    console.log('Service deleted:', id);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Service not found' });
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

app.get("/api/store/settings", (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  res.json(getStoreSettings(userId));
});

app.put("/api/store/settings", (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  
  const { storeName, storePhone } = req.body;
  const settings = getStoreSettings(userId);
  
  if (storeName !== undefined) {
    if (!storeName || storeName.trim().length === 0) {
      return res.status(400).json({ error: 'Store name is required' });
    }
    settings.storeName = storeName.trim();
  }
  
  if (storePhone !== undefined) {
    settings.storePhone = storePhone.trim();
  }
  
  storeSettingsByUser.set(userId, settings);
  console.log('Store settings updated:', settings);
  res.json(settings);
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
app.get("/api/store/by-name/:storeName", (req, res) => {
  const { storeName } = req.params;
  
  // Normalize store names for comparison (lowercase, trim)
  const normalizedRequestName = storeName.toLowerCase().trim().replace(/\s+/g, '-');
  
  // Search through all user stores
  for (const [userId, settings] of storeSettingsByUser.entries()) {
    const normalizedStoreName = settings.storeName.toLowerCase().trim().replace(/\s+/g, '-');
    if (normalizedRequestName === normalizedStoreName) {
      return res.json(settings);
    }
  }
  
  res.status(404).json({ error: 'Store not found' });
});

// Business settings API
app.get("/api/business/settings", (req, res) => {
  res.json(businessSettings);
});

app.put("/api/business/settings", (req, res) => {
  const { businessDescription, tone, sampleReplies, keywords, supportName, supportPhone } = req.body;
  
  if (businessDescription !== undefined) {
    businessSettings.businessDescription = businessDescription;
  }
  if (tone !== undefined) {
    businessSettings.tone = tone;
  }
  if (sampleReplies !== undefined) {
    businessSettings.sampleReplies = sampleReplies;
  }
  if (keywords !== undefined) {
    businessSettings.keywords = keywords;
  }
  if (supportName !== undefined) {
    businessSettings.supportName = supportName;
  }
  if (supportPhone !== undefined) {
    businessSettings.supportPhone = supportPhone;
  }
  
  console.log('Business settings updated:', businessSettings);
  res.json(businessSettings);
});

// Orders API
app.get("/api/orders", (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  const userOrders = orders.filter(o => o.userId === userId);
  res.json(userOrders);
});

app.post("/api/orders", (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  
  const { customerName, customerPhone, items, totalAmount, totalItems } = req.body;
  
  if (!customerName || !customerPhone || !items || !totalAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const order = {
    id: Math.random().toString(36).substr(2, 9),
    userId,
    customerName,
    customerPhone,
    items,
    totalAmount,
    totalItems,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  orders.unshift(order); // Add to beginning
  console.log('New order created:', order);
  res.json(order);
});

app.put("/api/orders/:id", (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  
  const { id } = req.params;
  const { status } = req.body;
  
  const order = orders.find(o => o.id === id && o.userId === userId);
  if (order) {
    order.status = status;
    console.log('Order status updated:', id, status);
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Admin API - Get all users and their data
app.get("/api/admin/users", (req, res) => {
  const requestingUserId = req.headers['x-user-id'];
  const requestingUserRole = req.headers['x-user-role'];
  
  // Only admins can access this endpoint
  if (requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const allUsers = [];
  
  // Get all store settings (which includes userId)
  for (const [userId, settings] of storeSettingsByUser.entries()) {
    const userOrders = orders.filter(o => o.userId === userId);
    const userBookings = bookings.filter(b => b.userId === userId);
    const userProducts = products.filter(p => p.userId === userId);
    
    // Get user features from localStorage simulation (in real app, from database)
    const userFeatures = settings.enabledFeatures || ['conversations', 'store', 'bookings', 'settings', 'billing'];
    const userLimits = settings.limits || { maxConversations: 100, maxProducts: 50 };
    
    // Count conversations for this user
    let conversationCount = 0;
    for (const [phone, data] of conversationHistory.entries()) {
      if (data.userId === userId) {
        conversationCount++;
      }
    }
    
    allUsers.push({
      userId,
      storeName: settings.storeName,
      storePhone: settings.storePhone,
      storeId: settings.storeId,
      ordersCount: userOrders.length,
      bookingsCount: userBookings.length,
      totalRevenue: userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      isCurrent: userId === requestingUserId,
      enabledFeatures: userFeatures,
      limits: userLimits,
      currentCounts: {
        conversations: conversationCount,
        products: userProducts.length,
      },
    });
  }
  
  res.json(allUsers);
});

// Admin API - Update user features
app.put("/api/admin/users/:userId/features", (req, res) => {
  const requestingUserRole = req.headers['x-user-role'];
  
  if (requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { userId } = req.params;
  const { enabledFeatures } = req.body;
  
  if (!enabledFeatures || !Array.isArray(enabledFeatures)) {
    return res.status(400).json({ error: 'enabledFeatures must be an array' });
  }
  
  // Get or create store settings for this user
  const settings = getStoreSettings(userId);
  settings.enabledFeatures = enabledFeatures;
  storeSettingsByUser.set(userId, settings);
  
  console.log('User features updated:', userId, enabledFeatures);
  res.json({ success: true, userId, enabledFeatures });
});

// Admin API - Update user limits
app.put("/api/admin/users/:userId/limits", (req, res) => {
  const requestingUserRole = req.headers['x-user-role'];
  
  if (requestingUserRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { userId } = req.params;
  const { limits } = req.body;
  
  if (!limits || typeof limits !== 'object') {
    return res.status(400).json({ error: 'limits must be an object' });
  }
  
  // Get or create store settings for this user
  const settings = getStoreSettings(userId);
  settings.limits = {
    maxConversations: limits.maxConversations || 100,
    maxProducts: limits.maxProducts || 50,
  };
  storeSettingsByUser.set(userId, settings);
  
  console.log('User limits updated:', userId, settings.limits);
  res.json({ success: true, userId, limits: settings.limits });
});

// Health check endpoint
// ========================================
// USER CREDENTIALS MANAGEMENT API
// ========================================

// Save/Update user credentials
app.put("/api/user/credentials", (req, res) => {
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
    saveUserCredentials(userId, {
      claudeApiKey,
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
      businessContext,
      bypassClaude
    });

    // Map phone number to user if provided
    if (twilioPhoneNumber) {
      mapPhoneToUser(twilioPhoneNumber, userId);
    }

    console.log('[credentials] Successfully saved credentials for user:', userId);
    res.json({ success: true, message: "Credentials saved successfully" });
  } catch (error) {
    console.error("[credentials] Error saving credentials:", error);
    res.status(500).json({ error: "Failed to save credentials", details: error.message });
  }
});

// Get user credentials
app.get("/api/user/credentials", (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const credentials = getUserCredentials(userId);
    
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
app.delete("/api/user/credentials", (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    deleteUserCredentials(userId);
    res.json({ success: true, message: "Credentials deleted successfully" });
  } catch (error) {
    console.error("Error deleting credentials:", error);
    res.status(500).json({ error: "Failed to delete credentials" });
  }
});

// Admin: Get all users with credentials
app.get("/api/admin/users/credentials", (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    
    if (!userId || userRole !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const users = getAllUsers();
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

// Global error handlers
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Don't exit - just log
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit - just log
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
