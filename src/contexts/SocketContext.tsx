import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinTournament: (tournamentId: string) => void;
  leaveTournament: (tournamentId: string) => void;
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // VITE_SOCKET_URL overrides; otherwise derive from VITE_API_URL (strip /api path for Socket.IO)
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketOrigin = import.meta.env.VITE_SOCKET_URL
      ? new URL(import.meta.env.VITE_SOCKET_URL).origin
      : new URL(rawApiUrl).origin;

    // Skip Socket.IO when the socket URL is the same host as the app (e.g. Vercel frontend).
    // Serverless hosts don't run a persistent Socket.IO server, so connecting would 404 and retry forever.
    const sameOrigin =
      typeof window !== 'undefined' &&
      window.location.origin !== undefined &&
      new URL(socketOrigin).origin === window.location.origin;
    if (sameOrigin) {
      setSocket(null);
      setConnected(false);
      return;
    }

    const socketInstance = io(socketOrigin, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setConnected(true);

      // Join user room if authenticated
      if (isAuthenticated && user?._id) {
        socketInstance.emit('join-user', user._id);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user]);

  const joinTournament = (tournamentId: string) => {
    if (socket) {
      socket.emit('join-tournament', tournamentId);
      console.log(`📺 Joined tournament:${tournamentId}`);
    }
  };

  const leaveTournament = (tournamentId: string) => {
    if (socket) {
      socket.emit('leave-tournament', tournamentId);
      console.log(`👋 Left tournament:${tournamentId}`);
    }
  };

  const joinMatch = (matchId: string) => {
    if (socket) {
      socket.emit('join-match', matchId);
      console.log(`🏓 Joined match:${matchId}`);
    }
  };

  const leaveMatch = (matchId: string) => {
    if (socket) {
      socket.emit('leave-match', matchId);
      console.log(`👋 Left match:${matchId}`);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        joinTournament,
        leaveTournament,
        joinMatch,
        leaveMatch,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
