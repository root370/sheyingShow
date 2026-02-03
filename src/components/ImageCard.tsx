import React, { useState, useEffect } from 'react';
import { Blurhash } from 'react-blurhash';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCardProps {
  src: string;
  alt: string;
  blurhash?: string;
  aspectRatio?: 'landscape' | 'portrait' | 'square' | 'auto';
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  draggable?: boolean;
  onClick?: () => void;
}

const ASPECT_RATIOS = {
  landscape: '3/2',
  portrait: '2/3',
  square: '1/1',
};

export default function ImageCard({
  src,
  alt,
  blurhash,
  aspectRatio = 'landscape',
  className = '',
  style = {},
  loading = 'lazy',
  draggable = false,
  onClick,
}: ImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [naturalRatio, setNaturalRatio] = useState<string | undefined>(undefined);

  // If src changes, reset loaded state
  useEffect(() => {
    setIsLoaded(false);
    setNaturalRatio(undefined);
  }, [src]);

  // Handle image load to detect natural aspect ratio if we want to support 'auto'
  // But currently we enforce aspect ratio via prop.
  // The 'auto' support can be tricky with Masonry or rigid layouts.
  // Let's stick to prop, but if prop is missing, we could try to be smart.
  
  const isAuto = aspectRatio === 'auto';
  const computedAspectRatio = isAuto ? undefined : (ASPECT_RATIOS[aspectRatio as keyof typeof ASPECT_RATIOS] || ASPECT_RATIOS.landscape);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        // If aspectRatio is 'auto', we rely on the image itself, but here we force it.
        // If the prop passed is valid key, use it. Otherwise default to landscape.
        aspectRatio: computedAspectRatio,
        ...style,
      }}
      onClick={onClick}
    >
      {/* BlurHash Placeholder */}
      <AnimatePresence>
        {blurhash && !isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0 z-0"
          >
            <Blurhash
              hash={blurhash}
              width="100%"
              height="100%"
              resolutionX={32}
              resolutionY={32}
              punch={1}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real Image */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        draggable={draggable}
        onLoad={() => setIsLoaded(true)}
        className={`block w-full h-full object-contain transition-opacity duration-700 ease-in-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
            // Ensure image fits within the aspect ratio container
            // Use absolute positioning to overlap correctly if needed, 
            // but for simple stacking, we might want absolute for one or both.
            // Since we use aspect-ratio on parent, img should just fill it.
            // FIX: If auto mode, we want the image to dictate height, so use relative positioning.
            position: isAuto ? 'relative' : 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: isAuto ? 'auto' : '100%'
        }}
      />
    </div>
  );
}
