import React, { useState, useEffect } from 'react';
import { Blurhash } from 'react-blurhash';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCardProps {
  src: string;
  alt: string;
  blurhash?: string;
  aspectRatio?: 'landscape' | 'portrait' | 'square';
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

  // If src changes, reset loaded state
  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio: ASPECT_RATIOS[aspectRatio],
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
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
        }}
      />
    </div>
  );
}
