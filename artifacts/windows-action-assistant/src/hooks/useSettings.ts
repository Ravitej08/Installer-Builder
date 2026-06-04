import { useState, useEffect } from 'react';
import { Settings } from '../types';

const DEFAULT_SETTINGS: Settings = {
  browser: 'default',
  searchEngine: 'google',
  llm: 'chatgpt',
  editor: 'vscode',
  customEditorPath: '',
  projectFolders: [],
  theme: 'modern',
  voiceEnabled: false,
  widgetPosition: { x: -1, y: -1 },
  autoAction: false,
  firstRunComplete: false,
};

const isElectron = () => typeof window !== 'undefined' && !!(window as any).electronAPI;

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        if (isElectron()) {
          const saved = await (window as any).electronAPI.getSettings();
          if (saved) setSettings({ ...DEFAULT_SETTINGS, ...saved });
        } else {
          const raw = localStorage.getItem('waa_settings');
          if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
        }
      } catch {
        // use defaults
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  const save = async (updates: Partial<Settings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    try {
      if (isElectron()) {
        await (window as any).electronAPI.saveSettings(next);
      } else {
        localStorage.setItem('waa_settings', JSON.stringify(next));
      }
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  };

  return { settings, save, loaded };
}
