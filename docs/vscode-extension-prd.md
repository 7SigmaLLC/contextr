# Contextr VS Code Extension - Procedure Requirements Document (PRD)

## Technology Stack

| Category | Selection |
|----------|-----------|
| **Core Requirements** | Node.js (latest), Yarn, TypeScript (latest) |
| **VS Code API** | vscode-extension-sdk, @types/vscode |
| **UI Framework** | React (latest), Tailwind CSS, shadcn-react components |
| **Backend (Future MCP)** | Elysia with Bun, API docs plugin, better-auth |
| **Build Tools** | Vite |
| **Testing Framework** | Vitest |
| **Additional Tools** | Yeoman generator, vsce, Elysia WS plugin, Zustand |

## Functional Requirements

| ID | Requirement | Description | User Story | Implementation Considerations |
|----|-------------|-------------|------------|------------------------------|
| FR-01 | Context Explorer Panel | Implement a tree view in the VS Code sidebar that displays project files with selection options for inclusion/exclusion in context | As a developer, I want to visually select which files to include in my context so I can quickly build relevant context for LLMs | - Use VS Code TreeView API<br>- Implement custom TreeDataProvider<br>- Store selection state with Zustand<br>- Support file/folder checkboxes |
| FR-02 | File/Folder Selection | Enable users to select files and folders for inclusion/exclusion via checkboxes in the tree view | As a developer, I want to check/uncheck files and folders to quickly define what should be included in my context | - Implement hierarchical selection logic<br>- Support partial selection states<br>- Persist selection between sessions |
| FR-03 | Pattern-based Filtering | Allow users to define include/exclude patterns (glob and regex) for file selection | As a developer, I want to use patterns to include/exclude files so I can efficiently manage large projects | - Leverage existing contextr pattern matching<br>- Provide pattern validation<br>- Show pattern match previews |
| FR-04 | Right-click Integration | Add context menu items for files and folders to quickly add/remove from context | As a developer, I want to right-click files to add them to context without switching to the explorer panel | - Register context menu contributions<br>- Implement command handlers<br>- Provide visual feedback for selection |
| FR-05 | Context Preview | Create a preview panel showing the generated context with syntax highlighting | As a developer, I want to preview my context before using it so I can verify it contains the right information | - Use WebView panel with React<br>- Implement syntax highlighting<br>- Show file metadata<br>- Support collapsible sections |
| FR-06 | Context Management | Enable saving, loading, and managing named contexts | As a developer, I want to save contexts for different tasks so I can quickly switch between them | - Implement context storage using VS Code storage API<br>- Create UI for naming and managing contexts<br>- Support import/export of contexts |
| FR-07 | Search Integration | Provide in-file search with regex support to find and include relevant files | As a developer, I want to search within files to find and include only relevant code in my context | - Leverage contextr's FileContentSearch<br>- Show search results with previews<br>- Allow adding search results to context |
| FR-08 | LLM Integration | Enable sending context directly to configured LLM endpoints | As a developer, I want to send my context directly to LLMs so I can get assistance without leaving VS Code | - Support configurable LLM endpoints<br>- Implement token counting<br>- Provide context optimization options<br>- Handle API authentication |
| FR-09 | Context Size Optimization | Provide tools to optimize context size for LLM token limits | As a developer, I want to optimize my context size so I can stay within LLM token limits while maximizing relevant information | - Implement token estimation<br>- Provide automatic trimming options<br>- Show size visualizations<br>- Support content summarization |
| FR-10 | Configuration Management | Create comprehensive settings for controlling extension behavior | As a developer, I want to configure default behaviors so the extension works according to my preferences | - Implement VS Code configuration contributions<br>- Support workspace/user settings<br>- Provide UI for complex configurations |

## Technical Requirements

| ID | Requirement | Description | Implementation Considerations | MCP Server Compatibility |
|----|-------------|-------------|------------------------------|--------------------------|
| TR-01 | Extension Architecture | Design a modular architecture that separates UI, business logic, and data access | - Use clean architecture principles<br>- Implement service interfaces<br>- Use dependency injection where appropriate | Design interfaces that could later communicate with an MCP server |
| TR-02 | State Management | Implement robust state management using Zustand | - Define clear state interfaces<br>- Separate UI state from application state<br>- Implement persistence where needed | State should be designed to sync with a future server |
| TR-03 | WebView Implementation | Create React-based WebViews for complex UI components | - Set up Vite for WebView bundling<br>- Implement message passing between extension and WebView<br>- Use Tailwind and shadcn-react for UI | WebViews should follow a client-server model internally |
| TR-04 | Performance Optimization | Ensure the extension remains responsive even with large projects | - Implement virtualization for large trees<br>- Use incremental updates<br>- Add background processing for intensive operations | Identify operations that could be offloaded to a future server |
| TR-05 | Error Handling | Implement comprehensive error handling and user feedback | - Create consistent error reporting<br>- Provide actionable error messages<br>- Log errors for troubleshooting | Error handling should account for network failures in future server model |
| TR-06 | Telemetry | Add optional telemetry for usage insights (with user consent) | - Implement privacy-focused telemetry<br>- Make it opt-in<br>- Collect only non-sensitive data | Design to work with both local and server telemetry |
| TR-07 | Extensibility | Design plugin system for future extensions | - Define extension points<br>- Create plugin interfaces<br>- Document extension API | Ensure plugin system could work with server architecture |
| TR-08 | Security | Implement security best practices for handling code and API keys | - Secure storage of credentials<br>- Sanitize data sent to LLMs<br>- Implement permission model | Design with future server authentication in mind |
| TR-09 | Testing Infrastructure | Set up comprehensive testing with Vitest | - Unit tests for core functionality<br>- Integration tests for VS Code API<br>- UI tests for WebViews | Tests should be adaptable to server architecture |
| TR-10 | Future MCP Compatibility | Design with future MCP server in mind | - Use adapter pattern for core services<br>- Implement service interfaces<br>- Design protocol for client-server communication | Document how each component would interact with MCP server |

## UI/UX Requirements

| ID | Requirement | Description | User Story | Implementation Considerations |
|----|-------------|-------------|------------|------------------------------|
| UX-01 | Intuitive Tree View | Create a clear, intuitive file tree with visual indicators for selection state | As a developer, I want to easily understand which files are included in my context at a glance | - Use clear checkbox states<br>- Add visual indicators for inclusion/exclusion<br>- Support custom icons for different file types |
| UX-02 | Responsive WebView UI | Ensure all WebView UIs are responsive and match VS Code themes | As a developer, I want the extension UI to feel native to VS Code and respond quickly to my actions | - Use VS Code theme variables<br>- Implement responsive design<br>- Ensure keyboard accessibility |
| UX-03 | Progressive Disclosure | Implement progressive disclosure for advanced features | As a developer, I want simple operations to be easy while having access to advanced features when needed | - Design clear primary actions<br>- Group advanced features logically<br>- Provide tooltips and help |
| UX-04 | Status Indicators | Provide clear status indicators for background operations | As a developer, I want to know when the extension is processing data so I understand system state | - Add status bar items<br>- Implement progress indicators<br>- Provide cancellation options |
| UX-05 | Keyboard Shortcuts | Implement keyboard shortcuts for common operations | As a developer, I want to use keyboard shortcuts to quickly perform common actions | - Register keybindings<br>- Document shortcuts<br>- Allow customization |
| UX-06 | Contextual Help | Provide contextual help and tooltips throughout the UI | As a developer, I want to understand how to use features without leaving the UI | - Implement hover tooltips<br>- Add help buttons<br>- Create interactive guides |
| UX-07 | Notification System | Create a non-intrusive notification system for important events | As a developer, I want to be notified of important events without disrupting my workflow | - Use VS Code notification API<br>- Implement priority levels<br>- Allow dismissing/disabling |
| UX-08 | Dark/Light Theme Support | Ensure UI works well in both dark and light themes | As a developer, I want the extension to look good in my preferred VS Code theme | - Use VS Code theme variables<br>- Test in multiple themes<br>- Avoid hardcoded colors |
| UX-09 | Accessibility | Ensure the extension is accessible to all users | As a developer with accessibility needs, I want to use all features of the extension | - Implement ARIA attributes<br>- Ensure keyboard navigation<br>- Test with screen readers |
| UX-10 | First-run Experience | Create a welcoming first-run experience with tutorials | As a new user, I want to quickly understand how to use the extension | - Implement welcome walkthrough<br>- Create sample contexts<br>- Provide quick start guide |

## Development Phases

| Phase | Focus | Requirements Covered | Timeline Estimate |
|-------|-------|----------------------|-------------------|
| **Phase 1: Core Functionality** | Implement basic file selection and context generation | FR-01, FR-02, FR-03, FR-04, TR-01, TR-02, UX-01, UX-10 | 4-6 weeks |
| **Phase 2: Enhanced Features** | Add context management, search, and preview | FR-05, FR-06, FR-07, TR-03, TR-05, UX-02, UX-03, UX-07 | 4-6 weeks |
| **Phase 3: LLM Integration** | Implement LLM integration and optimization | FR-08, FR-09, TR-08, UX-04, UX-06 | 3-4 weeks |
| **Phase 4: Polish & Performance** | Optimize performance and enhance UX | FR-10, TR-04, TR-06, TR-09, UX-05, UX-08, UX-09 | 3-4 weeks |
| **Phase 5: MCP Preparation** | Refactor for future MCP compatibility | TR-07, TR-10 | 2-3 weeks |

## MCP Server Considerations

| Aspect | Current Implementation | Future MCP Adaptation |
|--------|------------------------|------------------------|
| **Architecture** | Local library calls within extension | Client-server model with API calls |
| **State Management** | Local state with Zustand | Synchronized state with server |
| **Performance** | Limited by VS Code process | Offload intensive operations to server |
| **Collaboration** | Limited to local contexts | Server-based shared contexts |
| **Persistence** | VS Code storage API | Server database with client sync |
| **Authentication** | VS Code-based | Server authentication with better-auth |
| **Real-time Updates** | Manual refresh | WebSocket updates from server |
| **Scaling** | Limited by local resources | Server-side scaling for large projects |

## Development Environment Setup

| Component | Setup Instructions | Purpose |
|-----------|-------------------|---------|
| **Node.js & Yarn** | Install latest Node.js and Yarn | Core runtime and package management |
| **VS Code** | Install latest VS Code with Extension Development pack | Development environment |
| **Yeoman Generator** | `yarn global add yo generator-code` | Project scaffolding |
| **TypeScript** | `yarn add typescript --dev` | Programming language |
| **Vite** | `yarn add vite @vitejs/plugin-react --dev` | Build tooling |
| **React & UI** | `yarn add react react-dom`<br>`yarn add tailwindcss postcss autoprefixer --dev`<br>`yarn add @shadcn/ui` | UI framework and components |
| **Zustand** | `yarn add zustand` | State management |
| **Vitest** | `yarn add vitest --dev` | Testing framework |
| **VS Code API** | `yarn add @types/vscode --dev` | VS Code type definitions |
| **VSCE** | `yarn global add vsce` | Packaging and publishing |

## Extension Packaging and Distribution

| Step | Description | Tools |
|------|-------------|-------|
| **Build** | Compile TypeScript and bundle WebViews | TypeScript compiler, Vite |
| **Package** | Create VSIX package | vsce |
| **Test** | Install locally for testing | VS Code Extension Testing |
| **Publish** | Publish to VS Code Marketplace | vsce, VS Code Marketplace account |
| **Updates** | Manage version updates | vsce, semantic versioning |
