'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

interface ResizeHandleProps {
  initialSpacing?: number;
  onSpacingChange?: (newSpacing: number) => void;
}

export function ResizeHandle({ initialSpacing = 64, onSpacingChange }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [spacing, setSpacing] = useState(initialSpacing);
  const startXRef = useRef<number>(0);
  const startSpacingRef = useRef<number>(initialSpacing);

  useEffect(() => {
    setSpacing(initialSpacing);
  }, [initialSpacing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startXRef.current;
      // Adjust sensitivity or range as needed
      // Assuming dragging right increases spacing
      const newSpacing = Math.max(16, Math.min(800, startSpacingRef.current + deltaX));
      
      setSpacing(newSpacing);
      if (onSpacingChange) onSpacingChange(newSpacing);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onSpacingChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startSpacingRef.current = spacing;
    document.body.style.cursor = 'col-resize';
  };

  return (
    <div 
        className="relative flex items-center justify-center group h-full select-none z-10"
        style={{ width: `${spacing}px` }}
    >
      {/* Visual Line (Visible on hover or drag) */}
      <div 
        onMouseDown={handleMouseDown}
        className={`w-4 h-32 flex items-center justify-center cursor-col-resize transition-all duration-300 rounded-full ${isDragging ? 'bg-white/20 scale-110' : 'hover:bg-white/10 opacity-0 group-hover:opacity-100'}`}
      >
        <ChevronsLeftRight size={16} className={`text-white/80 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
      </div>

      {/* Spacing Label (Visible on Drag) */}
      {isDragging && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded font-mono">
              {Math.round(spacing)}px
          </div>
      )}
      
      {/* Invisible broad hit area */}
      <div 
        onMouseDown={handleMouseDown}
        className="absolute inset-0 cursor-col-resize"
      />
    </div>
  );
}
