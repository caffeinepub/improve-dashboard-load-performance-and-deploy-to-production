import { useState, useEffect, useCallback } from 'react';

interface UseLoadTimeoutOptions {
  timeoutMs?: number;
}

interface UseLoadTimeoutReturn {
  timedOut: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

export function useLoadTimeout(options: UseLoadTimeoutOptions = {}): UseLoadTimeoutReturn {
  const { timeoutMs = 15000 } = options; // Default 15 seconds
  const [timedOut, setTimedOut] = useState(false);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  const stopTimer = useCallback(() => {
    if (timerId) {
      clearTimeout(timerId);
      setTimerId(null);
    }
  }, [timerId]);

  const startTimer = useCallback(() => {
    stopTimer();
    const id = setTimeout(() => {
      setTimedOut(true);
    }, timeoutMs);
    setTimerId(id);
  }, [timeoutMs, stopTimer]);

  const resetTimer = useCallback(() => {
    stopTimer();
    setTimedOut(false);
  }, [stopTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  return {
    timedOut,
    startTimer,
    stopTimer,
    resetTimer,
  };
}
