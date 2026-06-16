import { useCallback, useEffect, useRef } from 'react';

/**
 * Animated pixel-reveal background for the landing hero.
 *
 * Adapted from the 21st.dev pixel-hero community component — a one-time
 * staggered "appear" ripple of tiny squares that settles into a subtle
 * shimmer. Colors are passed in explicitly (Stitch blue + dim whites).
 * Respects prefers-reduced-motion.
 */

type Pixel = {
  x: number;
  y: number;
  color: string;
  size: number;
  sizeStep: number;
  minSize: number;
  maxSize: number;
  maxSizeInt: number;
  delay: number;
  counter: number;
  counterStep: number;
  speed: number;
  isIdle: boolean;
  isReverse: boolean;
  isShimmer: boolean;
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

type PixelCanvasProps = {
  colors: string[];
  gap?: number;
  speed?: number;
  className?: string;
};

export function PixelCanvas({
  colors,
  gap = 6,
  speed = 30,
  className,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef(performance.now());
  const reducedMotionRef = useRef(false);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || colors.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = wrap.getBoundingClientRect();
    const w = Math.floor(width);
    const h = Math.floor(height);
    if (w === 0 || h === 0) return;
    canvas.width = w;
    canvas.height = h;

    const effectiveSpeed = reducedMotionRef.current
      ? 0
      : Math.min(speed, 100) * 0.001;
    const pixels: Pixel[] = [];

    for (let x = 0; x < w; x += gap) {
      for (let y = 0; y < h; y += gap) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const dx = x - w / 2;
        const dy = y - h / 2;
        const delay = reducedMotionRef.current
          ? 0
          : Math.sqrt(dx * dx + dy * dy) * 0.65;
        pixels.push({
          x,
          y,
          color,
          size: 0,
          sizeStep: rand(0.12, 0.28),
          minSize: 0.5,
          maxSize: rand(0.5, 2),
          maxSizeInt: 2,
          delay,
          counter: 0,
          counterStep: rand(1.8, 3.2) + (w + h) * 0.008,
          speed: rand(0.08, 0.4) * effectiveSpeed,
          isIdle: false,
          isReverse: false,
          isShimmer: false,
        });
      }
    }
    pixelsRef.current = pixels;
  }, [colors, gap, speed]);

  const animate = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    const frameInterval = 1000 / 60;

    const loop = () => {
      animationRef.current = requestAnimationFrame(loop);
      const now = performance.now();
      const elapsed = now - lastFrameRef.current;
      if (elapsed < frameInterval) return;
      lastFrameRef.current = now - (elapsed % frameInterval);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pixels = pixelsRef.current;
      for (const p of pixels) {
        p.isIdle = false;
        if (p.counter <= p.delay) {
          p.counter += p.counterStep;
          continue;
        }
        if (p.size >= p.maxSize) p.isShimmer = true;
        if (p.isShimmer) {
          if (p.size >= p.maxSize) p.isReverse = true;
          else if (p.size <= p.minSize) p.isReverse = false;
          p.size += p.isReverse ? -p.speed : p.speed;
        } else {
          p.size += p.sizeStep;
        }
        const offset = p.maxSizeInt * 0.5 - p.size * 0.5;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x + offset, p.y + offset, p.size, p.size);
      }
    };
    animationRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    init();
    animate();

    const resizeObserver = new ResizeObserver(() => init());
    if (wrapRef.current) resizeObserver.observe(wrapRef.current);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationRef.current);
    };
  }, [init, animate]);

  return (
    <div ref={wrapRef} className={className}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}