import { describe, it, expect } from 'vitest';
import {
  verifyWebhookSignature,
  parseWebhookSignature,
  generateWebhookSignature,
} from '../../app/lib/webhook';

describe('Webhook Utilities', () => {
  describe('generateWebhookSignature', () => {
    it('should generate valid signature format', () => {
      const signature = generateWebhookSignature('{"test": "data"}', 'secret123');

      expect(signature).toContain('t=');
      expect(signature).toContain('v1=');
    });

    it('should generate different signatures for different payloads', () => {
      const sig1 = generateWebhookSignature('payload1', 'secret');
      const sig2 = generateWebhookSignature('payload2', 'secret');

      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different secrets', () => {
      const sig1 = generateWebhookSignature('payload', 'secret1');
      const sig2 = generateWebhookSignature('payload', 'secret2');

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('parseWebhookSignature', () => {
    it('should parse valid signature header', () => {
      const header = 't=1234567890,v1=abc123def456';
      const result = parseWebhookSignature(header);

      expect(result).not.toBeNull();
      expect(result?.timestamp).toBe('1234567890');
      expect(result?.signature).toBe('abc123def456');
      expect(result?.scheme).toBe('v1');
    });

    it('should return null for invalid header', () => {
      expect(parseWebhookSignature('')).toBeNull();
      expect(parseWebhookSignature('invalid')).toBeNull();
      expect(parseWebhookSignature('v1=abc')).toBeNull();
      expect(parseWebhookSignature('t=123')).toBeNull();
    });

    it('should handle multiple parts', () => {
      const header = 't=1234567890,v1=abc123def456,v0=legacy';
      const result = parseWebhookSignature(header);

      expect(result?.timestamp).toBe('1234567890');
      expect(result?.signature).toBe('abc123def456');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature', () => {
      const payload = '{"test": "data"}';
      const secret = 'my-secret-key';
      const signature = generateWebhookSignature(payload, secret);

      const result = verifyWebhookSignature(payload, signature, secret);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid signature format', () => {
      const result = verifyWebhookSignature('payload', 'invalid', 'secret');

      expect(result.valid).toBe(false);
    });

    it('should reject missing signature', () => {
      const result = verifyWebhookSignature('payload', '', 'secret');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing signature or secret');
    });

    it('should reject expired timestamp', () => {
      const payload = '{"test": "data"}';
      const secret = 'my-secret-key';
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600;

      const result = verifyWebhookSignature(
        payload,
        `t=${oldTimestamp},v1=abc123`,
        secret
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Timestamp outside tolerance window');
    });
  });
});
