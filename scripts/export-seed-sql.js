/**
 * Export seed.sql from database.js
 */
const fs = require('fs');
const path = require('path');
const db = require('../services/shared/database');

const store = db.getStore();

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  return `'${String(val).replace(/'/g, "''")}'`;
}

let sql = `-- TABLESERVE PostgreSQL Seed Data (Indian Regional Dataset)\n\n`;

// 1. Users
sql += `-- 1. Insert Users\n`;
sql += `INSERT INTO users (id, name, email, password_hash, phone, role) VALUES\n`;
sql += store.users.map(u => 
  `(${sqlEscape(u.id)}, ${sqlEscape(u.name)}, ${sqlEscape(u.email)}, ${sqlEscape(u.password_hash)}, ${sqlEscape(u.phone)}, ${sqlEscape(u.role)})`
).join(',\n') + ';\n\n';

// 2. Restaurants
sql += `-- 2. Insert Restaurants (18 Authentic Indian Restaurants across 9 Metro Cities)\n`;
sql += `INSERT INTO restaurants (id, name, description, cuisine, address, city, phone, image_url, rating, price_tier, opening_time, closing_time, total_tables) VALUES\n`;
sql += store.restaurants.map(r => 
  `(${sqlEscape(r.id)}, ${sqlEscape(r.name)}, ${sqlEscape(r.description)}, ${sqlEscape(r.cuisine)}, ${sqlEscape(r.address)}, ${sqlEscape(r.city)}, ${sqlEscape(r.phone)}, ${sqlEscape(r.image_url)}, ${r.rating}, ${sqlEscape(r.price_tier)}, ${sqlEscape(r.opening_time)}, ${sqlEscape(r.closing_time)}, ${r.total_tables})`
).join(',\n') + ';\n\n';

// 3. Tables
sql += `-- 3. Insert Tables\n`;
sql += `INSERT INTO restaurant_tables (id, restaurant_id, table_number, capacity, is_active) VALUES\n`;
sql += store.restaurant_tables.map(t =>
  `(${sqlEscape(t.id)}, ${sqlEscape(t.restaurant_id)}, ${t.table_number}, ${t.capacity}, ${t.is_active ? 'TRUE' : 'FALSE'})`
).join(',\n') + ';\n\n';

// 4. Menu items
sql += `-- 4. Insert Menu Items\n`;
sql += `INSERT INTO menu_items (id, restaurant_id, name, description, price, category, dietary_tags, image_url, is_available) VALUES\n`;
sql += store.menu_items.map(m =>
  `(${sqlEscape(m.id)}, ${sqlEscape(m.restaurant_id)}, ${sqlEscape(m.name)}, ${sqlEscape(m.description)}, ${m.price}, ${sqlEscape(m.category)}, ${sqlEscape(m.dietary_tags)}, ${sqlEscape(m.image_url)}, ${m.is_available ? 'TRUE' : 'FALSE'})`
).join(',\n') + ';\n\n';

// 5. Sample Reservations
sql += `-- 5. Insert Sample Reservations\n`;
sql += `INSERT INTO reservations (id, user_id, restaurant_id, table_id, reservation_date, time_slot, guests, status, special_requests) VALUES\n`;
sql += store.reservations.map(res =>
  `(${sqlEscape(res.id)}, ${sqlEscape(res.user_id)}, ${sqlEscape(res.restaurant_id)}, ${sqlEscape(res.table_id)}, ${sqlEscape(res.reservation_date)}, ${sqlEscape(res.time_slot)}, ${res.guests}, ${sqlEscape(res.status)}, ${sqlEscape(res.special_requests)})`
).join(',\n') + ';\n\n';

// 6. Sample Orders
sql += `-- 6. Insert Sample Orders\n`;
sql += `INSERT INTO orders (id, user_id, restaurant_id, order_type, table_number, total_amount, status, payment_status, special_notes) VALUES\n`;
sql += store.orders.map(o =>
  `(${sqlEscape(o.id)}, ${sqlEscape(o.user_id)}, ${sqlEscape(o.restaurant_id)}, ${sqlEscape(o.order_type)}, ${o.table_number || 'NULL'}, ${o.total_amount}, ${sqlEscape(o.status)}, ${sqlEscape(o.payment_status)}, ${sqlEscape(o.special_notes)})`
).join(',\n') + ';\n\n';

// 7. Order Items
sql += `-- 7. Insert Order Items\n`;
sql += `INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity, subtotal) VALUES\n`;
sql += store.order_items.map(oi =>
  `(${sqlEscape(oi.id)}, ${sqlEscape(oi.order_id)}, ${sqlEscape(oi.menu_item_id)}, ${sqlEscape(oi.name)}, ${oi.price}, ${oi.quantity}, ${oi.subtotal})`
).join(',\n') + ';\n\n';

// 8. Payments
sql += `-- 8. Insert Payments\n`;
sql += `INSERT INTO payments (id, reference_type, reference_id, amount, currency, payment_method, status, transaction_id, card_last4) VALUES\n`;
sql += store.payments.map(p =>
  `(${sqlEscape(p.id)}, ${sqlEscape(p.reference_type)}, ${sqlEscape(p.reference_id)}, ${p.amount}, ${sqlEscape(p.currency)}, ${sqlEscape(p.payment_method)}, ${sqlEscape(p.status)}, ${sqlEscape(p.transaction_id)}, ${sqlEscape(p.card_last4)})`
).join(',\n') + ';\n';

fs.writeFileSync(path.join(__dirname, '../database/seed.sql'), sql, 'utf8');
console.log('✓ Generated database/seed.sql with 18 Indian restaurants and complete schema!');
