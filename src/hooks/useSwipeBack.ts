import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

// Root tabs — swipe back disabled here
const ROOT_PATHS = new Set([
  '/', '/tournaments', '/leagues', '/live', '/dashboard', '/teams',
  '/login', '/signup', '/auth',
]);

const EDGE_ZONE = 30;   // px from left edge to begin gesture
const THRESHOLD = 80;   // px drag to trigger navigate(-1)
const MAX_Y_DRIFT = 60; // cancel if user scrolls vertically

export function useSwipeBack() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (ROOT_PATHS.has(location.pathname)) return;

    let startX: number | null = null;
    let startY: number | null = null;
    let active = false;

    // Thin visual indicator on the left edge
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed; left: 0; top: 50%;
      transform: translateY(-50%) translateX(-100%);
      width: 4px; height: 60px;
      background: rgba(255,255,255,0.5);
      border-radius: 0 4px 4px 0;
      z-index: 99998; pointer-events: none;
      transition: opacity 0.2s;
      box-shadow: 2px 0 8px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(indicator);

    const reset = () => {
      indicator.style.transform = 'translateY(-50%) translateX(-100%)';
      indicator.style.opacity = '0';
      active = false;
      startX = null;
      startY = null;
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t.clientX > EDGE_ZONE) return;
      startX = t.clientX;
      startY = t.clientY;
      active = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active || startX === null || startY === null) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);

      if (dy > MAX_Y_DRIFT) { reset(); return; }

      if (dx > 0) {
        const progress = Math.min(dx / THRESHOLD, 1);
        indicator.style.transform = `translateY(-50%) translateX(${(-1 + progress) * 100}%)`;
        indicator.style.opacity = String(progress);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!active || startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (dx >= THRESHOLD) navigate(-1);
      reset();
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      indicator.remove();
    };
  }, [navigate, location.pathname]);
}
