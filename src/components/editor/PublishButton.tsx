'use client';

import React, { useState } from 'react';
import RiveAnimation from '@/components/RiveAnimation';

interface PublishButtonProps {
  onPublish: () => Promise<void>;
  isPublishing: boolean;
}

export function PublishButton({ onPublish, isPublishing }: PublishButtonProps) {
  const [status, setStatus] = useState<'idle' | 'developing' | 'published'>('idle');

  // Sync internal status with prop
  React.useEffect(() => {
    if (isPublishing) {
        setStatus('developing');
    } else if (status === 'developing') {
        // If we were developing and now we're not, it means we finished
        setStatus('published');
        setTimeout(() => setStatus('idle'), 3000);
    }
  }, [isPublishing]);

  const handleClick = async () => {
    if (status !== 'idle') return;
    await onPublish();
  };

  return (
    <button
      onClick={handleClick}
      disabled={status === 'developing' || isPublishing}
      className={`
        fixed top-8 right-8 z-50 px-6 py-3 
        bg-white text-black font-serif font-bold tracking-[0.2em] text-xs uppercase
        transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95
        disabled:opacity-80 disabled:cursor-wait
        ${status === 'published' ? 'bg-green-500 text-white' : ''}
      `}
    >
      {status === 'idle' && 'PUBLISH'}
      {status === 'developing' && 'DEVELOPING...'}
      {status === 'published' && 'PUBLISHED'}
    </button>
  );
}
