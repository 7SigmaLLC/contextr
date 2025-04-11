import { FileCollectorConfig } from "../types";

/**
 * Enhanced regex pattern matching utility for contextr
 */
export class RegexPatternMatcher {
  /**
   * Parses a pattern string to extract regex pattern and flags
   * @param pattern The pattern string (e.g., "pattern:i" for case-insensitive)
   * @param defaultFlags Default flags to use if none specified
   * @returns Object containing the pattern and flags
   */
  public static parsePatternWithFlags(pattern: string, defaultFlags: string = ''): { pattern: string, flags: string } {
    let flags = defaultFlags;
    const patternParts = pattern.split(':');
    
    if (patternParts.length > 1) {
      const lastPart = patternParts.pop() || '';
      // Check if the last part contains only valid regex flags
      if (/^[gimsuy]+$/.test(lastPart)) {
        flags = lastPart;
        pattern = patternParts.join(':');
      } else {
        // If not valid flags, restore the original pattern
        pattern = patternParts.join(':') + ':' + lastPart;
      }
    }
    
    return { pattern, flags };
  }
  
  /**
   * Creates a RegExp object from a pattern string with optional flags
   * @param pattern The pattern string
   * @param defaultFlags Default flags to use if none specified
   * @returns RegExp object or null if invalid
   */
  public static createRegex(pattern: string, defaultFlags: string = ''): RegExp | null {
    try {
      const { pattern: parsedPattern, flags } = this.parsePatternWithFlags(pattern, defaultFlags);
      return new RegExp(parsedPattern, flags);
    } catch (err) {
      console.error(`Invalid regex pattern: ${pattern}`, err);
      return null;
    }
  }
  
  /**
   * Tests if a string matches a regex pattern
   * @param str The string to test
   * @param pattern The pattern to match against
   * @param defaultFlags Default flags to use if none specified
   * @returns True if the string matches the pattern
   */
  public static test(str: string, pattern: string, defaultFlags: string = ''): boolean {
    const regex = this.createRegex(pattern, defaultFlags);
    return regex ? regex.test(str) : false;
  }
  
  /**
   * Finds all matches of a pattern in a string
   * @param str The string to search in
   * @param pattern The pattern to search for
   * @param defaultFlags Default flags to use (will ensure 'g' flag is included)
   * @returns Array of matches or empty array if no matches or invalid pattern
   */
  public static findMatches(str: string, pattern: string, defaultFlags: string = 'g'): RegExpMatchArray[] {
    // Ensure global flag is present
    const ensuredFlags = defaultFlags.includes('g') ? defaultFlags : defaultFlags + 'g';
    const regex = this.createRegex(pattern, ensuredFlags);
    if (!regex) return [];
    
    const matches: RegExpMatchArray[] = [];
    let match: RegExpMatchArray | null;
    
    while ((match = regex.exec(str)) !== null) {
      matches.push(match);
    }
    
    return matches;
  }
  
  /**
   * Extracts context lines around matches in a string
   * @param str The string to search in
   * @param pattern The pattern to search for
   * @param contextLines Number of lines before and after the match to include
   * @param defaultFlags Default flags to use
   * @returns Array of match contexts with line numbers
   */
  public static findMatchesWithContext(
    str: string, 
    pattern: string, 
    contextLines: number = 2,
    defaultFlags: string = 'gm'
  ): Array<{ 
    match: string, 
    lineNumber: number, 
    context: string,
    beforeLines: number,
    afterLines: number
  }> {
    const lines = str.split('\n');
    const regex = this.createRegex(pattern, defaultFlags);
    if (!regex) return [];
    
    const results = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (regex.test(line)) {
        // Reset regex lastIndex
        regex.lastIndex = 0;
        
        // Calculate context line ranges
        const startLine = Math.max(0, i - contextLines);
        const endLine = Math.min(lines.length - 1, i + contextLines);
        
        // Extract context
        const contextArray = lines.slice(startLine, endLine + 1);
        const context = contextArray.join('\n');
        
        results.push({
          match: line,
          lineNumber: i + 1, // 1-based line number
          context,
          beforeLines: i - startLine,
          afterLines: endLine - i
        });
      }
    }
    
    return results;
  }
  
  /**
   * Filters an array of strings based on a regex pattern
   * @param strings Array of strings to filter
   * @param pattern The pattern to match against
   * @param defaultFlags Default flags to use
   * @returns Filtered array of strings that match the pattern
   */
  public static filterStrings(strings: string[], pattern: string, defaultFlags: string = ''): string[] {
    return strings.filter(str => this.test(str, pattern, defaultFlags));
  }
}
