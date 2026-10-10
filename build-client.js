const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const srcPath = path.resolve(__dirname, 'frontend/src/App.jsx');
const outPath = path.resolve(__dirname, 'frontend/public/App.js');
const outSrcPath = path.resolve(__dirname, 'frontend/src/App.js');

const srcCode = fs.readFileSync(srcPath, 'utf8');

const transformed = babel.transformSync(srcCode, {
  presets: [['@babel/preset-react', { runtime: 'classic' }]]
});

// Ensure output dirs exist
if (!fs.existsSync(path.dirname(outPath))) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
}

fs.writeFileSync(outPath, transformed.code, 'utf8');
fs.writeFileSync(outSrcPath, transformed.code, 'utf8');

console.log(`✓ Compiled App.jsx -> App.js (${(transformed.code.length / 1024).toFixed(1)} KB)`);
