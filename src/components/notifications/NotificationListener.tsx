import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from 'sonner';
import { Trophy, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationListener = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: any) => {
      const { type, title, message, result, data } = notification;

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
      } else if (type === 'partner-invitation' && data?.actionUrl) {
        toast(title, {
          description: message,
          icon: <AlertCircle className="w-5 h-5" />,
          duration: 8000,
          action: {
            label: 'Accept',
            onClick: () => navigate(data.actionUrl),
          },
        });
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
