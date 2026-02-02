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
      <div style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h2 style={{ 
              margin: '0 0 5px 0',
              fontSize: '28px',
              color: '#333'
            }}>
              {selectedPuzzle.name}
            </h2>
            <p style={{ 
              margin: 0,
              color: '#666',
              fontSize: '14px'
            }}>
              {selectedPuzzle.description}
            </p>
          </div>
          
          <button
            onClick={handleBackToGallery}
            style={{
              padding: '10px 20px',
              backgroundColor: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
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
          color: '#333'
        }}>
          🏺 Archaeology Puzzle Gallery
        </h1>
        <p style={{ 
          fontSize: '18px',
          color: '#666',
          margin: 0
        }}>
          Explore ancient artifacts through interactive jigsaw puzzles
        </p>
      </div>

      {/* Difficulty Filter */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        {["all", "easy", "medium", "hard"].map(level => (
          <button
            key={level}
            onClick={() => setDifficulty(level)}
            style={{
              padding: '10px 20px',
              backgroundColor: difficulty === level ? '#2196f3' : '#e0e0e0',
              color: difficulty === level ? 'white' : '#333',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              textTransform: 'capitalize',
              transition: 'all 0.3s ease'
            }}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Puzzle Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '25px',
        marginBottom: '40px'
      }}>
        {filteredPuzzles.map(puzzle => (
          <div
            key={puzzle.id}
            onClick={() => handleSelectPuzzle(puzzle)}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              ':hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            {/* Image Preview */}
            <div style={{
              width: '100%',
              height: '200px',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img
                src={puzzle.src}
                alt={puzzle.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div style="color: #999; font-size: 48px;">🏺</div>';
                }}
              />
            </div>

            {/* Info */}
            <div style={{ padding: '15px' }}>
              <h3 style={{ 
                margin: '0 0 8px 0',
                fontSize: '18px',
                color: '#333'
              }}>
                {puzzle.name}
              </h3>
              
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                color: '#666',
                lineHeight: '1.4'
              }}>
                {puzzle.description}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: 
                    puzzle.difficulty === 'easy' ? '#4caf50' :
                    puzzle.difficulty === 'medium' ? '#ff9800' : '#f44336',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}>
                  {puzzle.difficulty}
                </span>

                <span style={{
                  fontSize: '13px',
                  color: '#999'
                }}>
                  {puzzle.rows} × {puzzle.cols} pieces
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPuzzles.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#999'
        }}>
          <p style={{ fontSize: '18px' }}>
            No puzzles found for this difficulty level
          </p>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '30px',
        borderRadius: '12px',
        marginTop: '40px'
      }}>
        <h3 style={{ 
          margin: '0 0 15px 0',
          fontSize: '20px',
          color: '#333'
        }}>
          How to Play
        </h3>
        <ul style={{
          margin: 0,
          paddingLeft: '20px',
          color: '#666',
          lineHeight: '1.8'
        }}>
          <li>Select a puzzle from the gallery above</li>
          <li>Drag and drop pieces to assemble the image</li>
          <li>Pieces will snap into place when positioned correctly</li>
          <li>Use the hint button to briefly see the complete image</li>
          <li>Track your progress with the completion percentage</li>
        </ul>
      </div>
    </div>
  );
}
