const crypto = require('crypto');

/**
 * Normalize roll number to uppercase and trim whitespace
 * @param {string|number} rollNo - Roll number to normalize
 * @returns {string} - Normalized roll number
 */
const normalizeRollNo = (rollNo) => {
  if (!rollNo) return '';
  return String(rollNo).trim().toUpperCase();
};

/**
 * Normalize college name to standard enum values
 * @param {string} college - College name to normalize
 * @returns {string|null} - Normalized college name or null if invalid
 */
const normalizeCollege = (college) => {
  if (!college) return null;

  const mapping = {
    'KIET GROUP': 'KIET',
    'KIET GROUP OF INSTITUTIONS': 'KIET',
    'KIET ENGINEERING': 'KIET',
    'KIET ENGINEERING COLLEGE': 'KIET',
    'KIET GHAZIABAD': 'KIET',
    'KIEK': 'KIEK',
    'KIEK GHAZIABAD': 'KIEK',
    'KIEW': 'KIEW',
    'KIEW GHAZIABAD': 'KIEW'
  };

  const normalized = String(college).trim().toUpperCase();

  // Check direct mapping first
  if (mapping[normalized]) {
    return mapping[normalized];
  }

  // Check if it contains KIET/KIEK/KIEW
  if (normalized.includes('KIET')) return 'KIET';
  if (normalized.includes('KIEK')) return 'KIEK';
  if (normalized.includes('KIEW')) return 'KIEW';

  // If exact match with enum values
  if (['KIET', 'KIEK', 'KIEW'].includes(normalized)) {
    return normalized;
  }

  return null;
};

/**
 * Normalize branch name to standard enum values
 * @param {string} branch - Branch name to normalize
 * @returns {string|null} - Normalized branch name or null if invalid
 */
const normalizeBranch = (branch) => {
  if (!branch) return null;

  const mapping = {
    // Computer Science variations
    'CS': 'CSE',
    'COMPUTER SCIENCE': 'CSE',
    'COMPUTER SCIENCE AND ENGINEERING': 'CSE',
    'COMPUTER SCIENCE ENGINEERING': 'CSE',
    'CSD': 'CSE', // Map old CSD to CSE

    // AI & Data Science
    'AI&DS': 'AID',
    'ARTIFICIAL INTELLIGENCE': 'AID',
    'ARTIFICIAL INTELLIGENCE & DATA SCIENCE': 'AID',
    'AI DS': 'AID',
    'ARTIFICIAL INTELLIGENCE AND DATA SCIENCE': 'AID',

    // CS & ML
    'CS & ML': 'CSM',
    'CS ML': 'CSM',
    'COMPUTER SCIENCE AND MACHINE LEARNING': 'CSM',
    'COMPUTER SCIENCE MACHINE LEARNING': 'CSM',

    // AI & ML
    'AI&ML': 'CAI',
    'AI ML': 'CAI',
    'ARTIFICIAL INTELLIGENCE & MACHINE LEARNING': 'CAI',
    'ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING': 'CAI',

    // Cyber Security
    'CSBS': 'CSC',
    'CS & CYBER': 'CSC',
    'CS CYBER': 'CSC',
    'CYBER SECURITY': 'CSC',
    'COMPUTER SCIENCE AND CYBER SECURITY': 'CSC',

    // Electronics & Communication
    'EC': 'ECE',
    'ELECTRONICS': 'ECE',
    'ELECTRONICS AND COMMUNICATION': 'ECE',
    'ELECTRONICS AND COMMUNICATION ENGINEERING': 'ECE',
    'ELECTRONICS & COMMUNICATION': 'ECE',
    'ELECTRONICS & COMMUNICATION ENGINEERING': 'ECE',

    // Mechanical
    'MECHANICAL': 'MECH',
    'MECHANICAL ENGINEERING': 'MECH',
    'ME': 'MECH',

    // Civil
    'CIVIL ENGINEERING': 'CIVIL',
    'CE': 'CIVIL',

    // Electrical & Electronics
    'ELECTRICAL': 'EEE',
    'ELECTRICAL AND ELECTRONICS': 'EEE',
    'ELECTRICAL AND ELECTRONICS ENGINEERING': 'EEE',
    'ELECTRICAL & ELECTRONICS': 'EEE',
    'ELECTRICAL & ELECTRONICS ENGINEERING': 'EEE',
    'EE': 'EEE'
  };

  const normalized = String(branch).trim().toUpperCase();

  // Check direct mapping
  if (mapping[normalized]) {
    return mapping[normalized];
  }

  // If exact match with enum values
  if (['AID', 'CSM', 'CAI', 'CSD', 'CSC', 'CSE', 'ECE', 'MECH', 'CIVIL', 'EEE'].includes(normalized)) {
    return normalized;
  }

  return null;
};

/**
 * Parse FMML and KHUB activities into otherClubs array
 * @param {string|boolean|number} fmml - FMML participation indicator
 * @param {string|boolean|number} khub - KHUB participation indicator
 * @returns {string[]} - Array of club names
 */
const parseActivities = (fmml, khub) => {
  const clubs = [];

  const fmmlVal = String(fmml || '').trim().toLowerCase();
  const khubVal = String(khub || '').trim().toLowerCase();

  const positiveValues = ['yes', 'y', '1', 'true'];

  // FMML participants are part of K-Hub
  if (positiveValues.includes(fmmlVal)) {
    clubs.push('k-hub');
  }

  // KHUB participants
  if (positiveValues.includes(khubVal)) {
    if (!clubs.includes('k-hub')) {
      clubs.push('k-hub');
    }
  }

  return clubs;
};

/**
 * Normalize phone number to 10 digits
 * @param {string|number} phone - Phone number
 * @returns {string} - Normalized 10-digit phone number or default
 */
const normalizePhone = (phone) => {
  if (!phone) return '0000000000';

  // Extract only digits
  const digits = String(phone).replace(/\D/g, '');

  // Take last 10 digits
  if (digits.length >= 10) {
    return digits.slice(-10);
  }

  return '0000000000';
};

/**
 * Parse CTC from various formats
 * @param {string|number} ctc - CTC value (can be "12.5 LPA", "12,50,000", etc.)
 * @returns {number|null} - Parsed CTC as number in LPA
 */
const parseCTC = (ctc) => {
  if (ctc === null || ctc === undefined || String(ctc).trim() === '') return null;

  // Extract numeric value only
  const numericStr = String(ctc).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(numericStr);

  if (isNaN(parsed)) return null;

  // If value is very large (like 1250000), assume it's in rupees, convert to LPA
  if (parsed > 1000) {
    return parsed / 100000;
  }

  return parsed;
};

/**
 * Validate year format and normalize to 4-digit year
 * @param {string|number} year - Year value
 * @returns {number|null} - 4-digit year or null if invalid
 */
const normalizeYear = (year) => {
  if (!year) return null;

  let yearNum = parseInt(year);

  if (isNaN(yearNum)) return null;

  // If 2-digit year (like 25), convert to 2025
  if (yearNum >= 0 && yearNum <= 99) {
    yearNum = 2000 + yearNum;
  }

  // Validate reasonable year range (2020-2030)
  if (yearNum < 2020 || yearNum > 2030) {
    return null;
  }

  return yearNum;
};

/**
 * Generate MD5 hash of file content for duplicate detection
 * @param {Buffer} fileContent - File content buffer
 * @returns {string} - MD5 hash
 */
const generateFileHash = (fileContent) => {
  return crypto.createHash('md5').update(fileContent).digest('hex');
};

/**
 * Sanitize cell value to prevent formula injection
 * @param {any} value - Cell value
 * @returns {string} - Sanitized value
 */
const sanitizeCellValue = (value) => {
  if (value == null) return '';

  const strValue = String(value);

  // If starts with potentially dangerous characters, prefix with single quote
  if (/^[=+\-@]/.test(strValue)) {
    return `'${strValue}`;
  }

  return strValue;
};

/**
 * Validate required fields for placement data
 * @param {Object} row - Row data
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
const validateRequiredFields = (row) => {
  const errors = [];
  const requiredFields = ['Roll No', 'Name', 'College', 'Branch', 'Year', 'Company', 'CTC (LPA)'];

  // Normalize row keys by removing asterisks
  const normalizedRow = {};
  Object.keys(row).forEach(key => {
    const cleanKey = key.replace(/\*/g, '').trim();
    normalizedRow[cleanKey] = row[key];
  });

  requiredFields.forEach(field => {
    const val = normalizedRow[field];
    if (val === null || val === undefined || String(val).trim() === '') {
      errors.push(`Missing required field: ${field}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Generate unique email for imported students
 * @param {string} rollNo - Roll number
 * @param {string} existingEmail - Existing email if any
 * @returns {string} - Unique email
 */
const generateUniqueEmail = (rollNo, existingEmail = null) => {
  if (existingEmail && existingEmail !== '' && !existingEmail.includes('imported.placeholder')) {
    return existingEmail;
  }

  const timestamp = Date.now();
  return `${rollNo.toLowerCase()}.${timestamp}@imported.placeholder`;
};

module.exports = {
  normalizeRollNo,
  normalizeCollege,
  normalizeBranch,
  parseActivities,
  normalizePhone,
  parseCTC,
  normalizeYear,
  generateFileHash,
  sanitizeCellValue,
  validateRequiredFields,
  generateUniqueEmail
};
