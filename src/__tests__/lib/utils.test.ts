import {
  cn,
  extractUUIDFromString,
  extractURLfromString,
  extractEmailsFromString,
  getMonthName
} from '@/lib/utils';

describe('Utility Functions', () => {
  describe('cn (classNames utility)', () => {
    it('combines class names correctly', () => {
      expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
      expect(cn('btn', null, undefined, 'btn-large')).toBe('btn btn-large');
      expect(cn('p-4', { 'text-red': true, 'bg-blue': false })).toBe('p-4 text-red');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      expect(cn('btn', isActive && 'btn-active')).toBe('btn btn-active');
      
      const isDisabled = false;
      expect(cn('btn', isDisabled && 'btn-disabled')).toBe('btn');
    });
  });

  describe('extractUUIDFromString', () => {
    it('extracts valid UUIDs', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      expect(extractUUIDFromString(validUUID)).toBeTruthy();
    });

    it('returns null for invalid UUIDs', () => {
      const invalidUUID = 'not-a-uuid';
      expect(extractUUIDFromString(invalidUUID)).toBeNull();
    });
  });

  describe('extractURLfromString', () => {
    it('extracts valid URLs', () => {
      const textWithURL = 'Visit our website at https://example.com for more information';
      const result = extractURLfromString(textWithURL);
      expect(result && result[0]).toBe('https://example.com');
    });

    it('extracts URLs with paths and query parameters', () => {
      const textWithURL = 'Check this link: https://example.com/services?id=123&category=electronics';
      const result = extractURLfromString(textWithURL);
      expect(result && result[0]).toBe('https://example.com/services?id=123&category=electronics');
    });

    it('extracts http URLs', () => {
      const textWithURL = 'Visit http://example.org';
      const result = extractURLfromString(textWithURL);
      expect(result && result[0]).toBe('http://example.org');
    });

    it('returns null for text without URLs', () => {
      const text = 'No URL here';
      expect(extractURLfromString(text)).toBeNull();
    });

    it('extracts the first URL when multiple are present', () => {
      const textWithMultipleURLs = 'First: https://example.com, Second: https://another.com';
      const result = extractURLfromString(textWithMultipleURLs);
      expect(result && result[0]).toBe('https://example.com,');
    });
  });

  describe('extractEmailsFromString', () => {
    it('extracts valid email addresses', () => {
      const text = 'Contact us at support@example.com or sales@example.com';
      const result = extractEmailsFromString(text);
      expect(result).toEqual(['support@example.com', 'sales@example.com']);
    });

    it('returns null for text without email addresses', () => {
      const text = 'No email addresses here';
      expect(extractEmailsFromString(text)).toBeNull();
    });
  });

  describe('getMonthName', () => {
    it('returns the correct month name for each number', () => {
      expect(getMonthName(1)).toBe('Jan');
      expect(getMonthName(2)).toBe('Feb');
      expect(getMonthName(3)).toBe('Mar');
      expect(getMonthName(4)).toBe('Apr');
      expect(getMonthName(5)).toBe('May');
      expect(getMonthName(6)).toBe('Jun');
      expect(getMonthName(7)).toBe('Jul');
      expect(getMonthName(8)).toBe('Aug');
      expect(getMonthName(9)).toBe('Sep');
      expect(getMonthName(10)).toBe('Oct');
      expect(getMonthName(11)).toBe('Nov');
      expect(getMonthName(12)).toBe('Dec');
    });

    it('handles invalid month numbers', () => {
      expect(getMonthName(13)).toBe(false);
      expect(getMonthName(0)).toBe(false);
    });
  });
}); 