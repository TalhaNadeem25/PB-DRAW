import { useRef, useState, useCallback, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { haptics } from '@/lib/haptics';

interface Props {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}

const THRESHOLD = 70; // px to pull before triggering

export function PullToRefresh({ onRefresh, children }: Props) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const hapticFiredRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate when scrolled to top
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
      hapticFiredRef.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startYRef.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) { setPullDistance(0); return; }

    // Rubber band resistance
    const distance = Math.min(delta * 0.45, THRESHOLD * 1.4);
    setPullDistance(distance);

    if (distance >= THRESHOLD && !hapticFiredRef.current) {
      haptics.light();
      hapticFiredRef.current = true;
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      haptics.medium();
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    startYRef.current = null;
  }, [pullDistance, refreshing, onRefresh]);

  // On web, just render children normally
  if (!Capacitor.isNativePlatform()) return <>{children}</>;

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const isTriggered = pullDistance >= THRESHOLD;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative' }}
    >
      {/* Pull indicator */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: pullDistance || (refreshing ? THRESHOLD : 0),
          overflow: 'hidden',
          transition: refreshing || pullDistance === 0 ? 'height 0.3s ease' : 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'hsl(var(--primary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${0.5 + progress * 0.5}) rotate(${refreshing ? 0 : progress * 180}deg)`,
            transition: refreshing ? 'transform 0.1s' : 'none',
            opacity: progress,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {refreshing ? (
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: 'spin 0.8s linear infinite' }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d={isTriggered ? "M5 10l7-7 7 7" : "M12 5v14M5 12l7 7 7-7"} />
            </svg>
          )}
        </div>
      </div>

      {/* Content shifts down while pulling */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: refreshing || pullDistance === 0 ? 'transform 0.3s ease' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
