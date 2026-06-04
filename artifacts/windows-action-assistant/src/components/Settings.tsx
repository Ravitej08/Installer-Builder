import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, X, FolderOpen } from 'lucide-react';
import { Settings as SettingsType, Browser, SearchEngine, LLM, Editor, Theme } from '../types';

interface Props {
  settings: SettingsType;
  onSave: (updates: Partial<SettingsType>) => void;
  onBack: () => void;
  theme: 'terminal' | 'modern';
}

type Section = 'appearance' | 'preferences' | 'voice' | 'folders' | 'privacy';

function MCQGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  isTerminal,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  isTerminal: boolean;
}) {
  return (
    <div className="mb-5">
      <label className={`block text-xs mb-2 ${isTerminal ? 'text-green-600 font-mono' : 'text-gray-400 font-medium uppercase tracking-wider'}`}>
        {isTerminal ? `// ${label}` : label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded text-sm transition-all ${
              value === opt.value
                ? isTerminal
                  ? 'border border-green-400 text-green-400 bg-green-900/20 font-mono'
                  : 'bg-indigo-600 text-white border border-indigo-500'
                : isTerminal
                ? 'border border-green-500/30 text-green-700 font-mono hover:border-green-500 hover:text-green-500'
                : 'bg-gray-800 text-gray-400 border border-white/10 hover:border-white/30 hover:text-white'
            }`}
          >
            {isTerminal && value === opt.value ? `[x] ${opt.label}` : isTerminal ? `[ ] ${opt.label}` : opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange, isTerminal }: { label: string; checked: boolean; onChange: (v: boolean) => void; isTerminal: boolean }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <span className={`text-sm ${isTerminal ? 'text-green-400 font-mono' : 'text-gray-200'}`}>
        {isTerminal ? `// ${label}` : label}
      </span>
      <button
        onClick={() => onChange(!checked)}
        className={`px-3 py-1 text-xs rounded transition-all ${
          checked
            ? isTerminal
              ? 'border border-green-400 text-green-400 bg-green-900/20 font-mono'
              : 'bg-indigo-600 text-white'
            : isTerminal
            ? 'border border-green-500/30 text-green-700 font-mono'
            : 'bg-gray-800 text-gray-400 border border-white/10'
        }`}
      >
        {isTerminal ? (checked ? '[ENABLED]' : '[DISABLED]') : (checked ? 'On' : 'Off')}
      </button>
    </div>
  );
}

export default function Settings({ settings, onSave, onBack, theme }: Props) {
  const [section, setSection] = useState<Section>('appearance');
  const [newFolder, setNewFolder] = useState('');
  const isTerminal = theme === 'terminal';

  const ThemeMCQ = MCQGroup<Theme>;
  const BrowserMCQ = MCQGroup<Browser>;
  const SearchMCQ = MCQGroup<SearchEngine>;
  const LLMMCQ = MCQGroup<LLM>;
  const EditorMCQ = MCQGroup<Editor>;

  const t = isTerminal ? {
    bg: 'bg-black',
    border: 'border border-green-500/30',
    text: 'text-green-400 font-mono',
    dim: 'text-green-700 font-mono',
    header: 'text-green-400 font-mono text-lg',
    nav: {
      active: 'border-b-2 border-green-400 text-green-400 font-mono',
      inactive: 'text-green-700 font-mono hover:text-green-500',
    },
    input: 'bg-black border border-green-500/30 text-green-400 font-mono placeholder-green-800 focus:border-green-400',
    btn: {
      primary: 'bg-green-900/30 border border-green-500 text-green-400 font-mono hover:bg-green-900/50',
      danger: 'bg-red-900/20 border border-red-500/50 text-red-400 font-mono hover:bg-red-900/30',
    },
  } : {
    bg: 'bg-gray-900',
    border: 'border border-white/10',
    text: 'text-white',
    dim: 'text-gray-400',
    header: 'text-white text-lg font-semibold',
    nav: {
      active: 'border-b-2 border-indigo-500 text-white font-medium',
      inactive: 'text-gray-500 hover:text-gray-300',
    },
    input: 'bg-gray-800 border border-white/10 text-white placeholder-gray-600 focus:border-indigo-400',
    btn: {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-500',
      danger: 'bg-red-900/30 text-red-400 border border-red-500/30 hover:bg-red-900/50',
    },
  };

  const sections: { id: Section; label: string }[] = [
    { id: 'appearance', label: isTerminal ? 'theme' : 'Appearance' },
    { id: 'preferences', label: isTerminal ? 'prefs' : 'Preferences' },
    { id: 'voice', label: isTerminal ? 'voice' : 'Voice' },
    { id: 'folders', label: isTerminal ? 'folders' : 'Folders' },
    { id: 'privacy', label: isTerminal ? 'privacy' : 'Privacy' },
  ];

  const addFolder = () => {
    if (!newFolder.trim()) return;
    onSave({ projectFolders: [...settings.projectFolders, newFolder.trim()] });
    setNewFolder('');
  };

  const removeFolder = (i: number) => {
    onSave({ projectFolders: settings.projectFolders.filter((_, idx) => idx !== i) });
  };

  const clearData = () => {
    if (confirm('Clear all preferences and data?')) {
      localStorage.removeItem('waa_settings');
      window.location.reload();
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${!isTerminal ? 'rounded-2xl overflow-hidden' : ''}`}>
      <div className={`${t.bg} ${t.border} ${!isTerminal ? 'rounded-2xl' : ''} overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${isTerminal ? 'border-green-500/20' : 'border-white/5'}`}>
          <button onClick={onBack} className={`${isTerminal ? 'text-green-600 hover:text-green-400' : 'text-gray-500 hover:text-white'} transition-colors`}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className={t.header}>
            {isTerminal ? '// settings.json' : 'Settings'}
          </h2>
        </div>

        {/* Nav */}
        <div className={`flex gap-4 px-4 pt-3 border-b ${isTerminal ? 'border-green-500/20' : 'border-white/5'}`}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`pb-2 text-sm transition-colors ${section === s.id ? t.nav.active : t.nav.inactive}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          <motion.div key={section} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
            {section === 'appearance' && (
              <div>
                <ThemeMCQ
                  label="Theme"
                  value={settings.theme}
                  options={[
                    { value: 'modern', label: 'Modern' },
                    { value: 'terminal', label: 'Terminal' },
                  ]}
                  onChange={v => onSave({ theme: v })}
                  isTerminal={isTerminal}
                />
              </div>
            )}

            {section === 'preferences' && (
              <div>
                <BrowserMCQ
                  label="Default Browser"
                  value={settings.browser}
                  options={[
                    { value: 'default', label: 'System Default' },
                    { value: 'chrome', label: 'Chrome' },
                    { value: 'firefox', label: 'Firefox' },
                    { value: 'edge', label: 'Edge' },
                    { value: 'brave', label: 'Brave' },
                  ]}
                  onChange={v => onSave({ browser: v })}
                  isTerminal={isTerminal}
                />
                <SearchMCQ
                  label="Search Engine"
                  value={settings.searchEngine}
                  options={[
                    { value: 'google', label: 'Google' },
                    { value: 'bing', label: 'Bing' },
                    { value: 'duckduckgo', label: 'DuckDuckGo' },
                  ]}
                  onChange={v => onSave({ searchEngine: v })}
                  isTerminal={isTerminal}
                />
                <LLMMCQ
                  label="Preferred AI"
                  value={settings.llm}
                  options={[
                    { value: 'chatgpt', label: 'ChatGPT' },
                    { value: 'claude', label: 'Claude' },
                    { value: 'gemini', label: 'Gemini' },
                    { value: 'copilot', label: 'Copilot' },
                  ]}
                  onChange={v => onSave({ llm: v })}
                  isTerminal={isTerminal}
                />
                <EditorMCQ
                  label="Code Editor"
                  value={settings.editor}
                  options={[
                    { value: 'vscode', label: 'VS Code' },
                    { value: 'cursor', label: 'Cursor' },
                    { value: 'notepad', label: 'Notepad' },
                    { value: 'sublime', label: 'Sublime Text' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                  onChange={v => onSave({ editor: v })}
                  isTerminal={isTerminal}
                />
                {settings.editor === 'custom' && (
                  <div className="mb-4">
                    <label className={`block text-xs mb-2 ${isTerminal ? 'text-green-600 font-mono' : 'text-gray-400'}`}>
                      {isTerminal ? '// custom editor path:' : 'Custom Editor Path'}
                    </label>
                    <input
                      value={settings.customEditorPath}
                      onChange={e => onSave({ customEditorPath: e.target.value })}
                      placeholder={isTerminal ? 'C:\\path\\to\\editor.exe' : 'C:\\path\\to\\editor.exe'}
                      className={`w-full px-3 py-2 rounded text-sm outline-none ${t.input}`}
                    />
                  </div>
                )}
                <Toggle
                  label="Auto-execute safe actions (volume, brightness, lock)"
                  checked={settings.autoAction}
                  onChange={v => onSave({ autoAction: v })}
                  isTerminal={isTerminal}
                />
              </div>
            )}

            {section === 'voice' && (
              <div>
                <Toggle
                  label="Enable Voice Input"
                  checked={settings.voiceEnabled}
                  onChange={v => onSave({ voiceEnabled: v })}
                  isTerminal={isTerminal}
                />
                {settings.voiceEnabled && (
                  <p className={`text-xs mt-2 ${t.dim}`}>
                    {isTerminal
                      ? '// voice uses Web Speech API (Chrome/Edge only). click mic icon in widget to start.'
                      : 'Voice uses the Web Speech API. Works best in Chrome or Edge. Click the mic icon in the widget to activate.'}
                  </p>
                )}
              </div>
            )}

            {section === 'folders' && (
              <div>
                <p className={`text-xs mb-3 ${t.dim}`}>
                  {isTerminal ? '// project folders for quick launch:' : 'Add project folders for quick access and launching.'}
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    value={newFolder}
                    onChange={e => setNewFolder(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addFolder()}
                    placeholder={isTerminal ? 'C:\\Users\\you\\projects' : 'C:\\Users\\you\\projects'}
                    className={`flex-1 px-3 py-2 rounded text-sm outline-none ${t.input}`}
                  />
                  <button onClick={addFolder} className={`px-3 py-2 rounded text-sm ${t.btn.primary} transition-colors`}>
                    {isTerminal ? '[+]' : <Plus className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {settings.projectFolders.map((folder, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded ${isTerminal ? 'border border-green-500/20' : 'bg-gray-800/50 border border-white/5'}`}>
                      <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${isTerminal ? 'text-green-600' : 'text-gray-500'}`} />
                      <span className={`flex-1 text-sm truncate ${t.dim}`}>{folder}</span>
                      <button onClick={() => removeFolder(i)} className={`${isTerminal ? 'text-red-700 hover:text-red-500' : 'text-gray-600 hover:text-red-400'} transition-colors`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {settings.projectFolders.length === 0 && (
                    <p className={`text-xs ${t.dim}`}>
                      {isTerminal ? '// no folders added' : 'No folders added yet.'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {section === 'privacy' && (
              <div>
                <div className={`mb-4 p-3 rounded ${isTerminal ? 'border border-green-500/20' : 'bg-gray-800/50 border border-white/5'}`}>
                  <h3 className={`text-sm font-medium mb-2 ${t.text}`}>
                    {isTerminal ? '// data stored locally:' : 'What is stored locally'}
                  </h3>
                  <ul className={`text-xs space-y-1 ${t.dim}`}>
                    <li>{isTerminal ? '> ' : '• '}Your preferences (browser, editor, theme, etc.)</li>
                    <li>{isTerminal ? '> ' : '• '}Configured project folder paths</li>
                    <li>{isTerminal ? '> ' : '• '}No file contents, only folder/app names</li>
                    <li>{isTerminal ? '> ' : '• '}No telemetry, no cloud sync, no accounts</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <button onClick={clearData} className={`px-4 py-2 rounded text-sm ${t.btn.danger} transition-colors`}>
                    {isTerminal ? '[clear data]' : 'Clear All Data'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
