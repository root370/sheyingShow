'use client';

import { Fit } from '@rive-app/react-canvas';
import RiveAnimation from '@/components/RiveAnimation';

export default function RiveDemoPage() {
  const animations = [
    {
      name: 'Start Button',
      src: '/rive/8343-15997-start-button.riv',
      stateMachines: 'State Machine 1',
      className: 'w-[110%] h-[160%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
      fit: Fit.Cover,
    },
    {
      name: 'Test Responsive Guy',
      src: '/rive/10275-35738-test-responsive-guy.riv',
      stateMachines: 'State Machine 1',
    },
    {
      name: 'Camera Disassembly',
      src: '/rive/4482-9139-camera-dissasembly.riv',
    },
    {
      name: 'Bundled Photos',
      src: '/rive/8584-16428-bundled-photos.riv',
    },
    {
      name: 'Planet Douch',
      src: '/rive/17506-32816-planetdouch3.riv',
    },
    {
      name: 'Loading 1',
      src: '/rive/11081-21225-loading.riv',
    },
    {
      name: 'Dot Loading',
      src: '/rive/511-976-dot-loading-loaders.riv',
    },
    {
      name: 'Curate Button (Sci-Fi UI)',
      src: '/rive/curate-button.riv',
      stateMachines: 'State Machine 1',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Rive Animation Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {animations.map((anim) => (
          <div key={anim.src} className="flex flex-col items-center bg-gray-900 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">{anim.name}</h2>
            <div className="w-full h-64 bg-gray-800 rounded-md overflow-hidden relative">
              <RiveAnimation 
                src={anim.src} 
                className={(anim as any).className || "w-full h-full"}
                stateMachines={(anim as any).stateMachines}
                fit={(anim as any).fit}
              />
            </div>
            <p className="mt-4 text-sm text-gray-400 break-all">{anim.src}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
