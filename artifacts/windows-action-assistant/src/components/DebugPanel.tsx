import { motion } from 'framer-motion';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { LogEntry } from '../types';

interface Props {
  logs: LogEntry[];
  onClear: () => void;
  onBack: () => void;
  theme: 'terminal' | 'modern';
}

export default function DebugPanel({ logs, onClear, onBack, theme }: Props) {
  const isTerminal = theme === 'terminal';

  const t = isTerminal ? {
    bg: 'bg-black',
    border: 'border border-green-500/30',
    text: 'text-green-400 font-mono',
    dim: 'text-green-700 font-mono',
    header: 'text-green-400 font-mono text-lg',
    row: 'border-b border-green-500/10 hover:bg-green-900/10',
    badge: (type: string) => type === 'success' ? 'text-green-400' : type === 'error' ? 'text-red-400' : 'text-yellow-500',
    btn: 'border border-red-500/40 text-red-500 hover:bg-red-900/20 font-mono',
    back: 'text-green-700 hover:text-green-400',
  } : {
    bg: 'bg-gray-900',
    border: 'border border-white/10',
    text: 'text-white',
    dim: 'text-gray-500',
    header: 'text-white text-lg font-semibold',
    row: 'border-b border-white/5 hover:bg-gray-800/50',
    badge: (type: string) => type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-red-400' : 'text-yellow-400',
    btn: 'bg-red-900/30 text-red-400 border border-red-500/20 hover:bg-red-900/50',
    back: 'text-gray-500 hover:text-white',
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${!isTerminal ? 'rounded-2xl overflow-hidden' : ''}`}>
      <div className={`${t.bg} ${t.border} ${!isTerminal ? 'rounded-2xl' : ''} overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${isTerminal ? 'border-green-500/20' : 'border-white/5'}`}>
          <button onClick={onBack} className={`${t.back} transition-colors`}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className={`flex-1 ${t.header}`}>
            {isTerminal ? '// debug.log' : 'Debug Log'}
          </h2>
          {logs.length > 0 && (
            <button onClick={onClear} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${t.btn}`}>
              <Trash2 className="w-3 h-3" />
              {isTerminal ? '[clear]' : 'Clear'}
            </button>
          )}
        </div>

        {/* Log table */}
        <div className="max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className={`px-4 py-8 text-center text-sm ${t.dim}`}>
              {isTerminal ? '// no log entries yet.' : 'No log entries yet. Try searching for something.'}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className={`${isTerminal ? 'border-b border-green-500/20' : 'border-b border-white/5'} sticky top-0 ${t.bg}`}>
                <tr>
                  <th className={`px-3 py-2 text-left ${t.dim}`}>{isTerminal ? 'TIME' : 'Time'}</th>
                  <th className={`px-3 py-2 text-left ${t.dim}`}>{isTerminal ? 'QUERY' : 'Query'}</th>
                  <th className={`px-3 py-2 text-left ${t.dim}`}>{isTerminal ? 'INTENT' : 'Intent'}</th>
                  <th className={`px-3 py-2 text-left ${t.dim}`}>{isTerminal ? 'CONF' : 'Conf'}</th>
                  <th className={`px-3 py-2 text-left ${t.dim}`}>{isTerminal ? 'ACTION' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`${t.row} transition-colors`}
                  >
                    <td className={`px-3 py-2 ${t.dim} whitespace-nowrap`}>{formatTime(log.timestamp)}</td>
                    <td className={`px-3 py-2 ${t.text} max-w-[120px] truncate`}>{log.query}</td>
                    <td className={`px-3 py-2 ${t.dim} max-w-[120px] truncate`}>{log.matchedIntent ?? '—'}</td>
                    <td className={`px-3 py-2 ${log.error ? (isTerminal ? 'text-red-400' : 'text-red-400') : t.dim}`}>
                      {log.error ? 'ERR' : `${log.confidence}%`}
                    </td>
                    <td className={`px-3 py-2 ${t.dim} max-w-[140px] truncate`}>
                      {log.error ? (
                        <span className="text-red-400">{log.error}</span>
                      ) : (
                        log.actionExecuted ?? '—'
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={`px-4 py-2 text-xs ${t.dim} border-t ${isTerminal ? 'border-green-500/20' : 'border-white/5'}`}>
          {isTerminal ? `// ${logs.length} entries` : `${logs.length} entries`}
        </div>
      </div>
    </div>
  );
}
