/**
 * TABLESERVE End-to-End API Test Suite
 * Tests Auth, Restaurant, Reservation, Ordering, Search, and Amazon Lex Chatbot APIs
 */

const assert = require('assert');
const http = require('http');
const path = require('path');

// Import service apps for direct in-process testing or live HTTP testing
const gatewayApp = require('../services/api-gateway/server');
const restaurantApp = require('../services/restaurant-service/server');
const reservationApp = require('../services/reservation-service/server');
const orderingApp = require('../services/ordering-service/server');
const searchApp = require('../services/search-service/server');
const db = require('../services/shared/database');

let servers = [];

async function startTestServers() {
  return new Promise((resolve) => {
    const s1 = restaurantApp.listen(5001);
    const s2 = reservationApp.listen(5002);
    const s3 = orderingApp.listen(5003);
    const s4 = searchApp.listen(5004);
    const s0 = gatewayApp.listen(5000, () => {
      servers = [s0, s1, s2, s3, s4];
      resolve();
    });
  });
}

function stopTestServers() {
  servers.forEach(s => s.close());
}

async function request(url, options = {}) {
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      },
      (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          let json = {};
          try {
            json = JSON.parse(body);
          } catch (e) {
            json = { raw: body };
          }
          resolve({ status: res.statusCode, data: json });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runApiTests() {
  console.log('====================================================');
  console.log('📡 STARTING TABLESERVE END-TO-END API TEST SUITE');
  console.log('====================================================\n');

  await startTestServers();
  await new Promise(r => setTimeout(r, 600));

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  try {
    // 1. Health Checks
    console.log('\n--- 1. Microservice Health Checks ---');
    await test('Gateway Health Check', async () => {
      const res = await request('http://localhost:5000/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.status, 'OK');
    });

    await test('Restaurant Service Health Check', async () => {
      const res = await request('http://localhost:5001/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.status, 'OK');
    });

    await test('Reservation Service Health Check', async () => {
      const res = await request('http://localhost:5002/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.status, 'OK');
    });

    await test('Ordering Service Health Check', async () => {
      const res = await request('http://localhost:5003/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.status, 'OK');
    });

    await test('Search Service Health Check', async () => {
      const res = await request('http://localhost:5004/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.status, 'OK');
    });

    // 2. Authentication Flow
    console.log('\n--- 2. Authentication & JWT Security ---');
    let customerToken = '';
    let adminToken = '';

    await test('Customer Registration (POST /api/auth/register)', async () => {
      const testEmail = `testuser_${Date.now()}@example.com`;
      const res = await request('http://localhost:5000/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Test Customer',
          email: testEmail,
          password: 'Password@123',
          role: 'CUSTOMER'
        }
      });
      assert.strictEqual(res.status, 201);
      assert.ok(res.data.token, 'JWT token returned');
      customerToken = res.data.token;
    });

    await test('Admin Login (POST /api/auth/login)', async () => {
      const res = await request('http://localhost:5000/api/auth/login', {
        method: 'POST',
        body: {
          email: 'admin@tableserve.com',
          password: 'Admin@123'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.role, 'ADMIN');
      adminToken = res.data.token;
    });

    await test('Protected Profile Check (GET /api/auth/profile)', async () => {
      const res = await request('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.name, 'Test Customer');
    });

    // 3. Restaurant & Menu APIs
    console.log('\n--- 3. Restaurant & Menu Management ---');
    await test('List Restaurants (GET /api/restaurants)', async () => {
      const res = await request('http://localhost:5000/api/restaurants');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.length >= 6);
    });

    await test('Get Restaurant Details with Menu (GET /api/restaurants/rest-01)', async () => {
      const res = await request('http://localhost:5000/api/restaurants/rest-01');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.name, 'Bella Italia Trattoria');
      assert.ok(res.data.data.menu.length > 0);
    });

    // 4. Search Service
    console.log('\n--- 4. Search & Multi-Faceted Filtering ---');
    await test('Search by Cuisine Filter (GET /api/search?cuisine=Italian)', async () => {
      const res = await request('http://localhost:5000/api/search?cuisine=Italian');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.every(r => r.cuisine === 'Italian'));
    });

    await test('Text Search matching Menu Item (GET /api/search?q=truffle)', async () => {
      const res = await request('http://localhost:5000/api/search?q=truffle');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.some(r => r.name === 'Bella Italia Trattoria'));
    });

    // 5. Reservation & Double-Booking Protection
    console.log('\n--- 5. Reservation & Double-Booking Protection ---');
    await test('Check Table Availability (GET /api/reservations/availability)', async () => {
      const res = await request('http://localhost:5000/api/reservations/availability?restaurant_id=rest-01&date=2026-11-25&guests=2');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.slots.length > 0);
    });

    let createdResId = '';
    await test('Create Confirmed Reservation (POST /api/reservations)', async () => {
      const res = await request('http://localhost:5000/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          restaurant_id: 'rest-01',
          reservation_date: '2026-11-25',
          time_slot: '20:00',
          guests: 2,
          special_requests: 'Quiet romantic table'
        }
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.data.status, 'CONFIRMED');
      assert.ok(res.data.data.table_number);
      createdResId = res.data.data.id;
    });

    await test('Cancel Reservation and Release Table (PUT /api/reservations/:id/cancel)', async () => {
      const res = await request(`http://localhost:5000/api/reservations/${createdResId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      assert.strictEqual(res.status, 200);
    });

    // 6. Payment Simulation
    console.log('\n--- 6. Payment Simulation ---');
    await test('Simulate Successful Payment (POST /api/payments/simulate)', async () => {
      const res = await request('http://localhost:5000/api/payments/simulate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          amount: 45.00,
          reference_id: 'res-01',
          reference_type: 'RESERVATION',
          card_number: '4242424242424242'
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.status, 'COMPLETED');
    });

    await test('Simulate Declined Payment with 0000 card (POST /api/payments/simulate)', async () => {
      const res = await request('http://localhost:5000/api/payments/simulate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          amount: 45.00,
          reference_id: 'res-01',
          reference_type: 'RESERVATION',
          card_number: '4000000000000000'
        }
      });
      assert.strictEqual(res.status, 402);
      assert.strictEqual(res.data.data.status, 'FAILED');
    });

    // 7. Ordering Service
    console.log('\n--- 7. Order Placement & Status Progression ---');
    let orderId = '';
    await test('Place Order with verified pricing (POST /api/orders)', async () => {
      const res = await request('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: {
          restaurant_id: 'rest-01',
          order_type: 'DINE_IN',
          table_number: 3,
          items: [
            { menu_item_id: 'menu-01-01', quantity: 1 },
            { menu_item_id: 'menu-01-03', quantity: 2 }
          ]
        }
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.data.total_amount, 62.00); // 18 + 22*2 = 62
      orderId = res.data.data.id;
    });

    await test('Advance Order Status to PREPARING (PUT /api/orders/:id/status)', async () => {
      const res = await request(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { status: 'PREPARING' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.newStatus, 'PREPARING');
    });

    // 8. Amazon Lex Chatbot (8 Intents)
    console.log('\n--- 8. Amazon Lex Chatbot (8 Intents) ---');
    await test('Lex Intent 1: GreetingIntent', async () => {
      const res = await request('http://localhost:5000/api/chatbot/message', {
        method: 'POST',
        body: { message: 'Hello TABLESERVE!' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.intent, 'GreetingIntent');
    });

    await test('Lex Intent 2: HelpIntent', async () => {
      const res = await request('http://localhost:5000/api/chatbot/message', {
        method: 'POST',
        body: { message: 'Can you help me?' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.intent, 'HelpIntent');
    });

    await test('Lex Intent 3: RestaurantSearchIntent', async () => {
      const res = await request('http://localhost:5000/api/chatbot/message', {
        method: 'POST',
        body: { message: 'Find me Italian restaurants' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.intent, 'RestaurantSearchIntent');
    });

    await test('Lex Intent 4: MenuIntent', async () => {
      const res = await request('http://localhost:5000/api/chatbot/message', {
        method: 'POST',
        body: { message: 'Show menu for Bella Italia' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.intent, 'MenuIntent');
    });

    await test('Lex Intent 5: ReservationIntent', async () => {
      const res = await request('http://localhost:5000/api/chatbot/message', {
        method: 'POST',
        body: { message: 'I want to reserve a table' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.intent, 'ReservationIntent');
    });

    await test('Lex Intent 6: ReservationStatusIntent', async () => {
      const res = await request('http://localhost:5000/api/chatbot/message', {
        method: 'POST',
        body: { message: 'Check status of my reservation' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.intent, 'ReservationStatusIntent');
    });

    await test('Lex Intent 7: CancelReservationIntent', async () => {
      const res = await request('http://localhost:5000/api/chatbot/message', {
        method: 'POST',
        body: { message: 'Cancel reservation res-02' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.intent, 'CancelReservationIntent');
    });

    await test('Lex Intent 8: FallbackIntent', async () => {
      const res = await request('http://localhost:5000/api/chatbot/message', {
        method: 'POST',
        body: { message: 'quantum mechanical flux capacitor' }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.intent, 'FallbackIntent');
    });

  } finally {
    stopTestServers();
  }

  console.log('\n====================================================');
  console.log(`🏁 API TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runApiTests().catch(err => {
  console.error('Fatal test error:', err);
  stopTestServers();
  process.exit(1);
});
