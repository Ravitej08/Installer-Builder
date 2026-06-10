import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsType, Browser, SearchEngine, LLM, Editor } from '../types';

interface Props {
  onComplete: (settings: Partial<SettingsType>) => void;
}

type Step = 0 | 1 | 2 | 3;

function MCQ<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { value: T; label: string; desc?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-5">
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

// Mini panda SVG for the welcome screen
function MiniPanda() {
  return (
    <svg viewBox="0 0 140 165" width="100" height="118" xmlns="http://www.w3.org/2000/svg">
      <circle cx="36" cy="32" r="18" fill="#1C1C1C" />
      <circle cx="104" cy="32" r="18" fill="#1C1C1C" />
      <circle cx="36" cy="32" r="10" fill="#2E2E2E" />
      <circle cx="104" cy="32" r="10" fill="#2E2E2E" />
      <ellipse cx="70" cy="68" rx="42" ry="40" fill="#FAF8F4" />
      <ellipse cx="51" cy="65" rx="15" ry="13" fill="#1C1C1C" />
      <ellipse cx="89" cy="65" rx="15" ry="13" fill="#1C1C1C" />
      <path d="M42 68 Q51 61 60 68" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M80 68 Q89 61 98 68" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="70" cy="80" rx="5.5" ry="4" fill="#222" />
      <path d="M62 87 Q70 95 78 87" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="42" cy="81" r="11" fill="#FFB3C6" opacity="0.42" />
      <circle cx="98" cy="81" r="11" fill="#FFB3C6" opacity="0.42" />
      <ellipse cx="70" cy="126" rx="42" ry="38" fill="#FAF8F4" />
      <ellipse cx="70" cy="127" rx="26" ry="24" fill="#EDE8DE" opacity="0.55" />
      <ellipse cx="24" cy="118" rx="12" ry="24" fill="#1C1C1C" transform="rotate(-15 24 118)" />
      <ellipse cx="116" cy="118" rx="12" ry="24" fill="#1C1C1C" transform="rotate(15 116 118)" />
      <ellipse cx="52" cy="158" rx="18" ry="11" fill="#1C1C1C" />
      <ellipse cx="88" cy="158" rx="18" ry="11" fill="#1C1C1C" />
    </svg>
  );
}

export default function FirstRun({ onComplete }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [prefs, setPrefs] = useState({
    browser: 'default' as Browser,
    searchEngine: 'google' as SearchEngine,
    llm: 'chatgpt' as LLM,
    editor: 'vscode' as Editor,
    voiceEnabled: false,
    theme: 'modern' as 'modern' | 'terminal',
  });

  const set = (key: keyof typeof prefs, value: any) => setPrefs(p => ({ ...p, [key]: value }));

  const BrowserMCQ = MCQ<Browser>;
  const SearchMCQ = MCQ<SearchEngine>;
  const LLMMCQ = MCQ<LLM>;
  const EditorMCQ = MCQ<Editor>;

  const steps = [
    {
      title: "Meet your Panda 🐼",
      subtitle: "Your new desktop companion. Click it to give commands, double-click for voice.",
      content: (
        <div className="flex flex-col items-center gap-4 py-2">
          <motion.div
            animate={{ scale: [1, 1.05, 1], y: [0, -4, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MiniPanda />
          </motion.div>
          <div className="text-center space-y-2 text-sm text-gray-400 max-w-xs">
            <p>🐾 <span className="text-white font-medium">Click</span> — open command bubble</p>
            <p>🎤 <span className="text-white font-medium">Double-click</span> — voice input</p>
            <p>😴 <span className="text-white font-medium">Leave it alone</span> — panda falls asleep</p>
            <p>⚡ <span className="text-white font-medium">Complete a task</span> — panda celebrates!</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Browser & Search',
      subtitle: 'Used when no Windows action is found for your command.',
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
      subtitle: 'Double-click the panda to activate voice. Requires Chrome or Edge.',
      content: (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => set('voiceEnabled', true)}
            className={`text-left px-4 py-3 rounded-xl border transition-all ${prefs.voiceEnabled ? 'border-indigo-500 bg-indigo-600/20 text-white' : 'border-white/10 bg-gray-800/50 text-gray-400 hover:border-white/30'}`}
          >
            <div className="text-sm font-medium">Enable Voice</div>
            <div className="text-xs text-gray-500 mt-0.5">Double-click panda to listen</div>
          </button>
          <button
            onClick={() => set('voiceEnabled', false)}
            className={`text-left px-4 py-3 rounded-xl border transition-all ${!prefs.voiceEnabled ? 'border-indigo-500 bg-indigo-600/20 text-white' : 'border-white/10 bg-gray-800/50 text-gray-400 hover:border-white/30'}`}
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
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-indigo-500' : 'bg-gray-800'}`} />
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
                if (isLast) onComplete({ ...prefs, firstRunComplete: true });
                else setStep((step + 1) as Step);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-indigo-600 text-white hover:bg-indigo-500 transition-colors font-medium"
            >
              {isLast ? "Meet my Panda 🐼" : 'Next'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
