import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui';

export default function PuzzlePage({ onNavigate }) {
  const [selectedMode, setSelectedMode] = useState(null);

  const puzzleModes = [
    {
      id: 'quick',
      title: 'Quick Puzzle',
      description: 'Practice with shorter puzzles (50-75 pieces)',
      difficulty: 'Beginner',
      time: '5-10 minutes',
      icon: '⚡'
    },
    {
      id: 'challenge',
      title: 'Timed Challenge',
      description: 'Test your skills against the clock (100-150 pieces)',
      difficulty: 'Intermediate',
      time: '15-20 minutes',
      icon: '⏱️'
    },
    {
      id: 'free',
      title: 'Free Play',
      description: 'No time pressure, focus on learning patterns',
      difficulty: 'All Levels',
      time: 'No limit',
      icon: '🎯'
    }
  ];

  const handleModeSelect = (mode) => {
    setSelectedMode(mode.id);
    // In a full implementation, this would load the puzzle game
    console.log(`Starting ${mode.title} mode`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Page header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Puzzle Lab
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Train your eye by reconstructing archaeological fragments. 
            Learn to recognize patterns and shapes found in real pottery.
          </p>
        </div>

        {/* Educational context */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="text-6xl">🧩</div>
              <h3 className="text-2xl font-bold text-white">
                Why Puzzle Training?
              </h3>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Archaeological reconstruction requires pattern recognition skills. 
                These puzzles help you develop an intuitive understanding of how 
                pottery fragments fit together, making real reconstruction work more effective.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Puzzle mode selection */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Choose Your Challenge
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {puzzleModes.map((mode) => (
              <Card 
                key={mode.id}
                className="group hover:border-amber-500 transition-all duration-300 cursor-pointer"
                onClick={() => handleModeSelect(mode)}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className="text-5xl">{mode.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {mode.title}
                    </h3>
                    <p className="text-zinc-400 text-sm mb-4">
                      {mode.description}
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Difficulty:</span>
                      <span className="text-amber-500 font-medium">{mode.difficulty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Time:</span>
                      <span className="text-amber-500 font-medium">{mode.time}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    variant={selectedMode === mode.id ? "default" : "outline"}
                  >
                    {selectedMode === mode.id ? 'Selected' : 'Start'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Puzzle features */}
        <Card>
          <CardHeader>
            <CardTitle>What You'll Learn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-amber-500">Pattern Recognition</h4>
                <ul className="space-y-2 text-zinc-400">
                  <li>• Identify fragment edge patterns</li>
                  <li>• Recognize curvature and shape cues</li>
                  <li>• Match texture and color variations</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-amber-500">Reconstruction Skills</h4>
                <ul className="space-y-2 text-zinc-400">
                  <li>• Visualize complete pottery shapes</li>
                  <li>• Understand fragment relationships</li>
                  <li>• Develop spatial reasoning</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming soon notice */}
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-amber-500 text-lg font-medium mb-2">
              🚧 Coming Soon
            </div>
            <p className="text-zinc-400">
              The puzzle game is currently in development. Check back soon for interactive challenges!
            </p>
          </CardContent>
        </Card>

        {/* Navigation hint */}
        <div className="text-center">
          <Button
            onClick={() => onNavigate('home')}
            variant="ghost"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
