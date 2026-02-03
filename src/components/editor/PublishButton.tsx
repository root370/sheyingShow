'use client';

import React, { useState } from 'react';
import StarBorder from '@/components/StarBorder/StarBorder';
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

  if (status === 'idle') {
    return (
      <div className="fixed top-8 right-8 z-50">
        <StarBorder
          as="button"
          onClick={handleClick}
          color="#FF2E63"
          speed="3s"
          className="cursor-pointer transition-opacity duration-300 hover:opacity-90 active:scale-95"
        >
          <span className="font-serif tracking-[0.1em] text-base text-white px-4">
            发布
          </span>
        </StarBorder>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === 'developing' || isPublishing}
      className={`
        fixed top-8 right-8 z-50 
        text-white font-serif tracking-[0.1em] text-base
        transition-all duration-300
        disabled:opacity-30 disabled:cursor-not-allowed
        ${status === 'published' ? 'text-green-400' : ''}
      `}
    >
      {status === 'developing' && '正在显影...'}
      {status === 'published' && '发布成功'}
    </button>
  );
}
