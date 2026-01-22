// download-mobilenet.js
// Purpose: Downloads MobileNet v2 (alpha 1.0, 224x224) model files from TensorFlow.js official storage
//          to a local directory for offline use in your web app.
//          Run once: node download-mobilenet.js
// Requirements:
// - Node.js >= 14 (for ES modules)
// - Install dependencies: npm install @tensorflow/tfjs-node node-fetch
// Output: Saves model.json and .bin weight files to public/models/mobilenet/
// Usage in app: mobilenet.load({ modelUrl: '/models/mobilenet/model.json' })

import fs from 'fs';              // File system module for directory creation and file operations
import path from 'path';          // Path utilities for resolving directories
import fetch from 'node-fetch';   // HTTP client for any potential direct fetches (unused here but kept for extensibility)
import * as tf from '@tensorflow/tfjs-node';  // TensorFlow.js Node.js backend for loading/saving models

// Define the destination directory: relative to current working directory (project root)
const DEST_DIR = path.resolve(process.cwd(), 'public/models/mobilenet');

// Ensure the destination directory exists (recursive: creates parents if needed)
if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
  console.log(`📁 Created directory: ${DEST_DIR}`);
} else {
  console.log(`📁 Using existing directory: ${DEST_DIR}`);
}

// Main async download function
async function downloadModel() {
  try {
    console.log('🌐 Loading model from URL...');
    console.log('URL: https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json');
    
    // Load the pre-trained LayersModel from official TF.js cloud storage
    // This fetches model.json and automatically downloads all associated .bin weight shards
    const model = await tf.loadLayersModel(
      'https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json'
    );
    
    console.log('💾 Saving model locally...');
    
    // Save the loaded model to the local file system
    // Format: Saves model.json and groups weights into .bin files in the same dir
    await model.save(`file://${DEST_DIR}`);
    
    // List saved files for verification
    const savedFiles = fs.readdirSync(DEST_DIR).filter(file => file.endsWith('.json') || file.endsWith('.bin'));
    console.log('📋 Saved files:');
    savedFiles.forEach(file => console.log(`  - ${file}`));
    
    console.log(`✅ Download complete! Model saved to: ${DEST_DIR}`);
    console.log('\nNext steps:');
    console.log('1. Serve your app with Vite/React (models accessible via /models/mobilenet/model.json)');
    console.log('2. In your code: const model = await mobilenet.load({ modelUrl: \'/models/mobilenet/model.json\' });');
    console.log('3. For other variants (e.g., alpha 0.75): Replace URL with mobilenet_v2_0.75_224');
    
  } catch (err) {
    console.error('❌ Download failed:');
    console.error('Error details:', err.message);
    if (err.stack) {
      console.error('Stack trace:', err.stack);
    }
    process.exit(1);  // Exit with error code
  }
}

// Execute the download
downloadModel();

// Graceful shutdown on completion
process.on('exit', (code) => {
  console.log(`Process exited with code ${code}`);
});