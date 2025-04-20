import * as jose from 'jose';

export interface DecodedJwt {
  header: any;
  payload: any;
  signature: string;
  isValid: boolean;
  error?: string;
  signatureVerified?: boolean;
  verificationError?: string;
}

export const decodeJwt = (token: string): DecodedJwt => {
  try {
    // Split the token to get the signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        header: {},
        payload: {},
        signature: '',
        isValid: false,
        error: 'Invalid token format'
      };
    }

    // Decode header and payload
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    const signature = parts[2];

    return {
      header,
      payload,
      signature,
      isValid: true
    };
  } catch (error) {
    return {
      header: {},
      payload: {},
      signature: '',
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Formatting timestamp to readable date
export const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp * 1000).toLocaleString();
};

// Checking if a timestamp has expired
export const isExpired = (exp?: number): boolean => {
  if (!exp) return false;
  return Date.now() >= exp * 1000;
};

// Generate a JWT token
export const generateJwt = async (
  payload: Record<string, any>,
  secretKey: string,
  options: { algorithm?: string; expiresIn?: string }
): Promise<string> => {
  try {
    // Create a new signing key using TextEncoder for browser compatibility
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    
    // Handle expiration
    if (options.expiresIn) {
      const duration = parseDuration(options.expiresIn);
      payload.exp = Math.floor((Date.now() + duration) / 1000);
    }

    // Sign the payload
    const alg = options.algorithm || 'HS256';
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg })
      .sign(keyData);

    return jwt;
  } catch (error) {
    throw new Error(`Failed to generate token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper to parse duration strings like "1h", "2d", etc.
const parseDuration = (duration: string): number => {
  const regex = /^(\d+)([smhdw])$/;
  const match = duration.match(regex);
  
  if (!match) {
    // Default to seconds if format is not recognized
    return parseInt(duration, 10) * 1000;
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000; // seconds
    case 'm': return value * 60 * 1000; // minutes
    case 'h': return value * 60 * 60 * 1000; // hours
    case 'd': return value * 24 * 60 * 60 * 1000; // days
    case 'w': return value * 7 * 24 * 60 * 60 * 1000; // weeks
    default: return value * 1000; // seconds
  }
};

// Verify JWT signature
export const verifyJwtSignature = async (
  token: string, 
  secretKey: string
): Promise<{ verified: boolean; error?: string }> => {
  try {
    if (!token || !secretKey) {
      return { verified: false, error: 'Token and secret key are required' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { verified: false, error: 'Invalid token format' };
    }

    // Create a new verification key using TextEncoder
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);

    // Attempt to verify the token
    await jose.jwtVerify(token, keyData);
    
    return { verified: true };
  } catch (error) {
    return { 
      verified: false, 
      error: error instanceof Error ? error.message : 'Signature verification failed' 
    };
  }
};
