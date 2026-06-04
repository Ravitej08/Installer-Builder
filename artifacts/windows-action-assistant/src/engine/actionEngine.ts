import { IntentAction, Settings } from '../types';

const isElectron = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
};

const api = () => (window as any).electronAPI;

export async function executeAction(action: IntentAction, settings: Settings): Promise<string> {
  if (!action.value) return 'No action specified';

  if (!isElectron()) {
    return `[Browser Preview] Would execute: ${action.type} → ${action.value}`;
  }

  switch (action.type) {
    case 'uri':
      await api().openUri(action.value);
      return `Opened: ${action.value}`;

    case 'powershell':
      return await api().runPowerShell(action.value);

    case 'cmd':
      return await api().runCmd(action.value);

    case 'winget':
      return await api().runWinget(action.value, action.label ?? action.value);

    case 'app':
      await api().launchApp(action.value);
      return `Launched: ${action.label ?? action.value}`;

    case 'explorer':
      await api().openExplorer(action.value);
      return `Opened folder: ${action.value || 'File Explorer'}`;

    case 'browser': {
      const url = buildSearchUrl(action.value, settings);
      await api().openUri(url);
      return `Searching: ${action.value}`;
    }

    case 'llm': {
      const url = buildLLMUrl(action.value, settings);
      await api().openUri(url);
      return `Opening ${settings.llm} with prompt`;
    }

    default:
      return `Unknown action type: ${action.type}`;
  }
}

function buildSearchUrl(query: string, settings: Settings): string {
  const engines: Record<string, string> = {
    google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
    duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
  };
  return engines[settings.searchEngine] ?? engines.google;
}

function buildLLMUrl(prompt: string, settings: Settings): string {
  const encoded = encodeURIComponent(prompt);
  const urls: Record<string, string> = {
    chatgpt: `https://chat.openai.com/?q=${encoded}`,
    claude: `https://claude.ai/new?q=${encoded}`,
    gemini: `https://gemini.google.com/app?q=${encoded}`,
    copilot: `https://copilot.microsoft.com/?q=${encoded}`,
  };
  return urls[settings.llm] ?? urls.chatgpt;
}

export function isPreviewMode(): boolean {
  return !isElectron();
}
