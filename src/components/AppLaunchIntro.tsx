import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

// Centerline geometry traced from the app icon (ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png),
// in that image's own 1024x1024 coordinate space, so this recreates the mark exactly.
const TOP_PATH = "M 188 281 L 425 281 L 425 425 L 597.5 425 L 597.5 511";
const BOTTOM_PATH = "M 188 743 L 425 743 L 425 597.5 L 597.5 597.5 L 597.5 511";
const STEM_PATH = "M 597.5 511 L 780 511";
const STROKE_WIDTH = 71;
const BALL = { cx: 799, cy: 511, r: 39 };

const ZIGZAG_DURATION = 0.5;
const STEM_DELAY = 0.46;
const STEM_DURATION = 0.16;
const BALL_DELAY = 0.58;
const HOLD_UNTIL = 1.15;
const EXIT_DURATION = 0.32;

// Native app-launch intro: draws the paddle path, drops the ball in, then hands off
// to the app. Web sessions skip this — it's for the app-open moment, not every page load.
export default function AppLaunchIntro() {
  const [visible, setVisible] = useState(() => Capacitor.isNativePlatform());

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Native splash shares the same brand-green background as this overlay, so
    // handing off here is seamless — no flash, no visible cut.
    SplashScreen.hide().catch(() => {});

    const timer = setTimeout(() => setVisible(false), HOLD_UNTIL * 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: "var(--pb-court)", zIndex: 999999 }}
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_DURATION, ease: "easeInOut" }}
        >
          <svg width="160" height="160" viewBox="0 0 1024 1024" fill="none">
            <motion.path
              d={TOP_PATH}
              stroke="var(--pb-paper)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="square"
              strokeLinejoin="miter"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: ZIGZAG_DURATION, ease: "easeInOut" }}
            />
            <motion.path
              d={BOTTOM_PATH}
              stroke="var(--pb-paper)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="square"
              strokeLinejoin="miter"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: ZIGZAG_DURATION, ease: "easeInOut" }}
            />
            <motion.path
              d={STEM_PATH}
              stroke="var(--pb-paper)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="square"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: STEM_DURATION, delay: STEM_DELAY, ease: "easeInOut" }}
            />
            <motion.circle
              cx={BALL.cx}
              cy={BALL.cy}
              r={BALL.r}
              fill="var(--pb-amber)"
              initial={{ scale: 0, opacity: 0, y: -50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: BALL_DELAY, type: "spring", stiffness: 420, damping: 14 }}
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
