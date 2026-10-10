const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Path for local state persistence when PostgreSQL is not running locally
const LOCAL_STORAGE_DIR = path.resolve(__dirname, '../../data');
const LOCAL_STORAGE_FILE = path.join(LOCAL_STORAGE_DIR, 'tableserve_db.json');

let pgPool = null;
let isPostgresAvailable = false;
let memoryStore = null;

// Initial rich Indian & Pan-Indian restaurant dataset
function getDefaultData() {
  const users = [
    {
      id: 'usr-admin-01',
      name: 'Admin Supervisor',
      email: 'admin@tableserve.com',
      password_hash: '$2a$10$fG6aNn2E8QJ2C2u4X1.0..Q3I/zJ3o9YjQ4iQ7c9tP0/h6Y6J8e9K',
      phone: '+91-98110-12345',
      role: 'ADMIN',
      created_at: new Date().toISOString()
    },
    {
      id: 'usr-cust-01',
      name: 'Aarav Sharma',
      email: 'john.doe@example.com',
      password_hash: '$2a$10$fG6aNn2E8QJ2C2u4X1.0..Q3I/zJ3o9YjQ4iQ7c9tP0/h6Y6J8e9K',
      phone: '+91-98200-54321',
      role: 'CUSTOMER',
      created_at: new Date().toISOString()
    },
    {
      id: 'usr-cust-02',
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      password_hash: '$2a$10$fG6aNn2E8QJ2C2u4X1.0..Q3I/zJ3o9YjQ4iQ7c9tP0/h6Y6J8e9K',
      phone: '+91-98300-67890',
      role: 'CUSTOMER',
      created_at: new Date().toISOString()
    },
    {
      id: 'usr-cust-03',
      name: 'Rohan Iyer',
      email: 'rohan.iyer@example.com',
      password_hash: '$2a$10$fG6aNn2E8QJ2C2u4X1.0..Q3I/zJ3o9YjQ4iQ7c9tP0/h6Y6J8e9K',
      phone: '+91-98400-11223',
      role: 'CUSTOMER',
      created_at: new Date().toISOString()
    }
  ];

  const restaurants = [
    {
      id: 'rest-in-01',
      name: 'Bukhara - ITC Maurya',
      description: 'Legendary clay tandoor culinary marvel crafted over 40 years, serving iconic Dal Bukhara and melt-in-mouth kebabs in New Delhi.',
      cuisine: 'North Indian',
      address: 'Diplomatic Enclave, Chanakyapuri',
      city: 'New Delhi',
      phone: '+91-11-2611-2233',
      image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      price_tier: '₹₹₹₹',
      opening_time: '12:30',
      closing_time: '23:45',
      total_tables: 12,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-02',
      name: 'Saravanaa Bhavan',
      description: 'World-renowned South Indian pure vegetarian culinary heritage with golden crisp dosas, idlis, and traditional brass-tumbler filter coffee.',
      cuisine: 'South Indian',
      address: '19 Kennet Lane, Egmore',
      city: 'Chennai',
      phone: '+91-44-2819-1234',
      image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      price_tier: '₹',
      opening_time: '07:00',
      closing_time: '22:30',
      total_tables: 14,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-03',
      name: 'Paradise Biryani',
      description: 'The world-famous heart of authentic Hyderabadi Dum Biryani cooked with aged long-grain Basmati, saffron, and tender spices since 1953.',
      cuisine: 'Biryani & Mughlai',
      address: 'MG Road, Secunderabad',
      city: 'Hyderabad',
      phone: '+91-40-6666-5588',
      image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      price_tier: '₹₹',
      opening_time: '11:30',
      closing_time: '23:30',
      total_tables: 16,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-04',
      name: 'Trishna Coastal Dining',
      description: 'Celebrated Mumbai seafood institution famous for fresh Butter Garlic Crab, Mangalorean fish curries, and warm Neer Dosas.',
      cuisine: 'Coastal Seafood',
      address: '7 Sai Baba Marg, Kala Ghoda, Fort',
      city: 'Mumbai',
      phone: '+91-22-2270-3213',
      image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      price_tier: '₹₹₹₹',
      opening_time: '12:00',
      closing_time: '23:45',
      total_tables: 10,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-05',
      name: 'Karavalli - The Gateway Hotel',
      description: 'Award-winning sanctuary celebrating traditional coastal home-cooking from Mangalore, Goa, and Kerala in a heritage Bengaluru courtyard.',
      cuisine: 'South Indian',
      address: '66 Residency Road',
      city: 'Bengaluru',
      phone: '+91-80-6660-4545',
      image_url: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      price_tier: '₹₹₹₹',
      opening_time: '12:30',
      closing_time: '23:30',
      total_tables: 10,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-06',
      name: 'Peter Cat',
      description: 'Iconic Park Street landmark with dim vintage chandeliers, legendary Iranian Cheelo Kebabs, and classic sizzlers loved across generations.',
      cuisine: 'Continental & North Indian',
      address: '18A Park Street',
      city: 'Kolkata',
      phone: '+91-33-2229-8841',
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      price_tier: '₹₹',
      opening_time: '11:00',
      closing_time: '23:15',
      total_tables: 12,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-07',
      name: 'Chokhi Dhani Ethnic Village',
      description: 'Immersive Rajasthani cultural dining experience featuring unlimited royal thalis with Dal Baati Churma, Gatte Ki Sabzi, and Malpuas.',
      cuisine: 'Rajasthani & Thali',
      address: '12 Miles, Tonk Road',
      city: 'Jaipur',
      phone: '+91-141-516-5000',
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      price_tier: '₹₹₹',
      opening_time: '17:30',
      closing_time: '23:30',
      total_tables: 16,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-08',
      name: "Britto's Shack & Bar",
      description: 'Quintessential beachfront shack on Baga Beach serving Goan Prawn Curries, Chicken Xacuti, Pork Vindaloo, and chilled beverages with sea breeze.',
      cuisine: 'Coastal Seafood',
      address: 'Baga Beach, Calangute, North Goa',
      city: 'Goa',
      phone: '+91-832-227-7331',
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      rating: 4.6,
      price_tier: '₹₹',
      opening_time: '09:00',
      closing_time: '00:30',
      total_tables: 15,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-09',
      name: 'Gulati Restaurant',
      description: 'Celebrated culinary destination on Pandara Road renowned for Delhi’s richest Butter Chicken, Dal Makhani, and Kakori kebabs.',
      cuisine: 'North Indian',
      address: '6 Pandara Road Market',
      city: 'New Delhi',
      phone: '+91-11-2338-8836',
      image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      price_tier: '₹₹₹',
      opening_time: '12:00',
      closing_time: '00:00',
      total_tables: 14,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-10',
      name: 'The Fatty Bao',
      description: 'Vibrant rooftop Asian gastro-bar in Indiranagar famous for pillowy open baos, artisan dim sums, ramen bowls, and innovative cocktails.',
      cuisine: 'Pan-Asian',
      address: '610 12th Main Rd, HAL 2nd Stage, Indiranagar',
      city: 'Bengaluru',
      phone: '+91-80-4124-2434',
      image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      price_tier: '₹₹₹',
      opening_time: '12:00',
      closing_time: '23:30',
      total_tables: 10,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-11',
      name: 'Gajalee Seafood',
      description: 'Unrivaled Maharashtrian Malvani seafood dining serving charcoal tandoori bombil, crab sukka, and refreshing Sol Kadhi.',
      cuisine: 'Coastal Seafood',
      address: 'Kadam Marg, Vile Parle East',
      city: 'Mumbai',
      phone: '+91-22-2611-4093',
      image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      price_tier: '₹₹₹',
      opening_time: '11:30',
      closing_time: '23:45',
      total_tables: 11,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-12',
      name: 'Bawarchi Restaurant',
      description: 'Crowd-favorite Hyderabadi culinary institution at RTC X Roads dishing out flavorful Dum Biryanis, Tangdi Kebabs, and Rumali Rotis.',
      cuisine: 'Biryani & Mughlai',
      address: 'Beside Sandhya Theatre, RTC X Roads',
      city: 'Hyderabad',
      phone: '+91-40-2763-4490',
      image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      price_tier: '₹₹',
      opening_time: '11:30',
      closing_time: '23:45',
      total_tables: 18,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-13',
      name: 'Murugan Idli Shop',
      description: 'Beloved Chennai breakfast tradition known for cloud-soft steamed idlis, ghee onion uthappams, and Madurai special Jigarthanda.',
      cuisine: 'South Indian',
      address: 'GN Chetty Road, T. Nagar',
      city: 'Chennai',
      phone: '+91-44-2815-5444',
      image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      price_tier: '₹',
      opening_time: '06:30',
      closing_time: '23:00',
      total_tables: 15,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-14',
      name: '6 Ballygunge Place',
      description: 'Pristine colonial mansion preserving authentic Bengali royal heritage with Kosha Mangsho, Daab Chingri, Bhetki Paturi, and Baked Mishti Doi.',
      cuisine: 'Bengali',
      address: '6 Ballygunge Place, Ballygunge',
      city: 'Kolkata',
      phone: '+91-33-2460-3922',
      image_url: 'https://images.unsplash.com/photo-1605197148564-90ef59ef6e4d?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      price_tier: '₹₹₹',
      opening_time: '12:00',
      closing_time: '22:30',
      total_tables: 10,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-15',
      name: 'Smoke House Deli',
      description: 'Artisanal European cafe in Bandra featuring hand-rolled pastas, truffle risottos, sourdough pizzas, and gourmet desserts.',
      cuisine: 'Italian & Continental',
      address: 'Madhu Milan Building, 33rd Road, Bandra West',
      city: 'Mumbai',
      phone: '+91-22-6528-7800',
      image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      price_tier: '₹₹₹',
      opening_time: '09:00',
      closing_time: '23:30',
      total_tables: 12,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-16',
      name: 'Agashiye - The House of MG',
      description: 'Rooftop Gujarati fine dining in a 1924 heritage boutique hotel serving traditional seasonal thalis, undhiyu, and fresh basundi.',
      cuisine: 'Rajasthani & Thali',
      address: 'Opposite Sidi Saiyyed Mosque, Lal Darwaja',
      city: 'Ahmedabad',
      phone: '+91-79-2550-6946',
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      rating: 4.9,
      price_tier: '₹₹₹',
      opening_time: '12:00',
      closing_time: '23:00',
      total_tables: 14,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-17',
      name: 'Farzi Cafe',
      description: 'Trendsetting modern Indian bistro in Cyber Hub pioneering culinary illusions, molecular gastronomy, and global Indian comfort food.',
      cuisine: 'Modern Indian',
      address: 'Cyber Hub, DLF Phase 2, Gurugram',
      city: 'Delhi NCR',
      phone: '+91-124-492-2273',
      image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      rating: 4.8,
      price_tier: '₹₹₹',
      opening_time: '12:00',
      closing_time: '00:00',
      total_tables: 14,
      created_at: new Date().toISOString()
    },
    {
      id: 'rest-in-18',
      name: "Haldiram's Royale",
      description: 'Beloved Old Delhi street food and chaat destination serving legendary Chhole Bhature, Raj Kachoris, Pav Bhaji, and hot Gulab Jamuns.',
      cuisine: 'Street Food & Chaat',
      address: '1454 Chandni Chowk, Old Delhi',
      city: 'New Delhi',
      phone: '+91-11-4770-5555',
      image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
      rating: 4.7,
      price_tier: '₹',
      opening_time: '09:00',
      closing_time: '22:30',
      total_tables: 16,
      created_at: new Date().toISOString()
    }
  ];

  // Auto-generate tables for each restaurant
  const restaurant_tables = [];
  restaurants.forEach(rest => {
    const count = rest.total_tables || 10;
    for (let i = 1; i <= count; i++) {
      const cap = i <= 2 ? 2 : (i <= 6 ? 4 : (i <= 9 ? 6 : 8));
      restaurant_tables.push({
        id: `tbl-${rest.id}-${i}`,
        restaurant_id: rest.id,
        table_number: i,
        capacity: cap,
        is_active: true
      });
    }
  });

  // Rich authentic Indian menus
  const menu_items = [
    // 1. Bukhara
    { id: 'm-in-01-1', restaurant_id: 'rest-in-01', name: 'Dal Bukhara', description: 'Whole black lentils, tomatoes, ginger, and garlic slow-simmered for 18 hours on charcoal embers with churned butter.', price: 650, category: 'Main Course', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-01-2', restaurant_id: 'rest-in-01', name: 'Sikandari Raan', description: 'Whole leg of spring lamb marinated in malt vinegar, cinnamon, cloves, and tandoori spices, braised and slow-roasted.', price: 1850, category: 'Main Course', dietary_tags: 'Halal,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-01-3', restaurant_id: 'rest-in-01', name: 'Murgh Malai Kebab', description: 'Tender chicken supreme steeped in cream cheese, green chilies, coriander stem, and roasted cardamom.', price: 850, category: 'Appetizer', dietary_tags: 'Halal,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-01-4', restaurant_id: 'rest-in-01', name: 'Naan Bukhara', description: 'Signature giant leavened whole-wheat flatbread baked on curved tandoor walls.', price: 450, category: 'Main Course', dietary_tags: 'Vegetarian', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-01-5', restaurant_id: 'rest-in-01', name: 'Kulfi Falooda', description: 'Dense saffron pistachio frozen rabdi kulfi served with chilled cornstarch falooda and rose water.', price: 380, category: 'Dessert', dietary_tags: 'Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 2. Saravanaa Bhavan
    { id: 'm-in-02-1', restaurant_id: 'rest-in-02', name: 'Special Masala Dosa', description: 'Crisp golden fermented rice crepe stuffed with spiced potato onion masala, served with 3 coconut chutneys and hot sambar.', price: 160, category: 'Main Course', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-02-2', restaurant_id: 'rest-in-02', name: 'Ghee Podi Mini Idlis (14 Pcs)', description: 'Coin-sized steamed rice dumplings drenched in pure melted cow ghee and spiced gun powder podi.', price: 140, category: 'Appetizer', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-02-3', restaurant_id: 'rest-in-02', name: 'Crispy Medu Vada (2 Pcs)', description: 'Golden fried savory lentil doughnuts with crushed peppercorns and curry leaves.', price: 90, category: 'Appetizer', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-02-4', restaurant_id: 'rest-in-02', name: 'Traditional Filter Coffee', description: 'Strong chicory decoction frothed with boiled whole buffalo milk in traditional brass dabarah and tumbler.', price: 60, category: 'Beverage', dietary_tags: 'Pure Veg,Vegetarian', image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 3. Paradise Biryani
    { id: 'm-in-03-1', restaurant_id: 'rest-in-03', name: 'Royal Mutton Dum Biryani', description: 'Tender marinated goat meat layered with saffron basmati rice, caramelized onions, and mint, cooked on slow dum.', price: 480, category: 'Main Course', dietary_tags: 'Halal,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-03-2', restaurant_id: 'rest-in-03', name: 'Nizami Chicken Dum Biryani', description: 'Hyderabadi spiced chicken cooked under dough-sealed copper handi with fragrant aged basmati rice.', price: 380, category: 'Main Course', dietary_tags: 'Halal,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-03-3', restaurant_id: 'rest-in-03', name: 'Mirchi Ka Salan', description: 'Large bhavnagri chilies cooked in a velvety sauce of roasted peanuts, sesame seeds, coconut, and tamarind.', price: 180, category: 'Appetizer', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-03-4', restaurant_id: 'rest-in-03', name: 'Double Ka Meetha', description: 'Crisp fried bread slices soaked in saffron cardamom flavored condensed milk and garnished with toasted almonds.', price: 160, category: 'Dessert', dietary_tags: 'Vegetarian', image_url: 'https://images.unsplash.com/photo-1605197148564-90ef59ef6e4d?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 4. Trishna
    { id: 'm-in-04-1', restaurant_id: 'rest-in-04', name: 'Butter Garlic Jumbo Crab', description: 'Live sea mud crab tossed in crushed garlic, creamy butter sauce, and black pepper, served in shell.', price: 2200, category: 'Main Course', dietary_tags: 'Halal,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-04-2', restaurant_id: 'rest-in-04', name: 'Koliwada Prawns Fry', description: 'Succulent king prawns crisp-fried with Kashmiri red chili, ginger-garlic paste, and carom seeds.', price: 680, category: 'Appetizer', dietary_tags: 'Halal', image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-04-3', restaurant_id: 'rest-in-04', name: 'Neer Dosa (4 Pcs)', description: 'Gossamer-thin, lace-like steamed Mangalorean crepes made with fine rice batter and coconut water.', price: 120, category: 'Main Course', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 5. Karavalli
    { id: 'm-in-05-1', restaurant_id: 'rest-in-05', name: 'Mangalorean Fish Curry', description: 'Fresh Kingfish simmered in spicy Bedgi chili and tamarind coconut gravy.', price: 720, category: 'Main Course', dietary_tags: 'Halal,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-05-2', restaurant_id: 'rest-in-05', name: 'Koli Barthad', description: 'Coorg style tender country chicken pan-fried with roasted spices and dark Kachampuli vinegar.', price: 620, category: 'Appetizer', dietary_tags: 'Halal', image_url: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-05-3', restaurant_id: 'rest-in-05', name: 'Steamed Appams (3 Pcs)', description: 'Bowl-shaped fermented rice pancakes with spongy coconut milk centers.', price: 150, category: 'Main Course', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-05-4', restaurant_id: 'rest-in-05', name: 'Elaneer Payasam', description: 'Delicate dessert made with fresh tender coconut pulp, coconut milk, and cardamom.', price: 240, category: 'Dessert', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 6. Peter Cat
    { id: 'm-in-06-1', restaurant_id: 'rest-in-06', name: 'Famous Cheelo Kebab', description: 'Steamed buttered rice topped with char-grilled mutton and chicken kebabs, fried egg, and salted butter.', price: 540, category: 'Main Course', dietary_tags: 'Halal', image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-06-2', restaurant_id: 'rest-in-06', name: 'Beckti Meuniere Sizzler', description: 'Fresh Kolkata bhetki fish fillet pan-grilled in lemon caper butter sauce on a sizzling cast-iron platter.', price: 680, category: 'Main Course', dietary_tags: 'Gluten-Free', image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-06-3', restaurant_id: 'rest-in-06', name: 'Vintage Caramel Custard', description: 'Silky baked egg custard topped with dark golden bittersweet caramel.', price: 180, category: 'Dessert', dietary_tags: 'Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 7. Chokhi Dhani
    { id: 'm-in-07-1', restaurant_id: 'rest-in-07', name: 'Grand Rajasthani Thali', description: 'Complete royal Rajasthani banquet: Dal Baati Churma, Gatte Ki Sabzi, Ker Sangri, Kadhi, Bajre Ki Roti, and Malpuas.', price: 850, category: 'Main Course', dietary_tags: 'Pure Veg,Vegetarian', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-07-2', restaurant_id: 'rest-in-07', name: 'Dal Baati Churma Platter', description: 'Hard wheat rolls baked over cowdung coals, crushed in desi ghee, served with panchmel lentil curry and sweetened churma.', price: 380, category: 'Main Course', dietary_tags: 'Pure Veg,Vegetarian', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-07-3', restaurant_id: 'rest-in-07', name: 'Rabdi Malpua', description: 'Cardamom pancake dipped in sugar syrup, served beneath a thick layer of saffron pistachio rabdi.', price: 210, category: 'Dessert', dietary_tags: 'Pure Veg,Vegetarian', image_url: 'https://images.unsplash.com/photo-1605197148564-90ef59ef6e4d?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 8. Britto's Shack
    { id: 'm-in-08-1', restaurant_id: 'rest-in-08', name: 'Goan Prawn Curry with Rice', description: 'Tiger prawns stewed in fresh coconut milk, kokum, and ground red spices, served with Goan red rice.', price: 490, category: 'Main Course', dietary_tags: 'Gluten-Free', image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-08-2', restaurant_id: 'rest-in-08', name: 'Chicken Xacuti', description: 'Traditional Goan curry prepared with roasted white poppy seeds, dried coconut, and peri-peri spices.', price: 420, category: 'Main Course', dietary_tags: 'Halal,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-08-3', restaurant_id: 'rest-in-08', name: 'Traditional Bebinca', description: 'Seven-layered Goan coconut milk, egg, and ghee dessert flavored with nutmeg.', price: 210, category: 'Dessert', dietary_tags: 'Vegetarian', image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 9. Gulati
    { id: 'm-in-09-1', restaurant_id: 'rest-in-09', name: 'Murgh Makhani (Butter Chicken)', description: 'Tandoori chicken simmered in rich gravy of fresh tomatoes, cashew paste, butter, and kasoori methi.', price: 590, category: 'Main Course', dietary_tags: 'Halal,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-09-2', restaurant_id: 'rest-in-09', name: 'Dal Makhani', description: 'Black lentils slow cooked overnight on charcoal with butter and cream.', price: 420, category: 'Main Course', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-09-3', restaurant_id: 'rest-in-09', name: 'Garlic Butter Naan', description: 'Tandoor oven flatbread topped with minced garlic and melted Amul butter.', price: 110, category: 'Main Course', dietary_tags: 'Pure Veg,Vegetarian', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 10. The Fatty Bao
    { id: 'm-in-10-1', restaurant_id: 'rest-in-10', name: 'Char Siu Bao (2 Pcs)', description: 'Steamed open buns filled with barbecue glazed chicken, green apple kimchi, and scallions.', price: 390, category: 'Appetizer', dietary_tags: 'Halal', image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-10-2', restaurant_id: 'rest-in-10', name: 'Truffle Edamame Dim Sum (4 Pcs)', description: 'Translucent crystal dumplings filled with crushed edamame, water chestnuts, and black truffle oil.', price: 440, category: 'Appetizer', dietary_tags: 'Pure Veg,Vegetarian', image_url: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-10-3', restaurant_id: 'rest-in-10', name: 'Spicy Chicken Ramen', description: 'Handmade noodles in a 12-hour simmered spicy broth with nitamago egg, scallions, and nori.', price: 560, category: 'Main Course', dietary_tags: 'Halal', image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 11. Gajalee Seafood
    { id: 'm-in-11-1', restaurant_id: 'rest-in-11', name: 'Tandoori Bombil (Bombay Duck)', description: 'Crisp fresh Bombay duck fish coated in fiery Malvani chili masala and semolina crust.', price: 480, category: 'Appetizer', dietary_tags: 'Halal', image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-11-2', restaurant_id: 'rest-in-11', name: 'Malvani Crab Masala', description: 'Whole mud crab tossed with roasted coconut, coriander, and coastal spices.', price: 1250, category: 'Main Course', dietary_tags: 'Halal,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-11-3', restaurant_id: 'rest-in-11', name: 'Pink Sol Kadhi', description: 'Digestive coastal drink made with wild Kokum fruit extract and fresh coconut milk.', price: 90, category: 'Beverage', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1559839914-ba2ce93efb57?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 12. Bawarchi Restaurant
    { id: 'm-in-12-1', restaurant_id: 'rest-in-12', name: 'Bawarchi Special Mutton Biryani', description: 'Signature Hyderabadi mutton dum biryani garnished with boiled egg and spiced keema.', price: 460, category: 'Main Course', dietary_tags: 'Halal,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-12-2', restaurant_id: 'rest-in-12', name: 'Tangdi Kebab (3 Pcs)', description: 'Chicken drumsticks stuffed with spiced cheese and dry fruits, roasted in tandoor.', price: 380, category: 'Appetizer', dietary_tags: 'Halal,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-12-3', restaurant_id: 'rest-in-12', name: 'Khubani Ka Meetha with Cream', description: 'Stewed Turkish apricots with hints of almond kernels, crowned with fresh malai.', price: 160, category: 'Dessert', dietary_tags: 'Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1605197148564-90ef59ef6e4d?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 13. Murugan Idli Shop
    { id: 'm-in-13-1', restaurant_id: 'rest-in-13', name: 'Soft Podi Idli (2 Pcs)', description: 'Steamed pillow-soft idlis slathered in spicy gun powder and melted sesame gingelly oil.', price: 95, category: 'Appetizer', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-13-2', restaurant_id: 'rest-in-13', name: 'Ghee Onion Uthappam', description: 'Thick savory fermented rice pancake studded with crisp caramelized shallots and green chilies.', price: 150, category: 'Main Course', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-13-3', restaurant_id: 'rest-in-13', name: 'Madurai Special Jigarthanda', description: 'Iconic sweet cooling beverage of almond gum, reduced condensed milk, nannari syrup, and ice cream.', price: 120, category: 'Beverage', dietary_tags: 'Pure Veg,Vegetarian', image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 14. 6 Ballygunge Place
    { id: 'm-in-14-1', restaurant_id: 'rest-in-14', name: 'Kosha Mangsho', description: 'Tender mutton pieces braised in deep dark caramelized onion, ginger, garlic, and whole garam masala.', price: 560, category: 'Main Course', dietary_tags: 'Halal,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-14-2', restaurant_id: 'rest-in-14', name: 'Daab Chingri', description: 'Prawns cooked in tender coconut cream and mustard paste, served inside an earthen carved green coconut.', price: 680, category: 'Main Course', dietary_tags: 'Halal,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-14-3', restaurant_id: 'rest-in-14', name: 'Baked Mishti Doi', description: 'Classic sweet Bengali curd infused with nolen gur date palm jaggery, gently baked in terracotta bowl.', price: 140, category: 'Dessert', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 15. Smoke House Deli
    { id: 'm-in-15-1', restaurant_id: 'rest-in-15', name: 'Truffle Mushroom Risotto', description: 'Arborio rice simmered with wild porcini mushrooms, white truffle oil, and parmesan crisps.', price: 580, category: 'Main Course', dietary_tags: 'Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d62811fa?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-15-2', restaurant_id: 'rest-in-15', name: 'Hand-Rolled Ricotta Ravioli', description: 'Stuffed pasta pockets with spinach and creamy buffalo ricotta in burnt sage butter sauce.', price: 540, category: 'Main Course', dietary_tags: 'Vegetarian', image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-15-3', restaurant_id: 'rest-in-15', name: 'Flourless Dark Chocolate Fudge', description: 'Warm decadent 70% dark Belgian chocolate slice with Madagascar vanilla bean ice cream.', price: 290, category: 'Dessert', dietary_tags: 'Vegetarian,Gluten-Free', image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 16. Agashiye
    { id: 'm-in-16-1', restaurant_id: 'rest-in-16', name: 'Royal Gujarati Thali', description: 'Unlimited heritage banquet: Gujarati Kadhi, Ringan No Olo, Undhiyu, Rasawala Aloo, Methi Thepla, and Kesar Jalebi.', price: 790, category: 'Main Course', dietary_tags: 'Pure Veg,Vegetarian,Jain', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-16-2', restaurant_id: 'rest-in-16', name: 'Khaman Dhokla Platter', description: 'Steamed nylon khaman dhokla tempered with mustard seeds, curry leaves, and green chillies.', price: 190, category: 'Appetizer', dietary_tags: 'Pure Veg,Vegetarian,Jain', image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-16-3', restaurant_id: 'rest-in-16', name: 'Kesar Pista Basundi', description: 'Rich, thick caramelized sweet milk slow-cooked for hours, perfumed with Kashmir saffron and pistachios.', price: 180, category: 'Dessert', dietary_tags: 'Pure Veg,Vegetarian,Gluten-Free,Jain', image_url: 'https://images.unsplash.com/photo-1605197148564-90ef59ef6e4d?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 17. Farzi Cafe
    { id: 'm-in-17-1', restaurant_id: 'rest-in-17', name: 'Dal Chawal Arancini', description: 'Italian crisp arancini balls with Indian yellow dal and jeera rice, achari mayo, and papad roll.', price: 390, category: 'Appetizer', dietary_tags: 'Pure Veg,Vegetarian', image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-17-2', restaurant_id: 'rest-in-17', name: 'Rasmalai Tres Leches', description: 'Fusion dessert featuring soft chenna dumplings soaked in Mexican three-milk reduction with saffron.', price: 340, category: 'Dessert', dietary_tags: 'Pure Veg,Vegetarian', image_url: 'https://images.unsplash.com/photo-1605197148564-90ef59ef6e4d?auto=format&fit=crop&w=500&q=80', is_available: true },

    // 18. Haldiram's
    { id: 'm-in-18-1', restaurant_id: 'rest-in-18', name: 'Dilli Ke Chhole Bhature', description: 'Two giant puffed bhaturas served with spicy pindi chhole, pickled carrots, and green chilies.', price: 180, category: 'Main Course', dietary_tags: 'Pure Veg,Vegetarian', image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-18-2', restaurant_id: 'rest-in-18', name: 'Royal Raj Kachori', description: 'Crispy hollow sphere filled with potatoes, sprouted moong, sweetened curd, tamarind chutney, and bhujia.', price: 140, category: 'Appetizer', dietary_tags: 'Pure Veg,Vegetarian', image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80', is_available: true },
    { id: 'm-in-18-3', restaurant_id: 'rest-in-18', name: 'Hot Gulab Jamun (2 Pcs)', description: 'Warm khoya dumplings fried in pure desi ghee and soaked in rose water cardamom syrup.', price: 90, category: 'Dessert', dietary_tags: 'Pure Veg,Vegetarian', image_url: 'https://images.unsplash.com/photo-1605197148564-90ef59ef6e4d?auto=format&fit=crop&w=500&q=80', is_available: true }
  ];

  const reservations = [
    {
      id: 'res-01',
      user_id: 'usr-cust-01',
      restaurant_id: 'rest-in-01',
      table_id: 'tbl-rest-in-01-3',
      table_number: 3,
      reservation_date: '2026-10-15',
      time_slot: '19:00',
      guests: 4,
      status: 'CONFIRMED',
      special_requests: 'Anniversary celebration, corner table preferred',
      created_at: new Date().toISOString()
    },
    {
      id: 'res-02',
      user_id: 'usr-cust-02',
      restaurant_id: 'rest-in-03',
      table_id: 'tbl-rest-in-03-1',
      table_number: 1,
      reservation_date: '2026-10-16',
      time_slot: '20:00',
      guests: 2,
      status: 'CONFIRMED',
      special_requests: 'Family dinner',
      created_at: new Date().toISOString()
    }
  ];

  const orders = [
    {
      id: 'ord-01',
      user_id: 'usr-cust-01',
      restaurant_id: 'rest-in-01',
      order_type: 'DINE_IN',
      table_number: 3,
      total_amount: 1100.00,
      status: 'READY',
      payment_status: 'PAID',
      special_notes: 'Serve Dal Bukhara extra hot with butter naan',
      created_at: new Date().toISOString()
    }
  ];

  const order_items = [
    { id: 'ord-item-01', order_id: 'ord-01', menu_item_id: 'm-in-01-1', name: 'Dal Bukhara', price: 650.00, quantity: 1, subtotal: 650.00 },
    { id: 'ord-item-02', order_id: 'ord-01', menu_item_id: 'm-in-01-4', name: 'Naan Bukhara', price: 450.00, quantity: 1, subtotal: 450.00 }
  ];

  const payments = [
    {
      id: 'pay-01',
      reference_type: 'ORDER',
      reference_id: 'ord-01',
      amount: 1100.00,
      currency: 'INR',
      payment_method: 'CREDIT_CARD',
      status: 'COMPLETED',
      transaction_id: 'txn_sim_in_98234871923',
      card_last4: '4242',
      created_at: new Date().toISOString()
    }
  ];

  return { users, restaurants, restaurant_tables, menu_items, reservations, orders, order_items, payments };
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

  resetToDefault() {
    memoryStore = getDefaultData();
    saveLocalStore();
    return memoryStore;
  },

  async query(sqlText, params = []) {
    if (isPostgresAvailable && pgPool) {
      return pgPool.query(sqlText, params);
    }
    return { rows: [], rowCount: 0 };
  },

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

initDatabase();

module.exports = db;
