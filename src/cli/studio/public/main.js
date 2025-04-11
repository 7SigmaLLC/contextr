// ESM/CJS compatibility wrapper
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['exports'], factory);
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    // CommonJS
    factory(exports);
  } else {
    // Browser globals
    factory((root.contextr = {}));
  }
}(typeof self !== 'undefined' ? self : this, function(exports) {
  // Main JavaScript for ContextR Studio UI

  // Global state
  let currentConfig = {
    name: "Project Context",
    showContents: true,
    showMeta: true,
    includeDirs: [],
    includeFiles: [],
    excludeFiles: [],
    useRegex: false
  };

  let currentContext = null;
  let currentDirIndex = -1;
  let selectedFiles = new Set();

  // DOM Elements
  function initializeUI() {
    const fileTree = document.getElementById('file-tree');
    const pathInput = document.getElementById('path-input');
    const browseBtn = document.getElementById('browse-btn');
    const includeDirsContainer = document.getElementById('include-dirs');
    const includeFilesContainer = document.getElementById('include-files');
    const excludeFilesContainer = document.getElementById('exclude-files');
    const addDirBtn = document.getElementById('add-dir-btn');
    const addIncludeFileBtn = document.getElementById('add-include-file-btn');
    const addExcludeFileBtn = document.getElementById('add-exclude-file-btn');
    const includeFileInput = document.getElementById('include-file-input');
    const excludeFileInput = document.getElementById('exclude-file-input');
    const buildContextBtn = document.getElementById('build-context-btn');
    const resetConfigBtn = document.getElementById('reset-config-btn');
    const contextNameInput = document.getElementById('context-name');
    const showContentsCheckbox = document.getElementById('show-contents');
    const showMetaCheckbox = document.getElementById('show-meta');
    const useRegexCheckbox = document.getElementById('use-regex');
    const previewContent = document.getElementById('preview-content');
    const previewFormat = document.getElementById('preview-format');
    const searchBtn = document.getElementById('search-btn');
    const searchPattern = document.getElementById('search-pattern');
    const searchRegex = document.getElementById('search-regex');
    const caseSensitive = document.getElementById('case-sensitive');
    const wholeWord = document.getElementById('whole-word');
    const contextLines = document.getElementById('context-lines');
    const searchResults = document.getElementById('search-results');
    const statusMessage = document.getElementById('status-message');
    const statusFiles = document.getElementById('status-files');
    const saveConfigBtn = document.getElementById('save-config-btn');
    const loadConfigBtn = document.getElementById('load-config-btn');
    const configList = document.getElementById('config-list');

    // Initialize UI
    document.addEventListener('DOMContentLoaded', () => {
      // Load file tree
      loadFileTree(pathInput.value);
      
      // Initialize sortable for directory items
      if (typeof Sortable !== 'undefined') {
        new Sortable(includeDirsContainer, {
          animation: 150,
          handle: '.drag-handle',
          ghostClass: 'sortable-ghost'
        });
      }
      
      // Load saved configurations
      loadConfigList();
      
      // Set up event listeners
      setupEventListeners();
      
      // Update status bar with version
      const versionElement = document.getElementById('status-version');
      if (versionElement) {
        versionElement.textContent = `ContextR v${getPackageVersion()}`;
      }
    });

    // Helper function to get package version
    function getPackageVersion() {
      // This would normally come from the package.json, but we'll hardcode it for now
      return "1.0.17";
    }

    // Set up all event listeners
    function setupEventListeners() {
      // Browse button
      if (browseBtn) {
        browseBtn.addEventListener('click', () => {
          loadFileTree(pathInput.value);
        });
      }
      
      // Path input enter key
      if (pathInput) {
        pathInput.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') {
            loadFileTree(pathInput.value);
          }
        });
      }
      
      // Add directory button
      if (addDirBtn) {
        addDirBtn.addEventListener('click', () => {
          showDirectoryModal();
        });
      }
      
      // Add include file button
      if (addIncludeFileBtn) {
        addIncludeFileBtn.addEventListener('click', () => {
          addIncludeFile();
        });
      }
      
      // Include file input enter key
      if (includeFileInput) {
        includeFileInput.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') {
            addIncludeFile();
          }
        });
      }
      
      // Add exclude file button
      if (addExcludeFileBtn) {
        addExcludeFileBtn.addEventListener('click', () => {
          addExcludeFile();
        });
      }
      
      // Exclude file input enter key
      if (excludeFileInput) {
        excludeFileInput.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') {
            addExcludeFile();
          }
        });
      }
      
      // Build context button
      if (buildContextBtn) {
        buildContextBtn.addEventListener('click', () => {
          buildContext();
        });
      }
      
      // Reset config button
      if (resetConfigBtn) {
        resetConfigBtn.addEventListener('click', () => {
          resetConfig();
        });
      }
      
      // Preview format change
      if (previewFormat) {
        previewFormat.addEventListener('change', () => {
          if (currentContext) {
            updatePreview();
          }
        });
      }
      
      // Search button
      if (searchBtn) {
        searchBtn.addEventListener('click', () => {
          performSearch();
        });
      }
      
      // Save config button
      if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', () => {
          showSaveConfigModal();
        });
      }
      
      // Directory modal save button
      const saveDirConfigBtn = document.getElementById('save-dir-config-btn');
      if (saveDirConfigBtn) {
        saveDirConfigBtn.addEventListener('click', () => {
          saveDirConfig();
        });
      }
      
      // Config save modal confirm button
      const confirmSaveConfigBtn = document.getElementById('confirm-save-config-btn');
      if (confirmSaveConfigBtn) {
        confirmSaveConfigBtn.addEventListener('click', () => {
          saveConfig();
        });
      }
      
      // Form inputs for config
      if (contextNameInput) {
        contextNameInput.addEventListener('change', () => {
          currentConfig.name = contextNameInput.value;
        });
      }
      
      if (showContentsCheckbox) {
        showContentsCheckbox.addEventListener('change', () => {
          currentConfig.showContents = showContentsCheckbox.checked;
        });
      }
      
      if (showMetaCheckbox) {
        showMetaCheckbox.addEventListener('change', () => {
          currentConfig.showMeta = showMetaCheckbox.checked;
        });
      }
      
      if (useRegexCheckbox) {
        useRegexCheckbox.addEventListener('change', () => {
          currentConfig.useRegex = useRegexCheckbox.checked;
        });
      }
    }

    // Load file tree from server
    async function loadFileTree(dirPath) {
      try {
        updateStatus(`Loading files from ${dirPath}...`);
        if (fileTree) {
          fileTree.innerHTML = `
            <div class="d-flex justify-content-center">
              <div class="spinner-border text-light" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          `;
        }
        
        const response = await fetch(`/api/files?path=${encodeURIComponent(dirPath)}`);
        if (!response.ok) {
          throw new Error(`Failed to load files: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (fileTree) {
          renderFileTree(data, fileTree);
        }
        updateStatus('Files loaded successfully');
        if (statusFiles) {
          statusFiles.textContent = `Files: ${data.length}`;
        }
      } catch (error) {
        if (fileTree) {
          fileTree.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
        updateStatus(`Error: ${error.message}`, true);
      }
    }

    // Render file tree
    function renderFileTree(files, container) {
      container.innerHTML = '';
      const ul = document.createElement('ul');
      ul.className = 'file-tree';
      
      // Sort directories first, then files
      files.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      
      files.forEach(file => {
        const li = document.createElement('li');
        const icon = file.isDirectory ? 'bi-folder-fill folder' : 'bi-file-text file';
        
        li.innerHTML = `<i class="bi ${icon}"></i> ${file.name}`;
        li.dataset.path = file.path;
        li.dataset.isDirectory = file.isDirectory;
        
        if (file.isDirectory) {
          li.addEventListener('click', (e) => {
            e.stopPropagation();
            if (e.ctrlKey || e.metaKey) {
              // Add directory to config
              addDirectoryToConfig(file.path);
            } else {
              // Navigate to directory
              if (pathInput) {
                pathInput.value = file.path;
                loadFileTree(file.path);
              }
            }
          });
        } else {
          li.addEventListener('click', (e) => {
            e.stopPropagation();
            if (e.ctrlKey || e.metaKey) {
              // Toggle file selection
              if (selectedFiles.has(file.path)) {
                selectedFiles.delete(file.path);
                li.classList.remove('selected');
              } else {
                selectedFiles.add(file.path);
                li.classList.add('selected');
              }
            } else {
              // Add file to include files
              addFileToInclude(file.path);
            }
          });
        }
        
        ul.appendChild(li);
      });
      
      container.appendChild(ul);
    }

    // Add directory to config
    function addDirectoryToConfig(dirPath) {
      const dirConfig = {
        path: dirPath,
        include: ['**/*'],
        exclude: [],
        recursive: true,
        useRegex: currentConfig.useRegex
      };
      
      currentConfig.includeDirs.push(dirConfig);
      renderIncludeDirs();
      updateStatus(`Added directory: ${dirPath}`);
    }

    // Render include directories
    function renderIncludeDirs() {
      if (!includeDirsContainer) return;
      
      includeDirsContainer.innerHTML = '';
      
      currentConfig.includeDirs.forEach((dirConfig, index) => {
        const dirItem = document.createElement('div');
        dirItem.className = 'context-item';
        dirItem.dataset.index = index;
        
        dirItem.innerHTML = `
          <div class="drag-handle"><i class="bi bi-grip-vertical"></i></div>
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong>${dirConfig.path}</strong>
              <div class="small text-muted">
                Include: ${dirConfig.include.join(', ')}
                ${dirConfig.exclude.length > 0 ? `<br>Exclude: ${dirConfig.exclude.join(', ')}` : ''}
                <br>Recursive: ${dirConfig.recursive ? 'Yes' : 'No'}, 
                Regex: ${dirConfig.useRegex ? 'Yes' : 'No'}
              </div>
            </div>
            <div class="actions">
              <button class="btn btn-sm btn-outline-primary edit-dir-btn" data-index="${index}">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger remove-dir-btn" data-index="${index}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        `;
        
        includeDirsContainer.appendChild(dirItem);
        
        // Add event listeners
        dirItem.querySelector('.edit-dir-btn').addEventListener('click', () => {
          editDirectory(index);
        });
        
        dirItem.querySelector('.remove-dir-btn').addEventListener('click', () => {
          removeDirectory(index);
        });
      });
    }

    // Show directory configuration modal
    function showDirectoryModal(index = -1) {
      currentDirIndex = index;
      
      // Check if Bootstrap is available
      if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not available');
        return;
      }
      
      const modalElement = document.getElementById('dir-config-modal');
      if (!modalElement) return;
      
      const modal = new bootstrap.Modal(modalElement);
      const dirPath = document.getElementById('dir-path');
      const dirRecursive = document.getElementById('dir-recursive');
      const dirUseRegex = document.getElementById('dir-use-regex');
      const dirIncludeTags = document.getElementById('dir-include-tags');
      const dirExcludeTags = document.getElementById('dir-exclude-tags');
      
      if (!dirPath || !dirRecursive || !dirUseRegex || !dirIncludeTags || !dirExcludeTags) {
        console.error('Modal elements not found');
        return;
      }
      
      // Clear previous values
      dirPath.value = '';
      dirRecursive.checked = true;
      dirUseRegex.checked = currentConfig.useRegex;
      dirIncludeTags.innerHTML = '';
      dirExcludeTags.innerHTML = '';
      
      // If editing existing directory
      if (index >= 0 && index < currentConfig.includeDirs.length) {
        const dirConfig = currentConfig.includeDirs[index];
        dirPath.value = dirConfig.path;
        dirRecursive.checked = dirConfig.recursive;
        dirUseRegex.checked = dirConfig.useRegex || false;
        
        // Render include patterns
        dirConfig.include.forEach(pattern => {
          addPatternTag(pattern, dirIncludeTags, 'dir-include');
        });
        
        // Render exclude patterns
        if (dirConfig.exclude) {
          dirConfig.exclude.forEach(pattern => {
            addPatternTag(pattern, dirExcludeTags, 'dir-exclude');
          });
        }
      }
      
      modal.show();
      
      // Set up event listeners for the modal
      const addDirIncludeBtn = document.getElementById('add-dir-include-btn');
      if (addDirIncludeBtn) {
        addDirIncludeBtn.onclick = () => {
          const input = document.getElementById('dir-include-input');
          if (input && input.value.trim()) {
            addPatternTag(input.value.trim(), dirIncludeTags, 'dir-include');
            input.value = '';
          }
        };
      }
      
      const addDirExcludeBtn = document.getElementById('add-dir-exclude-btn');
      if (addDirExcludeBtn) {
        addDirExcludeBtn.onclick = () => {
          const input = document.getElementById('dir-exclude-input');
          if (input && input.value.trim()) {
            addPatternTag(input.value.trim(), dirExcludeTags, 'dir-exclude');
            input.value = '';
          }
        };
      }
      
      const dirIncludeInput = document.getElementById('dir-include-input');
      if (dirIncludeInput) {
        dirIncludeInput.onkeyup = (e) => {
          if (e.key === 'Enter' && addDirIncludeBtn) {
            addDirIncludeBtn.click();
          }
        };
      }
      
      const dirExcludeInput = document.getElementById('dir-exclude-input');
      if (dirExcludeInput) {
        dirExcludeInput.onkeyup = (e) => {
          if (e.key === 'Enter' && addDirExcludeBtn) {
            addDirExcludeBtn.click();
          }
        };
      }
      
      const browseDirBtn = document.getElementById('browse-dir-btn');
      if (browseDirBtn && dirPath && pathInput) {
        browseDirBtn.onclick = () => {
          // This would normally open a directory browser, but we'll use the current path
          dirPath.value = pathInput.value;
        };
      }
    }

    // Add pattern tag to container
    function addPatternTag(pattern, container, prefix) {
      const tag = document.createElement('span');
      tag.className = 'pattern-tag';
      tag.innerHTML = `
        ${pattern}
        <span class="remove" data-pattern="${pattern}">×</span>
      `;
      
      container.appendChild(tag);
      
      // Add event listener to remove button
      tag.querySelector('.remove').addEventListener('click', (e) => {
        e.target.parentElement.remove();
      });
    }

    // Save directory configuration
    function saveDirConfig() {
      const dirPathElement = document.getElementById('dir-path');
      if (!dirPathElement) return;
      
      const dirPath = dirPathElement.value.trim();
      if (!dirPath) {
        alert('Directory path is required');
        return;
      }
      
      // Get include patterns
      const includePatterns = [];
      document.querySelectorAll('#dir-include-tags .pattern-tag').forEach(tag => {
        const pattern = tag.textContent.trim().replace('×', '');
        includePatterns.push(pattern);
      });
      
      if (includePatterns.length === 0) {
        includePatterns.push('**/*'); // Default pattern
      }
      
      // Get exclude patterns
      const excludePatterns = [];
      document.querySelectorAll('#dir-exclude-tags .pattern-tag').forEach(tag => {
        const pattern = tag.textContent.trim().replace('×', '');
        excludePatterns.push(pattern);
      });
      
      const dirRecursiveElement = document.getElementById('dir-recursive');
      const dirUseRegexElement = document.getElementById('dir-use-regex');
      
      const dirConfig = {
        path: dirPath,
        include: includePatterns,
        exclude: excludePatterns,
        recursive: dirRecursiveElement ? dirRecursiveElement.checked : true,
        useRegex: dirUseRegexElement ? dirUseRegexElement.checked : false
      };
      
      if (currentDirIndex >= 0) {
        // Update existing directory
        currentConfig.includeDirs[currentDirIndex] = dirConfig;
      } else {
        // Add new directory
        currentConfig.includeDirs.push(dirConfig);
      }
      
      renderIncludeDirs();
      
      // Close modal if Bootstrap is available
      if (typeof bootstrap !== 'undefined') {
        const modalElement = document.getElementById('dir-config-modal');
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }
      }
      
      updateStatus(`${currentDirIndex >= 0 ? 'Updated' : 'Added'} directory: ${dirPath}`);
    }

    // Edit directory
    function editDirectory(index) {
      showDirectoryModal(index);
    }

    // Remove directory
    function removeDirectory(index) {
      if (confirm('Are you sure you want to remove this directory?')) {
        currentConfig.includeDirs.splice(index, 1);
        renderIncludeDirs();
        updateStatus('Directory removed');
      }
    }

    // Add file to include files
    function addFileToInclude(filePath) {
      if (!currentConfig.includeFiles.includes(filePath)) {
        currentConfig.includeFiles.push(filePath);
        renderIncludeFiles();
        updateStatus(`Added file: ${filePath}`);
      }
    }

    // Add include file from input
    function addIncludeFile() {
      if (!includeFileInput) return;
      
      const pattern = includeFileInput.value.trim();
      if (pattern && !currentConfig.includeFiles.includes(pattern)) {
        currentConfig.includeFiles.push(pattern);
        renderIncludeFiles();
        includeFileInput.value = '';
        updateStatus(`Added include pattern: ${pattern}`);
      }
    }

    // Add exclude file from input
    function addExcludeFile() {
      if (!excludeFileInput) return;
      
      const pattern = excludeFileInput.value.trim();
      if (pattern && !currentConfig.excludeFiles.includes(pattern)) {
        currentConfig.excludeFiles.push(pattern);
        renderExcludeFiles();
        excludeFileInput.value = '';
        updateStatus(`Added exclude pattern: ${pattern}`);
      }
    }

    // Render include files
    function renderIncludeFiles() {
      if (!includeFilesContainer) return;
      
      includeFilesContainer.innerHTML = '';
      
      currentConfig.includeFiles.forEach(pattern => {
        const tag = document.createElement('span');
        tag.className = 'pattern-tag';
        tag.innerHTML = `
          ${pattern}
          <span class="remove" data-pattern="${pattern}">×</span>
        `;
        
        includeFilesContainer.appendChild(tag);
        
        // Add event listener to remove button
        tag.querySelector('.remove').addEventListener('click', (e) => {
          const pattern = e.target.dataset.pattern;
          currentConfig.includeFiles = currentConfig.includeFiles.filter(p => p !== pattern);
          renderIncludeFiles();
          updateStatus(`Removed include pattern: ${pattern}`);
        });
      });
    }

    // Render exclude files
    function renderExcludeFiles() {
      if (!excludeFilesContainer) return;
      
      excludeFilesContainer.innerHTML = '';
      
      currentConfig.excludeFiles.forEach(pattern => {
        const tag = document.createElement('span');
        tag.className = 'pattern-tag';
        tag.innerHTML = `
          ${pattern}
          <span class="remove" data-pattern="${pattern}">×</span>
        `;
        
        excludeFilesContainer.appendChild(tag);
        
        // Add event listener to remove button
        tag.querySelector('.remove').addEventListener('click', (e) => {
          const pattern = e.target.dataset.pattern;
          currentConfig.excludeFiles = currentConfig.excludeFiles.filter(p => p !== pattern);
          renderExcludeFiles();
          updateStatus(`Removed exclude pattern: ${pattern}`);
        });
      });
    }

    // Build context
    async function buildContext() {
      try {
        updateStatus('Building context...');
        
        // Update config from form inputs
        if (contextNameInput) {
          currentConfig.name = contextNameInput.value;
        }
        
        if (showContentsCheckbox) {
          currentConfig.showContents = showContentsCheckbox.checked;
        }
        
        if (showMetaCheckbox) {
          currentConfig.showMeta = showMetaCheckbox.checked;
        }
        
        if (useRegexCheckbox) {
          currentConfig.useRegex = useRegexCheckbox.checked;
        }
        
        // Check if we have any directories or files
        if (currentConfig.includeDirs.length === 0 && currentConfig.includeFiles.length === 0) {
          alert('Please add at least one directory or file pattern');
          updateStatus('Error: No directories or files specified', true);
          return;
        }
        
        // Build context
        const format = previewFormat ? previewFormat.value : 'console';
        
        const response = await fetch('/api/context/build', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            config: currentConfig,
            format
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to build context: ${response.statusText}`);
        }
        
        const data = await response.json();
        currentContext = data;
        
        // Update preview
        updatePreview();
        
        // Update status
        updateStatus(`Context built successfully: ${data.totalFiles} files`);
        if (statusFiles) {
          statusFiles.textContent = `Files: ${data.totalFiles}`;
        }
        
        // Switch to preview tab
        if (typeof bootstrap !== 'undefined') {
          const previewTab = document.getElementById('preview-tab');
          if (previewTab) {
            const tab = new bootstrap.Tab(previewTab);
            tab.show();
          }
        }
      } catch (error) {
        updateStatus(`Error building context: ${error.message}`, true);
        if (previewContent) {
          previewContent.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
      }
    }

    // Update preview
    function updatePreview() {
      if (!previewContent || !currentContext) return;
      
      const format = previewFormat ? previewFormat.value : 'console';
      
      if (format === 'json') {
        // JSON format
        const jsonOutput = JSON.stringify(currentContext.context || currentContext, null, 2);
        previewContent.innerHTML = `<pre class="preview-code">${escapeHtml(jsonOutput)}</pre>`;
      } else {
        // Console format
        previewContent.innerHTML = `<pre class="preview-code">${escapeHtml(currentContext.output || '')}</pre>`;
      }
    }

    // Perform search
    async function performSearch() {
      try {
        if (!searchPattern || !searchResults) return;
        
        const pattern = searchPattern.value.trim();
        if (!pattern) {
          alert('Please enter a search pattern');
          return;
        }
        
        updateStatus('Searching...');
        
        // Build search options
        const searchOptions = {
          pattern,
          isRegex: searchRegex ? searchRegex.checked : false,
          caseSensitive: caseSensitive ? caseSensitive.checked : false,
          wholeWord: wholeWord ? wholeWord.checked : false,
          contextLines: contextLines ? parseInt(contextLines.value, 10) : 2
        };
        
        // Perform search
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            config: currentConfig,
            searchOptions
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to search: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Display results
        if (data.results.length === 0) {
          searchResults.innerHTML = `<div class="alert alert-warning">No matches found</div>`;
          updateStatus('Search completed: No matches found');
          return;
        }
        
        // Format results
        let resultsHtml = `
          <div class="alert alert-success">
            Found ${data.totalMatches} matches in ${data.matchedFiles} files (searched ${data.totalFiles} files)
          </div>
          <div class="list-group">
        `;
        
        data.results.forEach(result => {
          resultsHtml += `
            <div class="list-group-item">
              <div class="d-flex justify-content-between align-items-center">
                <h6 class="mb-1">${result.filePath}</h6>
                <span class="badge bg-primary rounded-pill">${result.matchCount} matches</span>
              </div>
              <pre class="mt-2 preview-code">${formatSearchResult(result)}</pre>
            </div>
          `;
        });
        
        resultsHtml += `</div>`;
        searchResults.innerHTML = resultsHtml;
        
        updateStatus(`Search completed: Found ${data.totalMatches} matches in ${data.matchedFiles} files`);
      } catch (error) {
        updateStatus(`Error searching: ${error.message}`, true);
        searchResults.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
      }
    }

    // Format search result
    function formatSearchResult(result) {
      let output = '';
      
      if (result.matches && result.matches.length > 0) {
        result.matches.forEach(match => {
          // Add line number
          output += `<span class="text-muted">${match.lineNumber}:</span> `;
          
          // Add content with highlighted match
          if (match.content) {
            output += escapeHtml(match.content);
          } else if (match.before || match.match || match.after) {
            output += escapeHtml(match.before || '');
            output += `<span class="match-highlight">${escapeHtml(match.match || '')}</span>`;
            output += escapeHtml(match.after || '');
          }
          
          output += '\n';
        });
      }
      
      return output;
    }

    // Reset config
    function resetConfig() {
      if (confirm('Are you sure you want to reset the configuration?')) {
        currentConfig = {
          name: "Project Context",
          showContents: true,
          showMeta: true,
          includeDirs: [],
          includeFiles: [],
          excludeFiles: [],
          useRegex: false
        };
        
        // Update UI
        if (contextNameInput) contextNameInput.value = currentConfig.name;
        if (showContentsCheckbox) showContentsCheckbox.checked = currentConfig.showContents;
        if (showMetaCheckbox) showMetaCheckbox.checked = currentConfig.showMeta;
        if (useRegexCheckbox) useRegexCheckbox.checked = currentConfig.useRegex;
        
        renderIncludeDirs();
        renderIncludeFiles();
        renderExcludeFiles();
        
        updateStatus('Configuration reset');
      }
    }

    // Show save config modal
    function showSaveConfigModal() {
      // Check if Bootstrap is available
      if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not available');
        return;
      }
      
      const modalElement = document.getElementById('save-config-modal');
      if (!modalElement) return;
      
      const modal = new bootstrap.Modal(modalElement);
      const configNameInput = document.getElementById('config-name');
      const globalConfigCheckbox = document.getElementById('global-config');
      
      if (configNameInput) {
        configNameInput.value = currentConfig.name.replace(/\s+/g, '-').toLowerCase();
      }
      
      if (globalConfigCheckbox) {
        globalConfigCheckbox.checked = false;
      }
      
      modal.show();
    }

    // Save config
    async function saveConfig() {
      try {
        const configNameInput = document.getElementById('config-name');
        const globalConfigCheckbox = document.getElementById('global-config');
        
        if (!configNameInput) return;
        
        const name = configNameInput.value.trim();
        if (!name) {
          alert('Please enter a configuration name');
          return;
        }
        
        updateStatus('Saving configuration...');
        
        const response = await fetch('/api/config/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            config: currentConfig,
            global: globalConfigCheckbox ? globalConfigCheckbox.checked : false
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save configuration: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Close modal if Bootstrap is available
        if (typeof bootstrap !== 'undefined') {
          const modalElement = document.getElementById('save-config-modal');
          if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
              modal.hide();
            }
          }
        }
        
        updateStatus(`Configuration saved: ${name}`);
        
        // Reload config list
        loadConfigList();
      } catch (error) {
        updateStatus(`Error saving configuration: ${error.message}`, true);
      }
    }

    // Load config list
    async function loadConfigList() {
      try {
        if (!configList) return;
        
        updateStatus('Loading configurations...');
        
        const response = await fetch('/api/config/list');
        if (!response.ok) {
          throw new Error(`Failed to load configurations: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.configs || data.configs.length === 0) {
          configList.innerHTML = `<li><a class="dropdown-item disabled" href="#">No saved configurations</a></li>`;
          updateStatus('No saved configurations found');
          return;
        }
        
        configList.innerHTML = '';
        data.configs.forEach(config => {
          const li = document.createElement('li');
          li.innerHTML = `
            <a class="dropdown-item" href="#" data-name="${config.name}" data-global="${config.isGlobal}">
              ${config.name} ${config.isGlobal ? '(global)' : ''}
            </a>
          `;
          
          li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            loadConfig(config.name, config.isGlobal);
          });
          
          configList.appendChild(li);
        });
        
        updateStatus(`Loaded ${data.configs.length} configurations`);
      } catch (error) {
        updateStatus(`Error loading configurations: ${error.message}`, true);
        if (configList) {
          configList.innerHTML = `<li><a class="dropdown-item disabled" href="#">Error: ${error.message}</a></li>`;
        }
      }
    }

    // Load config
    async function loadConfig(name, isGlobal) {
      try {
        updateStatus(`Loading configuration: ${name}...`);
        
        const response = await fetch(`/api/config/load?name=${encodeURIComponent(name)}&global=${isGlobal}`);
        if (!response.ok) {
          throw new Error(`Failed to load configuration: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Update current config
        currentConfig = data.config;
        
        // Update UI
        if (contextNameInput) contextNameInput.value = currentConfig.name || 'Project Context';
        if (showContentsCheckbox) showContentsCheckbox.checked = currentConfig.showContents !== false;
        if (showMetaCheckbox) showMetaCheckbox.checked = currentConfig.showMeta !== false;
        if (useRegexCheckbox) useRegexCheckbox.checked = currentConfig.useRegex === true;
        
        renderIncludeDirs();
        renderIncludeFiles();
        renderExcludeFiles();
        
        updateStatus(`Configuration loaded: ${name}`);
      } catch (error) {
        updateStatus(`Error loading configuration: ${error.message}`, true);
      }
    }

    // Update status
    function updateStatus(message, isError = false) {
      if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = isError ? 'col-md-4 text-danger' : 'col-md-4';
      }
      console.log(isError ? `ERROR: ${message}` : message);
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
      if (!text) return '';
      
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Return public API
    return {
      loadFileTree,
      buildContext,
      performSearch,
      resetConfig,
      saveConfig,
      loadConfig
    };
  }

  // Export public API
  exports.initializeUI = initializeUI;
}));
