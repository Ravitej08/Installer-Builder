import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Settings, Bug, X, Send, Loader2, ChevronRight } from 'lucide-react';
import { topMatches } from '../engine/intentEngine';
import { executeAction } from '../engine/actionEngine';
import { Settings as SettingsType, MatchResult, LogEntry, IntentOption } from '../types';

export type PandaState =
  | 'idle' | 'sleeping' | 'watching' | 'listening'
  | 'thinking' | 'executing' | 'success' | 'error' | 'celebration';

type Status = { type: 'idle' | 'success' | 'error' | 'info'; message: string };

const isElectron = () => typeof window !== 'undefined' && !!(window as any).electronAPI;
const api = () => (window as any).electronAPI;

// ─── PANDA SVG ────────────────────────────────────────────────────────────────

function PandaEyes({ state }: { state: PandaState }) {
  const sleeping = state === 'sleeping';
  const happy = state === 'success' || state === 'celebration' || state === 'listening';
  const surprised = state === 'error' || state === 'watching';

  if (sleeping) {
    return (
      <>
        <path d="M42 66 Q51 73 60 66" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M80 66 Q89 73 98 66" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (happy) {
    return (
      <>
        <path d="M42 68 Q51 61 60 68" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M80 68 Q89 61 98 68" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    );
  }
  const r = surprised ? 9 : 8;
  return (
    <>
      <circle cx="51" cy="66" r={r} fill="white" />
      <circle cx="89" cy="66" r={r} fill="white" />
      <circle cx="52" cy={surprised ? 66 : 67} r="4.5" fill="#111" />
      <circle cx="90" cy={surprised ? 66 : 67} r="4.5" fill="#111" />
      <circle cx="50" cy="64" r="1.8" fill="white" />
      <circle cx="88" cy="64" r="1.8" fill="white" />
    </>
  );
}

function PandaMouth({ state }: { state: PandaState }) {
  if (state === 'success' || state === 'celebration') {
    return <path d="M62 87 Q70 95 78 87" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" />;
  }
  if (state === 'error') {
    return <path d="M63 92 Q70 85 77 92" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" />;
  }
  return <path d="M64 87 Q70 93 76 87" stroke="#222" strokeWidth="1.8" fill="none" strokeLinecap="round" />;
}

function PandaSVG({ state }: { state: PandaState }) {
  return (
    <svg viewBox="0 0 140 165" width="140" height="165" xmlns="http://www.w3.org/2000/svg">
      {/* Ears */}
      <circle cx="36" cy="32" r="18" fill="#1C1C1C" />
      <circle cx="104" cy="32" r="18" fill="#1C1C1C" />
      <circle cx="36" cy="32" r="10" fill="#2E2E2E" />
      <circle cx="104" cy="32" r="10" fill="#2E2E2E" />

      {/* Head */}
      <ellipse cx="70" cy="68" rx="42" ry="40" fill="#FAF8F4" />

      {/* Eye patches */}
      <ellipse cx="51" cy="65" rx="15" ry="13" fill="#1C1C1C" />
      <ellipse cx="89" cy="65" rx="15" ry="13" fill="#1C1C1C" />

      {/* Eyes */}
      <PandaEyes state={state} />

      {/* Nose */}
      <ellipse cx="70" cy="80" rx="5.5" ry="4" fill="#222" />

      {/* Mouth */}
      <PandaMouth state={state} />

      {/* Cheeks */}
      <circle cx="42" cy="81" r="11" fill="#FFB3C6" opacity="0.42" />
      <circle cx="98" cy="81" r="11" fill="#FFB3C6" opacity="0.42" />

      {/* Body */}
      <ellipse cx="70" cy="126" rx="42" ry="38" fill="#FAF8F4" />

      {/* Belly */}
      <ellipse cx="70" cy="127" rx="26" ry="24" fill="#EDE8DE" opacity="0.55" />

      {/* Arms */}
      <ellipse cx="24" cy="118" rx="12" ry="24" fill="#1C1C1C" transform="rotate(-15 24 118)" />
      <ellipse cx="116" cy="118" rx="12" ry="24" fill="#1C1C1C" transform="rotate(15 116 118)" />

      {/* Clapping arms for success */}
      {state === 'success' && (
        <>
          <ellipse cx="30" cy="110" rx="12" ry="20" fill="#1C1C1C" transform="rotate(30 30 110)" />
          <ellipse cx="110" cy="110" rx="12" ry="20" fill="#1C1C1C" transform="rotate(-30 110 110)" />
        </>
      )}

      {/* Legs */}
      <ellipse cx="52" cy="158" rx="18" ry="11" fill="#1C1C1C" />
      <ellipse cx="88" cy="158" rx="18" ry="11" fill="#1C1C1C" />
    </svg>
  );
}

const PANDA_SIZE = { w: 140, h: 165 };

// ─── PANDA CHARACTER ─────────────────────────────────────────────────────────

function PandaCharacter({ state, onClick, onDoubleClick }: {
  state: PandaState;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      onDoubleClick();
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        onClick();
      }, 250);
    }
  };

  const bodyAnim = {
    idle: { scale: [1, 1.018, 1], y: [0, -2, 0], transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const } },
    sleeping: { scale: [1, 1.012, 1], y: [0, 3, 0], rotate: [0, 1.5, 0], transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' as const } },
    watching: { scale: 1.05, y: -3, transition: { duration: 0.3 } },
    listening: { scale: [1, 1.04, 1], transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' as const } },
    thinking: { rotate: [-4, 4, -4], transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' as const } },
    executing: { y: [0, -5, 0], transition: { duration: 0.45, repeat: Infinity, ease: 'easeInOut' as const } },
    success: { scale: [1, 1.18, 0.94, 1.08, 1], y: [0, -14, 0, -7, 0], transition: { duration: 0.9 } },
    error: { x: [-7, 7, -7, 7, -4, 4, 0], transition: { duration: 0.55 } },
    celebration: { scale: [1, 1.22, 1], rotate: [0, 18, -18, 12, -8, 0], transition: { duration: 1.1 } },
  };

  return (
    <div className="relative cursor-pointer select-none" onClick={handleClick} style={{ width: PANDA_SIZE.w, height: PANDA_SIZE.h }}>
      {/* Drag handle — invisible strip at head top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-20 rounded-full"
        style={{ WebkitAppRegion: 'drag' } as any}
      />

      {/* Main body animation */}
      <motion.div animate={bodyAnim[state]}>
        <PandaSVG state={state} />
      </motion.div>

      {/* Sleeping ZZZ */}
      <AnimatePresence>
        {state === 'sleeping' && (
          <div className="absolute top-0 right-0">
            <motion.span
              key="z1"
              className="absolute text-blue-300 font-bold text-sm"
              style={{ right: 8, top: 10 }}
              animate={{ y: [-2, -14], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            >z</motion.span>
            <motion.span
              key="z2"
              className="absolute text-blue-300 font-bold text-base"
              style={{ right: 0, top: 2 }}
              animate={{ y: [-2, -18], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            >Z</motion.span>
            <motion.span
              key="z3"
              className="absolute text-blue-200 font-bold text-lg"
              style={{ right: -8, top: -6 }}
              animate={{ y: [-2, -22], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
            >Z</motion.span>
          </div>
        )}
      </AnimatePresence>

      {/* Thinking bubble */}
      <AnimatePresence>
        {state === 'thinking' && (
          <motion.div
            className="absolute -top-2 -right-2 bg-white/90 rounded-full px-2 py-1 text-xs text-gray-500 shadow"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            ...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listening pulse ring */}
      <AnimatePresence>
        {state === 'listening' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400"
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Celebration confetti */}
      <AnimatePresence>
        {state === 'celebration' && (
          <div className="absolute inset-0 pointer-events-none">
            {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'].map((color, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: color, left: 10 + i * 22, top: 20 }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: [-5, 35], x: [(i - 2.5) * 6, (i - 2.5) * 18], opacity: [1, 0], rotate: [0, 360] }}
                transition={{ duration: 0.9, delay: i * 0.08 }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── COMMAND BUBBLE ───────────────────────────────────────────────────────────

interface BubbleProps {
  settings: SettingsType;
  onLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onOpenSettings: () => void;
  onOpenDebug: () => void;
  onClose: () => void;
  onStateChange: (s: PandaState) => void;
  onVoiceToggle: (active: boolean) => void;
  listening: boolean;
}

function CommandBubble({ settings, onLog, onOpenSettings, onOpenDebug, onClose, onStateChange, onVoiceToggle, listening }: BubbleProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });
  const [showOptions, setShowOptions] = useState<IntentOption[] | null>(null);
  const [pendingResult, setPendingResult] = useState<MatchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const showStatus = (type: Status['type'], message: string, duration = 3000) => {
    setStatus({ type, message });
    if (duration > 0) setTimeout(() => setStatus({ type: 'idle', message: '' }), duration);
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    onStateChange('thinking');
    debounceRef.current = setTimeout(async () => {
      const matches = await topMatches(query, 5);
      setResults(matches);
      onStateChange(matches.length > 0 ? 'watching' : 'idle');
    }, 200);
  }, [query]);

  const runAction = useCallback(async (result: MatchResult) => {
    const { intent } = result;
    if (intent.options && intent.options.length > 0 && !intent.safeAutoExecute) {
      setPendingResult(result);
      setShowOptions(intent.options);
      return;
    }
    setLoading(true);
    onStateChange('executing');
    try {
      const action = intent.actions[0];
      await executeAction(action, settings);
      onStateChange('success');
      showStatus('success', intent.description);
      onLog({ query, matchedIntent: intent.id, confidence: Math.round(result.score * 100), actionExecuted: `${action.type}:${action.value}` });
      setQuery('');
      setResults([]);
      setTimeout(() => onStateChange('celebration'), 900);
      setTimeout(() => onStateChange('idle'), 2200);
    } catch (err: any) {
      const msg = err?.message ?? 'Action failed';
      onStateChange('error');
      showStatus('error', msg);
      onLog({ query, matchedIntent: intent.id, confidence: Math.round(result.score * 100), actionExecuted: null, error: msg });
      setTimeout(() => onStateChange('idle'), 1500);
    } finally {
      setLoading(false);
    }
  }, [query, settings, onLog, onStateChange]);

  const runOption = useCallback(async (option: IntentOption) => {
    if (!pendingResult) return;
    setShowOptions(null);
    setLoading(true);
    onStateChange('executing');
    try {
      await executeAction(option.action, settings);
      onStateChange('success');
      showStatus('success', option.label);
      onLog({ query, matchedIntent: pendingResult.intent.id, confidence: Math.round(pendingResult.score * 100), actionExecuted: `${option.action.type}:${option.action.value}` });
      setQuery('');
      setResults([]);
      setTimeout(() => onStateChange('celebration'), 900);
      setTimeout(() => onStateChange('idle'), 2200);
    } catch (err: any) {
      onStateChange('error');
      showStatus('error', err?.message ?? 'Action failed');
      setTimeout(() => onStateChange('idle'), 1500);
    } finally {
      setLoading(false);
      setPendingResult(null);
    }
  }, [pendingResult, query, settings, onLog, onStateChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Enter' && results.length > 0 && !showOptions) { runAction(results[0]); }
  };

  const handleSearchFallback = async () => {
    await executeAction({ type: 'browser', value: query }, settings);
    onLog({ query, matchedIntent: null, confidence: 0, actionExecuted: 'browser:search' });
    setQuery('');
    setResults([]);
    onClose();
  };

  const confidenceColor = (s: number) => s > 0.75 ? 'text-emerald-400' : s > 0.5 ? 'text-yellow-400' : 'text-red-400';
  const actionLabel = (type: string) => ({ uri: 'SETTINGS', powershell: 'PS', cmd: 'CMD', winget: 'INSTALL', app: 'LAUNCH', explorer: 'FOLDER', browser: 'WEB', llm: 'AI' }[type] ?? type.toUpperCase());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="w-full mb-2"
      style={{ WebkitAppRegion: 'no-drag' } as any}
    >
      {/* Bubble tail */}
      <div className="flex justify-center mb-0.5">
        <div className="w-3 h-3 bg-gray-900/95 rotate-45 rounded-sm" style={{ marginBottom: -6 }} />
      </div>

      <div className="bg-gray-900/95 border border-white/12 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 backdrop-blur-sm">
        {/* Input row */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          {loading
            ? <Loader2 className="w-4 h-4 shrink-0 text-indigo-400 animate-spin" />
            : <span className="text-indigo-400 text-base shrink-0">🐾</span>
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you need help with?"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
          />
          <div className="flex items-center gap-0.5 shrink-0">
            {settings.voiceEnabled && (
              <button
                onClick={() => onVoiceToggle(!listening)}
                className={`p-1.5 rounded-lg transition-colors ${listening ? 'text-red-400 bg-red-400/10' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            )}
            <button onClick={onOpenSettings} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button onClick={onOpenDebug} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
              <Bug className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-600 hover:text-gray-400 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {/* Status */}
          {status.type !== 'idle' && status.message && (
            <motion.div
              key="status"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`px-3 py-1.5 text-xs border-t border-white/5 ${status.type === 'success' ? 'text-emerald-400' : status.type === 'error' ? 'text-red-400' : 'text-blue-400'}`}
            >
              {status.type === 'success' ? '✓ ' : status.type === 'error' ? '✕ ' : ''}{status.message}
            </motion.div>
          )}

          {/* Options */}
          {showOptions && (
            <motion.div key="options" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-white/5">
              <div className="px-3 py-1.5 text-xs text-gray-500">Choose an action:</div>
              <div className="flex flex-col gap-1 px-2 pb-2">
                {showOptions.map((opt, i) => (
                  <button key={i} onClick={() => runOption(opt)} className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-200 bg-gray-800/50 border border-white/8 hover:border-indigo-400/50 hover:bg-indigo-900/20 transition-all">
                    {opt.label}
                  </button>
                ))}
                <button onClick={() => { setShowOptions(null); setPendingResult(null); }} className="w-full text-left px-3 py-1.5 rounded-xl text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {results.length > 0 && !showOptions && (
            <motion.div key="results" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-white/5">
              <div className="flex flex-col gap-1 p-2">
                {results.map((r, i) => (
                  <motion.button
                    key={r.intent.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.035 }}
                    onClick={() => runAction(r)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-gray-800/50 border border-white/5 hover:border-white/20 hover:bg-gray-700/60 transition-all flex items-center gap-2 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{r.intent.description}</div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        <span className="inline-block mr-1.5 px-1.5 py-0.5 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-500/20 text-xs">
                          {actionLabel(r.intent.actions[0]?.type ?? '')}
                        </span>
                        {r.intent.actions[0]?.value?.replace('ms-settings:', '').slice(0, 38)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xs ${confidenceColor(r.score)}`}>{Math.round(r.score * 100)}%</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </motion.button>
                ))}
              </div>
              <div className="px-3 py-1.5 text-xs text-gray-600 border-t border-white/5">
                Enter for top result · Esc to close
              </div>
            </motion.div>
          )}

          {/* No results */}
          {query.trim() && results.length === 0 && !loading && (
            <motion.div key="noresult" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-white/5 px-3 py-2.5">
              <p className="text-sm text-gray-500">No Windows action found — search instead?</p>
              <button onClick={handleSearchFallback} className="mt-1.5 text-sm text-indigo-400 hover:text-indigo-300 underline transition-colors">
                Search "{query.slice(0, 40)}"
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── PANDA ASSISTANT (MAIN) ───────────────────────────────────────────────────

interface Props {
  settings: SettingsType;
  onLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  onOpenSettings: () => void;
  onOpenDebug: () => void;
}

const SLEEP_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const IDLE_W = 180, IDLE_H = 200;
const BUBBLE_W = 360, BUBBLE_H_BASE = 250, BUBBLE_H_RESULTS = 490;

export default function PandaAssistant({ settings, onLog, onOpenSettings, onOpenDebug }: Props) {
  const [pandaState, setPandaState] = useState<PandaState>('idle');
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const sleepTimer = useRef<ReturnType<typeof setTimeout>>();
  const recognitionRef = useRef<any>(null);

  const resetSleep = useCallback(() => {
    clearTimeout(sleepTimer.current);
    if (pandaState === 'sleeping') setPandaState('idle');
    sleepTimer.current = setTimeout(() => setPandaState('sleeping'), SLEEP_TIMEOUT);
  }, [pandaState]);

  // Start sleep timer
  useEffect(() => {
    sleepTimer.current = setTimeout(() => setPandaState('sleeping'), SLEEP_TIMEOUT);
    return () => clearTimeout(sleepTimer.current);
  }, []);

  // Battery events
  useEffect(() => {
    if (!isElectron()) return;
    api()?.onBatteryStatus?.((data: { level?: number; charging?: boolean }) => {
      if (data.charging) return;
      if (data.level !== undefined && data.level <= 10) {
        setPandaState('error');
        setTimeout(() => setPandaState('watching'), 3000);
      } else if (data.level !== undefined && data.level <= 20) {
        setPandaState('watching');
        setTimeout(() => setPandaState('idle'), 5000);
      }
    });
  }, []);

  // Resize Electron window
  useEffect(() => {
    if (!isElectron()) return;
    if (bubbleOpen) {
      api()?.resizeWindow?.(BUBBLE_W, BUBBLE_H_RESULTS);
      api()?.setIgnoreMouse?.(false);
    } else {
      api()?.resizeWindow?.(IDLE_W, IDLE_H);
    }
  }, [bubbleOpen]);

  const handlePandaClick = () => {
    resetSleep();
    setBubbleOpen(b => !b);
    setPandaState(bubbleOpen ? 'idle' : 'watching');
  };

  const handlePandaDoubleClick = () => {
    resetSleep();
    if (!settings.voiceEnabled) {
      setBubbleOpen(true);
      return;
    }
    toggleVoice();
    setBubbleOpen(true);
  };

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setPandaState('watching');
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e: any) => {
      setVoiceQuery(e.results[0][0].transcript);
      setListening(false);
      setPandaState('watching');
    };
    recognition.onerror = () => { setListening(false); setPandaState('idle'); };
    recognition.onend = () => { setListening(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setPandaState('listening');
  };

  const handleClose = () => {
    setBubbleOpen(false);
    setPandaState('idle');
  };

  const handleStateChange = (s: PandaState) => {
    setPandaState(s);
    resetSleep();
  };

  // Browser preview: show panda centered on page
  const isElectronEnv = isElectron();
  const outerClass = isElectronEnv
    ? 'flex flex-col items-center justify-end pb-1'
    : 'min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 flex flex-col items-center justify-end pb-8';

  return (
    <div
      className={outerClass}
      style={isElectronEnv ? { height: '100vh' } : undefined}
      onMouseMove={resetSleep}
      onKeyDown={resetSleep}
    >
      {/* Command bubble */}
      <AnimatePresence>
        {bubbleOpen && (
          <div className="w-full max-w-sm px-2">
            <CommandBubble
              settings={settings}
              onLog={onLog}
              onOpenSettings={onOpenSettings}
              onOpenDebug={onOpenDebug}
              onClose={handleClose}
              onStateChange={handleStateChange}
              onVoiceToggle={(active) => { if (active) toggleVoice(); else { recognitionRef.current?.stop(); setListening(false); } }}
              listening={listening}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Panda */}
      <PandaCharacter
        state={pandaState}
        onClick={handlePandaClick}
        onDoubleClick={handlePandaDoubleClick}
      />

      {/* Browser preview hint */}
      {!isElectronEnv && (
        <p className="mt-3 text-xs text-gray-700 text-center max-w-xs">
          Click the panda to open the command bubble · Double-click for voice
          <br />Browser preview — Windows actions are simulated
        </p>
      )}
    </div>
  );
}
