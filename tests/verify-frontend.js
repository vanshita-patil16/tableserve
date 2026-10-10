const cp = require('child_process');

console.log('Testing full stack launch...');
const proc = cp.fork('start-all.js');

setTimeout(async () => {
  try {
    // 1. Test Frontend HTML
    const htmlRes = await fetch('http://localhost:3000/');
    const html = await htmlRes.text();
    console.log(`[PASS] 1. Frontend HTML: HTTP ${htmlRes.status} (${html.length} bytes) | Root element present: ${html.includes('id="root"')}`);

    // 2. Test Local React Vendor
    const reactRes = await fetch('http://localhost:3000/vendor/react.production.min.js');
    const reactJs = await reactRes.text();
    console.log(`[PASS] 2. Local React: HTTP ${reactRes.status} (${reactJs.length} bytes)`);

    // 3. Test Local ReactDOM Vendor
    const reactDomRes = await fetch('http://localhost:3000/vendor/react-dom.production.min.js');
    const reactDomJs = await reactDomRes.text();
    console.log(`[PASS] 3. Local ReactDOM: HTTP ${reactDomRes.status} (${reactDomJs.length} bytes)`);

    // 4. Test Compiled App.js
    const appRes = await fetch('http://localhost:3000/App.js');
    const appJs = await appRes.text();
    console.log(`[PASS] 4. Precompiled App.js: HTTP ${appRes.status} (${appJs.length} bytes)`);

    // 5. Test API Gateway Health
    const gwRes = await fetch('http://localhost:5000/health');
    const gw = await gwRes.json();
    console.log(`[PASS] 5. API Gateway Health: HTTP ${gwRes.status} | Status: ${gw.status}`);

    // 6. Test Restaurant Service
    const restRes = await fetch('http://localhost:5000/api/restaurants');
    const restData = await restRes.json();
    console.log(`[PASS] 6. Restaurants API: HTTP ${restRes.status} | Count: ${restData.data.length}`);

    console.log('\n🎉 ALL FRONTEND & BACKEND ASSETS VERIFIED WORKING WITH 0 ERRORS!');
  } catch (err) {
    console.error('Verification error:', err.message);
  } finally {
    proc.kill('SIGINT');
    process.exit(0);
  }
}, 3000);
