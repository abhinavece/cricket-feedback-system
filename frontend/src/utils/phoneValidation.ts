/**
 * Validates and sanitizes Indian phone numbers
 * Ensures 10-digit format without +91 or 91 prefix
 */

export const validateIndianPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's exactly 10 digits
  if (cleaned.length === 10) {
    return true;
  }
  
  // Check if it's 12 digits starting with 91 (country code)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return true;
  }
  
  return false;
};

export const sanitizeIndianPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 91 and has 12 digits, remove the country code
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.substring(2);
  }
  
  // If it's already 10 digits, return as is
  if (cleaned.length === 10) {
    return cleaned;
  }
  
  // Otherwise return the cleaned version
  return cleaned;
};

export const formatPhoneNumberForDisplay = (phone: string): string => {
  const sanitized = sanitizeIndianPhoneNumber(phone);
  if (sanitized.length === 10) {
    return `${sanitized.substring(0, 5)} ${sanitized.substring(5)}`;
  }
  return phone;
};
