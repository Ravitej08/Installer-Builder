import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsType, Browser, SearchEngine, LLM, Editor, Theme } from '../types';

interface Props {
  onComplete: (settings: Partial<SettingsType>) => void;
}

type Step = 0 | 1 | 2 | 3;

function MCQ<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; desc?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-6">
      <label className="block text-sm text-gray-400 mb-3">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`text-left px-4 py-3 rounded-xl border transition-all ${
              value === opt.value
                ? 'border-indigo-500 bg-indigo-600/20 text-white'
                : 'border-white/10 bg-gray-800/50 text-gray-400 hover:border-white/30 hover:text-gray-200'
            }`}
          >
            <div className="text-sm font-medium">{opt.label}</div>
            {opt.desc && <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FirstRun({ onComplete }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [prefs, setPrefs] = useState({
    theme: 'modern' as Theme,
    browser: 'default' as Browser,
    searchEngine: 'google' as SearchEngine,
    llm: 'chatgpt' as LLM,
    editor: 'vscode' as Editor,
    voiceEnabled: false,
  });

  const set = (key: keyof typeof prefs, value: any) => setPrefs(p => ({ ...p, [key]: value }));

  const ThemeMCQ = MCQ<Theme>;
  const BrowserMCQ = MCQ<Browser>;
  const SearchMCQ = MCQ<SearchEngine>;
  const LLMMCQ = MCQ<LLM>;
  const EditorMCQ = MCQ<Editor>;

  const steps = [
    {
      title: 'Welcome to Windows Action Assistant',
      subtitle: 'Takes 30 seconds. You can change everything later in Settings.',
      content: (
        <ThemeMCQ
          label="Choose your theme"
          value={prefs.theme}
          options={[
            { value: 'modern', label: 'Modern', desc: 'Clean, rounded, dark glass' },
            { value: 'terminal', label: 'Terminal', desc: 'Black + green, hacker style' },
          ]}
          onChange={v => set('theme', v)}
        />
      ),
    },
    {
      title: 'Browser & Search',
      subtitle: 'Used when no Windows action is found.',
      content: (
        <>
          <BrowserMCQ
            label="Default browser"
            value={prefs.browser}
            options={[
              { value: 'default', label: 'System Default' },
              { value: 'chrome', label: 'Chrome' },
              { value: 'firefox', label: 'Firefox' },
              { value: 'edge', label: 'Edge' },
              { value: 'brave', label: 'Brave' },
            ]}
            onChange={v => set('browser', v)}
          />
          <SearchMCQ
            label="Search engine"
            value={prefs.searchEngine}
            options={[
              { value: 'google', label: 'Google' },
              { value: 'bing', label: 'Bing' },
              { value: 'duckduckgo', label: 'DuckDuckGo' },
            ]}
            onChange={v => set('searchEngine', v)}
          />
        </>
      ),
    },
    {
      title: 'AI & Editor',
      subtitle: 'For questions outside Windows — and for opening your projects.',
      content: (
        <>
          <LLMMCQ
            label="Preferred AI"
            value={prefs.llm}
            options={[
              { value: 'chatgpt', label: 'ChatGPT' },
              { value: 'claude', label: 'Claude' },
              { value: 'gemini', label: 'Gemini' },
              { value: 'copilot', label: 'Copilot' },
            ]}
            onChange={v => set('llm', v)}
          />
          <EditorMCQ
            label="Code editor"
            value={prefs.editor}
            options={[
              { value: 'vscode', label: 'VS Code' },
              { value: 'cursor', label: 'Cursor' },
              { value: 'notepad', label: 'Notepad' },
              { value: 'sublime', label: 'Sublime Text' },
            ]}
            onChange={v => set('editor', v)}
          />
        </>
      ),
    },
    {
      title: 'Voice Input',
      subtitle: 'Click the mic icon in the widget to activate. Requires Chrome or Edge.',
      content: (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => set('voiceEnabled', true)}
            className={`text-left px-4 py-3 rounded-xl border transition-all ${
              prefs.voiceEnabled
                ? 'border-indigo-500 bg-indigo-600/20 text-white'
                : 'border-white/10 bg-gray-800/50 text-gray-400 hover:border-white/30'
            }`}
          >
            <div className="text-sm font-medium">Enable Voice</div>
            <div className="text-xs text-gray-500 mt-0.5">Mic icon will appear</div>
          </button>
          <button
            onClick={() => set('voiceEnabled', false)}
            className={`text-left px-4 py-3 rounded-xl border transition-all ${
              !prefs.voiceEnabled
                ? 'border-indigo-500 bg-indigo-600/20 text-white'
                : 'border-white/10 bg-gray-800/50 text-gray-400 hover:border-white/30'
            }`}
          >
            <div className="text-sm font-medium">No thanks</div>
            <div className="text-xs text-gray-500 mt-0.5">Keyboard only</div>
          </button>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-indigo-500' : 'bg-gray-800'
              }`}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-gray-900 rounded-2xl p-6 border border-white/10"
        >
          <h1 className="text-xl font-semibold text-white mb-1">{current.title}</h1>
          <p className="text-sm text-gray-500 mb-6">{current.subtitle}</p>
          {current.content}

          <div className="flex gap-3 mt-2">
            {step > 0 && (
              <button
                onClick={() => setStep((step - 1) as Step)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-gray-400 border border-white/10 hover:border-white/30 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) {
                  onComplete({ ...prefs, firstRunComplete: true });
                } else {
                  setStep((step + 1) as Step);
                }
              }}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-indigo-600 text-white hover:bg-indigo-500 transition-colors font-medium"
            >
              {isLast ? "Let's go" : 'Next'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
