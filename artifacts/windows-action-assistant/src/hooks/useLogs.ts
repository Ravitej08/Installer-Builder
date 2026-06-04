import { useState, useCallback } from 'react';
import { LogEntry } from '../types';

const MAX_LOGS = 100;

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const log: LogEntry = {
      ...entry,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
    };
    setLogs(prev => [log, ...prev].slice(0, MAX_LOGS));
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, addLog, clearLogs };
}
