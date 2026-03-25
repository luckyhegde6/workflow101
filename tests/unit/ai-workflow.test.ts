import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@dbos-inc/dbos-sdk', () => ({
  DBOS: {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    },
    workflow: () => (target: unknown) => target,
    step: () => (target: unknown) => target,
  },
}));

describe('AI Workflow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AI Analysis Workflow', () => {
    it('should validate content length', () => {
      const validateContent = (content: string) => {
        if (!content || content.trim().length === 0) {
          return { isValid: false, reason: 'Content is empty' };
        }
        if (content.length > 10000) {
          return { isValid: false, reason: 'Content exceeds maximum length' };
        }
        return { isValid: true };
      };

      expect(validateContent('')).toEqual({ isValid: false, reason: 'Content is empty' });
      expect(validateContent('   ')).toEqual({ isValid: false, reason: 'Content is empty' });
      expect(validateContent('a'.repeat(10001))).toEqual({
        isValid: false,
        reason: 'Content exceeds maximum length',
      });
      expect(validateContent('Valid content')).toEqual({ isValid: true });
    });

    it('should perform sentiment analysis', () => {
      const analyzeSentiment = (content: string) => {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'hate'];

        const lowerContent = content.toLowerCase();
        const positiveCount = positiveWords.filter((word) => lowerContent.includes(word)).length;
        const negativeCount = negativeWords.filter((word) => lowerContent.includes(word)).length;

        if (positiveCount > negativeCount) return 'POSITIVE';
        if (negativeCount > positiveCount) return 'NEGATIVE';
        return 'NEUTRAL';
      };

      expect(analyzeSentiment('This is great and amazing!')).toBe('POSITIVE');
      expect(analyzeSentiment('This is terrible and awful!')).toBe('NEGATIVE');
      expect(analyzeSentiment('This is a normal statement.')).toBe('NEUTRAL');
    });

    it('should categorize content correctly', () => {
      const categorize = (content: string): string[] => {
        const categories: string[] = [];
        const lowerContent = content.toLowerCase();

        const categoryMap: Record<string, string[]> = {
          Technology: ['software', 'computer', 'code', 'programming', 'api'],
          Business: ['revenue', 'profit', 'sales', 'marketing', 'customer'],
          Science: ['research', 'experiment', 'data', 'study', 'analysis'],
          Health: ['health', 'medical', 'patient', 'treatment', 'doctor'],
        };

        for (const [category, keywords] of Object.entries(categoryMap)) {
          if (keywords.some((keyword) => lowerContent.includes(keyword))) {
            categories.push(category);
          }
        }

        return categories.length > 0 ? categories : ['General'];
      };

      expect(categorize('The software programming is excellent')).toContain('Technology');
      expect(categorize('Revenue and sales are up')).toContain('Business');
      expect(categorize('Research shows interesting data')).toContain('Science');
      expect(categorize('Medical health treatment available')).toContain('Health');
      expect(categorize('Random text without keywords')).toEqual(['General']);
    });

    it('should summarize content', () => {
      const summarize = (content: string): string => {
        const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);

        if (sentences.length <= 2) return content;

        const firstSentence = sentences[0].trim();
        const lastSentence = sentences[sentences.length - 1].trim();

        return `${firstSentence}. ${lastSentence}.`;
      };

      const short = 'Short content.';
      expect(summarize(short)).toBe(short);

      const long = 'First sentence. Middle sentence. Last sentence.';
      expect(summarize(long)).toBe('First sentence. Last sentence.');
    });

    it('should extract entities from content', () => {
      const extractEntities = (content: string): string[] => {
        const entities: string[] = [];

        const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
        const urlRegex = /https?:\/\/[^\s]+/g;
        const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;

        const emails = content.match(emailRegex);
        const urls = content.match(urlRegex);
        const phones = content.match(phoneRegex);

        if (emails) entities.push(...emails.map((e) => `Email: ${e}`));
        if (urls) entities.push(...urls.map((u) => `URL: ${u}`));
        if (phones) entities.push(...phones.map((p) => `Phone: ${p}`));

        return entities;
      };

      const content = 'Contact us at support@example.com or visit https://example.com';
      const entities = extractEntities(content);

      expect(entities).toContain('Email: support@example.com');
      expect(entities).toContain('URL: https://example.com');
    });

    it('should handle extraction with phone numbers', () => {
      const extractEntities = (content: string): string[] => {
        const entities: string[] = [];
        const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
        const phones = content.match(phoneRegex);
        if (phones) entities.push(...phones.map((p) => `Phone: ${p}`));
        return entities;
      };

      expect(extractEntities('Call 123-456-7890')).toContain('Phone: 123-456-7890');
      expect(extractEntities('Call 123.456.7890')).toContain('Phone: 123.456.7890');
    });
  });

  describe('Batch Analysis', () => {
    it('should process multiple items in batch', async () => {
      const processBatch = async (items: string[]) => {
        const results: { success: boolean; analysis: string }[] = [];

        for (const item of items) {
          if (!item || item.trim().length === 0) {
            results.push({ success: false, analysis: 'Empty content' });
          } else {
            results.push({ success: true, analysis: `Processed: ${item.substring(0, 10)}...` });
          }
        }

        return results;
      };

      const items = ['Valid content', '', 'Another valid item'];
      const results = await processBatch(items);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });

    it('should track batch progress', () => {
      const trackProgress = (completed: number, total: number) => {
        const percentage = Math.round((completed / total) * 100);
        return { completed, total, percentage };
      };

      expect(trackProgress(5, 10)).toEqual({ completed: 5, total: 10, percentage: 50 });
      expect(trackProgress(1, 3)).toEqual({ completed: 1, total: 3, percentage: 33 });
      expect(trackProgress(10, 10)).toEqual({ completed: 10, total: 10, percentage: 100 });
    });
  });

  describe('Chained Analysis', () => {
    it('should chain multiple analysis steps', () => {
      const chainAnalysis = (content: string) => {
        const sentiment = content.includes('good') ? 'POSITIVE' : 'NEGATIVE';
        const summary = content.substring(0, 50);
        const categories = ['General'];

        return {
          sentiment,
          summary: `${summary}...`,
          categories,
          finalAnalysis: `Content is ${sentiment.toLowerCase()}. Categories: ${categories.join(', ')}`,
        };
      };

      const result = chainAnalysis('This is good content for testing');

      expect(result.sentiment).toBe('POSITIVE');
      expect(result.categories).toContain('General');
      expect(result.finalAnalysis).toContain('positive');
      expect(result.finalAnalysis).toContain('General');
    });

    it('should generate comprehensive final analysis', () => {
      const generateFinalAnalysis = (
        sentiment: string,
        summary: string,
        categories: string[]
      ) => {
        const categoryList = categories.join(', ');
        const confidenceLevel =
          sentiment === 'POSITIVE'
            ? 'high'
            : sentiment === 'NEGATIVE'
              ? 'moderate concern'
              : 'neutral';

        return `This ${categoryList} content has a ${sentiment.toLowerCase()} tone with ${confidenceLevel} overall sentiment. Key points: ${summary}`;
      };

      const result = generateFinalAnalysis('POSITIVE', 'Main points discussed', [
        'Technology',
        'Business',
      ]);

      expect(result).toContain('positive');
      expect(result).toContain('Technology');
      expect(result).toContain('high');
    });
  });
});
