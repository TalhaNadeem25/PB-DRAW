import { useSocket } from '@/contexts/SocketContext';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ConnectionStatus = () => {
  const { connected } = useSocket();

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-lg",
        connected
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      )}
    >
      {connected ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Live</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Reconnecting...</span>
        </>
      )}
    </div>
  );
};
