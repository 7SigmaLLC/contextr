import { describe, expect, test } from '@jest/globals';
import { PluginEnabledFileContextBuilder } from '../src/plugins/PluginEnabledFileContextBuilder';

describe('PluginEnabledFileContextBuilder', () => {
  test('should create an instance', () => {
    const builder = new PluginEnabledFileContextBuilder();
    expect(builder).toBeDefined();
  });

  test('should create an instance with custom config', () => {
    const builder = new PluginEnabledFileContextBuilder({
      includeFiles: ['src/index.js']
    });
    expect(builder).toBeDefined();
  });
});
