import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { WhitelistBlacklist } from '../src/collector/WhitelistBlacklist';
import * as path from 'path';

describe('WhitelistBlacklist', () => {
  describe('createWhitelist', () => {
    test('should create a whitelist configuration', () => {
      const whitelist = WhitelistBlacklist.createWhitelist(['**/*.js', '**/*.ts']);
      
      expect(whitelist).toHaveProperty('includeFiles');
      expect(whitelist.includeFiles).toContain('**/*.js');
      expect(whitelist.includeFiles).toContain('**/*.ts');
    });
    
    test('should support regex patterns', () => {
      const whitelist = WhitelistBlacklist.createWhitelist(['.*\\.js$', '.*\\.ts$'], true);
      
      expect(whitelist).toHaveProperty('includeFiles');
      expect(whitelist).toHaveProperty('useRegex', true);
    });
  });
  
  describe('createBlacklist', () => {
    test('should create a blacklist configuration', () => {
      const blacklist = WhitelistBlacklist.createBlacklist(['**/node_modules/**', '**/*.test.js']);
      
      expect(blacklist).toHaveProperty('excludeFiles');
      expect(blacklist.excludeFiles).toContain('**/node_modules/**');
      expect(blacklist.excludeFiles).toContain('**/*.test.js');
    });
    
    test('should support regex patterns', () => {
      const blacklist = WhitelistBlacklist.createBlacklist(['node_modules', '.*\\.test\\.js$'], true);
      
      expect(blacklist).toHaveProperty('excludeFiles');
      expect(blacklist).toHaveProperty('useRegex', true);
    });
  });
  
  describe('createConfig', () => {
    test('should create a combined configuration', () => {
      const whitelist = WhitelistBlacklist.createWhitelist(['**/*.js', '**/*.ts']);
      const blacklist = WhitelistBlacklist.createBlacklist(['**/node_modules/**', '**/*.test.js']);
      
      const config = WhitelistBlacklist.createConfig({
        whitelist,
        blacklist,
        baseDir: './src'
      });
      
      expect(config).toHaveProperty('includeFiles');
      expect(config).toHaveProperty('excludeFiles');
      expect(config).toHaveProperty('includeDirs');
      expect(config.includeDirs).toHaveLength(1);
      expect(config.includeDirs[0].path).toBe('./src');
    });
    
    test('should merge configurations correctly', () => {
      const config1 = WhitelistBlacklist.createWhitelist(['**/*.js']);
      const config2 = WhitelistBlacklist.createBlacklist(['**/node_modules/**']);
      
      const merged = WhitelistBlacklist.mergeConfigs(config1, config2);
      
      expect(merged).toHaveProperty('includeFiles');
      expect(merged).toHaveProperty('excludeFiles');
      expect(merged.includeFiles).toContain('**/*.js');
      expect(merged.excludeFiles).toContain('**/node_modules/**');
    });
  });
  
  describe('matchesPattern', () => {
    test('should match glob patterns', () => {
      expect(WhitelistBlacklist.matchesPattern('file.js', '**/*.js', false)).toBe(true);
      expect(WhitelistBlacklist.matchesPattern('file.ts', '**/*.js', false)).toBe(false);
    });
    
    test('should match regex patterns', () => {
      expect(WhitelistBlacklist.matchesPattern('file.js', '.*\\.js$', true)).toBe(true);
      expect(WhitelistBlacklist.matchesPattern('file.ts', '.*\\.js$', true)).toBe(false);
    });
    
    test('should handle complex patterns', () => {
      expect(WhitelistBlacklist.matchesPattern('src/components/Button.js', '**/components/**/*.js', false)).toBe(true);
      expect(WhitelistBlacklist.matchesPattern('src/utils/helpers.js', '**/components/**/*.js', false)).toBe(false);
    });
  });
  
  describe('matchesAnyPattern', () => {
    test('should match if any pattern matches', () => {
      expect(WhitelistBlacklist.matchesAnyPattern('file.js', ['**/*.js', '**/*.ts'], false)).toBe(true);
      expect(WhitelistBlacklist.matchesAnyPattern('file.ts', ['**/*.js', '**/*.ts'], false)).toBe(true);
      expect(WhitelistBlacklist.matchesAnyPattern('file.css', ['**/*.js', '**/*.ts'], false)).toBe(false);
    });
    
    test('should work with regex patterns', () => {
      expect(WhitelistBlacklist.matchesAnyPattern('file.js', ['.*\\.js$', '.*\\.ts$'], true)).toBe(true);
      expect(WhitelistBlacklist.matchesAnyPattern('file.css', ['.*\\.js$', '.*\\.ts$'], true)).toBe(false);
    });
  });
  
  describe('filterByExtension', () => {
    test('should filter files by extension', () => {
      const files = [
        { filePath: 'file1.js', content: '', meta: {} },
        { filePath: 'file2.ts', content: '', meta: {} },
        { filePath: 'file3.css', content: '', meta: {} }
      ];
      
      const filtered = WhitelistBlacklist.filterByExtension(files, ['js', 'ts']);
      
      expect(filtered).toHaveLength(2);
      expect(filtered[0].filePath).toBe('file1.js');
      expect(filtered[1].filePath).toBe('file2.ts');
    });
  });
  
  describe('filterByDirectory', () => {
    test('should filter files by directory', () => {
      const files = [
        { filePath: path.join('src', 'components', 'Button.js'), content: '', meta: {} },
        { filePath: path.join('src', 'utils', 'helpers.js'), content: '', meta: {} },
        { filePath: path.join('tests', 'Button.test.js'), content: '', meta: {} }
      ];
      
      const filtered = WhitelistBlacklist.filterByDirectory(files, 'src');
      
      expect(filtered).toHaveLength(2);
      expect(filtered[0].filePath).toContain('src');
      expect(filtered[1].filePath).toContain('src');
    });
    
    test('should support recursive filtering', () => {
      const files = [
        { filePath: path.join('src', 'components', 'Button.js'), content: '', meta: {} },
        { filePath: path.join('src', 'components', 'nested', 'Input.js'), content: '', meta: {} },
        { filePath: path.join('src', 'utils', 'helpers.js'), content: '', meta: {} }
      ];
      
      const filtered = WhitelistBlacklist.filterByDirectory(files, path.join('src', 'components'), true);
      
      expect(filtered).toHaveLength(2);
      expect(filtered[0].filePath).toContain(path.join('src', 'components'));
      expect(filtered[1].filePath).toContain(path.join('src', 'components'));
    });
    
    test('should support non-recursive filtering', () => {
      const files = [
        { filePath: path.join('src', 'components', 'Button.js'), content: '', meta: {} },
        { filePath: path.join('src', 'components', 'nested', 'Input.js'), content: '', meta: {} },
        { filePath: path.join('src', 'utils', 'helpers.js'), content: '', meta: {} }
      ];
      
      const filtered = WhitelistBlacklist.filterByDirectory(files, path.join('src', 'components'), false);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].filePath).toBe(path.join('src', 'components', 'Button.js'));
    });
  });
  
  describe('filterByContent', () => {
    test('should filter files by content', () => {
      const files = [
        { filePath: 'file1.js', content: 'import React from "react";', meta: {} },
        { filePath: 'file2.js', content: 'const x = 10;', meta: {} },
        { filePath: 'file3.js', content: 'function Component() { return <div>Hello</div>; }', meta: {} }
      ];
      
      const filtered = WhitelistBlacklist.filterByContent(files, 'import React');
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].filePath).toBe('file1.js');
    });
    
    test('should support regex content matching', () => {
      const files = [
        { filePath: 'file1.js', content: 'import React from "react";', meta: {} },
        { filePath: 'file2.js', content: 'const x = 10;', meta: {} },
        { filePath: 'file3.js', content: 'function Component() { return <div>Hello</div>; }', meta: {} }
      ];
      
      const filtered = WhitelistBlacklist.filterByContent(files, 'function\\s+\\w+\\s*\\(', true);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].filePath).toBe('file3.js');
    });
  });
});
