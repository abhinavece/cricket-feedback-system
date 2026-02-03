/**
 * @fileoverview File Parser Service
 * 
 * Handles parsing of Excel (xlsx) and CSV files for bulk tournament entry imports.
 * Supports automatic column detection and field mapping.
 * 
 * @module services/fileParserService
 */

const XLSX = require('xlsx');

// Known column name mappings (case-insensitive)
const COLUMN_MAPPINGS = {
  // Name variations
  name: ['name', 'player name', 'full name', 'fullname', 'player', 'participant'],
  
  // Phone variations
  phone: ['phone', 'mobile', 'contact', 'phone number', 'mobile number', 'contact number', 'whatsapp', 'cell'],
  
  // Email variations
  email: ['email', 'e-mail', 'email address', 'mail'],
  
  // DOB variations
  dateOfBirth: ['dob', 'date of birth', 'birth date', 'birthdate', 'birthday', 'age'],
  
  // CricHeroes ID variations
  cricHeroesId: ['cricheroes', 'cricheroes id', 'cricherosid', 'ch id', 'chid', 'cricheroes profile'],
  
  // Role variations
  role: ['role', 'playing role', 'player role', 'position', 'type', 'player type', 'category'],
  
  // Company variations
  companyName: ['company', 'company name', 'organization', 'org', 'employer', 'firm', 'corporate'],
  
  // Address variations
  address: ['address', 'location', 'city', 'area', 'place'],
  
  // Team variations
  teamName: ['team', 'team name', 'squad', 'group', 'franchise'],
  
  // Jersey number variations
  jerseyNumber: ['jersey', 'jersey number', 'jersey no', 'number', 'shirt number', 'shirt no']
};

// Role normalization mapping
const ROLE_MAPPINGS = {
  'batsman': ['batsman', 'batter', 'batsmen', 'batting'],
  'bowler': ['bowler', 'bowling', 'bowlers'],
  'all-rounder': ['all-rounder', 'allrounder', 'all rounder', 'ar'],
  'wicket-keeper': ['wicket-keeper', 'wicketkeeper', 'wk', 'keeper', 'wicket keeper'],
  'captain': ['captain', 'c', 'capt'],
  'vice-captain': ['vice-captain', 'vice captain', 'vc', 'vicecaptain'],
  'coach': ['coach', 'trainer'],
  'manager': ['manager', 'mgr'],
  'player': ['player', 'regular', 'default']
};

/**
 * Parse Excel or CSV buffer and return parsed rows
 * 
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename (for extension detection)
 * @returns {Object} { headers, rows, suggestedMapping }
 */
function parseFile(buffer, filename) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  
  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with headers
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  if (jsonData.length < 2) {
    throw new Error('File must have at least a header row and one data row');
  }
  
  // First row is headers
  const headers = jsonData[0].map(h => String(h).trim());
  
  // Rest are data rows
  const rows = jsonData.slice(1)
    .filter(row => row.some(cell => cell !== '')) // Filter empty rows
    .map((row, index) => {
      const rowObj = { _rowNumber: index + 2 }; // 1-indexed, accounting for header
      headers.forEach((header, colIndex) => {
        rowObj[header] = row[colIndex] !== undefined ? row[colIndex] : '';
      });
      return rowObj;
    });
  
  // Suggest field mapping based on headers
  const suggestedMapping = suggestFieldMapping(headers);
  
  return {
    headers,
    rows,
    rowCount: rows.length,
    suggestedMapping
  };
}

/**
 * Suggest field mapping based on header names
 * 
 * @param {string[]} headers - Column headers from file
 * @returns {Object} Mapping of our fields to source column names
 */
function suggestFieldMapping(headers) {
  const mapping = {};
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  Object.entries(COLUMN_MAPPINGS).forEach(([ourField, variations]) => {
    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim();
      if (variations.some(v => normalizedHeader === v || normalizedHeader.includes(v))) {
        mapping[ourField] = header;
        break;
      }
    }
  });
  
  return mapping;
}

/**
 * Transform rows using the provided column mapping
 * 
 * @param {Object[]} rows - Parsed rows from file
 * @param {Object} columnMapping - Mapping of our fields to source columns
 * @returns {Object[]} Transformed entries ready for database
 */
function transformRows(rows, columnMapping) {
  return rows.map(row => {
    const entry = {
      _rowNumber: row._rowNumber
    };
    
    // Map each field
    if (columnMapping.name) {
      entry.name = normalizeText(row[columnMapping.name]);
    }
    
    if (columnMapping.phone) {
      entry.phone = normalizePhone(row[columnMapping.phone]);
    }
    
    if (columnMapping.email) {
      entry.email = normalizeEmail(row[columnMapping.email]);
    }
    
    if (columnMapping.dateOfBirth) {
      entry.dateOfBirth = parseDateOfBirth(row[columnMapping.dateOfBirth]);
    }
    
    if (columnMapping.cricHeroesId) {
      entry.cricHeroesId = normalizeText(row[columnMapping.cricHeroesId]);
    }
    
    if (columnMapping.role) {
      entry.role = normalizeRole(row[columnMapping.role]);
    }
    
    if (columnMapping.companyName) {
      entry.companyName = normalizeText(row[columnMapping.companyName]);
    }
    
    if (columnMapping.address) {
      entry.address = normalizeText(row[columnMapping.address]);
    }
    
    if (columnMapping.teamName) {
      entry.teamName = normalizeText(row[columnMapping.teamName]);
    }
    
    if (columnMapping.jerseyNumber) {
      const num = parseInt(row[columnMapping.jerseyNumber], 10);
      entry.jerseyNumber = isNaN(num) ? null : num;
    }
    
    return entry;
  });
}

/**
 * Validate transformed entries
 * 
 * @param {Object[]} entries - Transformed entries
 * @returns {Object} { valid, invalid, duplicates }
 */
function validateEntries(entries) {
  const valid = [];
  const invalid = [];
  const seen = new Map(); // Track duplicates by phone/email
  const duplicates = [];
  
  entries.forEach(entry => {
    const errors = [];
    
    // Name is required
    if (!entry.name) {
      errors.push('Name is required');
    }
    
    // Check for duplicates
    const phoneKey = entry.phone ? `phone:${entry.phone}` : null;
    const emailKey = entry.email ? `email:${entry.email}` : null;
    
    if (phoneKey && seen.has(phoneKey)) {
      duplicates.push({
        entry,
        duplicateOf: seen.get(phoneKey),
        reason: 'Duplicate phone number'
      });
      return;
    }
    
    if (emailKey && seen.has(emailKey)) {
      duplicates.push({
        entry,
        duplicateOf: seen.get(emailKey),
        reason: 'Duplicate email'
      });
      return;
    }
    
    if (errors.length > 0) {
      invalid.push({ entry, errors });
    } else {
      valid.push(entry);
      if (phoneKey) seen.set(phoneKey, entry._rowNumber);
      if (emailKey) seen.set(emailKey, entry._rowNumber);
    }
  });
  
  return { valid, invalid, duplicates };
}

// ============================================
// NORMALIZATION HELPERS
// ============================================

function normalizeText(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizePhone(value) {
  if (!value) return '';
  let phone = String(value).trim();
  
  // Remove common formatting
  phone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Handle Excel number format (may have scientific notation or missing leading zero)
  if (/^\d+$/.test(phone)) {
    // Indian numbers: add +91 if 10 digits
    if (phone.length === 10) {
      phone = '+91' + phone;
    } else if (phone.length === 12 && phone.startsWith('91')) {
      phone = '+' + phone;
    }
  }
  
  // Ensure + prefix for international format
  if (phone.match(/^91\d{10}$/)) {
    phone = '+' + phone;
  }
  
  return phone;
}

function normalizeEmail(value) {
  if (!value) return '';
  return String(value).trim().toLowerCase();
}

function normalizeRole(value) {
  if (!value) return 'player';
  const normalized = String(value).toLowerCase().trim();
  
  for (const [role, variations] of Object.entries(ROLE_MAPPINGS)) {
    if (variations.some(v => normalized === v || normalized.includes(v))) {
      return role;
    }
  }
  
  return 'player';
}

function parseDateOfBirth(value) {
  if (!value) return null;
  
  // If already a Date object (from Excel)
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  
  // Try parsing string formats
  const str = String(value).trim();
  
  // Common formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const formats = [
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/, // DD/MM/YYYY or DD-MM-YYYY
    /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/, // YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = str.match(format);
    if (match) {
      let year, month, day;
      if (match[3].length === 4) {
        // DD/MM/YYYY
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        year = parseInt(match[3], 10);
      } else {
        // YYYY-MM-DD
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        day = parseInt(match[3], 10);
      }
      
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2020) {
        return date;
      }
    }
  }
  
  // Try native parsing as fallback
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

module.exports = {
  parseFile,
  suggestFieldMapping,
  transformRows,
  validateEntries,
  COLUMN_MAPPINGS,
  ROLE_MAPPINGS
};
