export type ActionType = 'uri' | 'powershell' | 'cmd' | 'winget' | 'browser' | 'llm' | 'app' | 'explorer';

export interface IntentAction {
  type: ActionType;
  value: string;
  label?: string;
}

export interface IntentOption {
  label: string;
  action: IntentAction;
}

export interface Intent {
  id: string;
  intent: string;
  keywords: string[];
  aliases?: string[];
  description: string;
  actions: IntentAction[];
  fallback?: 'browser' | 'llm';
  options?: IntentOption[];
  safeAutoExecute?: boolean;
}

export type Theme = 'terminal' | 'modern';
export type LLM = 'chatgpt' | 'claude' | 'gemini' | 'copilot';
export type Browser = 'chrome' | 'firefox' | 'edge' | 'brave' | 'default';
export type SearchEngine = 'google' | 'bing' | 'duckduckgo';
export type Editor = 'vscode' | 'cursor' | 'notepad' | 'sublime' | 'custom';

export interface Settings {
  browser: Browser;
  searchEngine: SearchEngine;
  llm: LLM;
  editor: Editor;
  customEditorPath: string;
  projectFolders: string[];
  theme: Theme;
  voiceEnabled: boolean;
  widgetPosition: { x: number; y: number };
  autoAction: boolean;
  firstRunComplete: boolean;
}

export interface MatchResult {
  intent: Intent;
  score: number;
  query: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  query: string;
  matchedIntent: string | null;
  confidence: number;
  actionExecuted: string | null;
  error?: string;
}

export interface IndexedItem {
  name: string;
  path: string;
  type: 'app' | 'folder' | 'project' | 'file';
  lastSeen: string;
}
