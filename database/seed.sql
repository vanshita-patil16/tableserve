-- TABLESERVE PostgreSQL Seed Data

-- 1. Insert Users (Password: 'Password@123' bcrypt hashed: $2a$10$wTfUvH7J6P3g6W4Y4b4f5.h3iLkJ3YQo7Hj3E8k4uX8q9p8q8k9k.)
-- We'll provide standard bcrypt hashes for: Admin@123 and Customer@123
INSERT INTO users (id, name, email, password_hash, phone, role) VALUES
('usr-admin-01', 'Admin Supervisor', 'admin@tableserve.com', '$2a$10$fG6aNn2E8QJ2C2u4X1.0..Q3I/zJ3o9YjQ4iQ7c9tP0/h6Y6J8e9K', '+1-555-0100', 'ADMIN'),
('usr-cust-01', 'John Doe', 'john.doe@example.com', '$2a$10$fG6aNn2E8QJ2C2u4X1.0..Q3I/zJ3o9YjQ4iQ7c9tP0/h6Y6J8e9K', '+1-555-0101', 'CUSTOMER'),
('usr-cust-02', 'Alice Smith', 'alice.smith@example.com', '$2a$10$fG6aNn2E8QJ2C2u4X1.0..Q3I/zJ3o9YjQ4iQ7c9tP0/h6Y6J8e9K', '+1-555-0102', 'CUSTOMER'),
('usr-cust-03', 'Robert Chen', 'robert.chen@example.com', '$2a$10$fG6aNn2E8QJ2C2u4X1.0..Q3I/zJ3o9YjQ4iQ7c9tP0/h6Y6J8e9K', '+1-555-0103', 'CUSTOMER');

-- 2. Insert Restaurants
INSERT INTO restaurants (id, name, description, cuisine, address, city, phone, image_url, rating, price_tier, opening_time, closing_time, total_tables) VALUES
('rest-01', 'Bella Italia Trattoria', 'Authentic wood-fired Neapolitan pizza, handmade pastas, and fine Tuscan wines in a warm rustic setting.', 'Italian', '452 Columbus Ave', 'New York', '+1-212-555-0143', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', 4.8, '$$$', '11:30', '23:00', 10),
('rest-02', 'Sakura Japanese Bistro', 'Master sushi chefs crafting fresh nigiri, sashimi, and comforting tonkotsu ramen with traditional hospitality.', 'Japanese', '789 2nd Avenue', 'New York', '+1-212-555-0199', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', 4.9, '$$$$', '12:00', '22:30', 8),
('rest-03', 'Spice Symphony', 'A culinary journey through regional Indian spices, tandoori grills, rich curries, and freshly baked naans.', 'Indian', '150 East 50th St', 'New York', '+1-212-555-0122', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80', 4.7, '$$', '11:00', '23:00', 12),
('rest-04', 'Le Petit Bouchon', 'Classic Parisian bistro dining featuring boeuf bourguignon, duck confit, escargots, and artisanal baguettes.', 'French', '320 West 4th St', 'New York', '+1-212-555-0188', 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80', 4.6, '$$$', '12:00', '22:00', 8),
('rest-05', 'El Fuego Taqueria', 'Vibrant Mexican street cuisine with slow-roasted al pastor, fresh guacamole, mezcal cocktails, and churros.', 'Mexican', '210 Bowery', 'New York', '+1-212-555-0177', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', 4.5, '$', '11:00', '00:00', 14),
('rest-06', 'The Prime Oakhouse', 'Dry-aged prime steaks, fresh Atlantic seafood, and craft cocktails in a luxurious contemporary lounge.', 'Steakhouse', '620 Lexington Ave', 'New York', '+1-212-555-0166', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', 4.9, '$$$$', '16:00', '23:30', 10);

-- 3. Insert Tables for Bella Italia (rest-01)
INSERT INTO restaurant_tables (id, restaurant_id, table_number, capacity, is_active) VALUES
('tbl-01-01', 'rest-01', 1, 2, TRUE),
('tbl-01-02', 'rest-01', 2, 2, TRUE),
('tbl-01-03', 'rest-01', 3, 4, TRUE),
('tbl-01-04', 'rest-01', 4, 4, TRUE),
('tbl-01-05', 'rest-01', 5, 4, TRUE),
('tbl-01-06', 'rest-01', 6, 6, TRUE),
('tbl-01-07', 'rest-01', 7, 6, TRUE),
('tbl-01-08', 'rest-01', 8, 8, TRUE);

-- Insert Tables for Sakura (rest-02)
INSERT INTO restaurant_tables (id, restaurant_id, table_number, capacity, is_active) VALUES
('tbl-02-01', 'rest-02', 1, 2, TRUE),
('tbl-02-02', 'rest-02', 2, 2, TRUE),
('tbl-02-03', 'rest-02', 3, 4, TRUE),
('tbl-02-04', 'rest-02', 4, 4, TRUE),
('tbl-02-05', 'rest-02', 5, 6, TRUE);

-- Insert Tables for Spice Symphony (rest-03)
INSERT INTO restaurant_tables (id, restaurant_id, table_number, capacity, is_active) VALUES
('tbl-03-01', 'rest-03', 1, 2, TRUE),
('tbl-03-02', 'rest-03', 2, 4, TRUE),
('tbl-03-03', 'rest-03', 3, 4, TRUE),
('tbl-03-04', 'rest-03', 4, 6, TRUE),
('tbl-03-05', 'rest-03', 5, 8, TRUE);

-- 4. Insert Menu Items
-- Bella Italia Menu
INSERT INTO menu_items (id, restaurant_id, name, description, price, category, dietary_tags, image_url, is_available) VALUES
('menu-01-01', 'rest-01', 'Burrata Pugliese', 'Creamy pugliese burrata with heirloom tomatoes, aged balsamic reduction, and fresh basil.', 18.00, 'Appetizer', 'Vegetarian,Gluten-Free', 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=500&q=80', TRUE),
('menu-01-02', 'rest-01', 'Truffle Tagliolini', 'Handmade egg ribbon pasta tossed in black summer truffle butter and 24-month Parmigiano Reggiano.', 28.50, 'Main Course', 'Vegetarian', 'https://images.unsplash.com/photo-1621996346565-e3d5d62811fa?auto=format&fit=crop&w=500&q=80', TRUE),
('menu-01-03', 'rest-01', 'Margherita D.O.P.', 'San Marzano tomatoes, fior di latte mozzarella, fresh basil, and extra virgin olive oil.', 22.00, 'Main Course', 'Vegetarian', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=500&q=80', TRUE),
('menu-01-04', 'rest-01', 'Osso Buco alla Milanese', 'Braised veal shank slow-cooked with white wine and vegetables, served over saffron risotto.', 36.00, 'Main Course', 'Gluten-Free', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80', TRUE),
('menu-01-05', 'rest-01', 'Classic Tiramisu', 'Espresso-soaked ladyfingers, velvety mascarpone cream, and Dutch dark cocoa dusting.', 12.00, 'Dessert', 'Vegetarian', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=500&q=80', TRUE),
('menu-01-06', 'rest-01', 'San Pellegrino Sparkling', 'Imported Italian mineral water with lemon twist.', 5.00, 'Beverage', 'Vegan,Gluten-Free', 'https://images.unsplash.com/photo-1559839914-ba2ce93efb57?auto=format&fit=crop&w=500&q=80', TRUE);

-- Sakura Japanese Menu
INSERT INTO menu_items (id, restaurant_id, name, description, price, category, dietary_tags, image_url, is_available) VALUES
('menu-02-01', 'rest-02', 'Tuna & Salmon Sashimi Deluxe', 'Chef selection of bluefin tuna, king salmon, and yellowtail with fresh wasabi.', 34.00, 'Appetizer', 'Gluten-Free', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80', TRUE),
('menu-02-02', 'rest-02', 'Dragon Roll', 'Eel and cucumber inside topped with sliced avocado, tobiko, and unagi glaze.', 21.00, 'Main Course', '', 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=500&q=80', TRUE),
('menu-02-03', 'rest-02', 'Wagyu Beef Ramen', 'Rich 18-hour tonkotsu broth, A5 Miyazaki wagyu slices, nitamago egg, and scallions.', 27.00, 'Main Course', '', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80', TRUE),
('menu-02-04', 'rest-02', 'Matcha Green Tea Cheesecake', 'Light Japanese souffle cheesecake infused with Kyoto ceremonial matcha.', 11.00, 'Dessert', 'Vegetarian', 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=500&q=80', TRUE);

-- Spice Symphony Menu
INSERT INTO menu_items (id, restaurant_id, name, description, price, category, dietary_tags, image_url, is_available) VALUES
('menu-03-01', 'rest-03', 'Tandoori Murgh', 'Spring chicken marinated in yogurt, Kashmiri chilies, and roasted garam masala.', 24.00, 'Main Course', 'Halal,Gluten-Free', 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=500&q=80', TRUE),
('menu-03-02', 'rest-03', 'Paneer Tikka Masala', 'Charcoal-grilled cottage cheese cubes simmered in spiced tomato fenugreek cream.', 21.00, 'Main Course', 'Vegetarian,Gluten-Free', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80', TRUE),
('menu-03-03', 'rest-03', 'Garlic Butter Naan', 'Freshly baked leavened bread brushed with garlic butter and fresh coriander.', 4.50, 'Appetizer', 'Vegetarian', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80', TRUE),
('menu-03-04', 'rest-03', 'Gulab Jamun Flambé', 'Golden milk dumplings soaked in saffron cardamom syrup.', 8.50, 'Dessert', 'Vegetarian', 'https://images.unsplash.com/photo-1605197148564-90ef59ef6e4d?auto=format&fit=crop&w=500&q=80', TRUE);

-- 5. Insert Sample Reservations
INSERT INTO reservations (id, user_id, restaurant_id, table_id, reservation_date, time_slot, guests, status, special_requests) VALUES
('res-01', 'usr-cust-01', 'rest-01', 'tbl-01-03', CURRENT_DATE + INTERVAL '1 day', '19:00', 4, 'CONFIRMED', 'Anniversary celebration, window table preferred'),
('res-02', 'usr-cust-02', 'rest-02', 'tbl-02-01', CURRENT_DATE + INTERVAL '2 day', '20:00', 2, 'CONFIRMED', 'Quiet corner for business dinner');

-- 6. Insert Sample Orders
INSERT INTO orders (id, user_id, restaurant_id, order_type, table_number, total_amount, status, payment_status, special_notes) VALUES
('ord-01', 'usr-cust-01', 'rest-01', 'DINE_IN', 3, 68.50, 'READY', 'PAID', 'Extra grated parmesan please'),
('ord-02', 'usr-cust-02', 'rest-02', 'TAKEAWAY', NULL, 55.00, 'PREPARING', 'PAID', 'Include chopsticks and soy sauce');

-- 7. Insert Order Items
INSERT INTO order_items (id, order_id, menu_item_id, name, price, quantity, subtotal) VALUES
('ord-item-01', 'ord-01', 'menu-01-01', 'Burrata Pugliese', 18.00, 1, 18.00),
('ord-item-02', 'ord-01', 'menu-01-02', 'Truffle Tagliolini', 28.50, 1, 28.50),
('ord-item-03', 'ord-01', 'menu-01-03', 'Margherita D.O.P.', 22.00, 1, 22.00),
('ord-item-04', 'ord-02', 'menu-02-01', 'Tuna & Salmon Sashimi Deluxe', 34.00, 1, 34.00),
('ord-item-05', 'ord-02', 'menu-02-02', 'Dragon Roll', 21.00, 1, 21.00);

-- 8. Insert Payments
INSERT INTO payments (id, reference_type, reference_id, amount, currency, payment_method, status, transaction_id, card_last4) VALUES
('pay-01', 'ORDER', 'ord-01', 68.50, 'USD', 'CREDIT_CARD', 'COMPLETED', 'txn_sim_98234871923', '4242'),
('pay-02', 'ORDER', 'ord-02', 55.00, 'USD', 'CREDIT_CARD', 'COMPLETED', 'txn_sim_11928471204', '8888');
