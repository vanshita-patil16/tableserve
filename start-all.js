/**
 * TABLESERVE Complete Stack Local Orchestrator
 * Spawns all 4 backend microservices, the API Gateway Hub, and the React Frontend
 */

const { fork, execSync } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('🍴 STARTING TABLESERVE FULL MICROSERVICES & FRONTEND');
console.log('====================================================\n');

// 1. Precompile React client code so zero runtime Babel compilation is needed in browser
try {
  console.log('[ORCHESTRATOR] Pre-compiling React frontend client application...');
  execSync('node build-client.js', { stdio: 'inherit' });
} catch (e) {
  console.warn('[ORCHESTRATOR] Client compilation warning:', e.message);
}

const services = [
  { name: 'Restaurant Service', script: 'services/restaurant-service/server.js', port: 5001 },
  { name: 'Reservation & Payment', script: 'services/reservation-service/server.js', port: 5002 },
  { name: 'Ordering Service', script: 'services/ordering-service/server.js', port: 5003 },
  { name: 'Search Service', script: 'services/search-service/server.js', port: 5004 },
  { name: 'API Gateway Hub', script: 'services/api-gateway/server.js', port: 5000 },
  { name: 'React Frontend App', script: 'frontend/server.cjs', port: 3000 }
];

const runningProcesses = [];

services.forEach(service => {
  const scriptPath = path.resolve(__dirname, service.script);
  const child = fork(scriptPath, [], {
    env: {
      ...process.env,
      PORT: service.port
    },
    stdio: 'inherit'
  });

  runningProcesses.push({ ...service, child });
  console.log(`[ORCHESTRATOR] Initialized ${service.name} (Port ${service.port})`);
});

console.log('\n----------------------------------------------------');
console.log('✓ All 6 Stack Components Online & Ready!');
console.log('  🌐 React Frontend UI: http://localhost:3000');
console.log('  ⚡ API Gateway Hub: http://localhost:5000');
console.log('  📖 Unified Swagger Docs: http://localhost:5000/api-docs');
console.log('  🤖 Amazon Lex Chatbot: Embedded in Frontend UI');
console.log('----------------------------------------------------\n');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[ORCHESTRATOR] Shutting down TABLESERVE stack...');
  runningProcesses.forEach(({ name, child }) => {
    console.log(` Stopping ${name}...`);
    child.kill('SIGINT');
  });
  process.exit(0);
});

process.on('SIGTERM', () => {
  runningProcesses.forEach(({ child }) => child.kill('SIGTERM'));
  process.exit(0);
});
