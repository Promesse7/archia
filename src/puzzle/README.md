# Archaeology Puzzle Module

A complete 2D jigsaw puzzle game module for your Archia React Vite project.

## 📁 Files Included

```
puzzle/
├── PuzzleGame.jsx        # Main component with puzzle gallery
├── PuzzleBoard.jsx       # Game board with progress tracking
├── PuzzlePiece.jsx       # Individual draggable puzzle piece
├── puzzleImages.js       # Image configuration and utilities
└── puzzleUtils.js        # Core puzzle logic (slicing, snapping)
```

## 🚀 Installation

### 1. Copy the puzzle folder to your project

```bash
cp -r puzzle/ your-project/src/
```

### 2. Create the public/puzzles directory

```bash
mkdir -p your-project/public/puzzles
```

### 3. Add puzzle images

Place your archaeology-themed images in `public/puzzles/`:

```
public/puzzles/
├── pottery_1.jpg
├── pottery_2.jpg
├── site_1.jpg
├── site_2.jpg
└── artifact_1.jpg
```

**Image recommendations:**
- Size: 800x600 to 1200x900 pixels
- Format: JPG or PNG
- Clear, high-contrast images work best
- Archaeological themes: pottery, sites, artifacts, ruins

### 4. Integrate into your App.jsx

**Option A: Add as a new mode (recommended)**

```jsx
import { useState } from 'react';
import PuzzleGame from './puzzle/PuzzleGame';

function App() {
  const [mode, setMode] = useState('home'); // 'home' | 'puzzle' | 'scan'

  return (
    <div className="App">
      {/* Navigation */}
      <nav>
        <button onClick={() => setMode('home')}>Home</button>
        <button onClick={() => setMode('puzzle')}>Puzzle Game</button>
        <button onClick={() => setMode('scan')}>Scan Mode</button>
      </nav>

      {/* Render based on mode */}
      {mode === 'home' && <HomePage />}
      {mode === 'puzzle' && <PuzzleGame />}
      {mode === 'scan' && <ScanMode />}
    </div>
  );
}
```

**Option B: Add as a route (if using React Router)**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PuzzleGame from './puzzle/PuzzleGame';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/puzzle" element={<PuzzleGame />} />
        <Route path="/scan" element={<ScanMode />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 🎮 Features

### Current Features
- ✅ Drag and drop puzzle pieces
- ✅ Automatic snap-to-grid when close to correct position
- ✅ Progress tracking (percentage completion)
- ✅ Multiple difficulty levels (easy, medium, hard)
- ✅ Hint system (briefly shows complete image)
- ✅ Reset puzzle functionality
- ✅ Touch support for mobile devices
- ✅ Puzzle gallery with filtering
- ✅ Completion celebration animation

### Difficulty Levels
- **Easy**: 8×8 = 64 pieces
- **Medium**: 10×10 = 100 pieces
- **Hard**: 12×12 = 144 pieces

## 📝 Customization

### Adding New Puzzles

Edit `puzzle/puzzleImages.js`:

```js
export const puzzleImages = [
  {
    id: 1,
    name: "Your Puzzle Name",
    src: "/puzzles/your-image.jpg",
    difficulty: "medium", // 'easy', 'medium', or 'hard'
    rows: 10,
    cols: 10,
    description: "Description of the puzzle"
  },
  // Add more puzzles...
];
```

### Adjusting Difficulty

Modify the `rows` and `cols` values:
- Small (easy): 6×6 to 8×8
- Medium: 10×10 to 12×12
- Large (hard): 12×12 to 15×15

### Changing Snap Sensitivity

In `PuzzleBoard.jsx`, adjust the snap threshold:

```jsx
<PuzzlePiece
  snapThreshold={20}  // Lower = harder to snap, Higher = easier
  // ...
/>
```

### Styling

All styling is inline for easy copying. To customize:

1. Extract styles to CSS modules or styled-components
2. Modify colors, sizes, and animations in each component
3. Update the color scheme to match your Archia branding

## 🔧 Dependencies

This module uses only React (no additional dependencies required):
- React 18+ (useState, useEffect, useRef)
- No external puzzle libraries needed
- Pure JavaScript for game logic

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (touch support included)

## 🎯 Usage Example

```jsx
import PuzzleGame from './puzzle/PuzzleGame';

// Simple usage
function App() {
  return <PuzzleGame />;
}

// With callback
function App() {
  return (
    <PuzzleGame 
      onPuzzleComplete={() => console.log('Puzzle completed!')}
    />
  );
}
```

## 🚦 Performance Notes

- Images are automatically resized to fit the board (max 800×600)
- Puzzle pieces use Canvas for efficient rendering
- Touch events properly handled to prevent scrolling
- Drag operations use requestAnimationFrame for smoothness

## 📐 Architecture

```
PuzzleGame (Gallery & Selection)
    └── PuzzleBoard (Game Container)
            └── PuzzlePiece[] (Individual Pieces)
                    └── Canvas (Image Rendering)
```

**Component Responsibilities:**
- **PuzzleGame**: Puzzle selection, difficulty filtering, gallery UI
- **PuzzleBoard**: Game state, piece management, progress tracking
- **PuzzlePiece**: Individual piece rendering, drag/drop, snapping
- **puzzleUtils**: Image slicing, distance calculations
- **puzzleImages**: Puzzle configuration and metadata

## 🐛 Troubleshooting

### Images not loading
- Ensure images are in `public/puzzles/` directory
- Check image paths in `puzzleImages.js`
- Verify image file extensions match the configuration

### Pieces not snapping
- Adjust `snapThreshold` in PuzzleBoard.jsx
- Check that pieces are close enough to correct position
- Ensure drag events are working properly

### Performance issues
- Reduce image size (recommended: 800×600)
- Lower the number of pieces (use 8×8 instead of 12×12)
- Ensure images are optimized (compressed JPG/PNG)

## 🎨 Educational Value (for FLL)

This module adds educational value to Archia:
- **Cultural Learning**: Familiarization with archaeological artifacts
- **Pattern Recognition**: Visual learning and memory enhancement
- **Problem Solving**: Spatial reasoning and logical thinking
- **Engagement**: Interactive way to explore archaeology
- **Accessibility**: Simple, intuitive gameplay for all ages

## 📄 License

This module is part of the Archia project. Use freely within your project.

## 🤝 Contributing

To extend this module:
1. Add new features in separate files
2. Keep components isolated and reusable
3. Maintain backward compatibility
4. Update this README with new features

## ✨ Future Enhancements (Optional)

Ideas for future development:
- [ ] Timer and scoring system
- [ ] Leaderboard with best times
- [ ] Irregular puzzle piece shapes (jigsaw style)
- [ ] Sound effects and music
- [ ] Save/load puzzle progress
- [ ] Multiplayer mode
- [ ] AI-assisted piece suggestion
- [ ] User-uploaded images
- [ ] Puzzle piece rotation
- [ ] Multiple board layouts

---

**Need help?** This is a standalone module that won't interfere with your existing Archia codebase. Just add it and enjoy! 🏺✨
