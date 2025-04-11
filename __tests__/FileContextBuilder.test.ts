import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { FileContextBuilder } from '../src/FileContextBuilder';
import { FileCollector } from '../src/collector/FileCollector';
import { ConsoleRenderer } from '../src/renderers/ConsoleRenderer';
import { JsonRenderer } from '../src/renderers/JsonRenderer';

// Mock dependencies
jest.mock('../src/collector/FileCollector');
jest.mock('../src/renderers/ConsoleRenderer');
jest.mock('../src/renderers/JsonRenderer');

describe('FileContextBuilder', () => {
  let mockFileCollector;
  let mockConsoleRenderer;
  let mockJsonRenderer;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock implementations
    mockFileCollector = {
      collect: jest.fn().mockResolvedValue([
        { filePath: 'file1.js', content: 'content1', meta: { size: 100 } },
        { filePath: 'file2.js', content: 'content2', meta: { size: 200 } }
      ])
    };
    
    mockConsoleRenderer = {
      render: jest.fn().mockReturnValue('console output')
    };
    
    mockJsonRenderer = {
      render: jest.fn().mockReturnValue('{"files":[]}')
    };
    
    // Setup mock constructors
    (FileCollector as jest.Mock).mockImplementation(() => mockFileCollector);
    (ConsoleRenderer as jest.Mock).mockImplementation(() => mockConsoleRenderer);
    (JsonRenderer as jest.Mock).mockImplementation(() => mockJsonRenderer);
  });
  
  describe('constructor', () => {
    test('should initialize with default config', () => {
      const builder = new FileContextBuilder();
      expect(builder).toBeDefined();
      expect(FileCollector).toHaveBeenCalledWith({});
    });
    
    test('should initialize with provided config', () => {
      const config = {
        includeDirs: [{ path: './src', include: ['**/*.js'] }]
      };
      
      const builder = new FileContextBuilder(config);
      expect(FileCollector).toHaveBeenCalledWith(config);
    });
  });
  
  describe('build', () => {
    test('should collect files and render context', async () => {
      const builder = new FileContextBuilder();
      const result = await builder.build();
      
      expect(mockFileCollector.collect).toHaveBeenCalled();
      expect(result).toHaveProperty('files');
      expect(result.files).toHaveLength(2);
    });
    
    test('should use console renderer by default', async () => {
      const builder = new FileContextBuilder();
      const result = await builder.build();
      
      expect(ConsoleRenderer).toHaveBeenCalled();
      expect(mockConsoleRenderer.render).toHaveBeenCalled();
      expect(result).toHaveProperty('output', 'console output');
    });
    
    test('should use json renderer when specified', async () => {
      const builder = new FileContextBuilder();
      const result = await builder.build('json');
      
      expect(JsonRenderer).toHaveBeenCalled();
      expect(mockJsonRenderer.render).toHaveBeenCalled();
      expect(result).toHaveProperty('output');
    });
    
    test('should handle empty file collection', async () => {
      mockFileCollector.collect.mockResolvedValue([]);
      
      const builder = new FileContextBuilder();
      const result = await builder.build();
      
      expect(result).toHaveProperty('files');
      expect(result.files).toHaveLength(0);
    });
    
    test('should handle collection errors', async () => {
      mockFileCollector.collect.mockRejectedValue(new Error('Collection failed'));
      
      const builder = new FileContextBuilder();
      await expect(builder.build()).rejects.toThrow('Collection failed');
    });
  });
  
  describe('buildWithRenderer', () => {
    test('should use custom renderer', async () => {
      const customRenderer = {
        render: jest.fn().mockReturnValue('custom output')
      };
      
      const builder = new FileContextBuilder();
      const result = await builder.buildWithRenderer(customRenderer);
      
      expect(customRenderer.render).toHaveBeenCalled();
      expect(result).toHaveProperty('output', 'custom output');
    });
  });
  
  describe('getConfig', () => {
    test('should return current config', () => {
      const config = {
        includeDirs: [{ path: './src', include: ['**/*.js'] }]
      };
      
      const builder = new FileContextBuilder(config);
      const result = builder.getConfig();
      
      expect(result).toEqual(config);
    });
  });
  
  describe('setConfig', () => {
    test('should update config', () => {
      const builder = new FileContextBuilder();
      const newConfig = {
        includeDirs: [{ path: './lib', include: ['**/*.ts'] }]
      };
      
      builder.setConfig(newConfig);
      
      // Create a new collector with the updated config
      expect(FileCollector).toHaveBeenCalledWith(newConfig);
    });
  });
});
