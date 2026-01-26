'use client';

import React, { useState, useRef, useEffect } from 'react';

interface EditableTextProps {
  initialValue: string;
  className?: string;
  placeholder?: string;
  onSave?: (value: string) => void;
}

export function EditableText({ initialValue, className = '', placeholder = 'Type here...', onSave }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Update local state when initialValue prop changes (e.g. async data load)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    setIsEditing(false);
    if (onSave) onSave(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (onSave) onSave(value);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
        className={`bg-transparent border-b border-gray-400 outline-none w-full text-center ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div 
        onClick={() => setIsEditing(true)} 
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking to edit
        className={`cursor-text hover:bg-gray-100/50 rounded px-1 transition-colors ${className}`}
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </div>
  );
}
