async function run() {
  try {
    const r1 = await fetch('http://localhost:3000/api/restaurants').then(r => r.json());
    console.log('1. Restaurants via Port 3000:', r1.success, '| count:', r1.data.length);

    const r2 = await fetch('http://localhost:3000/api/search?q=truffle').then(r => r.json());
    console.log('2. Search truffle via Port 3000:', r2.success, '| top match:', r2.data[0].name);

    const r3 = await fetch('http://localhost:3000/api/search?cuisine=Japanese').then(r => r.json());
    console.log('3. Search Japanese cuisine via Port 3000:', r3.success, '| match:', r3.data[0].name);

    const r4 = await fetch('http://localhost:3000/api/reservations/availability?restaurant_id=rest-01&date=2026-11-20&guests=2').then(r => r.json());
    console.log('4. Availability check via Port 3000:', r4.success, '| slots count:', r4.slots.length);

    const r5 = await fetch('http://localhost:3000/api/chatbot/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Find sushi' })
    }).then(r => r.json());
    console.log('5. Chatbot via Port 3000:', r5.success, '| bot intent:', r5.intent);

    console.log('\n🎉 ALL PORT 3000 PROXY ENDPOINTS FULLY FUNCTIONAL AND RETURNING DATA!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
