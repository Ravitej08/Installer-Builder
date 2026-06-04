import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Settings, Bug, Loader2, ChevronRight, Zap } from 'lucide-react';
import { matchIntent, topMatches } from '../engine/intentEngine';
import { executeAction } from '../engine/actionEngine';
import { Settings as SettingsType, MatchResult, LogEntry, IntentOption } from '../types';

interface Props {
  settings: SettingsType;
  onLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onOpenSettings: () => void;
  onOpenDebug: () => void;
  theme: 'terminal' | 'modern';
}

type Status = { type: 'idle' | 'success' | 'error' | 'info'; message: string };

export default function Widget({ settings, onLog, onOpenSettings, onOpenDebug, theme }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MatchResult[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [showOptions, setShowOptions] = useState<IntentOption[] | null>(null);
  const [pendingResult, setPendingResult] = useState<MatchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const isTerminal = theme === 'terminal';

  const showStatus = (type: Status['type'], message: string, duration = 3000) => {
    setStatus({ type, message });
    if (duration > 0) setTimeout(() => setStatus({ type: 'idle', message: '' }), duration);
  };

  const handleQuery = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const matches = await topMatches(q, 5);
    setResults(matches);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setExpanded(false);
      return;
    }
    setExpanded(true);
    debounceRef.current = setTimeout(() => handleQuery(query), 200);
  }, [query, handleQuery]);

  const runAction = async (result: MatchResult) => {
    const { intent } = result;

    // If intent has options, show them instead of auto-executing
    if (intent.options && intent.options.length > 0 && !intent.safeAutoExecute) {
      setPendingResult(result);
      setShowOptions(intent.options);
      return;
    }

    setLoading(true);
    try {
      const action = intent.actions[0];
      const output = await executeAction(action, settings);
      showStatus('success', `Done: ${intent.description}`);
      onLog({
        query,
        matchedIntent: intent.id,
        confidence: Math.round(result.score * 100),
        actionExecuted: `${action.type}:${action.value}`,
      });
      setQuery('');
      setExpanded(false);
    } catch (err: any) {
      const msg = err?.message ?? 'Action failed';
      showStatus('error', msg);
      onLog({
        query,
        matchedIntent: intent.id,
        confidence: Math.round(result.score * 100),
        actionExecuted: null,
        error: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const runOption = async (option: IntentOption) => {
    if (!pendingResult) return;
    setShowOptions(null);
    setLoading(true);
    try {
      const output = await executeAction(option.action, settings);
      showStatus('success', `Done: ${option.label}`);
      onLog({
        query,
        matchedIntent: pendingResult.intent.id,
        confidence: Math.round(pendingResult.score * 100),
        actionExecuted: `${option.action.type}:${option.action.value}`,
      });
      setQuery('');
      setExpanded(false);
    } catch (err: any) {
      showStatus('error', err?.message ?? 'Action failed');
    } finally {
      setLoading(false);
      setPendingResult(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      setExpanded(false);
      setShowOptions(null);
      setPendingResult(null);
    }
    if (e.key === 'Enter' && results.length > 0 && !showOptions) {
      runAction(results[0]);
    }
  };

  const toggleVoice = () => {
    if (!settings.voiceEnabled) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      showStatus('error', 'Speech recognition not supported in this browser');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setQuery(text);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  // Styles based on theme
  const t = isTerminal ? {
    bg: 'bg-black',
    border: 'border border-green-500/40',
    input: 'bg-black text-green-400 placeholder-green-800 font-mono',
    text: 'text-green-400 font-mono',
    dim: 'text-green-700 font-mono',
    card: 'bg-black border border-green-500/30 hover:border-green-400',
    cardActive: 'bg-green-900/20 border-green-400',
    badge: 'bg-green-900/40 text-green-400 font-mono text-xs border border-green-500/30',
    btn: 'text-green-600 hover:text-green-400',
    status: {
      success: 'text-green-400 font-mono',
      error: 'text-red-400 font-mono',
      info: 'text-yellow-400 font-mono',
      idle: '',
    },
    divider: 'border-green-500/20',
    optionCard: 'bg-black border border-green-500/30 hover:border-green-400 hover:bg-green-900/10 font-mono text-green-300',
    glow: '',
  } : {
    bg: 'bg-gray-900/95',
    border: 'border border-white/10',
    input: 'bg-transparent text-white placeholder-gray-500',
    text: 'text-white',
    dim: 'text-gray-400',
    card: 'bg-gray-800/60 border border-white/5 hover:border-white/20 hover:bg-gray-700/60',
    cardActive: 'bg-indigo-600/20 border-indigo-500/50',
    badge: 'bg-indigo-900/50 text-indigo-300 text-xs border border-indigo-500/20',
    btn: 'text-gray-500 hover:text-gray-300',
    status: {
      success: 'text-emerald-400',
      error: 'text-red-400',
      info: 'text-blue-400',
      idle: '',
    },
    divider: 'border-white/5',
    optionCard: 'bg-gray-800/50 border border-white/10 hover:border-indigo-400/50 hover:bg-indigo-900/20 text-gray-200',
    glow: 'shadow-2xl shadow-black/50',
  };

  const confidenceColor = (score: number) => {
    if (score > 0.75) return isTerminal ? 'text-green-400' : 'text-emerald-400';
    if (score > 0.5) return isTerminal ? 'text-yellow-500' : 'text-yellow-400';
    return isTerminal ? 'text-red-500' : 'text-red-400';
  };

  const actionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      uri: 'SETTINGS', powershell: 'POWERSHELL', cmd: 'CMD',
      winget: 'INSTALL', app: 'LAUNCH', explorer: 'FOLDER',
      browser: 'BROWSER', llm: 'AI',
    };
    return labels[type] ?? type.toUpperCase();
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${!isTerminal && 'rounded-2xl overflow-hidden'}`}>
      <div className={`${t.bg} ${t.border} ${t.glow} ${!isTerminal ? 'rounded-2xl' : ''} overflow-hidden`}>
        {/* Search bar */}
        <div className="flex items-center gap-2 px-4 py-3">
          {loading ? (
            <Loader2 className={`w-4 h-4 shrink-0 ${isTerminal ? 'text-green-500' : 'text-indigo-400'} animate-spin`} />
          ) : (
            <Zap className={`w-4 h-4 shrink-0 ${isTerminal ? 'text-green-600' : 'text-indigo-500'}`} />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTerminal ? '> type a command or describe a problem_' : 'What do you want to do?'}
            className={`flex-1 bg-transparent outline-none text-sm ${t.input}`}
            autoFocus
          />
          <div className="flex items-center gap-1">
            {settings.voiceEnabled && (
              <button onClick={toggleVoice} className={`p-1.5 rounded ${t.btn} transition-colors`}>
                {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            )}
            <button onClick={onOpenSettings} className={`p-1.5 rounded ${t.btn} transition-colors`}>
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button onClick={onOpenDebug} className={`p-1.5 rounded ${t.btn} transition-colors`}>
              <Bug className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {/* Status message */}
          {status.type !== 'idle' && status.message && (
            <motion.div
              key="status"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`px-4 py-2 text-xs border-t ${t.divider} ${t.status[status.type]}`}
            >
              {isTerminal ? `[${status.type.toUpperCase()}] ${status.message}` : status.message}
            </motion.div>
          )}

          {/* Options picker */}
          {showOptions && (
            <motion.div
              key="options"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`border-t ${t.divider}`}
            >
              <div className={`px-4 py-2 text-xs ${t.dim}`}>
                {isTerminal ? '// select action:' : 'Choose an action:'}
              </div>
              <div className="flex flex-col gap-1 px-3 pb-3">
                {showOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => runOption(opt)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${t.optionCard}`}
                  >
                    {isTerminal ? `[${i + 1}] ` : ''}{opt.label}
                  </button>
                ))}
                <button
                  onClick={() => { setShowOptions(null); setPendingResult(null); }}
                  className={`w-full text-left px-3 py-2 rounded text-xs transition-all ${t.btn}`}
                >
                  {isTerminal ? '[0] cancel' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {expanded && results.length > 0 && !showOptions && (
            <motion.div
              key="results"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`border-t ${t.divider}`}
            >
              <div className="flex flex-col gap-1 p-2">
                {results.map((r, i) => (
                  <motion.button
                    key={r.intent.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => runAction(r)}
                    className={`w-full text-left px-3 py-2.5 rounded transition-all flex items-center gap-2 group ${t.card}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${t.text}`}>
                        {r.intent.description}
                      </div>
                      <div className={`text-xs truncate ${t.dim}`}>
                        {r.intent.actions[0] && (
                          <span className={`inline-block mr-2 px-1.5 py-0.5 rounded ${t.badge}`}>
                            {actionTypeLabel(r.intent.actions[0].type)}
                          </span>
                        )}
                        {r.intent.actions[0]?.value?.replace('ms-settings:', '').slice(0, 40)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs ${confidenceColor(r.score)}`}>
                        {Math.round(r.score * 100)}%
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 ${t.dim} group-hover:translate-x-0.5 transition-transform`} />
                    </div>
                  </motion.button>
                ))}
              </div>
              <div className={`px-4 py-1.5 text-xs ${t.dim} border-t ${t.divider}`}>
                {isTerminal ? `// press [enter] to execute top result · [esc] to clear` : 'Press Enter for top result · Esc to clear'}
              </div>
            </motion.div>
          )}

          {/* No results */}
          {expanded && results.length === 0 && query.trim() && (
            <motion.div
              key="noresult"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`border-t ${t.divider} px-4 py-3`}
            >
              <p className={`text-sm ${t.dim}`}>
                {isTerminal ? `// no match found. routing to ${settings.searchEngine}...` : `No Windows action found — will search ${settings.searchEngine}`}
              </p>
              <button
                onClick={async () => {
                  await executeAction({ type: 'browser', value: query }, settings);
                  onLog({ query, matchedIntent: null, confidence: 0, actionExecuted: `browser:search` });
                  setQuery('');
                  setExpanded(false);
                }}
                className={`mt-2 text-sm underline ${isTerminal ? 'text-green-500' : 'text-indigo-400'}`}
              >
                Search "{query}"
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Listening indicator */}
      {listening && (
        <div className={`mt-2 text-center text-xs ${isTerminal ? 'text-green-600 font-mono' : 'text-indigo-400'} animate-pulse`}>
          {isTerminal ? '// listening...' : '🎤 Listening...'}
        </div>
      )}
    </div>
  );
}
