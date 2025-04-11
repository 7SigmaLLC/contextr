#!/usr/bin/env node

import express from 'express';
import path from 'path';
import open from 'open';
import { dirname } from 'path';
import fs from 'fs';
import bodyParser from 'body-parser';
import { 
  FileContextBuilder, 
  FileCollectorConfig,
  ConsoleRenderer,
  JsonRenderer,
  WhitelistBlacklist,
  FileContentSearch,
  FileSearchOptions,
  RegexPatternMatcher
} from '../../index';

// Get current directory
// In CommonJS environment, __dirname is already available
// For TypeScript compilation, we'll declare it if not available
const currentFilename = 'index.js';
const currentDirname = __dirname || dirname(currentFilename);

const app = express();
const PORT = process.env.CONTEXTR_STUDIO_PORT ? parseInt(process.env.CONTEXTR_STUDIO_PORT, 10) : 3000;
const HOST = process.env.CONTEXTR_STUDIO_HOST || 'localhost';
const OPEN_BROWSER = process.env.CONTEXTR_STUDIO_OPEN_BROWSER === 'true';

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use((express as any).static(path.join(currentDirname, 'public')));

// API Routes
app.get('/api/files', async (req, res) => {
  try {
    const dirPath = req.query.path || '.';
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    const fileList = files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      path: path.join(dirPath.toString(), file.name),
      extension: file.isDirectory() ? null : path.extname(file.name).substring(1)
    }));
    
    res.json(fileList);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/context/build', async (req, res) => {
  try {
    const config = req.body.config;
    
    if (!config) {
      return res.status(400).json({ error: 'Configuration is required' });
    }
    
    const builder = new FileContextBuilder(config);
    const context = await builder.build();
    
    // Apply additional filters if provided
    let filteredFiles = context.files;
    
    // Filter by extensions if specified
    if (req.body.extensions && req.body.extensions.length > 0) {
      filteredFiles = filteredFiles.filter(file => {
        const ext = path.extname(file.filePath).substring(1);
        return req.body.extensions.includes(ext);
      });
    }
    
    // Filter by content search if specified
    if (req.body.searchInFiles) {
      const { pattern, isRegex } = req.body.searchInFiles;
      if (pattern) {
        filteredFiles = filteredFiles.filter(file => {
          if (isRegex) {
            return RegexPatternMatcher.test(file.content, pattern, 'gm');
          } else {
            return file.content.includes(pattern);
          }
        });
      }
    }
    
    // Update context with filtered files
    context.files = filteredFiles;
    
    if (req.body.format === 'json') {
      const jsonRenderer = new JsonRenderer();
      const jsonOutput = jsonRenderer.render(context);
      res.json({
        context: jsonOutput,
        totalFiles: context.files.length,
        totalSize: context.files.reduce((sum, file) => sum + file.content.length, 0)
      });
    } else {
      const consoleRenderer = new ConsoleRenderer();
      const output = consoleRenderer.render(context);
      res.json({ 
        output,
        totalFiles: context.files.length,
        totalSize: context.files.reduce((sum, file) => sum + file.content.length, 0)
      });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/search', async (req, res) => {
  try {
    const { config, searchOptions } = req.body;
    
    if (!config || !searchOptions) {
      return res.status(400).json({ error: 'Configuration and search options are required' });
    }
    
    const builder = new FileContextBuilder(config);
    const context = await builder.build();
    
    // Apply extension filtering if specified
    let filesToSearch = context.files;
    if (req.body.extensions && req.body.extensions.length > 0) {
      filesToSearch = filesToSearch.filter(file => {
        const ext = path.extname(file.filePath).substring(1);
        return req.body.extensions.includes(ext);
      });
    }
    
    const results = FileContentSearch.searchInFiles(filesToSearch, searchOptions);
    
    // Add context lines if requested
    let resultsWithContext = results;
    if (searchOptions.contextLines && searchOptions.contextLines > 0) {
      resultsWithContext = results.map(result => 
        FileContentSearch.addContextLines(result, searchOptions.contextLines)
      );
    }
    
    res.json({
      totalFiles: filesToSearch.length,
      matchedFiles: results.length,
      totalMatches: results.reduce((sum, result) => sum + result.matchCount, 0),
      results: resultsWithContext
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/config/save', (req, res) => {
  try {
    const { name, config } = req.body;
    
    if (!name || !config) {
      return res.status(400).json({ error: 'Name and configuration are required' });
    }
    
    // Use home directory for global configs or current directory for project configs
    const configDir = req.body.global 
      ? path.join(process.env.HOME || process.env.USERPROFILE || '.', '.contextr')
      : path.join(process.cwd(), '.contextr');
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const configPath = path.join(configDir, `${name}.json`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    res.json({ success: true, path: configPath });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/config/list', (req, res) => {
  try {
    // Check both global and project config directories
    const globalConfigDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.contextr');
    const projectConfigDir = path.join(process.cwd(), '.contextr');
    
    const configs = [];
    
    // Get global configs
    if (fs.existsSync(globalConfigDir)) {
      const globalFiles = fs.readdirSync(globalConfigDir);
      globalFiles
        .filter(file => file.endsWith('.json'))
        .forEach(file => {
          configs.push({
            name: file.replace('.json', ''),
            path: path.join(globalConfigDir, file),
            isGlobal: true
          });
        });
    }
    
    // Get project configs
    if (fs.existsSync(projectConfigDir)) {
      const projectFiles = fs.readdirSync(projectConfigDir);
      projectFiles
        .filter(file => file.endsWith('.json'))
        .forEach(file => {
          configs.push({
            name: file.replace('.json', ''),
            path: path.join(projectConfigDir, file),
            isGlobal: false
          });
        });
    }
    
    res.json({ configs });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/config/load', (req, res) => {
  try {
    const name = req.query.name;
    const isGlobal = req.query.global === 'true';
    
    if (!name) {
      return res.status(400).json({ error: 'Config name is required' });
    }
    
    // Determine config path based on global flag
    const configDir = isGlobal
      ? path.join(process.env.HOME || process.env.USERPROFILE || '.', '.contextr')
      : path.join(process.cwd(), '.contextr');
    
    const configPath = path.join(configDir, `${name}.json`);
    
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: `Config '${name}' not found` });
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.delete('/api/config/delete', (req, res) => {
  try {
    const name = req.query.name;
    const isGlobal = req.query.global === 'true';
    
    if (!name) {
      return res.status(400).json({ error: 'Config name is required' });
    }
    
    // Determine config path based on global flag
    const configDir = isGlobal
      ? path.join(process.env.HOME || process.env.USERPROFILE || '.', '.contextr')
      : path.join(process.cwd(), '.contextr');
    
    const configPath = path.join(configDir, `${name}.json`);
    
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: `Config '${name}' not found` });
    }
    
    fs.unlinkSync(configPath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/file/content', (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File not found: ${filePath}` });
    }
    
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      return res.status(400).json({ error: `Path is a directory: ${filePath}` });
    }
    
    // Check file size to avoid loading very large files
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (stats.size > MAX_SIZE) {
      return res.status(413).json({ 
        error: `File too large (${(stats.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.` 
      });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(currentDirname, 'public', 'index.html'));
});

// Start the server
const server = app.listen(PORT, HOST, () => {
  console.log(`ContextR Studio running at http://${HOST}:${PORT}`);
  if (OPEN_BROWSER) {
    open(`http://${HOST}:${PORT}`);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down ContextR Studio...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
