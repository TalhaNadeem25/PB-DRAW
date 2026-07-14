import { useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { WifiSlash } from '@phosphor-icons/react';

export const ConnectionStatus = () => {
  const { socket, connected } = useSocket();
  const wasConnected = useRef(false);

  useEffect(() => {
    if (connected) wasConnected.current = true;
  }, [connected]);

  // Never show the badge if socket is disabled, or if we never had a connection
  // (avoids showing "Reconnecting..." on first load / during screenshots)
  if (socket === null || !wasConnected.current || connected) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
      <WifiSlash className="w-4 h-4 animate-pulse" />
      <span>Reconnecting...</span>
    </div>
  );
};
