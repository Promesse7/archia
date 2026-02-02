import React, { useState } from 'react';
import PuzzleGame from '../puzzle/PuzzleGame';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui';
import { getPuzzlesByDifficulty, getRandomPuzzle } from '../puzzle/puzzleImages';

export default function PuzzlePage({ onNavigate }) {
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);

  const puzzleModes = [
    {
      id: 'quick',
      title: 'Quick Puzzle',
      description: 'Practice with shorter puzzles (64 pieces)',
      difficulty: 'easy',
      time: '5-10 minutes',
      icon: '⚡'
    },
    {
      id: 'challenge',
      title: 'Timed Challenge',
      description: 'Test your skills with medium difficulty (100 pieces)',
      difficulty: 'medium',
      time: '15-20 minutes',
      icon: '⏱️'
    },
    {
      id: 'free',
      title: 'Free Play',
      description: 'Choose any puzzle and play at your own pace',
      difficulty: 'all',
      time: 'No limit',
      icon: '🎯'
    }
  ];

  const handleModeSelect = (mode) => {
    if (mode.id === 'free') {
      // For free play, show puzzle selection
      setSelectedMode('free');
    } else {
      // For quick/challenge, auto-select a random puzzle of that difficulty
      const puzzles = getPuzzlesByDifficulty(mode.difficulty);
      const randomPuzzle = puzzles.length > 0 ? puzzles[Math.floor(Math.random() * puzzles.length)] : getRandomPuzzle();
      setSelectedPuzzle(randomPuzzle);
      setSelectedMode(mode.id);
    }
  };

  const handlePuzzleSelect = (puzzle) => {
    setSelectedPuzzle(puzzle);
  };

  const handleBackToModes = () => {
    setSelectedMode(null);
    setSelectedPuzzle(null);
  };

  const handleBackToPuzzleSelection = () => {
    setSelectedPuzzle(null);
  };

  // If a puzzle is selected, show the game
  if (selectedPuzzle) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="p-4">
          <Button
            onClick={handleBackToModes}
            variant="ghost"
            className="mb-4"
          >
            ← Back to Puzzle Lab
          </Button>
        </div>
        <PuzzleGame 
          initialPuzzle={selectedPuzzle}
          onBack={handleBackToPuzzleSelection}
        />
      </div>
    );
  }

  // If free play mode is selected, show puzzle selection
  if (selectedMode === 'free') {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">
                Choose Your Puzzle
              </h1>
              <p className="text-zinc-400 text-lg mt-2">
                Select any puzzle to play at your own pace
              </p>
            </div>
            <Button
              onClick={handleBackToModes}
              variant="outline"
            >
              ← Back to Modes
            </Button>
          </div>

          {/* Puzzle Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getPuzzlesByDifficulty('easy').map(puzzle => (
              <Card 
                key={puzzle.id}
                className="group hover:border-amber-500 transition-all duration-300 cursor-pointer"
                onClick={() => handlePuzzleSelect(puzzle)}
              >
                <CardContent className="p-6">
                  <div className="aspect-video bg-zinc-800 rounded-lg mb-4 flex items-center justify-center">
                    <img 
                      src={puzzle.src} 
                      alt={puzzle.name}
                      className="max-w-full max-h-full object-contain rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden items-center justify-center text-zinc-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🏺</div>
                        <div className="text-sm">Image not found</div>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {puzzle.name}
                  </h3>
                  <p className="text-zinc-400 text-sm mb-4">
                    {puzzle.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-1 bg-green-500/20 border border-green-500 rounded text-xs text-green-500">
                      Easy
                    </span>
                    <span className="text-zinc-500 text-sm">
                      {puzzle.rows}×{puzzle.cols} pieces
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {getPuzzlesByDifficulty('medium').map(puzzle => (
              <Card 
                key={puzzle.id}
                className="group hover:border-amber-500 transition-all duration-300 cursor-pointer"
                onClick={() => handlePuzzleSelect(puzzle)}
              >
                <CardContent className="p-6">
                  <div className="aspect-video bg-zinc-800 rounded-lg mb-4 flex items-center justify-center">
                    <img 
                      src={puzzle.src} 
                      alt={puzzle.name}
                      className="max-w-full max-h-full object-contain rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden items-center justify-center text-zinc-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🏛️</div>
                        <div className="text-sm">Image not found</div>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {puzzle.name}
                  </h3>
                  <p className="text-zinc-400 text-sm mb-4">
                    {puzzle.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500 rounded text-xs text-yellow-500">
                      Medium
                    </span>
                    <span className="text-zinc-500 text-sm">
                      {puzzle.rows}×{puzzle.cols} pieces
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {getPuzzlesByDifficulty('hard').map(puzzle => (
              <Card 
                key={puzzle.id}
                className="group hover:border-amber-500 transition-all duration-300 cursor-pointer"
                onClick={() => handlePuzzleSelect(puzzle)}
              >
                <CardContent className="p-6">
                  <div className="aspect-video bg-zinc-800 rounded-lg mb-4 flex items-center justify-center">
                    <img 
                      src={puzzle.src} 
                      alt={puzzle.name}
                      className="max-w-full max-h-full object-contain rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden items-center justify-center text-zinc-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🔍</div>
                        <div className="text-sm">Image not found</div>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {puzzle.name}
                  </h3>
                  <p className="text-zinc-400 text-sm mb-4">
                    {puzzle.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-1 bg-red-500/20 border border-red-500 rounded text-xs text-red-500">
                      Hard
                    </span>
                    <span className="text-zinc-500 text-sm">
                      {puzzle.rows}×{puzzle.cols} pieces
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show mode selection (default view)
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
                  >
                    Start
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
