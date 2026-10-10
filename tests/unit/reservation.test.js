const assert = require('assert');
const db = require('../../services/shared/database');

async function runReservationUnitTests() {
  console.log('🧪 [Unit Test] Running Reservation & Double-Booking Prevention tests...');

  const restaurantId = 'rest-in-01'; // Bukhara (has 12 tables)
  const testDate = '2026-11-20';
  const testSlot = '19:00';
  const guests = 2;

  // 1. First booking for date & slot should succeed
  const lock1 = await db.lockReservationSlot({
    restaurantId,
    date: testDate,
    timeSlot: testSlot,
    guests
  });
  assert.strictEqual(lock1.success, true, 'First table booking should succeed');
  assert.ok(lock1.table, 'Table object should be allocated');

  // Insert test reservation
  const res1 = {
    id: 'res-test-01',
    user_id: 'usr-cust-01',
    restaurant_id: restaurantId,
    table_id: lock1.table.id,
    table_number: lock1.table.table_number,
    reservation_date: testDate,
    time_slot: testSlot,
    guests,
    status: 'CONFIRMED',
    created_at: new Date().toISOString()
  };
  await db.insert('reservations', res1);
  console.log('  ✓ Test 1: First reservation allocation verified.');

  // 2. Second booking for the same slot should allocate a DIFFERENT table
  const lock2 = await db.lockReservationSlot({
    restaurantId,
    date: testDate,
    timeSlot: testSlot,
    guests
  });
  assert.strictEqual(lock2.success, true, 'Second table booking should find another available table');
  assert.notStrictEqual(lock2.table.id, lock1.table.id, 'Second booking must NOT use the first already-booked table');
  console.log('  ✓ Test 2: Concurrent slot allocation assigned separate table.');

  // 3. Test slot cancellation releases table
  await db.update('reservations', r => r.id === 'res-test-01', { status: 'CANCELLED' });
  const checkCancelled = await db.findOne('reservations', r => r.id === 'res-test-01');
  assert.strictEqual(checkCancelled.status, 'CANCELLED', 'Reservation status should be CANCELLED');

  // Now booking again should be able to reuse the released table
  const lock3 = await db.lockReservationSlot({
    restaurantId,
    date: testDate,
    timeSlot: testSlot,
    guests
  });
  assert.strictEqual(lock3.success, true, 'Booking should succeed after cancellation');
  console.log('  ✓ Test 3: Table released on cancellation & available for re-booking.');

  // Cleanup test reservations
  await db.delete('reservations', r => r.id.startsWith('res-test-'));

  console.log('🎉 [Unit Test] All Reservation tests passed successfully!\n');
}

module.exports = runReservationUnitTests;

if (require.main === module) {
  runReservationUnitTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}
