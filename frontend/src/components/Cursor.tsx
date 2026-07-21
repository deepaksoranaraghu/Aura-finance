import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useStore } from '@/store/useStore';

export function Cursor() {
  const { cursorVariant } = useStore();
  const [hasMouse, setHasMouse] = useState(true);

  // Use motion values to avoid React re-renders on every mouse move (massive performance boost)
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Outer glow follows with a slight delay/spring
  const glowX = useSpring(cursorX, { damping: 25, stiffness: 100, mass: 0.5 });
  const glowY = useSpring(cursorY, { damping: 25, stiffness: 100, mass: 0.5 });

  useEffect(() => {
    // Only use custom cursor if device has a fine pointer (mouse)
    if (window.matchMedia && !window.matchMedia('(pointer: fine)').matches) {
      setHasMouse(false);
      return;
    }
    
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      
      // Batch CSS variable updates in requestAnimationFrame for better performance
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [cursorX, cursorY]);

  if (!hasMouse) return null;

  const variants = {
    default: {
      x: -12,
      y: -12,
      height: 24,
      width: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
      mixBlendMode: 'difference' as const,
      fontSize: '14px',
    },
    button: {
      x: -25,
      y: -25,
      height: 50,
      width: 50,
      backgroundColor: 'rgba(255, 255, 255, 1)',
      mixBlendMode: 'difference' as const,
      fontSize: '24px',
    },
    card: {
      x: -15,
      y: -15,
      height: 30,
      width: 30,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      mixBlendMode: 'difference' as const,
      fontSize: '18px',
    },
    input: {
      x: -2,
      y: -10,
      height: 20,
      width: 4,
      borderRadius: '2px',
      backgroundColor: 'rgba(255, 255, 255, 1)',
      mixBlendMode: 'difference' as const,
      fontSize: '0px',
    }
  };

  return (
    <>
      {/* Outer subtle glow */}
      <motion.div
        className="fixed top-0 left-0 w-[300px] h-[300px] rounded-full pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 70%)',
          x: glowX,
          y: glowY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
      {/* Inner precise cursor with $ */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999] flex items-center justify-center font-bold text-background leading-none select-none"
        style={{
          x: cursorX,
          y: cursorY,
        }}
      >
        <motion.div
          variants={variants}
          animate={cursorVariant}
          transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.5 }}
          className="rounded-full flex items-center justify-center"
        >
          {cursorVariant !== 'input' && <span>$</span>}
        </motion.div>
      </motion.div>
    </>
  );
}
