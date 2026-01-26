export interface Exhibition {
  id: string;
  title: string;
  cover: string;
  year: string;
  photoCount: number;
  description: string;
  top: string;
  left: string;
  rotate: string;
  borderRadius: string;
}

export const exhibitions: Exhibition[] = [
  {
    id: "1",
    title: "TOKYO NOIR",
    cover: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1988&auto=format&fit=crop",
    year: "2024",
    photoCount: 12,
    description: "Shadows and neon in the electric city.",
    top: "10%",
    left: "5%",
    rotate: "-3deg",
    borderRadius: "12% 58% 18% 46% / 46% 16% 52% 14%" // More extreme organic shape
  },
  {
    id: "2",
    title: "DESERT WINDS",
    cover: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=2070&auto=format&fit=crop",
    year: "2023",
    photoCount: 8,
    description: "Silence in the shifting sands.",
    top: "40%",
    left: "30%",
    rotate: "2deg",
    borderRadius: "61% 17% 43% 18% / 22% 51% 15% 58%" // More extreme organic shape
  },
  {
    id: "3",
    title: "HIGHLANDS",
    cover: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop",
    year: "2022",
    photoCount: 15,
    description: "The winding roads of memory.",
    top: "15%",
    left: "60%",
    rotate: "5deg",
    borderRadius: "28% 54% 19% 48% / 35% 22% 55% 18%" // More extreme organic shape
  }
];
