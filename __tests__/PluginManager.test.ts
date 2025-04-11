import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { PluginManager, PluginType } from '../src/plugins/PluginManager';

describe('PluginManager', () => {
  let pluginManager: PluginManager;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a new plugin manager for each test
    pluginManager = new PluginManager();
  });

  describe('registerPlugin', () => {
    test('should register a security scanner plugin', () => {
      // Create a mock security scanner plugin
      const mockPlugin = {
        id: 'test-security-scanner',
        name: 'Test Security Scanner',
        type: PluginType.SECURITY_SCANNER,
        version: '1.0.0',
        description: 'A test security scanner plugin',
        scanFiles: async (files: any) => files
      };

      // Register the plugin
      pluginManager.registerPlugin(mockPlugin as any);

      // Verify the plugin was registered
      expect(pluginManager.getAllPlugins()).toContainEqual(mockPlugin);
      expect(pluginManager.getSecurityScanners()).toContainEqual(mockPlugin);
    });

    test('should register an output renderer plugin', () => {
      // Create a mock output renderer plugin
      const mockPlugin = {
        id: 'test-output-renderer',
        name: 'Test Output Renderer',
        type: PluginType.OUTPUT_RENDERER,
        version: '1.0.0',
        description: 'A test output renderer plugin',
        render: async () => 'rendered output'
      };

      // Register the plugin
      pluginManager.registerPlugin(mockPlugin as any);

      // Verify the plugin was registered
      expect(pluginManager.getAllPlugins()).toContainEqual(mockPlugin);
      expect(pluginManager.getOutputRenderers()).toContainEqual(mockPlugin);
    });

    test('should register an LLM reviewer plugin', () => {
      // Create a mock LLM reviewer plugin
      const mockPlugin = {
        id: 'test-llm-reviewer',
        name: 'Test LLM Reviewer',
        type: PluginType.LLM_REVIEWER,
        version: '1.0.0',
        description: 'A test LLM reviewer plugin',
        reviewFiles: async (files: any) => files,
        isAvailable: async () => true
      };

      // Register the plugin
      pluginManager.registerPlugin(mockPlugin as any);

      // Verify the plugin was registered
      expect(pluginManager.getAllPlugins()).toContainEqual(mockPlugin);
      expect(pluginManager.getLLMReviewers()).toContainEqual(mockPlugin);
    });
  });

  describe('getPlugin', () => {
    test('should return a plugin by ID', () => {
      // Create and register a mock plugin
      const mockPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        type: PluginType.SECURITY_SCANNER,
        version: '1.0.0',
        description: 'A test plugin'
      };

      pluginManager.registerPlugin(mockPlugin as any);

      // Get the plugin by ID
      const plugin = pluginManager.getPlugin('test-plugin');

      // Verify the correct plugin was returned
      expect(plugin).toBe(mockPlugin);
    });

    test('should return undefined for an unknown plugin ID', () => {
      // Get a plugin with an unknown ID
      const plugin = pluginManager.getPlugin('unknown-plugin');

      // Verify undefined was returned
      expect(plugin).toBeUndefined();
    });
  });

  describe('unloadPlugins', () => {
    test('should clean up all plugins', async () => {
      // Create mock plugins with cleanup methods
      const mockPlugin1 = {
        id: 'plugin1',
        name: 'Plugin 1',
        type: PluginType.SECURITY_SCANNER,
        version: '1.0.0',
        description: 'Plugin 1',
        cleanup: jest.fn().mockImplementation(() => Promise.resolve())
      };

      const mockPlugin2 = {
        id: 'plugin2',
        name: 'Plugin 2',
        type: PluginType.OUTPUT_RENDERER,
        version: '1.0.0',
        description: 'Plugin 2',
        cleanup: jest.fn().mockImplementation(() => Promise.resolve())
      };

      // Register the plugins
      pluginManager.registerPlugin(mockPlugin1 as any);
      pluginManager.registerPlugin(mockPlugin2 as any);

      // Clean up the plugins
      await pluginManager.unloadPlugins();

      // Verify cleanup was called for each plugin
      expect(mockPlugin1.cleanup).toHaveBeenCalled();
      expect(mockPlugin2.cleanup).toHaveBeenCalled();
    });
  });
});
