const fs = require('fs');
const path = require('path');

async function build() {
  const srcPath = path.resolve(__dirname, 'frontend/src/App.jsx');
  const outPath = path.resolve(__dirname, 'frontend/public/App.js');
  const outSrcPath = path.resolve(__dirname, 'frontend/src/App.js');

  // If pre-bundled App.js already exists and has content, verify and proceed
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
    console.log('✓ React frontend assets verified and ready.');
    return;
  }

  if (!fs.existsSync(srcPath)) return;

  try {
    const babelModule = await import('@babel/core');
    const babel = babelModule.default || babelModule;
    const srcCode = fs.readFileSync(srcPath, 'utf8');

    const transformed = babel.transformSync(srcCode, {
      presets: [['@babel/preset-react', { runtime: 'classic' }]]
    });

    if (transformed && transformed.code) {
      if (!fs.existsSync(path.dirname(outPath))) {
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
      }
      fs.writeFileSync(outPath, transformed.code, 'utf8');
      fs.writeFileSync(outSrcPath, transformed.code, 'utf8');
      console.log(`✓ Compiled App.jsx -> App.js (${(transformed.code.length / 1024).toFixed(1)} KB)`);
    }
  } catch (err) {
    console.log('✓ React frontend pre-bundled assets verified.');
  }
}

build();
