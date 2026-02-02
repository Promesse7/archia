/**
 * Archaeology-themed puzzle images
 * Replace these with your actual image paths in public/puzzles/
 */

export const puzzleImages = [
  {
    id: 1,
    name: "Ancient Pottery",
    src: "/puzzles/pottery_1.svg",
    difficulty: "easy",
    rows: 8,
    cols: 8,
    description: "Beautiful ancient pottery with intricate designs"
  },
  {
    id: 2,
    name: "Archaeological Site",
    src: "/puzzles/site_1.svg",
    difficulty: "medium",
    rows: 10,
    cols: 10,
    description: "Excavation site showing ancient ruins"
  },
  {
    id: 3,
    name: "Ancient Artifacts",
    src: "/puzzles/artifact_1.svg",
    difficulty: "medium",
    rows: 10,
    cols: 10,
    description: "Collection of ancient artifacts and relics"
  },
  {
    id: 4,
    name: "Pottery Sherds",
    src: "/puzzles/pottery_2.svg",
    difficulty: "hard",
    rows: 12,
    cols: 12,
    description: "Detailed view of pottery fragments"
  },
  {
    id: 5,
    name: "Temple Ruins",
    src: "/puzzles/site_2.svg",
    difficulty: "hard",
    rows: 12,
    cols: 12,
    description: "Ancient temple architecture"
  }
];

/**
 * Get puzzle by difficulty level
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {Array}
 */
export function getPuzzlesByDifficulty(difficulty) {
  return puzzleImages.filter(img => img.difficulty === difficulty);
}

/**
 * Get random puzzle
 * @returns {Object}
 */
export function getRandomPuzzle() {
  return puzzleImages[Math.floor(Math.random() * puzzleImages.length)];
}

/**
 * Get puzzle by ID
 * @param {number} id 
 * @returns {Object|undefined}
 */
export function getPuzzleById(id) {
  return puzzleImages.find(img => img.id === id);
}
