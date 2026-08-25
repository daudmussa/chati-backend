/**
 * Natural Language Date/Time Parser
 * Understands various date and time expressions in English and Swahili
 */

// Month name mappings
const monthNames = {
  en: {
    full: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
    short: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  },
  sw: {
    full: ['januari', 'februari', 'machi', 'aprili', 'mei', 'juni', 'julai', 'agosti', 'septemba', 'oktoba', 'novemba', 'desemba'],
    short: ['jan', 'feb', 'mach', 'apr', 'mei', 'jun', 'jul', 'ago', 'sep', 'okt', 'nov', 'des']
  }
};

// Day name mappings
const dayNames = {
  en: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  sw: ['jumapili', 'jumatatu', 'jumanne', 'jumatano', 'alhamisi', 'ijumaa', 'jumamosi']
};

// Relative day expressions
const relativeDays = {
  en: {
    'today': 0,
    'tomorrow': 1,
    'next week': 7,
    'in a week': 7,
    'in two weeks': 14,
    'next month': 30
  },
  sw: {
    'leo': 0,
    'kesho': 1,
    'keshokutwa': 2,
    'wiki ijayo': 7,
    'mwezi ujao': 30
  }
};

// Time expressions - REMOVED: Only explicit time formats are now accepted

/**
 * Parse natural language date expression
 * @param {string} input - User input text
 * @param {Array} availableDates - Array of available date strings (ISO format)
 * @param {string} language - 'en' or 'sw'
 * @returns {Object} - { date: ISO string|null, found: boolean }
 */
export function parseNaturalDate(input, availableDates = [], language = 'en') {
  const normalizedInput = input.toLowerCase().trim();
  const result = { date: null, found: false, confidence: 'low' };
  
  if (!availableDates || availableDates.length === 0) {
    return result;
  }
  
  // Try parsing relative expressions first (today, tomorrow, etc.)
  const relativeMatch = parseRelativeDate(normalizedInput, language);
  if (relativeMatch) {
    const matchedDate = relativeMatch.toISOString().split('T')[0];
    if (availableDates.includes(matchedDate)) {
      result.date = matchedDate;
      result.found = true;
      result.confidence = 'high';
      return result;
    }
  }
  
  // Try day of week (Monday, Tuesday, etc.)
  const dayOfWeekMatch = parseDayOfWeek(normalizedInput, language);
  if (dayOfWeekMatch) {
    const matchedDate = dayOfWeekMatch.toISOString().split('T')[0];
    if (availableDates.includes(matchedDate)) {
      result.date = matchedDate;
      result.found = true;
      result.confidence = 'medium';
      return result;
    }
  }
  
  // Try month name patterns
  const monthMatch = parseMonthName(normalizedInput, language);
  if (monthMatch) {
    const { day, month, year } = monthMatch;
    const matchedDate = findMatchingDate(year, month, day, availableDates);
    if (matchedDate) {
      result.date = matchedDate;
      result.found = true;
      result.confidence = 'high';
      return result;
    }
  }
  
  // Try numeric date patterns (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.)
  const numericMatch = parseNumericDate(normalizedInput);
  if (numericMatch) {
    const { day, month, year } = numericMatch;
    const matchedDate = findMatchingDate(year, month, day, availableDates);
    if (matchedDate) {
      result.date = matchedDate;
      result.found = true;
      result.confidence = 'high';
      return result;
    }
  }
  
  // Fallback: try fuzzy matching against available dates
  const fuzzyMatch = fuzzyMatchDate(normalizedInput, availableDates, language);
  if (fuzzyMatch) {
    result.date = fuzzyMatch;
    result.found = true;
    result.confidence = 'medium';
    return result;
  }
  
  return result;
}

/**
 * Parse natural language time expression
 * @param {string} input - User input text
 * @param {Array} availableTimes - Array of available time slots
 * @param {string} language - 'en' or 'sw'
 * @returns {Object} - { time: string|null, found: boolean }
 */
export function parseNaturalTime(input, availableTimes = [], language = 'en') {
  const normalizedInput = input.toLowerCase().trim();
  const result = { time: null, found: false, confidence: 'low' };
  
  // Only parse explicit time formats (10AM, 10:00AM, 10:00 AM, etc.)
  const explicitMatch = parseExplicitTime(normalizedInput);
  if (explicitMatch) {
    if (availableTimes && availableTimes.length > 0) {
      // Validate against available times
      const normalizedInputTime = normalizeTime(explicitMatch);
      for (const slot of availableTimes) {
        if (normalizeTime(slot) === normalizedInputTime) {
          result.time = slot;
          result.found = true;
          result.confidence = 'high';
          return result;
        }
      }
      // If no exact match, still return the parsed time
      result.time = explicitMatch;
      result.found = true;
      result.confidence = 'medium';
      return result;
    } else {
      result.time = explicitMatch;
      result.found = true;
      result.confidence = 'high';
      return result;
    }
  }
  
  return result;
}

/**
 * Parse both date and time from input
 * @param {string} input - User input text
 * @param {Array} availableDates - Array of available dates
 * @param {Array} availableTimes - Array of available times
 * @param {string} language - 'en' or 'sw'
 * @returns {Object} - { date: string|null, time: string|null, dateFound: boolean, timeFound: boolean }
 */
export function parseDateTime(input, availableDates = [], availableTimes = [], language = 'en') {
  const dateResult = parseNaturalDate(input, availableDates, language);
  const timeResult = parseNaturalTime(input, availableTimes, language);
  
  return {
    date: dateResult.date,
    time: timeResult.time,
    dateFound: dateResult.found,
    timeFound: timeResult.found,
    dateConfidence: dateResult.confidence,
    timeConfidence: timeResult.confidence
  };
}

// Helper functions

function parseRelativeDate(input, language) {
  const expressions = relativeDays[language] || relativeDays.en;
  
  for (const [expr, days] of Object.entries(expressions)) {
    if (input.includes(expr)) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date;
    }
  }
  
  return null;
}

function parseDayOfWeek(input, language) {
  const days = language === 'sw' ? dayNames.sw : dayNames.en;
  const today = new Date();
  
  for (let i = 0; i < days.length; i++) {
    if (input.includes(days[i])) {
      const currentDay = today.getDay();
      let daysUntilTarget = i - currentDay;
      
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7; // Next occurrence
      }
      
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntilTarget);
      return targetDate;
    }
  }
  
  return null;
}

function parseMonthName(input, language) {
  const months = {
    ...monthNames[language]?.full.reduce((acc, name, i) => ({ ...acc, [name]: i }), {}),
    ...monthNames[language]?.short.reduce((acc, name, i) => ({ ...acc, [name]: i }), {}),
    ...monthNames.en.full.reduce((acc, name, i) => ({ ...acc, [name]: i }), {}),
    ...monthNames.en.short.reduce((acc, name, i) => ({ ...acc, [name]: i }), {})
  };
  
  // Try pattern: "5 January", "January 5", "5th of January", etc.
  for (const [monthName, monthIndex] of Object.entries(months)) {
    const monthPattern = new RegExp(`\\b${monthName}\\b`, 'i');
    if (monthPattern.test(input)) {
      // Extract day number
      const dayMatch = input.match(/(\d{1,2})(?:st|nd|rd|th)?/);
      const day = dayMatch ? parseInt(dayMatch[1]) : 1;
      
      // Extract year if present
      const yearMatch = input.match(/\b(20\d{2}|20\d{2})\b/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      return { day, month: monthIndex, year };
    }
  }
  
  return null;
}

function parseNumericDate(input) {
  // Try ISO format: YYYY-MM-DD
  const isoMatch = input.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return { year: parseInt(isoMatch[1]), month: parseInt(isoMatch[2]) - 1, day: parseInt(isoMatch[3]) };
  }
  
  // Try MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = input.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const first = parseInt(slashMatch[1]);
    const second = parseInt(slashMatch[2]);
    const year = parseInt(slashMatch[3]);
    
    // Heuristic: if first > 12, it's DD/MM
    if (first > 12) {
      return { day: first, month: second - 1, year };
    } else if (second > 12) {
      return { day: second, month: first - 1, year };
    } else {
      // Assume MM/DD/YYYY (US format)
      return { day: second, month: first - 1, year };
    }
  }
  
  // Try DD-MM-YYYY
  const dashMatch = input.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dashMatch) {
    const first = parseInt(dashMatch[1]);
    const second = parseInt(dashMatch[2]);
    const year = parseInt(dashMatch[3]);
    
    if (first > 12) {
      return { day: first, month: second - 1, year };
    } else if (second > 12) {
      return { day: second, month: first - 1, year };
    } else {
      return { day: first, month: second - 1, year };
    }
  }
  
  return null;
}

function findMatchingDate(year, month, day, availableDates) {
  const targetDate = new Date(year, month, day);
  const targetISO = targetDate.toISOString().split('T')[0];
  
  // Exact match
  if (availableDates.includes(targetISO)) {
    return targetISO;
  }
  
  // Try to find matching day and month regardless of year
  for (const dateStr of availableDates) {
    const dateObj = new Date(dateStr);
    if (dateObj.getDate() === day && dateObj.getMonth() === month) {
      return dateStr;
    }
  }
  
  return null;
}

function fuzzyMatchDate(input, availableDates, language) {
  const months = [
    ...monthNames[language]?.full || [],
    ...monthNames[language]?.short || [],
    ...monthNames.en.full || [],
    ...monthNames.en.short || []
  ];
  
  for (const dateStr of availableDates) {
    const dateObj = new Date(dateStr);
    const day = dateObj.getDate();
    const monthLong = dateObj.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
    const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
    
    // Check if day and month are mentioned
    if (input.includes(day.toString()) && (input.includes(monthLong) || input.includes(monthShort))) {
      return dateStr;
    }
  }
  
  return null;
}

function parseExplicitTime(input) {
  // Clean the input for better matching
  const cleanInput = input.toLowerCase().trim();
  
  // Pattern 1: "10:00 AM" or "10:00AM"
  let match = cleanInput.match(/(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.)/i);
  if (match) {
    let hour = parseInt(match[1]);
    const minute = match[2];
    const meridiem = match[3].toUpperCase().replace(/\./g, '');
    
    if (meridiem.startsWith('P') && hour < 12) hour += 12;
    if (meridiem.startsWith('A') && hour === 12) hour = 0;
    const formattedHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${formattedHour}:${minute} ${meridiem.startsWith('P') ? 'PM' : 'AM'}`;
  }
  
  // Pattern 2: "10 AM" or "10AM" (hour only with meridiem)
  match = cleanInput.match(/\b(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)/i);
  if (match && !cleanInput.includes(':')) {
    let hour = parseInt(match[1]);
    const meridiem = match[2].toUpperCase().replace(/\./g, '');
    
    if (meridiem.startsWith('P') && hour < 12) hour += 12;
    if (meridiem.startsWith('A') && hour === 12) hour = 0;
    const formattedHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${formattedHour}:00 ${meridiem.startsWith('P') ? 'PM' : 'AM'}`;
  }
  
  // Pattern 3: "14:00" or "10:00" (24-hour or explicit time without meridiem)
  match = cleanInput.match(/\b(\d{1,2}):(\d{2})\b/);
  if (match) {
    let hour = parseInt(match[1]);
    const minute = match[2];
    
    // If hour > 12, assume 24-hour format
    if (hour >= 12) {
      const formattedHour = hour > 12 ? hour - 12 : 12;
      return `${formattedHour}:${minute} PM`;
    } else {
      const formattedHour = hour === 0 ? 12 : hour;
      return `${formattedHour}:${minute} AM`;
    }
  }
  
  return null;
}

function normalizeTime(time) {
  return time.replace(/\s/g, '').toUpperCase();
}

/**
 * Get suggested date/time expressions for user guidance
 */
export function getSuggestedExpressions(language = 'en') {
  const isSwahili = language === 'sw';
  
  return {
    dateExamples: isSwahili
      ? ['Leo', 'Kesho', 'Jumatatu', '5 Januari', '5/1/2025']
      : ['Today', 'Tomorrow', 'Monday', 'January 5', '1/5/2025'],
    timeExamples: isSwahili
      ? ['10:00 AM', '2:00 PM', '10AM', '2:30PM']
      : ['10:00 AM', '2:00 PM', '10AM', '2:30PM']
  };
}
