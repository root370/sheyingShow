'use client';

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface EditableTextHandle {
  focus: () => void;
  shake: () => void;
}

interface EditableTextProps {
  initialValue: string;
  className?: string;
  placeholder?: string;
  onSave?: (value: string) => void;
}

export const EditableText = forwardRef<EditableTextHandle, EditableTextProps>(({ initialValue, className = '', placeholder = '点击输入...', onSave }, ref) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      setIsEditing(true);
      // Wait for render
      setTimeout(() => {
          inputRef.current?.focus();
      }, 0);
    },
    shake: () => {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  }));

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

  const shakeClass = isShaking ? 'animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]' : '';

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
        className={`bg-transparent border-b border-gray-400 outline-none w-full text-center select-text ${className} ${shakeClass}`}
        style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div 
        onClick={() => setIsEditing(true)} 
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking to edit
        className={`cursor-text hover:bg-gray-100/50 rounded px-1 transition-colors ${className} ${shakeClass}`}
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </div>
  );
});

EditableText.displayName = 'EditableText';
