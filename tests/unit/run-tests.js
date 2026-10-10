/**
 * TABLESERVE Unit Test Suite Runner
 */

const runReservationTests = require('./reservation.test');
const runRestaurantTests = require('./restaurant.test');
const runOrderTests = require('./order.test');

async function main() {
  console.log('====================================================');
  console.log('🧪 RUNNING TABLESERVE UNIT TEST SUITE');
  console.log('====================================================\n');

  try {
    await runReservationTests();
    await runRestaurantTests();
    await runOrderTests();

    console.log('====================================================');
    console.log('✅ ALL UNIT TESTS PASSED (100% SUCCESS)');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ UNIT TEST SUITE FAILED:', err);
    process.exit(1);
  }
}

main();
