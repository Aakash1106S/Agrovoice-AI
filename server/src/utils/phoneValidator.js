/**
 * Validates and normalizes an Indian mobile phone number to E.164 (+91XXXXXXXXXX).
 * Indian mobile numbers: 10 digits starting with 6, 7, 8, or 9.
 */
export function validateAndNormalizePhone(phoneInput) {
  if (!phoneInput || typeof phoneInput !== 'string') {
    return {
      isValid: false,
      normalized: '',
      error: 'Phone number is required',
    };
  }

  // Remove spaces, hyphens, parentheses, and dots
  const cleaned = phoneInput.replace(/[\s\-\(\)\.]/g, '');

  let digits = '';
  if (cleaned.startsWith('+91')) {
    digits = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    digits = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    digits = cleaned.slice(1);
  } else if (cleaned.length === 10) {
    digits = cleaned;
  } else {
    return {
      isValid: false,
      normalized: '',
      error: 'Invalid format. Must be an Indian mobile number (+91 or 10 digits starting with 6-9)',
    };
  }

  // Check 10 digits and starting with 6-9
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(digits)) {
    return {
      isValid: false,
      normalized: '',
      error: 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9',
    };
  }

  return {
    isValid: true,
    normalized: `+91${digits}`,
  };
}

/**
 * Masks a phone number for privacy in API responses and logs.
 * Format: +91 98*** **456
 */
export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const norm = phone.replace(/[\s\-\(\)]/g, '');
  if (norm.startsWith('+91') && norm.length === 13) {
    const d = norm.slice(3);
    return `+91 ${d.slice(0, 2)}*** **${d.slice(7)}`;
  }
  if (norm.length >= 10) {
    const last3 = norm.slice(-3);
    const first2 = norm.slice(0, 2);
    return `${first2}*** **${last3}`;
  }
  return '***-***-****';
}
