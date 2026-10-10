const assert = require('assert');
const db = require('../../services/shared/database');

async function runRestaurantUnitTests() {
  console.log('🧪 [Unit Test] Running Restaurant & Menu CRUD tests...');

  // 1. Find existing restaurants
  const allRestaurants = await db.find('restaurants');
  assert.ok(allRestaurants.length >= 6, 'Should load initial restaurants');
  console.log(`  ✓ Test 1: Loaded ${allRestaurants.length} restaurants successfully.`);

  // 2. Create new restaurant
  const testRest = {
    id: 'rest-unit-test-01',
    name: 'Unit Test Bistro',
    cuisine: 'French',
    address: '100 Test St',
    city: 'New York',
    rating: 4.8,
    price_tier: '$$$',
    opening_time: '12:00',
    closing_time: '22:00',
    total_tables: 5,
    created_at: new Date().toISOString()
  };
  await db.insert('restaurants', testRest);

  const found = await db.findOne('restaurants', r => r.id === 'rest-unit-test-01');
  assert.strictEqual(found.name, 'Unit Test Bistro', 'Restaurant name matches');
  console.log('  ✓ Test 2: Created restaurant successfully.');

  // 3. Add menu item
  const testMenuItem = {
    id: 'menu-unit-test-01',
    restaurant_id: 'rest-unit-test-01',
    name: 'French Onion Soup',
    price: 14.50,
    category: 'Appetizer',
    dietary_tags: 'Vegetarian',
    is_available: true,
    created_at: new Date().toISOString()
  };
  await db.insert('menu_items', testMenuItem);

  const foundMenu = await db.findOne('menu_items', m => m.id === 'menu-unit-test-01');
  assert.strictEqual(foundMenu.price, 14.50, 'Menu item price matches');
  console.log('  ✓ Test 3: Added menu item with price and dietary tags.');

  // 4. Update menu item
  await db.update('menu_items', m => m.id === 'menu-unit-test-01', { price: 16.00 });
  const updatedMenu = await db.findOne('menu_items', m => m.id === 'menu-unit-test-01');
  assert.strictEqual(updatedMenu.price, 16.00, 'Price updated to 16.00');
  console.log('  ✓ Test 4: Updated menu item price.');

  // 5. Cleanup
  await db.delete('menu_items', m => m.id === 'menu-unit-test-01');
  await db.delete('restaurants', r => r.id === 'rest-unit-test-01');
  console.log('  ✓ Test 5: Cleaned up test entities.');

  console.log('🎉 [Unit Test] All Restaurant & Menu tests passed successfully!\n');
}

module.exports = runRestaurantUnitTests;

if (require.main === module) {
  runRestaurantUnitTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}
