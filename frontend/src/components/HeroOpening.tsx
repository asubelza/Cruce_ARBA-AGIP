/**
 * HeroOpening Component
 * Animated narrative sequence: ARCA → SISTEMA → CONTROL → DIFERENCIAS
 * Uses framer-motion for 800ms duration, 200ms stagger, decelerate easing
 * Supports skip interaction, reduced-motion, and canvas-confetti on completion
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, useReducedMotion, useAnimationControls } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useFeatureFlagEnabled } from '../hooks/useFeatureFlag';
import { useECJYTokens } from '../theme/ECJYThemeProvider';

interface HeroOpeningProps {
  onComplete: () => void;
}

const STAGES = [
  { text: 'ARCA', colorToken: 'precision', typography: 'displayLarge' },
  { text: 'SISTEMA', colorToken: 'control', typography: 'displayMedium' },
  { text: 'CONTROL', colorToken: 'detection', typography: 'displaySmall' },
  { text: 'DIFERENCIAS', colorToken: 'order', typography: 'headlineMedium' },
] as const;

const STAGE_DURATION = 800; // ms - from tokens.motion.durations.hero
const STAGGER_DELAY = 200; // ms

export function HeroOpening({ onComplete }: HeroOpeningProps) {
  const heroEnabled = useFeatureFlagEnabled('HERO_OPENING');
  const { tokens } = useECJYTokens();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const controls = useAnimationControls();
  const [visibleStages, setVisibleStages] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const skipHandlerRef = useRef<() => void>();
  const onCompleteRef = useRef(onComplete);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [
        tokens.colors.semantic.precision.base,
        tokens.colors.semantic.control.base,
        tokens.colors.semantic.detection.base,
        tokens.colors.semantic.order.base,
        tokens.colors.semantic.security.base,
      ],
      disableForReducedMotion: prefersReducedMotion,
    });
  }, [tokens, prefersReducedMotion]);

  const completeSequence = useCallback(() => {
    if (completed) return;
    setCompleted(true);
    setVisibleStages([0, 1, 2, 3]);
    controls.start({ opacity: 1 });
    fireConfetti();
    onCompleteRef.current();
  }, [controls, completed, fireConfetti, onCompleteRef]);

  const handleSkip = useCallback(() => {
    completeSequence();
  }, [completeSequence]);

  // Keyboard/click skip handlers
  useEffect(() => {
    skipHandlerRef.current = handleSkip;
    const handleKeyDown = (_e: KeyboardEvent) => {
      if (!completed) {
        skipHandlerRef.current?.();
      }
    };
    const handleClick = () => {
      if (!completed) {
        skipHandlerRef.current?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
    };
  }, [handleSkip, completed]);

  // Animation sequence
  useEffect(() => {
    if (!heroEnabled) {
      completeSequence();
      return;
    }

    if (prefersReducedMotion) {
      // Reduced motion: show all immediately
      setVisibleStages([0, 1, 2, 3]);
      setCompleted(true);
      fireConfetti();
      onCompleteRef.current();
      return;
    }

    // Normal animation sequence
    const timers: ReturnType<typeof setTimeout>[] = [];
    
    STAGES.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleStages(prev => [...prev, index]);
        if (index === STAGES.length - 1) {
          // Last stage - trigger completion after duration
          setTimeout(() => {
            completeSequence();
          }, STAGE_DURATION);
        }
      }, index * STAGGER_DELAY);
      timers.push(timer);
    });

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [heroEnabled, prefersReducedMotion, completeSequence, fireConfetti]);

  if (!heroEnabled) {
    return null;
  }

  const getTypographyStyle = (typography: string) => {
    const fontSizeMap = {
      displayLarge: tokens.typography.fontSizes['4xl'], // 3rem
      displayMedium: tokens.typography.fontSizes['3xl'], // 2rem
      displaySmall: tokens.typography.fontSizes['2xl'], // 1.5rem
      headlineMedium: tokens.typography.fontSizes.xl, // 1.25rem
    };
    return {
      fontFamily: tokens.typography.fontFamilies.display,
      fontWeight: tokens.typography.fontWeights.bold,
      fontSize: fontSizeMap[typography as keyof typeof fontSizeMap] || tokens.typography.fontSizes.base,
      lineHeight: tokens.typography.lineHeights.tight,
      letterSpacing: tokens.typography.letterSpacings.tight,
    };
  };

  const getColor = (colorToken: string) => {
    return tokens.colors.semantic[colorToken as keyof typeof tokens.colors.semantic]?.base || tokens.colors.text.primary;
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: tokens.colors.surface.bg,
        zIndex: tokens.zIndex.modal,
        gap: tokens.spacing[6],
      }}
      role="region"
      aria-label="Secuencia de apertura ECJY"
      aria-live="polite"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: tokens.spacing[4],
        }}
      >
        {STAGES.map((stage, index) => {
          const isVisible = visibleStages.includes(index);
          const color = getColor(stage.colorToken);
          const typoStyle = getTypographyStyle(stage.typography);

          return (
            <motion.span
              key={stage.text}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                duration: STAGE_DURATION / 1000,
                ease: tokens.motion.easings.decelerate,
              }}
              style={{
                ...typoStyle,
                color,
                textShadow: `0 0 30px ${color}40`,
                whiteSpace: 'nowrap',
              }}
            >
              {stage.text}
            </motion.span>
          );
        })}
      </motion.div>

      {!completed && !prefersReducedMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: (STAGES.length * STAGGER_DELAY) / 1000, duration: 0.5 }}
          style={{
            fontFamily: tokens.typography.fontFamilies.body,
            fontSize: tokens.typography.fontSizes.sm,
            color: tokens.colors.text.tertiary,
            cursor: 'pointer',
          }}
          onClick={handleSkip}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleSkip()}
          aria-label="Saltar animación"
        >
          Click o tecla para saltar
        </motion.div>
      )}
    </div>
  );
}

export default HeroOpening;