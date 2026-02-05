import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, SectionHeader } from '../components/ui';

// Icon components
const CameraIcon = () => (
  <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CubeIcon = () => (
  <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const PuzzleIcon = () => (
  <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
  </svg>
);

const actionCards = [
  {
    id: 'capture',
    title: 'Capture Fragment',
    description: 'Analyze pottery fragments with AI vision',
    icon: <CameraIcon />,
    path: '/capture'
  },
  {
    id: 'reconstruct',
    title: 'View Reconstruction',
    description: 'Explore reconstructed pottery in 3D',
    icon: <CubeIcon />,
    path: '/reconstruct'
  },
  {
    id: 'puzzle',
    title: 'Puzzle Lab',
    description: 'Learn archaeology through interactive puzzles',
    icon: <PuzzleIcon />,
    path: '/puzzle'
  }
];

export default function HomePage({ onNavigate, fragmentCount }) {
  const [visibleCards, setVisibleCards] = useState(new Set());

  // Stagger-in animation for cards
  useEffect(() => {
    const timers = [];
    
    actionCards.forEach((card, index) => {
      const timer = setTimeout(() => {
        setVisibleCards(prev => new Set(prev).add(card.id));
      }, index * 100);
      timers.push(timer);
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  const handleCardClick = (path) => {
    onNavigate(path.replace('/', ''));
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              ARCHIA
            </h1>
            <p className="text-2xl text-zinc-300 font-medium">
              Archaeological Intelligence Assistant
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <p className="text-zinc-400 text-lg leading-relaxed">
              Discover ancient pottery through AI-powered analysis and reconstruction. 
              Capture fragments, watch them come to life in 3D, and explore archaeological puzzles.
            </p>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {actionCards.map((card) => {
            const isVisible = visibleCards.has(card.id);
            
            return (
              <Card
                key={card.id}
                className={`
                  cursor-pointer transition-all duration-500 transform
                  ${isVisible 
                    ? 'opacity-100 translate-y-0 hover:scale-[1.02] hover:-translate-y-1' 
                    : 'opacity-0 translate-y-8'
                  }
                `}
                onClick={() => handleCardClick(card.path)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    {card.icon}
                  </div>
                  <CardTitle className="text-xl text-white">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="text-center space-y-6">
                  <p className="text-zinc-400 leading-relaxed">
                    {card.description}
                  </p>
                  
                  <Button 
                    variant="primary" 
                    size="lg"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(card.path);
                    }}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        {fragmentCount > 0 && (
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-full border border-zinc-700/50">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-zinc-300 text-sm">
                {fragmentCount} fragment{fragmentCount !== 1 ? 's' : ''} captured
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
