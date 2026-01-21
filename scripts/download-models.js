// scripts/download-models.js
// Run once: node scripts/download-models.js

import fs from 'fs';
import https from 'https';
import path from 'path';

const MOBILENET_URL = 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_0.75_224/';
const OUTPUT_DIR = './public/models/mobilenet';

const files = [
  'model.json',
  'group1-shard1of1.bin'
];

// Create directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('📦 Downloading MobileNet v2 (alpha 0.75) models...');

files.forEach(file => {
  const url = MOBILENET_URL + file;
  const dest = path.join(OUTPUT_DIR, file);
  
  https.get(url, (response) => {
    const fileStream = fs.createWriteStream(dest);
    response.pipe(fileStream);
    
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`✅ Downloaded: ${file}`);
    });
  }).on('error', (err) => {
    console.error(`❌ Error downloading ${file}:`, err.message);
  });
});

console.log('\n📝 Usage in classifier.js:');
console.log(`
const modelPath = '/models/mobilenet/model.json';
this.mobileNet = await tf.loadLayersModel(modelPath);
`);