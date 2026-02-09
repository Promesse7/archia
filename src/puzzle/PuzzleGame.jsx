import { useState } from "react";
import PuzzleBoard from "./PuzzleBoard";
import { puzzleImages, getPuzzlesByDifficulty } from "./puzzleImages";

export default function PuzzleGame({ initialPuzzle, onBack }) {
  const [selectedPuzzle, setSelectedPuzzle] = useState(initialPuzzle || null);
  const [difficulty, setDifficulty] = useState("all");
  const [showCompletion, setShowCompletion] = useState(false);

  const handlePuzzleComplete = () => {
    setShowCompletion(true);
    setTimeout(() => setShowCompletion(false), 3000);
  };

  const handleSelectPuzzle = (puzzle) => {
    setSelectedPuzzle(puzzle);
    setShowCompletion(false);
  };

  const handleBackToGallery = () => {
    setSelectedPuzzle(null);
    if (onBack) {
      onBack();
    }
  };

  const filteredPuzzles = difficulty === "all"
    ? puzzleImages
    : getPuzzlesByDifficulty(difficulty);

  if (selectedPuzzle) {
    return (
      <div className="p-5 max-w-[1200px] mx-auto">
        <div className="flex flex-wrap items-center justify-between mb-7.5 gap-4">
          <div>
            <h2 className="m-0 mb-1.25 text-2xl text-charcoal-900 dark:text-charcoal-100">
              {selectedPuzzle.name}
            </h2>
            <p className="m-0 text-charcoal-600 dark:text-charcoal-400 text-sm">
              {selectedPuzzle.description}
            </p>
          </div>

          <button
            onClick={handleBackToGallery}
            className="px-5 py-2.5 bg-charcoal-600 dark:bg-charcoal-700 text-white rounded-md cursor-pointer text-base font-medium hover:bg-charcoal-700 dark:hover:bg-charcoal-800 transition-colors"
          >
            ← Back to Gallery
          </button>
        </div>

        {/* Puzzle Board */}
        <PuzzleBoard
          imageSrc={selectedPuzzle.src}
          rows={selectedPuzzle.rows}
          cols={selectedPuzzle.cols}
          onComplete={handlePuzzleComplete}
        />
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '36px',
          margin: '0 0 10px 0',
          color: '#111827'
        }}>
          🏺 Archaeology Puzzle Gallery
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          margin: 0
        }}>
          Explore ancient artifacts through interactive jigsaw puzzles
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2.5 mb-7.5">
        {["all", "easy", "medium", "hard"].map(level => (
          <button
            key={level}
            onClick={() => setDifficulty(level)}
            className={`px-5 py-2.5 rounded-full cursor-pointer text-sm font-medium capitalize transition-all duration-300 ${difficulty === level
                ? 'bg-clay-600 text-white'
                : 'bg-charcoal-200 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-300 dark:hover:bg-charcoal-600'
              }`}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 mb-10">
        {filteredPuzzles.map(puzzle => (
          <div
            key={puzzle.id}
            onClick={() => handleSelectPuzzle(puzzle)}
            className="bg-charcoal-100 dark:bg-charcoal-800 rounded-xl overflow-hidden shadow-soft cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lift border border-charcoal-200 dark:border-charcoal-700"
          >
            <div className="w-full h-50 bg-charcoal-200 dark:bg-charcoal-700 flex items-center justify-center overflow-hidden">
              <img
                src={puzzle.src}
                alt={puzzle.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="text-charcoal-500 dark:text-charcoal-400 text-5xl">🏺</div>';
                }}
              />
            </div>

            <div className="p-4">
              <h3 className="m-0 mb-2 text-lg text-charcoal-900 dark:text-charcoal-100">
                {puzzle.name}
              </h3>

              <p className="m-0 mb-3 text-sm text-charcoal-600 dark:text-charcoal-400 leading-relaxed">
                {puzzle.description}
              </p>

              <div className="flex justify-between items-center">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-clay text-white">
                  {puzzle.difficulty}
                </span>

                <span className="text-xs text-charcoal-600 dark:text-charcoal-400">
                  {puzzle.pieces} pieces
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredPuzzles.length === 0 && (
        <div className="text-center py-15 px-5 text-charcoal-600 dark:text-charcoal-400">
          <p className="text-lg">No puzzles found for this difficulty level</p>
        </div>
      )}

      <div className="bg-charcoal-100 dark:bg-charcoal-800 p-7.5 rounded-xl mt-10 border border-charcoal-200 dark:border-charcoal-700">
        <h3 className="m-0 mb-4 text-lg text-charcoal-900 dark:text-charcoal-100">
          How to Play
        </h3>
        <ul className="m-0 pl-5 text-charcoal-600 dark:text-charcoal-400 leading-relaxed">
          <li>Choose a difficulty level to filter puzzles</li>
          <li>Click on any puzzle to start playing</li>
          <li>Drag and drop pieces to reconstruct the artifact</li>
          <li>Use hints if you get stuck</li>
          <li>Complete the puzzle to see your time and score</li>
        </ul>
      </div>
    </div>
  );
}
