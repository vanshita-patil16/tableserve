const assert = require('assert');
const db = require('../../services/shared/database');

async function runOrderUnitTests() {
  console.log('🧪 [Unit Test] Running Order Lifecycle & Pricing tests...');

  // 1. Calculate pricing for multi-item order
  const orderId = 'ord-unit-test-01';
  const items = [
    { menu_item_id: 'menu-01-01', name: 'Burrata Pugliese', price: 18.00, quantity: 2, subtotal: 36.00 },
    { menu_item_id: 'menu-01-02', name: 'Truffle Tagliolini', price: 28.50, quantity: 1, subtotal: 28.50 }
  ];
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  assert.strictEqual(totalAmount, 64.50, 'Total should match expected calculation');

  // 2. Insert order
  const newOrder = {
    id: orderId,
    user_id: 'usr-cust-01',
    restaurant_id: 'rest-01',
    order_type: 'DINE_IN',
    table_number: 4,
    total_amount: totalAmount,
    status: 'PLACED',
    payment_status: 'PAID',
    created_at: new Date().toISOString()
  };
  await db.insert('orders', newOrder);
  console.log('  ✓ Test 1: Order placed with accurate pricing calculation.');

  // 3. Status transition: PLACED -> PREPARING
  await db.update('orders', o => o.id === orderId, { status: 'PREPARING' });
  let order = await db.findOne('orders', o => o.id === orderId);
  assert.strictEqual(order.status, 'PREPARING', 'Status transitioned to PREPARING');
  console.log('  ✓ Test 2: Status transition to PREPARING.');

  // 4. Status transition: PREPARING -> READY
  await db.update('orders', o => o.id === orderId, { status: 'READY' });
  order = await db.findOne('orders', o => o.id === orderId);
  assert.strictEqual(order.status, 'READY', 'Status transitioned to READY');
  console.log('  ✓ Test 3: Status transition to READY.');

  // 5. Status transition: READY -> SERVED
  await db.update('orders', o => o.id === orderId, { status: 'SERVED' });
  order = await db.findOne('orders', o => o.id === orderId);
  assert.strictEqual(order.status, 'SERVED', 'Status transitioned to SERVED');
  console.log('  ✓ Test 4: Status transition to SERVED.');

  // Cleanup
  await db.delete('orders', o => o.id === orderId);
  console.log('  ✓ Test 5: Cleaned up test order.');

  console.log('🎉 [Unit Test] All Order Lifecycle tests passed successfully!\n');
}

module.exports = runOrderUnitTests;

if (require.main === module) {
  runOrderUnitTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}
