import { useEffect, useRef, useState, useCallback } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface ParallaxValues {
  x: number;
  y: number;
}

export function useMouseParallax(intensity: number = 40, inverted: boolean = false) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState<ParallaxValues>({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const targetRef = useRef<ParallaxValues>({ x: 0, y: 0 });
  const currentRef = useRef<ParallaxValues>({ x: 0, y: 0 });
  const isActiveRef = useRef(true);

  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  const animate = useCallback(() => {
    if (!isActiveRef.current) return;

    currentRef.current.x = lerp(currentRef.current.x, targetRef.current.x, 0.1);
    currentRef.current.y = lerp(currentRef.current.y, targetRef.current.y, 0.1);

    setParallax({
      x: currentRef.current.x,
      y: currentRef.current.y,
    });

    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Check for touch device
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      // Normalize mouse position to -1 to 1
      const normalizedX = (e.clientX - centerX) / centerX;
      const normalizedY = (e.clientY - centerY) / centerY;
      
      const multiplier = inverted ? -1 : 1;
      
      targetRef.current = {
        x: normalizedX * intensity * multiplier,
        y: normalizedY * intensity * 0.5 * multiplier,
      };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      isActiveRef.current = false;
    };
  }, [intensity, inverted, animate]);

  return { elementRef, parallax };
}

export function useServiceParallax() {
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePos({ x, y });
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const getTransform = (intensity: number = 50, rotation: number = 6) => {
    const x = (mousePos.x - 0.5) * intensity;
    const y = (mousePos.y - 0.5) * intensity * 0.5;
    const rotate = (mousePos.x - 0.5) * rotation;
    
    return {
      transform: `translate(${x}%, ${y}%) rotate(${rotate}deg)`,
      transition: 'transform 0.3s cubic-bezier(0.455, 0.030, 0.515, 0.955)',
    };
  };

  return { containerRef, mousePos, getTransform };
}
