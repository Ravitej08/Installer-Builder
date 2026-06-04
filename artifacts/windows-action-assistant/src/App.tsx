import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Widget from './components/Widget';
import Settings from './components/Settings';
import DebugPanel from './components/DebugPanel';
import FirstRun from './components/FirstRun';
import { useSettings } from './hooks/useSettings';
import { useLogs } from './hooks/useLogs';

type View = 'widget' | 'settings' | 'debug';

const isElectron = () => typeof window !== 'undefined' && !!(window as any).electronAPI;

export default function App() {
  const { settings, save, loaded } = useSettings();
  const { logs, addLog, clearLogs } = useLogs();
  const [view, setView] = useState<View>('widget');
  const containerRef = useRef<HTMLDivElement>(null);

  // Navigate from tray menu (Electron only)
  useEffect(() => {
    if (isElectron()) {
      (window as any).electronAPI?.onNavigate?.((path: string) => {
        if (path === '/settings') setView('settings');
      });
    }
  }, []);

  // Resize Electron window based on content height
  useEffect(() => {
    if (!isElectron() || !containerRef.current) return;
    const ro = new ResizeObserver(() => {
      const h = containerRef.current?.offsetHeight ?? 80;
      (window as any).electronAPI?.resizeWindow?.(h + 20);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [view]);

  if (!loaded) return null;

  if (!settings.firstRunComplete) {
    return (
      <FirstRun onComplete={(prefs) => save({ ...prefs, firstRunComplete: true })} />
    );
  }

  const theme = settings.theme;
  const isTerminal = theme === 'terminal';

  // In browser preview: show centered with nice background
  // In Electron: transparent window, no background needed
  const outerClass = isElectron()
    ? 'p-2'
    : isTerminal
    ? 'min-h-screen bg-gray-950 flex items-start justify-center pt-16 p-4'
    : 'min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 flex items-start justify-center pt-16 p-4';

  return (
    <div className={outerClass}>
      <div ref={containerRef} className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {view === 'widget' && (
            <motion.div key="widget" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Widget
                settings={settings}
                onLog={addLog}
                onOpenSettings={() => setView('settings')}
                onOpenDebug={() => setView('debug')}
                theme={theme}
              />
            </motion.div>
          )}
          {view === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              <Settings
                settings={settings}
                onSave={save}
                onBack={() => setView('widget')}
                theme={theme}
              />
            </motion.div>
          )}
          {view === 'debug' && (
            <motion.div key="debug" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              <DebugPanel
                logs={logs}
                onClear={clearLogs}
                onBack={() => setView('widget')}
                theme={theme}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Browser preview notice */}
        {!isElectron() && (
          <p className={`mt-4 text-center text-xs ${isTerminal ? 'text-green-900 font-mono' : 'text-gray-700'}`}>
            {isTerminal
              ? '// running in browser preview. windows actions will be simulated.'
              : 'Browser preview — Windows actions are simulated. Build the Electron app to run natively.'}
          </p>
        )}
      </div>
    </div>
  );
}
