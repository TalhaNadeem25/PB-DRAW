import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';
import { Trophy, AlertCircle } from 'lucide-react';

export const NotificationListener = () => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: any) => {
      const { type, title, message, result } = notification;

      if (type === 'match-completed') {
        if (result === 'win') {
          toast.success(message, {
            description: title,
            icon: <Trophy className="w-5 h-5" />,
            duration: 5000,
          });
        } else {
          toast.info(message, {
            description: title,
            duration: 5000,
          });
        }
      } else {
        toast(title, {
          description: message,
          icon: <AlertCircle className="w-5 h-5" />,
          duration: 4000,
        });
      }
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  return null; // This component doesn't render anything
};
