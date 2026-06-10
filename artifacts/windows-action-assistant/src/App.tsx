import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PandaAssistant from './components/PandaAssistant';
import Settings from './components/Settings';
import DebugPanel from './components/DebugPanel';
import FirstRun from './components/FirstRun';
import { useSettings } from './hooks/useSettings';
import { useLogs } from './hooks/useLogs';

type View = 'panda' | 'settings' | 'debug';

const isElectron = () => typeof window !== 'undefined' && !!(window as any).electronAPI;

export default function App() {
  const { settings, save, loaded } = useSettings();
  const { logs, addLog, clearLogs } = useLogs();
  const [view, setView] = useState<View>('panda');

  useEffect(() => {
    if (isElectron()) {
      (window as any).electronAPI?.onNavigate?.((path: string) => {
        if (path === '/settings') setView('settings');
      });
    }
  }, []);

  if (!loaded) return null;

  if (!settings.firstRunComplete) {
    return <FirstRun onComplete={(prefs) => save({ ...prefs, firstRunComplete: true })} />;
  }

  const slideIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 } };

  return (
    <AnimatePresence mode="wait">
      {view === 'panda' && (
        <motion.div key="panda" {...slideIn} className="w-full h-full">
          <PandaAssistant
            settings={settings}
            onLog={addLog}
            onOpenSettings={() => setView('settings')}
            onOpenDebug={() => setView('debug')}
          />
        </motion.div>
      )}
      {view === 'settings' && (
        <motion.div key="settings" {...slideIn}
          className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 flex items-start justify-center pt-12 p-4"
        >
          <div className="w-full max-w-2xl">
            <Settings settings={settings} onSave={save} onBack={() => setView('panda')} theme={settings.theme} />
          </div>
        </motion.div>
      )}
      {view === 'debug' && (
        <motion.div key="debug" {...slideIn}
          className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 flex items-start justify-center pt-12 p-4"
        >
          <div className="w-full max-w-2xl">
            <DebugPanel logs={logs} onClear={clearLogs} onBack={() => setView('panda')} theme={settings.theme} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
