export interface Annotation {
  id: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  text: string;
  user_id?: string;
  username?: string;
}

export interface Photo {
  id: string;
  src: string;
  alt: string;
  caption: string;
  title?: string;
  year?: string;
  aspectRatio: 'landscape' | 'portrait' | 'square';
  color: string; // Dominant color for the spotlight
  annotations: Annotation[];
  exif?: {
    ISO?: number;
    FNumber?: number;
    Model?: string;
    ExposureTime?: number;
    FocalLength?: number;
    MeteringMode?: string;
  };
}

export const photos: Photo[] = [
  {
    id: '1',
    src: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=1000",
    alt: "Black and white street photography",
    caption: "LEICA M10 · 35MM",
    aspectRatio: "landscape",
    color: "#4a4a4a",
    annotations: [
      { id: 'a1', x: 30, y: 40, text: "Excellent contrast balance here." },
      { id: 'a2', x: 75, y: 60, text: "Notice the leading lines." }
    ]
  },
  {
    id: '2',
    src: "https://images.unsplash.com/photo-1531804055935-76f44d7c3621?auto=format&fit=crop&q=80&w=1000",
    alt: "Minimalist architecture",
    caption: "HASSELBLAD 500C · 80MM",
    aspectRatio: "portrait",
    color: "#8c7b75",
    annotations: [
      { id: 'b1', x: 50, y: 20, text: "The negative space is powerful." }
    ]
  },
  {
    id: '3',
    src: "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?auto=format&fit=crop&q=80&w=1000",
    alt: "Car window reflection",
    caption: "FUJIFILM GFX · 63MM",
    aspectRatio: "square",
    color: "#2c3e50",
    annotations: [
      { id: 'c1', x: 20, y: 80, text: "Reflections create a dual reality." },
      { id: 'c2', x: 80, y: 20, text: "Soft light diffusion." }
    ]
  },
  {
    id: '4',
    src: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&q=80&w=1000",
    alt: "Colorful abstract",
    caption: "SONY A7RIV · 50MM",
    aspectRatio: "landscape",
    color: "#c0392b",
    annotations: [
      { id: 'd1', x: 50, y: 50, text: "Vibrant saturation." }
    ]
  },
  {
    id: '5',
    src: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000",
    alt: "Camera lens close up",
    caption: "CANON AE-1 · 50MM",
    aspectRatio: "square",
    color: "#f39c12",
    annotations: []
  },
  {
    id: '6',
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1000",
    alt: "Foggy forest",
    caption: "NIKON F3 · 28MM",
    aspectRatio: "portrait",
    color: "#27ae60",
    annotations: [
      { id: 'f1', x: 40, y: 30, text: "Atmospheric depth." }
    ]
  }
];
