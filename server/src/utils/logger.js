import { maskPhone } from './phoneValidator.js';

function scrubSensitiveData(arg) {
  if (typeof arg === 'string') {
    // Replace E.164 phone numbers (+91XXXXXXXXXX)
    let scrubbed = arg.replace(/\+91[6-9]\d{9}/g, (match) => maskPhone(match));
    // Replace 10 digit Indian mobile numbers
    scrubbed = scrubbed.replace(/\b[6-9]\d{9}\b/g, (match) => {
      return `${match.slice(0, 2)}*** **${match.slice(7)}`;
    });
    // Replace jwt or bearer tokens or passwords
    scrubbed = scrubbed.replace(/(Bearer\s+)[A-Za-z0-9\-_.]+/gi, '$1[REDACTED]');
    scrubbed = scrubbed.replace(/("password":\s*")[^"]+(")/gi, '$1[REDACTED]$2');
    return scrubbed;
  }
  if (typeof arg === 'object' && arg !== null) {
    if (Array.isArray(arg)) {
      return arg.map(scrubSensitiveData);
    }
    const cleanObj = {};
    for (const [key, val] of Object.entries(arg)) {
      if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
        cleanObj[key] = '[REDACTED]';
      } else if (key === 'phone' || key.toLowerCase().includes('phone')) {
        cleanObj[key] = typeof val === 'string' ? maskPhone(val) : val;
      } else {
        cleanObj[key] = scrubSensitiveData(val);
      }
    }
    return cleanObj;
  }
  return arg;
}

export const logger = {
  info: (...args) => {
    const scrubbed = args.map(scrubSensitiveData);
    console.log(`[INFO] [${new Date().toISOString()}]`, ...scrubbed);
  },
  warn: (...args) => {
    const scrubbed = args.map(scrubSensitiveData);
    console.warn(`[WARN] [${new Date().toISOString()}]`, ...scrubbed);
  },
  error: (...args) => {
    const scrubbed = args.map(scrubSensitiveData);
    console.error(`[ERROR] [${new Date().toISOString()}]`, ...scrubbed);
  },
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      const scrubbed = args.map(scrubSensitiveData);
      console.debug(`[DEBUG] [${new Date().toISOString()}]`, ...scrubbed);
    }
  },
};
