/**
 * TABLESERVE Database Seeder
 * Populates PostgreSQL (or local store) with initial schema and rich sample data
 */

const fs = require('fs');
const path = require('path');
const db = require('../services/shared/database');

async function seedDatabase() {
  console.log('🌱 Starting TABLESERVE database seeding...');

  try {
    const isPg = db.isPostgres();
    if (isPg) {
      console.log('🐘 PostgreSQL detected. Executing init.sql and seed.sql...');
      const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
      const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

      await db.query(initSql);
      console.log('✓ DDL schema applied successfully.');

      await db.query(seedSql);
      console.log('✓ Seed data inserted successfully into PostgreSQL.');
    } else {
      console.log('📦 Local storage mode detected.');
      // db.init() auto-seeds default data if missing. Let's force reset to ensure pristine seed.
      const dataDir = path.resolve(__dirname, '../data');
      const dataFile = path.join(dataDir, 'tableserve_db.json');
      if (fs.existsSync(dataFile)) {
        fs.unlinkSync(dataFile);
        console.log('✓ Cleared old local store file.');
      }
      // Re-load fresh data
      db.getStore();
      console.log('✓ Pristine seed state initialized in data/tableserve_db.json');
    }

    const store = db.getStore();
    console.log(`\n🎉 Seeding complete! Database ready.`);
    console.log(`   - Users: ${(store.users || []).length}`);
    console.log(`   - Restaurants: ${(store.restaurants || []).length}`);
    console.log(`   - Tables: ${(store.restaurant_tables || []).length}`);
    console.log(`   - Menu Items: ${(store.menu_items || []).length}`);
    console.log(`   - Sample Reservations: ${(store.reservations || []).length}`);
    console.log(`   - Sample Orders: ${(store.orders || []).length}`);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seedDatabase().then(() => {
  console.log('\nSeeder process completed.');
  process.exit(0);
});
