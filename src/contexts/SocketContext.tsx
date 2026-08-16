import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinTournament: (tournamentId: string) => void;
  leaveTournament: (tournamentId: string) => void;
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  joinClub: (clubId: string) => void;
  leaveClub: (clubId: string) => void;
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
  const [liveScoreAnnouncement, setLiveScoreAnnouncement] = useState('');
  const { user, isAuthenticated } = useAuth();
  const tournamentRefCount = useRef<Record<string, number>>({});
  const matchRefCount = useRef<Record<string, number>>({});
  const clubRefCount = useRef<Record<string, number>>({});

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

  const joinTournament = useCallback((tournamentId: string) => {
    if (!socket) return;
    const prev = tournamentRefCount.current[tournamentId] ?? 0;
    tournamentRefCount.current[tournamentId] = prev + 1;
    if (prev === 0) {
      socket.emit('join-tournament', tournamentId);
      console.log(`📺 Joined tournament:${tournamentId}`);
    }
  }, [socket]);

  const leaveTournament = useCallback((tournamentId: string) => {
    if (!socket) return;
    const prev = tournamentRefCount.current[tournamentId] ?? 0;
    const next = Math.max(0, prev - 1);
    tournamentRefCount.current[tournamentId] = next;
    if (prev === 1) {
      socket.emit('leave-tournament', tournamentId);
      console.log(`👋 Left tournament:${tournamentId}`);
    }
  }, [socket]);

  const joinMatch = useCallback((matchId: string) => {
    if (!socket) return;
    const prev = matchRefCount.current[matchId] ?? 0;
    matchRefCount.current[matchId] = prev + 1;
    if (prev === 0) {
      socket.emit('join-match', matchId);
      console.log(`🏓 Joined match:${matchId}`);
    }
  }, [socket]);

  const leaveMatch = useCallback((matchId: string) => {
    if (!socket) return;
    const prev = matchRefCount.current[matchId] ?? 0;
    const next = Math.max(0, prev - 1);
    matchRefCount.current[matchId] = next;
    if (prev === 1) {
      socket.emit('leave-match', matchId);
      console.log(`👋 Left match:${matchId}`);
    }
  }, [socket]);

  const joinClub = useCallback((clubId: string) => {
    if (!socket) return;
    const prev = clubRefCount.current[clubId] ?? 0;
    clubRefCount.current[clubId] = prev + 1;
    if (prev === 0) {
      socket.emit('join-club', clubId);
      console.log(`💬 Joined club:${clubId}`);
    }
  }, [socket]);

  const leaveClub = useCallback((clubId: string) => {
    if (!socket) return;
    const prev = clubRefCount.current[clubId] ?? 0;
    const next = Math.max(0, prev - 1);
    clubRefCount.current[clubId] = next;
    if (prev === 1) {
      socket.emit('leave-club', clubId);
      console.log(`👋 Left club:${clubId}`);
    }
  }, [socket]);

  // Announce score updates for screen readers (aria-live)
  useEffect(() => {
    if (!socket) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const onScoreUpdate = (data: { matchId?: string; team1Score?: number; team2Score?: number }) => {
      const t1 = data.team1Score ?? 0;
      const t2 = data.team2Score ?? 0;
      setLiveScoreAnnouncement(`Score updated: ${t1} to ${t2}`);
      timeoutId = setTimeout(() => setLiveScoreAnnouncement(''), 1500);
    };
    socket.on('score-updated', onScoreUpdate);
    return () => {
      socket.off('score-updated', onScoreUpdate);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        joinTournament,
        leaveTournament,
        joinMatch,
        leaveMatch,
        joinClub,
        leaveClub,
      }}
    >
      {/* Screen reader announcement for live score updates */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {liveScoreAnnouncement}
      </div>
      {children}
    </SocketContext.Provider>
  );
};
