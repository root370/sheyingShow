'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronsLeftRight, ChevronsUpDown } from 'lucide-react';

interface ResizeHandleProps {
  initialSpacing?: number;
  onSpacingChange?: (newSpacing: number) => void;
  orientation?: 'horizontal' | 'vertical';
}

export function ResizeHandle({ initialSpacing = 64, onSpacingChange, orientation = 'horizontal' }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [spacing, setSpacing] = useState(initialSpacing);
  const startPosRef = useRef<number>(0);
  const startSpacingRef = useRef<number>(initialSpacing);

  useEffect(() => {
    setSpacing(initialSpacing);
  }, [initialSpacing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const currentPos = orientation === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      
      // Adjust sensitivity or range as needed
      const newSpacing = Math.max(16, Math.min(800, startSpacingRef.current + delta));
      
      setSpacing(newSpacing);
      if (onSpacingChange) onSpacingChange(newSpacing);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', (e) => {
          // Add basic touch support mapping
           const touch = e.touches[0];
           const currentPos = orientation === 'horizontal' ? touch.clientX : touch.clientY;
           const delta = currentPos - startPosRef.current;
           const newSpacing = Math.max(16, Math.min(800, startSpacingRef.current + delta));
           setSpacing(newSpacing);
           if (onSpacingChange) onSpacingChange(newSpacing);
      }, { passive: false });
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onSpacingChange, orientation]);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    startPosRef.current = orientation === 'horizontal' ? clientX : clientY;
    startSpacingRef.current = spacing;
    document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop propagation to prevent drag conflicts
    handleStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scroll
    e.stopPropagation();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const isVertical = orientation === 'vertical';

  return (
    <div 
        className={`relative flex items-center justify-center group select-none z-10 ${isVertical ? 'w-full' : 'h-full'}`}
        style={isVertical ? { height: `${spacing}px` } : { width: `${spacing}px` }}
    >
      {/* Visual Line (Visible on hover or drag) */}
      <div 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`
            flex items-center justify-center transition-all duration-300 rounded-full
            ${isVertical ? 'w-32 h-4 cursor-row-resize' : 'w-4 h-32 cursor-col-resize'}
            ${isDragging ? 'bg-white/20 scale-110' : 'hover:bg-white/10 opacity-0 group-hover:opacity-100'}
        `}
      >
        {isVertical ? (
            <ChevronsUpDown size={16} className={`text-white/80 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
        ) : (
            <ChevronsLeftRight size={16} className={`text-white/80 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
        )}
      </div>

      {/* Spacing Label (Visible on Drag) */}
      {isDragging && (
          <div className={`absolute bg-black text-white text-[10px] px-2 py-1 rounded font-mono z-50 pointer-events-none ${isVertical ? 'right-4 top-1/2 -translate-y-1/2' : '-top-8 left-1/2 -translate-x-1/2'}`}>
              {Math.round(spacing)}px
          </div>
      )}
      
      {/* Invisible broad hit area */}
      <div 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`absolute inset-0 ${isVertical ? 'cursor-row-resize' : 'cursor-col-resize'}`}
      />
    </div>
  );
}
