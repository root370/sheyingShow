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
        fixed top-8 right-8 z-50 
        text-white font-serif tracking-[0.1em] text-base
        transition-all duration-300 active:opacity-70
        disabled:opacity-30 disabled:cursor-not-allowed
        ${status === 'published' ? 'text-green-400' : ''}
      `}
    >
      {status === 'idle' && '发布'}
      {status === 'developing' && '正在显影...'}
      {status === 'published' && '发布成功'}
    </button>
  );
}
