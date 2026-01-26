'use client';

import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { useEffect, useState } from 'react';

interface RiveAnimationProps {
  src: string;
  artboard?: string;
  animations?: string | string[];
  stateMachines?: string | string[];
  autoplay?: boolean;
  className?: string;
  fit?: Fit;
  alignment?: Alignment;
}

export default function RiveAnimation({
  src,
  artboard,
  animations,
  stateMachines,
  autoplay = true,
  className = "w-full h-full",
  fit = Fit.Contain,
  alignment = Alignment.Center,
}: RiveAnimationProps) {
  // Use state to ensure client-side rendering for canvas
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { RiveComponent } = useRive({
    src,
    artboard,
    animations,
    stateMachines,
    autoplay,
    layout: new Layout({
      fit,
      alignment,
    }),
  });

  if (!isMounted) {
    return <div className={className} />;
  }

  return <RiveComponent className={className} />;
}
