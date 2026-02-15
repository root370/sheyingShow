
'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface MasonryGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: {
    default: number;
    lg?: number;
    md?: number;
    sm?: number;
  };
  gap?: number;
}

export default function MasonryGrid<T>({ 
  items, 
  renderItem, 
  columns = { default: 4, lg: 4, md: 3, sm: 2 },
  gap = 24
}: MasonryGridProps<T>) {
  const [columnCount, setColumnCount] = useState(2); // Default to mobile to match SSR roughly or avoid flash

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setColumnCount(columns.sm || 2);
      } else if (width < 1024) {
        setColumnCount(columns.md || 3);
      } else {
        setColumnCount(columns.lg || columns.default || 4);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [columns]);

  const columnItems = useMemo(() => {
    // If columnCount is not set yet (SSR), render everything in first column or just wait?
    // Better to distribute even if hydration mismatch to avoid content hidden
    const safeCols = Math.max(1, columnCount);
    const cols: T[][] = Array.from({ length: safeCols }, () => []);
    items.forEach((item, i) => {
      cols[i % safeCols].push(item);
    });
    return cols;
  }, [items, columnCount]);

  // Force Hydration Fix: Use a state to track if mounted to avoid mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
      setMounted(true);
  }, []);

  // Use a stable default for SSR (e.g., 1 column or 2)
  // But wait for mount to apply responsive columns to avoid layout shift?
  // No, we want content visible ASAP. 
  // Strategy: Render with default columns, then adjust.
  
  if (!mounted) {
      // Server-side / Initial render: Render as simple grid or single column?
      // Let's render a simple responsive grid instead of Masonry for SSR
      // This ensures content is visible and searchable by bots, then JS takes over.
      // Actually, let's just use a reasonable default like 2 columns or 4.
      // But we can't know window width on server.
      // Return null or loading? NO, bad for SEO.
      // Return a simple stacked layout?
      return (
         <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 w-full opacity-0">
             {items.map((item, i) => (
                 <div key={i}>{renderItem(item, i)}</div>
             ))}
         </div>
      );
  }

  return (
    <div 
      className="flex w-full" 
      style={{ gap: `${gap}px` }}
    >
      {columnItems.map((col, colIndex) => (
        <div 
          key={colIndex} 
          className="flex flex-col flex-1"
          style={{ gap: `${gap}px` }}
        >
          {col.map((item, itemIndex) => {
            // Calculate original index if needed, but renderItem usually just needs the item
            // Original index = itemIndex * columnCount + colIndex
            const originalIndex = itemIndex * columnCount + colIndex;
            return (
              <div key={colIndex + '-' + itemIndex}>
                {renderItem(item, originalIndex)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
