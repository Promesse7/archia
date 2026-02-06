import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, SectionHeader } from '../components/ui';

// Icon components
const PuzzleIcon = () => (
  <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 012.212 2.212 3.42 3.42 0 01.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 01-.806 1.946 3.42 3.42 0 01-2.212 2.212 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-2.212-2.212 3.42 3.42 0 01-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 01.806-1.946 3.42 3.42 0 012.212-2.212z" />
  </svg>
);

const LightbulbIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ResetIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const puzzleModes = [
  {
    id: 'quick',
    title: 'Quick Puzzle',
    description: 'Practice with simple fragment reconstruction puzzles',
    difficulty: 'Beginner',
    pieces: 9,
    timeEstimate: '5-10 min',
    icon: '🧩'
  },
  {
    id: 'timed',
    title: 'Timed Challenge',
    description: 'Test your skills against the clock with complex puzzles',
    difficulty: 'Advanced',
    pieces: 16,
    timeEstimate: '10-15 min',
    icon: '⏱️'
  },
  {
    id: 'free',
    title: 'Free Play',
    description: 'Explore puzzles at your own pace with no pressure',
    difficulty: 'All Levels',
    pieces: 'Variable',
    timeEstimate: 'No limit',
    icon: '🎯'
  }
];

export default function PuzzlePage({ onNavigate }) {
  const [gameMode, setGameMode] = useState(null);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'completed'
  const [puzzleData, setPuzzleData] = useState(null);
  const [placedPieces, setPlacedPieces] = useState(0);
  const [totalPieces, setTotalPieces] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [insights, setInsights] = useState([]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning && gameMode === 'timed') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, gameMode]);

  const startPuzzle = useCallback((mode) => {
    setGameMode(mode);
    setGameState('playing');
    
    // Initialize puzzle based on mode
    const modeConfig = puzzleModes.find(m => m.id === mode);
    setTotalPieces(modeConfig.pieces);
    setPlacedPieces(0);
    setTimer(0);
    setIsTimerRunning(mode === 'timed');
    setShowHint(false);
    
    // Generate puzzle data (simplified for demo)
    setPuzzleData({
      pieces: Array.from({ length: modeConfig.pieces }, (_, i) => ({
        id: i,
        correctPosition: i,
        currentPosition: Math.floor(Math.random() * modeConfig.pieces),
        isPlaced: false
      }))
    });
  }, []);

  const handlePiecePlacement = useCallback((pieceId) => {
    if (!puzzleData) return;
    
    setPuzzleData(prev => {
      const newPieces = prev.pieces.map(piece => {
        if (piece.id === pieceId) {
          const isCorrect = piece.currentPosition === piece.correctPosition;
          return {
            ...piece,
            isPlaced: isCorrect,
            currentPosition: isCorrect ? piece.correctPosition : piece.currentPosition
          };
        }
        return piece;
      });
      
      const placedCount = newPieces.filter(p => p.isPlaced).length;
      setPlacedPieces(placedCount);
      
      // Check for completion
      if (placedCount === totalPieces) {
        setGameState('completed');
        setIsTimerRunning(false);
        generateInsights(gameMode);
      }
      
      return { pieces: newPieces };
    });
  }, [puzzleData, totalPieces, gameMode]);

  const generateInsights = useCallback((mode) => {
    const insights = [];
    
    if (mode === 'quick') {
      insights.push('Great job! You\'ve mastered the basics of fragment reconstruction.');
      insights.push('Quick puzzles help develop spatial recognition skills.');
    } else if (mode === 'timed') {
      insights.push(`Excellent time management! You completed this in ${formatTime(timer)}.`);
      insights.push('Timed challenges improve pattern recognition under pressure.');
    } else {
      insights.push('Free play allows for deep exploration of reconstruction techniques.');
      insights.push('Take your time to understand each fragment\'s unique characteristics.');
    }
    
    setInsights(insights);
  }, [mode, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetPuzzle = useCallback(() => {
    setGameState('menu');
    setGameMode(null);
    setPuzzleData(null);
    setPlacedPieces(0);
    setTimer(0);
    setIsTimerRunning(false);
    setShowHint(false);
    setInsights([]);
  }, []);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'success';
      case 'Advanced': return 'warning';
      case 'All Levels': return 'info';
      default: return 'neutral';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-800 px-6 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Section Header */}
        <SectionHeader
          title="Puzzle Lab"
          subtitle="Train your eye by reconstructing archaeological fragments through interactive puzzles"
        />

        {/* Menu State */}
        {gameState === 'menu' && (
          <div className="grid md:grid-cols-3 gap-6">
            {puzzleModes.map((mode) => (
              <Card
                key={mode.id}
                className="cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 border-zinc-700/50 hover:border-amber-500/30"
                onClick={() => startPuzzle(mode.id)}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className="text-4xl">{mode.icon}</div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">
                      {mode.title}
                    </h3>
                    
                    <Badge variant={getDifficultyColor(mode.difficulty)} size="sm">
                      {mode.difficulty}
                    </Badge>
                  </div>
                  
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {mode.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Pieces:</span>
                      <span className="text-white font-medium">{mode.pieces}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Est. Time:</span>
                      <span className="text-white font-medium">{mode.timeEstimate}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    Start Puzzle
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Playing State */}
        {gameState === 'playing' && puzzleData && (
          <div className="space-y-6">
            {/* Game Header */}
            <Card className="bg-zinc-700/50 border-zinc-600/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-white">
                      <span className="font-medium">
                        {puzzleModes.find(m => m.id === gameMode)?.title}
                      </span>
                      <div className="text-sm text-zinc-400 mt-1">
                        Progress: {placedPieces} / {totalPieces} pieces
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-48 h-2 bg-zinc-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
                        style={{ width: `${(placedPieces / totalPieces) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Timer for timed mode */}
                    {gameMode === 'timed' && (
                      <div className="flex items-center gap-2 text-white">
                        <ClockIcon />
                        <span className="font-mono">{formatTime(timer)}</span>
                      </div>
                    )}
                    
                    {/* Controls */}
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowHint(!showHint)}
                        className="flex items-center gap-2"
                      >
                        <LightbulbIcon />
                        Hint
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetPuzzle}
                        className="flex items-center gap-2"
                      >
                        <ResetIcon />
                        Reset
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetPuzzle}
                      >
                        Exit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Puzzle Board */}
            <Card className="bg-zinc-700/30 border-zinc-600/30">
              <CardContent className="p-8">
                <div className="aspect-square max-w-2xl mx-auto">
                  {/* Simplified puzzle grid for demo */}
                  <div 
                    className={`
                      grid gap-2 w-full h-full
                      ${totalPieces === 9 ? 'grid-cols-3' : 'grid-cols-4'}
                    `}
                  >
                    {Array.from({ length: totalPieces }, (_, index) => {
                      const piece = puzzleData.pieces.find(p => p.correctPosition === index);
                      const isPlaced = piece?.isPlaced;
                      
                      return (
                        <div
                          key={index}
                          onClick={() => piece && !isPlaced && handlePiecePlacement(piece.id)}
                          className={`
                            border-2 rounded-lg flex items-center justify-center text-2xl font-bold
                            transition-all duration-300 cursor-pointer
                            ${isPlaced 
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                              : 'bg-zinc-800/50 border-zinc-600 text-zinc-400 hover:border-amber-500/50 hover:bg-zinc-700/50'
                            }
                          `}
                        >
                          {isPlaced ? piece?.id + 1 : '?'}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Hint Display */}
                {showHint && (
                  <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <LightbulbIcon className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-zinc-300 text-sm">
                        <p className="font-medium mb-1">Archaeological Insight:</p>
                        <p>
                          Look for patterns in the fragment edges. Pottery fragments often have distinctive 
                          break patterns that can help you identify how they fit together.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Completed State */}
        {gameState === 'completed' && (
          <Card className="bg-zinc-700/50 border-zinc-600/50">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <TrophyIcon className="w-16 h-16 text-amber-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  Puzzle Complete!
                </h3>
                <p className="text-zinc-400">
                  You successfully reconstructed the pottery fragment
                </p>
              </div>
              
              {/* Stats */}
              <div className="flex justify-center gap-8">
                {gameMode === 'timed' && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">
                      {formatTime(timer)}
                    </div>
                    <div className="text-sm text-zinc-500">Final Time</div>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">
                    {totalPieces}
                  </div>
                  <div className="text-sm text-zinc-500">Pieces Placed</div>
                </div>
              </div>
              
              {/* Insights */}
              {insights.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-white">Archaeological Insights</h4>
                  <div className="space-y-2">
                    {insights.map((insight, index) => (
                      <div key={index} className="p-3 bg-zinc-800/50 rounded-lg text-zinc-300 text-sm">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-center gap-4">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => startPuzzle(gameMode)}
                >
                  Play Again
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={resetPuzzle}
                >
                  Back to Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
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
