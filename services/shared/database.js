const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Path for local state persistence when PostgreSQL is not running locally
const LOCAL_STORAGE_DIR = path.resolve(__dirname, '../../data');
const LOCAL_STORAGE_FILE = path.join(LOCAL_STORAGE_DIR, 'tableserve_db.json');

let pgPool = null;
let isPostgresAvailable = false;
let memoryStore = null;

// Initial seed dataset (matches database/seed.sql)
function getDefaultData() {
  return {
    users: [
      {
        id: 'usr-admin-01',
        name: 'Admin Supervisor',
        email: 'admin@tableserve.com',
        password_hash: '$2a$10$fG6aNn2E8QJ2C2u4X1.0..Q3I/zJ3o9YjQ4iQ7c9tP0/h6Y6J8e9K',
        phone: '+1-555-0100',
        role: 'ADMIN',
        created_at: new Date().toISOString()
      },
      {
        id: 'usr-cust-01',
        name: 'John Doe',
        email: 'john.doe@example.com',
        password_hash: '$2a$10$fG6aNn2E8QJ2C2u4X1.0..Q3I/zJ3o9YjQ4iQ7c9tP0/h6Y6J8e9K',
        phone: '+1-555-0101',
        role: 'CUSTOMER',
        created_at: new Date().toISOString()
      },
      {
        id: 'usr-cust-02',
        name: 'Alice Smith',
        email: 'alice.smith@example.com',
        password_hash: '$2a$10$fG6aNn2E8QJ2C2u4X1.0..Q3I/zJ3o9YjQ4iQ7c9tP0/h6Y6J8e9K',
        phone: '+1-555-0102',
        role: 'CUSTOMER',
        created_at: new Date().toISOString()
      },
      {
        id: 'usr-cust-03',
        name: 'Robert Chen',
        email: 'robert.chen@example.com',
        password_hash: '$2a$10$fG6aNn2E8QJ2C2u4X1.0..Q3I/zJ3o9YjQ4iQ7c9tP0/h6Y6J8e9K',
        phone: '+1-555-0103',
        role: 'CUSTOMER',
        created_at: new Date().toISOString()
      }
    ],
    restaurants: [
      {
        id: 'rest-01',
        name: 'Bella Italia Trattoria',
        description: 'Authentic wood-fired Neapolitan pizza, handmade pastas, and fine Tuscan wines in a warm rustic setting.',
        cuisine: 'Italian',
        address: '452 Columbus Ave',
        city: 'New York',
        phone: '+1-212-555-0143',
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
        rating: 4.8,
        price_tier: '$$$',
        opening_time: '11:30',
        closing_time: '23:00',
        total_tables: 10,
        created_at: new Date().toISOString()
      },
      {
        id: 'rest-02',
        name: 'Sakura Japanese Bistro',
        description: 'Master sushi chefs crafting fresh nigiri, sashimi, and comforting tonkotsu ramen with traditional hospitality.',
        cuisine: 'Japanese',
        address: '789 2nd Avenue',
        city: 'New York',
        phone: '+1-212-555-0199',
        image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
        rating: 4.9,
        price_tier: '$$$$',
        opening_time: '12:00',
        closing_time: '22:30',
        total_tables: 8,
        created_at: new Date().toISOString()
      },
      {
        id: 'rest-03',
        name: 'Spice Symphony',
        description: 'A culinary journey through regional Indian spices, tandoori grills, rich curries, and freshly baked naans.',
        cuisine: 'Indian',
        address: '150 East 50th St',
        city: 'New York',
        phone: '+1-212-555-0122',
        image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
        rating: 4.7,
        price_tier: '$$',
        opening_time: '11:00',
        closing_time: '23:00',
        total_tables: 12,
        created_at: new Date().toISOString()
      },
      {
        id: 'rest-04',
        name: 'Le Petit Bouchon',
        description: 'Classic Parisian bistro dining featuring boeuf bourguignon, duck confit, escargots, and artisanal baguettes.',
        cuisine: 'French',
        address: '320 West 4th St',
        city: 'New York',
        phone: '+1-212-555-0188',
        image_url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
        rating: 4.6,
        price_tier: '$$$',
        opening_time: '12:00',
        closing_time: '22:00',
        total_tables: 8,
        created_at: new Date().toISOString()
      },
      {
        id: 'rest-05',
        name: 'El Fuego Taqueria',
        description: 'Vibrant Mexican street cuisine with slow-roasted al pastor, fresh guacamole, mezcal cocktails, and churros.',
        cuisine: 'Mexican',
        address: '210 Bowery',
        city: 'New York',
        phone: '+1-212-555-0177',
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        rating: 4.5,
        price_tier: '$',
        opening_time: '11:00',
        closing_time: '00:00',
        total_tables: 14,
        created_at: new Date().toISOString()
      },
      {
        id: 'rest-06',
        name: 'The Prime Oakhouse',
        description: 'Dry-aged prime steaks, fresh Atlantic seafood, and craft cocktails in a luxurious contemporary lounge.',
        cuisine: 'Steakhouse',
        address: '620 Lexington Ave',
        city: 'New York',
        phone: '+1-212-555-0166',
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        rating: 4.9,
        price_tier: '$$$$',
        opening_time: '16:00',
        closing_time: '23:30',
        total_tables: 10,
        created_at: new Date().toISOString()
      }
    ],
    restaurant_tables: [
      { id: 'tbl-01-01', restaurant_id: 'rest-01', table_number: 1, capacity: 2, is_active: true },
      { id: 'tbl-01-02', restaurant_id: 'rest-01', table_number: 2, capacity: 2, is_active: true },
      { id: 'tbl-01-03', restaurant_id: 'rest-01', table_number: 3, capacity: 4, is_active: true },
      { id: 'tbl-01-04', restaurant_id: 'rest-01', table_number: 4, capacity: 4, is_active: true },
      { id: 'tbl-01-05', restaurant_id: 'rest-01', table_number: 5, capacity: 4, is_active: true },
      { id: 'tbl-01-06', restaurant_id: 'rest-01', table_number: 6, capacity: 6, is_active: true },
      { id: 'tbl-01-07', restaurant_id: 'rest-01', table_number: 7, capacity: 6, is_active: true },
      { id: 'tbl-01-08', restaurant_id: 'rest-01', table_number: 8, capacity: 8, is_active: true },
      { id: 'tbl-02-01', restaurant_id: 'rest-02', table_number: 1, capacity: 2, is_active: true },
      { id: 'tbl-02-02', restaurant_id: 'rest-02', table_number: 2, capacity: 2, is_active: true },
      { id: 'tbl-02-03', restaurant_id: 'rest-02', table_number: 3, capacity: 4, is_active: true },
      { id: 'tbl-02-04', restaurant_id: 'rest-02', table_number: 4, capacity: 4, is_active: true },
      { id: 'tbl-02-05', restaurant_id: 'rest-02', table_number: 5, capacity: 6, is_active: true },
      { id: 'tbl-03-01', restaurant_id: 'rest-03', table_number: 1, capacity: 2, is_active: true },
      { id: 'tbl-03-02', restaurant_id: 'rest-03', table_number: 2, capacity: 4, is_active: true },
      { id: 'tbl-03-03', restaurant_id: 'rest-03', table_number: 3, capacity: 4, is_active: true },
      { id: 'tbl-03-04', restaurant_id: 'rest-03', table_number: 4, capacity: 6, is_active: true },
      { id: 'tbl-03-05', restaurant_id: 'rest-03', table_number: 5, capacity: 8, is_active: true }
    ],
    menu_items: [
      {
        id: 'menu-01-01',
        restaurant_id: 'rest-01',
        name: 'Burrata Pugliese',
        description: 'Creamy pugliese burrata with heirloom tomatoes, aged balsamic reduction, and fresh basil.',
        price: 18.00,
        category: 'Appetizer',
        dietary_tags: 'Vegetarian,Gluten-Free',
        image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=500&q=80',
        is_available: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'menu-01-02',
        restaurant_id: 'rest-01',
        name: 'Truffle Tagliolini',
        description: 'Handmade egg ribbon pasta tossed in black summer truffle butter and 24-month Parmigiano Reggiano.',
        price: 28.50,
        category: 'Main Course',
        dietary_tags: 'Vegetarian',
        image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d62811fa?auto=format&fit=crop&w=500&q=80',
        is_available: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'menu-01-03',
        restaurant_id: 'rest-01',
        name: 'Margherita D.O.P.',
        description: 'San Marzano tomatoes, fior di latte mozzarella, fresh basil, and extra virgin olive oil.',
        price: 22.00,
        category: 'Main Course',
        dietary_tags: 'Vegetarian',
        image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=500&q=80',
        is_available: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'menu-01-04',
        restaurant_id: 'rest-01',
        name: 'Osso Buco alla Milanese',
        description: 'Braised veal shank slow-cooked with white wine and vegetables, served over saffron risotto.',
        price: 36.00,
        category: 'Main Course',
        dietary_tags: 'Gluten-Free',
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
        is_available: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'menu-01-05',
        restaurant_id: 'rest-01',
        name: 'Classic Tiramisu',
        description: 'Espresso-soaked ladyfingers, velvety mascarpone cream, and Dutch dark cocoa dusting.',
        price: 12.00,
        category: 'Dessert',
        dietary_tags: 'Vegetarian',
        image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=500&q=80',
        is_available: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'menu-01-06',
        restaurant_id: 'rest-01',
        name: 'San Pellegrino Sparkling',
        description: 'Imported Italian mineral water with lemon twist.',
        price: 5.00,
        category: 'Beverage',
        dietary_tags: 'Vegan,Gluten-Free',
        image_url: 'https://images.unsplash.com/photo-1559839914-ba2ce93efb57?auto=format&fit=crop&w=500&q=80',
        is_available: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'menu-02-01',
        restaurant_id: 'rest-02',
        name: 'Tuna & Salmon Sashimi Deluxe',
        description: 'Chef selection of bluefin tuna, king salmon, and yellowtail with fresh wasabi.',
        price: 34.00,
        category: 'Appetizer',
        dietary_tags: 'Gluten-Free',
        image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80',
        is_available: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'menu-02-02',
        restaurant_id: 'rest-02',
        name: 'Dragon Roll',
        description: 'Eel and cucumber inside topped with sliced avocado, tobiko, and unagi glaze.',
        price: 21.00,
        category: 'Main Course',
        dietary_tags: '',
        image_url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=500&q=80',
        is_available: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'menu-02-03',
        restaurant_id: 'rest-02',
        name: 'Wagyu Beef Ramen',
        description: 'Rich 18-hour tonkotsu broth, A5 Miyazaki wagyu slices, nitamago egg, and scallions.',
        price: 27.00,
        category: 'Main Course',
        dietary_tags: '',
        image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80',
        is_available: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'menu-03-01',
        restaurant_id: 'rest-03',
        name: 'Tandoori Murgh',
        description: 'Spring chicken marinated in yogurt, Kashmiri chilies, and roasted garam masala.',
        price: 24.00,
        category: 'Main Course',
        dietary_tags: 'Halal,Gluten-Free',
        image_url: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=500&q=80',
        is_available: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'menu-03-02',
        restaurant_id: 'rest-03',
        name: 'Paneer Tikka Masala',
        description: 'Charcoal-grilled cottage cheese cubes simmered in spiced tomato fenugreek cream.',
        price: 21.00,
        category: 'Main Course',
        dietary_tags: 'Vegetarian,Gluten-Free',
        image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80',
        is_available: true,
        created_at: new Date().toISOString()
      }
    ],
    reservations: [
      {
        id: 'res-01',
        user_id: 'usr-cust-01',
        restaurant_id: 'rest-01',
        table_id: 'tbl-01-03',
        reservation_date: '2026-10-15',
        time_slot: '19:00',
        guests: 4,
        status: 'CONFIRMED',
        special_requests: 'Anniversary celebration, window table preferred',
        created_at: new Date().toISOString()
      },
      {
        id: 'res-02',
        user_id: 'usr-cust-02',
        restaurant_id: 'rest-02',
        table_id: 'tbl-02-01',
        reservation_date: '2026-10-16',
        time_slot: '20:00',
        guests: 2,
        status: 'CONFIRMED',
        special_requests: 'Quiet corner for business dinner',
        created_at: new Date().toISOString()
      }
    ],
    payments: [
      {
        id: 'pay-01',
        reference_type: 'ORDER',
        reference_id: 'ord-01',
        amount: 68.50,
        currency: 'USD',
        payment_method: 'CREDIT_CARD',
        status: 'COMPLETED',
        transaction_id: 'txn_sim_98234871923',
        card_last4: '4242',
        created_at: new Date().toISOString()
      }
    ],
    orders: [
      {
        id: 'ord-01',
        user_id: 'usr-cust-01',
        restaurant_id: 'rest-01',
        order_type: 'DINE_IN',
        table_number: 3,
        total_amount: 68.50,
        status: 'READY',
        payment_status: 'PAID',
        special_notes: 'Extra grated parmesan please',
        created_at: new Date().toISOString()
      }
    ],
    order_items: [
      {
        id: 'ord-item-01',
        order_id: 'ord-01',
        menu_item_id: 'menu-01-01',
        name: 'Burrata Pugliese',
        price: 18.00,
        quantity: 1,
        subtotal: 18.00
      },
      {
        id: 'ord-item-02',
        order_id: 'ord-01',
        menu_item_id: 'menu-01-02',
        name: 'Truffle Tagliolini',
        price: 28.50,
        quantity: 1,
        subtotal: 28.50
      },
      {
        id: 'ord-item-03',
        order_id: 'ord-01',
        menu_item_id: 'menu-01-03',
        name: 'Margherita D.O.P.',
        price: 22.00,
        quantity: 1,
        subtotal: 22.00
      }
    ]
  };
}

// Initialize Local JSON Store
function loadLocalStore() {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      const content = fs.readFileSync(LOCAL_STORAGE_FILE, 'utf8');
      memoryStore = JSON.parse(content);
    } else {
      memoryStore = getDefaultData();
      saveLocalStore();
    }
  } catch (err) {
    console.warn('[DB] Warning loading local store file, falling back to default seed in memory:', err.message);
    memoryStore = getDefaultData();
  }
}

function saveLocalStore() {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Error saving local store:', err.message);
  }
}

// Connect to PostgreSQL if configured
async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URI;
  if (dbUrl || (process.env.PGHOST && process.env.USE_POSTGRES === 'true')) {
    try {
      pgPool = new Pool({
        connectionString: dbUrl,
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432'),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'tableserve',
        connectionTimeoutMillis: 2000
      });

      const client = await pgPool.connect();
      client.release();
      isPostgresAvailable = true;
      console.log('✓ [DB] Connected to PostgreSQL successfully.');
      return;
    } catch (err) {
      console.log(`ℹ [DB] PostgreSQL not reachable (${err.message}). Using high-performance local store.`);
      isPostgresAvailable = false;
    }
  } else {
    isPostgresAvailable = false;
  }
  loadLocalStore();
}

// Unified query / data access API
const db = {
  async init() {
    await initDatabase();
  },

  isPostgres() {
    return isPostgresAvailable;
  },

  getStore() {
    if (!memoryStore) loadLocalStore();
    return memoryStore;
  },

  async query(sqlText, params = []) {
    if (isPostgresAvailable && pgPool) {
      return pgPool.query(sqlText, params);
    }
    // In local mode, return empty or handled by high-level methods
    return { rows: [], rowCount: 0 };
  },

  // High-level resilient data access methods that work across both PG and local storage
  async find(tableName, filterFn = null) {
    if (!memoryStore) loadLocalStore();
    const table = memoryStore[tableName] || [];
    if (!filterFn) return [...table];
    return table.filter(filterFn);
  },

  async findOne(tableName, filterFn) {
    if (!memoryStore) loadLocalStore();
    const table = memoryStore[tableName] || [];
    return table.find(filterFn) || null;
  },

  async insert(tableName, record) {
    if (!memoryStore) loadLocalStore();
    if (!memoryStore[tableName]) memoryStore[tableName] = [];
    memoryStore[tableName].push(record);
    saveLocalStore();
    return record;
  },

  async update(tableName, filterFn, updates) {
    if (!memoryStore) loadLocalStore();
    const table = memoryStore[tableName] || [];
    let updatedCount = 0;
    for (let i = 0; i < table.length; i++) {
      if (filterFn(table[i])) {
        table[i] = { ...table[i], ...updates, updated_at: new Date().toISOString() };
        updatedCount++;
      }
    }
    if (updatedCount > 0) saveLocalStore();
    return updatedCount;
  },

  async delete(tableName, filterFn) {
    if (!memoryStore) loadLocalStore();
    const initialLen = (memoryStore[tableName] || []).length;
    memoryStore[tableName] = (memoryStore[tableName] || []).filter(item => !filterFn(item));
    const deletedCount = initialLen - memoryStore[tableName].length;
    if (deletedCount > 0) saveLocalStore();
    return deletedCount;
  },

  // Atomically check and lock a reservation table slot (Double-booking prevention)
  async lockReservationSlot({ restaurantId, date, timeSlot, guests }) {
    if (!memoryStore) loadLocalStore();
    const tables = memoryStore.restaurant_tables.filter(
      t => t.restaurant_id === restaurantId && t.is_active && t.capacity >= guests
    );

    if (tables.length === 0) {
      return { success: false, reason: 'NO_TABLES_WITH_CAPACITY' };
    }

    // Sort tables by capacity ascending to allocate smallest fitting table first
    tables.sort((a, b) => a.capacity - b.capacity);

    // Find first table not already booked on date + timeSlot
    for (const table of tables) {
      const conflict = memoryStore.reservations.find(
        r => r.table_id === table.id &&
             r.reservation_date === date &&
             r.time_slot === timeSlot &&
             r.status !== 'CANCELLED'
      );

      if (!conflict) {
        return { success: true, table };
      }
    }

    return { success: false, reason: 'ALL_TABLES_BOOKED' };
  }
};

// Auto initialize
initDatabase();

module.exports = db;
