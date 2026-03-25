import { createHmac } from 'crypto';

export interface WebhookSignature {
  scheme: string;
  signature: string;
  timestamp: string;
}

export interface VerifiedWebhook {
  isValid: boolean;
  error?: string;
  payload: unknown;
  timestamp?: string;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  toleranceSeconds: number = 300
): { valid: boolean; error?: string } {
  if (!signature || !secret) {
    return { valid: false, error: 'Missing signature or secret' };
  }
  
  const parts = signature.split(',');
  const signatureMap: Record<string, string> = {};
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key && value) {
      signatureMap[key] = value;
    }
  }
  
  const timestamp = signatureMap['t'];
  const providedSignature = signatureMap['v1'];
  
  if (!timestamp || !providedSignature) {
    return { valid: false, error: 'Invalid signature format' };
  }
  
  const timestampNum = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  
  if (isNaN(timestampNum)) {
    return { valid: false, error: 'Invalid timestamp' };
  }
  
  if (Math.abs(now - timestampNum) > toleranceSeconds) {
    return { valid: false, error: 'Timestamp outside tolerance window' };
  }
  
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  if (!timingSafeEqual(providedSignature, expectedSignature)) {
    return { valid: false, error: 'Signature mismatch' };
  }
  
  return { valid: true };
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function parseWebhookSignature(signatureHeader: string): WebhookSignature | null {
  if (!signatureHeader) return null;
  
  const parts = signatureHeader.split(',');
  const result: Partial<WebhookSignature> = {};
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') {
      result.timestamp = value;
    } else if (key === 'v1') {
      result.signature = value;
      result.scheme = 'v1';
    }
  }
  
  if (!result.timestamp || !result.signature || !result.scheme) {
    return null;
  }
  
  return result as WebhookSignature;
}

export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedPayload = `${timestamp}.${payload}`;
  const signature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}
