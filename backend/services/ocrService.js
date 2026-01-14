/**
 * OCR Service using Google Cloud Vision API
 *
 * Extracts payment amounts from UPI/bank transfer screenshots.
 * Uses Google Cloud Vision for accurate text detection.
 * Free tier: 1000 requests/month
 */

const vision = require('@google-cloud/vision');

// Initialize client with service account credentials
// Expects either GOOGLE_CLOUD_KEYFILE env var or google-cloud-key.json in project root
let client = null;

const getVisionClient = () => {
  if (client) return client;

  const keyFilename = process.env.GOOGLE_CLOUD_KEYFILE || './google-cloud-key.json';

  try {
    client = new vision.ImageAnnotatorClient({
      keyFilename
    });
    console.log('✅ Google Cloud Vision client initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Google Cloud Vision:', error.message);
    console.error('   Make sure GOOGLE_CLOUD_KEYFILE env var is set or google-cloud-key.json exists');
    client = null;
  }

  return client;
};

/**
 * Extract payment amount from screenshot buffer using Google Cloud Vision
 * @param {Buffer} imageBuffer - Image data as Buffer
 * @returns {Promise<{amount: number|null, confidence: number, rawText: string, success: boolean}>}
 */
const extractAmountFromScreenshot = async (imageBuffer) => {
  try {
    console.log('🔍 Starting Google Cloud Vision OCR extraction...');

    const visionClient = getVisionClient();

    if (!visionClient) {
      console.log('⚠️ Google Cloud Vision not configured - skipping OCR');
      return {
        amount: null,
        confidence: 0,
        rawText: '',
        success: false,
        error: 'Vision API not configured'
      };
    }

    // Use Google Cloud Vision TEXT_DETECTION
    const [result] = await visionClient.textDetection({
      image: { content: imageBuffer.toString('base64') }
    });

    const fullText = result.fullTextAnnotation?.text || '';

    if (!fullText) {
      console.log('⚠️ No text detected in image');
      return {
        amount: null,
        confidence: 0,
        rawText: '',
        success: false
      };
    }

    console.log(`✅ OCR completed, extracted ${fullText.length} characters`);

    // Parse amount from the extracted text
    const amount = parseAmountFromText(fullText);

    if (amount) {
      console.log(`💰 Extracted amount: ₹${amount}`);
    } else {
      console.log('⚠️ Could not extract amount from text');
      console.log('   Raw text preview:', fullText.substring(0, 200));
    }

    return {
      amount,
      confidence: amount ? 85 : 0, // Google Vision doesn't return per-text confidence
      rawText: fullText,
      success: !!amount
    };
  } catch (error) {
    console.error('❌ Google Cloud Vision OCR failed:', error.message);

    // Check for common errors
    if (error.message.includes('Could not load the default credentials')) {
      console.error('   → Google Cloud credentials not found. Set GOOGLE_CLOUD_KEYFILE or add google-cloud-key.json');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.error('   → Vision API not enabled or service account lacks permissions');
    }

    return {
      amount: null,
      confidence: 0,
      rawText: '',
      success: false,
      error: error.message
    };
  }
};

/**
 * Parse amount from OCR text
 * Handles various Indian payment formats from UPI apps (GPay, PhonePe, Paytm, etc.)
 * Google Vision provides cleaner text than Tesseract, so these patterns work better
 *
 * @param {string} text - Raw OCR text
 * @returns {number|null} - Extracted amount or null
 */
const parseAmountFromText = (text) => {
  if (!text) return null;

  // Normalize the text - keep original case for first pass, then try lowercase
  const normalizedText = text
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ');

  // Patterns to match Indian currency amounts
  // Priority order: most specific to least specific
  const patterns = [
    // Pattern 1: "₹1,000" or "₹ 1,000" - most reliable indicator
    /[₹]\s*([\d,]+(?:\.\d{1,2})?)/i,

    // Pattern 2: "paid ₹1,000" or "paid rs.1000" or "sent ₹500"
    /(?:paid|sent|transferred|credited|debited|received)\s*[₹rs.]*\s*([\d,]+(?:\.\d{1,2})?)/i,

    // Pattern 3: "Rs." or "Rs" or "INR" followed by amount
    /(?:rs\.?|inr|rupees?)\s*([\d,]+(?:\.\d{1,2})?)/i,

    // Pattern 4: "amount: 1,000" or "Amount ₹1000"
    /amount[:\s]*[₹rs.]*\s*([\d,]+(?:\.\d{1,2})?)/i,

    // Pattern 5: "total: 1,000" or "Total ₹1000"
    /total[:\s]*[₹rs.]*\s*([\d,]+(?:\.\d{1,2})?)/i,

    // Pattern 6: "you paid 500" - common in GPay
    /you\s+paid\s+[₹rs.]*\s*([\d,]+(?:\.\d{1,2})?)/i,

    // Pattern 7: Amount after "to" in payment context - "Paid to X ₹500"
    /paid\s+to\s+\w+[^₹\d]*[₹rs.]*\s*([\d,]+(?:\.\d{1,2})?)/i
  ];

  // Try patterns on original text first
  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const amountStr = match[1];
      const amount = parseIndianAmount(amountStr);

      // Validate: amount should be between 1 and 1,00,000 (reasonable match fee range)
      if (amount && amount >= 1 && amount <= 100000) {
        return amount;
      }
    }
  }

  // Fallback: Look for large standalone numbers that look like amounts
  // This is less reliable but catches cases where currency symbols aren't detected
  const fallbackPattern = /\b([\d,]{3,}(?:\.\d{1,2})?)\b/g;
  const matches = normalizedText.match(fallbackPattern) || [];

  for (const match of matches) {
    const amount = parseIndianAmount(match);
    // More restrictive range for fallback
    if (amount && amount >= 100 && amount <= 50000) {
      return amount;
    }
  }

  return null;
};

/**
 * Parse Indian formatted amount string to number
 * Handles formats like "1,00,000" (Indian) and "100,000" (International)
 *
 * @param {string} amountStr - Amount string with possible commas
 * @returns {number|null} - Parsed number or null
 */
const parseIndianAmount = (amountStr) => {
  if (!amountStr) return null;

  // Remove all commas and spaces
  const cleaned = amountStr.replace(/[,\s]/g, '');

  // Parse as float
  const amount = parseFloat(cleaned);

  // Return as integer if it's a whole number, otherwise keep decimals
  if (isNaN(amount)) return null;

  return amount % 1 === 0 ? Math.round(amount) : amount;
};

/**
 * Validate if extracted amount matches expected amount
 * @param {number} extractedAmount - Amount from OCR
 * @param {number} expectedAmount - Expected payment amount
 * @param {number} tolerancePercent - Tolerance percentage (default 5%)
 * @returns {{isMatch: boolean, difference: number, percentDiff: number}}
 */
const validateAmount = (extractedAmount, expectedAmount, tolerancePercent = 5) => {
  if (!extractedAmount || !expectedAmount) {
    return { isMatch: false, difference: null, percentDiff: null };
  }

  const difference = extractedAmount - expectedAmount;
  const percentDiff = Math.abs(difference / expectedAmount) * 100;
  const isMatch = percentDiff <= tolerancePercent;

  return {
    isMatch,
    difference,
    percentDiff: Math.round(percentDiff * 100) / 100
  };
};

module.exports = {
  extractAmountFromScreenshot,
  parseAmountFromText,
  parseIndianAmount,
  validateAmount
};
