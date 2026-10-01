/**
 * ConnectionLines Component
 * Draws curved SVG paths between matched row centers (left edge → right edge)
 * Uses @visx/shape + @visx/responsive with Canvas fallback >500 connections
 * Viewport culling, hover highlight, draw-in animation, keyboard nav, ARIA live region
 */

import { useRef, useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { useParentSize } from '@visx/responsive';
import { useECJYTokens } from '../theme/ECJYThemeProvider';
import { MatchResult } from '../types';
import { useFeatureFlagEnabled } from '../hooks/useFeatureFlag';

interface ConnectionLinesProps {
  matches: MatchResult[];
  leftRowRefs: Map<string, HTMLTableRowElement>;
  rightRowRefs: Map<string, HTMLTableRowElement>;
  density: 'comfortable' | 'compact' | 'dense';
  hoveredPairId?: string;
  onPairHover: (pairId: string | null) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

interface ConnectionPath {
  id: string;
  path: string;
  leftCenter: { x: number; y: number };
  rightCenter: { x: number; y: number };
  isVisible: boolean;
}

const STROKE_WIDTH = 2;
const HOVER_STROKE_WIDTH = 3;
const ANIMATION_DURATION = 400; // ms
const STAGGER_DELAY = 20; // ms
const CANVAS_THRESHOLD = 500;
const VIEWPORT_BUFFER = 5;

export function ConnectionLines({
  matches,
  leftRowRefs,
  rightRowRefs,
  density,
  hoveredPairId,
  onPairHover,
  containerRef,
}: ConnectionLinesProps) {
  const { tokens } = useECJYTokens();
  const linesEnabled = useFeatureFlagEnabled('CONNECTION_LINES');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [useCanvas, setUseCanvas] = useState(false);
  const [visiblePaths, setVisiblePaths] = useState<ConnectionPath[]>([]);
  const [animatedPaths, setAnimatedPaths] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const animationFrameRef = useRef<number>();

  // ARIA live region for accessibility
  const [announcement, setAnnouncement] = useState('');

  // Responsive container size
  const { parentRef: resizeRef, width, height } = useParentSize();
  useEffect(() => {
    setContainerSize({ width, height });
  }, [width, height]);

  // Compute connection paths
  const paths = useMemo(() => {
    const computedPaths: ConnectionPath[] = [];

    matches.forEach((match) => {
      const leftRow = leftRowRefs.get(match.ret_id);
      const rightRow = rightRowRefs.get(match.plat_id);

      if (!leftRow || !rightRow) return;

      const leftRect = leftRow.getBoundingClientRect();
      const rightRect = rightRow.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (!containerRect) return;

      // Convert to container-relative coordinates
      const leftCenter = {
        x: leftRect.right - containerRect.left,
        y: leftRect.top + leftRect.height / 2 - containerRect.top,
      };

      const rightCenter = {
        x: rightRect.left - containerRect.left,
        y: rightRect.top + rightRect.height / 2 - containerRect.top,
      };

      // Check if in viewport (+ buffer)
      const buffer = 100; // pixels
      const isVisible =
        leftCenter.y >= -buffer &&
        leftCenter.y <= containerSize.height + buffer &&
        rightCenter.y >= -buffer &&
        rightCenter.y <= containerSize.height + buffer;

      // Create curved path using Catmull-Rom spline
      const midX = (leftCenter.x + rightCenter.x) / 2;

      // Generate SVG path
      const path = `M ${leftCenter.x} ${leftCenter.y} C ${midX} ${leftCenter.y} ${midX} ${rightCenter.y} ${rightCenter.x} ${rightCenter.y}`;

      computedPaths.push({
        id: `${match.ret_id}-${match.plat_id}`,
        path,
        leftCenter,
        rightCenter,
        isVisible,
      });
    });

    return computedPaths;
  }, [matches, leftRowRefs, rightRowRefs, containerSize, containerRef]);

  // Viewport culling - only render visible paths ± buffer
  useEffect(() => {
    if (!containerSize.height) return;

    const bufferRows = VIEWPORT_BUFFER;
    const rowHeight = density === 'dense' ? 14 : density === 'compact' ? 18 : 24;
    const bufferPx = bufferRows * rowHeight;

    const scrollTop = containerRef.current?.scrollTop || 0;
    const visibleTop = scrollTop - bufferPx;
    const visibleBottom = scrollTop + containerSize.height + bufferPx;

    const filtered = paths.filter((p) => {
      const avgY = (p.leftCenter.y + p.rightCenter.y) / 2;
      return avgY >= visibleTop && avgY <= visibleBottom;
    });

    setVisiblePaths(filtered);
  }, [paths, containerSize, density, containerRef]);

  // Canvas fallback when >500 connections
  useEffect(() => {
    setUseCanvas(visiblePaths.length > CANVAS_THRESHOLD);
  }, [visiblePaths.length]);

  // Draw-in animation on mount
  useEffect(() => {
    if (visiblePaths.length === 0) return;

    const startTime = performance.now();
    const pathIds = visiblePaths.map((p) => p.id);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const newlyAnimated = new Set<string>();

      pathIds.forEach((id, index) => {
        const delay = index * STAGGER_DELAY;
        if (elapsed >= delay) {
          const progress = Math.min((elapsed - delay) / ANIMATION_DURATION, 1);
          // Easing: decelerate (cubic-bezier(0, 0, 0.38, 1))
          const eased = 1 - Math.pow(1 - progress, 3);
          if (eased >= 1) {
            newlyAnimated.add(id);
          }
        }
      });

      if (newlyAnimated.size > 0) {
        setAnimatedPaths((prev) => new Set([...prev, ...newlyAnimated]));
      }

      if (elapsed < pathIds.length * STAGGER_DELAY + ANIMATION_DURATION) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Announce for screen readers
    setAnnouncement(`${visiblePaths.length} conexiones renderizadas`);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [visiblePaths]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visiblePaths.length) return;

      const currentIndex = visiblePaths.findIndex((p) => p.id === hoveredPairId);
      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowLeft':
          e.preventDefault();
          // Navigate between left/right tables
          onPairHover(null);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.min(visiblePaths.length - 1, currentIndex + 1);
          break;
        case 'Enter':
          e.preventDefault();
          // Confirm match - could trigger callback
          break;
        default:
          return;
      }

      if (newIndex !== currentIndex && newIndex >= 0) {
        onPairHover(visiblePaths[newIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visiblePaths, hoveredPairId, onPairHover]);

  // Render SVG paths
  const renderSVG = () => {
    if (useCanvas || visiblePaths.length === 0) return null;

    return (
      <svg
        ref={svgRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
        }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={tokens.colors.semantic.precision.base} />
            <stop offset="100%" stopColor={tokens.colors.semantic.control.base} />
          </linearGradient>
        </defs>
        {visiblePaths.map((connection) => {
          const isHovered = connection.id === hoveredPairId;
          const isAnimated = animatedPaths.has(connection.id);

          return (
            <path
              key={connection.id}
              d={connection.path}
              stroke="url(#connection-gradient)"
              strokeWidth={isHovered ? HOVER_STROKE_WIDTH : STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                opacity: isAnimated ? 1 : 0,
                transition: `opacity ${ANIMATION_DURATION}ms cubic-bezier(0, 0, 0.38, 1)`,
                filter: isHovered
                  ? 'drop-shadow(0 0 4px currentColor)'
                  : 'none',
              }}
              onMouseEnter={() => onPairHover(connection.id)}
              onMouseLeave={() => onPairHover(null)}
            />
          );
        })}
      </svg>
    );
  };

  // Render Canvas fallback
  const renderCanvas = () => {
    if (!useCanvas || visiblePaths.length === 0 || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerSize.width * dpr;
    canvas.height = containerSize.height * dpr;
    canvas.style.width = `${containerSize.width}px`;
    canvas.style.height = `${containerSize.height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, containerSize.width, containerSize.height);

    // Draw connections
    visiblePaths.forEach((connection) => {
      const isHovered = connection.id === hoveredPairId;
      const progress = animatedPaths.has(connection.id) ? 1 : 0;

      if (progress === 0) return;

      ctx.beginPath();
      ctx.moveTo(connection.leftCenter.x, connection.leftCenter.y);

      const midX = (connection.leftCenter.x + connection.rightCenter.x) / 2;
      ctx.bezierCurveTo(
        midX,
        connection.leftCenter.y,
        midX,
        connection.rightCenter.y,
        connection.rightCenter.x,
        connection.rightCenter.y
      );

      // Gradient stroke
      const gradient = ctx.createLinearGradient(
        connection.leftCenter.x,
        0,
        connection.rightCenter.x,
        0
      );
      gradient.addColorStop(0, tokens.colors.semantic.precision.base);
      gradient.addColorStop(1, tokens.colors.semantic.control.base);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = isHovered ? HOVER_STROKE_WIDTH : STROKE_WIDTH;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = progress;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
        }}
        aria-hidden="true"
      />
    );
  };

  if (!linesEnabled) return null;

  return (
    <Box
      ref={resizeRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {announcement && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          {announcement}
        </div>
      )}
      {renderSVG()}
      {renderCanvas()}
    </Box>
  );
}

export default ConnectionLines;