import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { RegexPatternMatcher } from '../src/collector/RegexPatternMatcher';

describe('RegexPatternMatcher', () => {
  describe('test', () => {
    test('should match simple patterns', () => {
      expect(RegexPatternMatcher.test('hello world', 'hello')).toBe(true);
      expect(RegexPatternMatcher.test('hello world', 'goodbye')).toBe(false);
    });

    test('should support regex patterns', () => {
      expect(RegexPatternMatcher.test('hello world', 'h.*o')).toBe(true);
      expect(RegexPatternMatcher.test('hello world', '\\d+')).toBe(false);
    });

    test('should support regex flags', () => {
      expect(RegexPatternMatcher.test('HELLO world', 'hello')).toBe(false);
      expect(RegexPatternMatcher.test('HELLO world', 'hello:i')).toBe(true);
    });

    test('should handle invalid regex patterns', () => {
      expect(() => RegexPatternMatcher.test('hello world', '[')).not.toThrow();
      expect(RegexPatternMatcher.test('hello world', '[')).toBe(false);
    });
  });

  describe('getMatches', () => {
    test('should return all matches', () => {
      const matches = RegexPatternMatcher.getMatches('hello world hello', 'hello');
      expect(matches).toHaveLength(2);
      expect(matches[0].match).toBe('hello');
      expect(matches[1].match).toBe('hello');
    });

    test('should support regex patterns', () => {
      const matches = RegexPatternMatcher.getMatches('hello 123 world 456', '\\d+');
      expect(matches).toHaveLength(2);
      expect(matches[0].match).toBe('123');
      expect(matches[1].match).toBe('456');
    });

    test('should support regex flags', () => {
      const matches = RegexPatternMatcher.getMatches('Hello HELLO hello', 'hello:i');
      expect(matches).toHaveLength(3);
    });

    test('should return empty array for no matches', () => {
      const matches = RegexPatternMatcher.getMatches('hello world', 'goodbye');
      expect(matches).toHaveLength(0);
    });
  });

  describe('getMatchesWithLineNumbers', () => {
    test('should return matches with line numbers', () => {
      const content = 'hello world\ngoodbye world\nhello again';
      const matches = RegexPatternMatcher.getMatchesWithLineNumbers(content, 'hello');
      expect(matches).toHaveLength(2);
      expect(matches[0].lineNumber).toBe(1);
      expect(matches[1].lineNumber).toBe(3);
    });

    test('should handle multiline content', () => {
      const content = 'line1\nline2\nline3\nline4';
      const matches = RegexPatternMatcher.getMatchesWithLineNumbers(content, 'line\\d');
      expect(matches).toHaveLength(4);
      expect(matches.map(m => m.lineNumber)).toEqual([1, 2, 3, 4]);
    });
  });

  describe('getMatchesWithContext', () => {
    test('should return matches with context', () => {
      const content = 'line1\nline2\nline3\nline4\nline5';
      const matches = RegexPatternMatcher.getMatchesWithContext(content, 'line3', 1);
      expect(matches).toHaveLength(1);
      expect(matches[0].before).toBe('line2\n');
      expect(matches[0].match).toBe('line3');
      expect(matches[0].after).toBe('\nline4');
    });

    test('should handle context at file boundaries', () => {
      const content = 'line1\nline2\nline3';
      const matches = RegexPatternMatcher.getMatchesWithContext(content, 'line1', 1);
      expect(matches).toHaveLength(1);
      expect(matches[0].before).toBe('');
      expect(matches[0].match).toBe('line1');
      expect(matches[0].after).toBe('\nline2');

      const matchesEnd = RegexPatternMatcher.getMatchesWithContext(content, 'line3', 1);
      expect(matchesEnd).toHaveLength(1);
      expect(matchesEnd[0].before).toBe('line2\n');
      expect(matchesEnd[0].match).toBe('line3');
      expect(matchesEnd[0].after).toBe('');
    });

    test('should handle multiple matches', () => {
      const content = 'hello\nworld\nhello\nagain';
      const matches = RegexPatternMatcher.getMatchesWithContext(content, 'hello', 1);
      expect(matches).toHaveLength(2);
    });
  });

  describe('parseRegexPattern', () => {
    test('should parse pattern with flags', () => {
      const { pattern, flags } = RegexPatternMatcher.parseRegexPattern('hello:i');
      expect(pattern).toBe('hello');
      expect(flags).toBe('i');
    });

    test('should handle pattern without flags', () => {
      const { pattern, flags } = RegexPatternMatcher.parseRegexPattern('hello');
      expect(pattern).toBe('hello');
      expect(flags).toBe('');
    });

    test('should handle complex patterns', () => {
      const { pattern, flags } = RegexPatternMatcher.parseRegexPattern('\\d+:\\w+:gim');
      expect(pattern).toBe('\\d+:\\w+');
      expect(flags).toBe('gim');
    });
  });
});
