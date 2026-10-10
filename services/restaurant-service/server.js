const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const swaggerUi = require('swagger-ui-express');
const db = require('../shared/database');
const { authenticateToken, requireRole } = require('../shared/auth');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// OpenAPI 3.0 Documentation Specification
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'TABLESERVE - Restaurant Service API',
    version: '1.0.0',
    description: 'Microservice managing restaurants, menu items with image support, and table inventory.'
  },
  servers: [{ url: `http://localhost:${PORT}` }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: { 200: { description: 'Service is healthy' } }
      }
    },
    '/restaurants': {
      get: {
        summary: 'List all restaurants with optional filters',
        parameters: [
          { name: 'cuisine', in: 'query', schema: { type: 'string' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'minRating', in: 'query', schema: { type: 'number' } }
        ],
        responses: { 200: { description: 'List of restaurants' } }
      },
      post: {
        summary: 'Create a new restaurant (Admin only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'cuisine', 'address', 'city'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  cuisine: { type: 'string' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  phone: { type: 'string' },
                  image_url: { type: 'string' },
                  price_tier: { type: 'string' },
                  opening_time: { type: 'string' },
                  closing_time: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Restaurant created' } }
      }
    },
    '/restaurants/{id}': {
      get: {
        summary: 'Get restaurant by ID with menu and tables',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Restaurant details' }, 404: { description: 'Not found' } }
      },
      put: {
        summary: 'Update restaurant details (Admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated' } }
      },
      delete: {
        summary: 'Delete restaurant (Admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' } }
      }
    },
    '/restaurants/{id}/menu': {
      get: {
        summary: 'Get menu items for a restaurant',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'List of menu items' } }
      },
      post: {
        summary: 'Add menu item (Admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 201: { description: 'Item created' } }
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'restaurant-service',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// GET /restaurants - List restaurants
app.get('/restaurants', async (req, res) => {
  try {
    const { cuisine, city, minRating } = req.query;
    let restaurants = await db.find('restaurants');

    if (cuisine) {
      restaurants = restaurants.filter(r => r.cuisine.toLowerCase() === cuisine.toLowerCase());
    }
    if (city) {
      restaurants = restaurants.filter(r => r.city.toLowerCase() === city.toLowerCase());
    }
    if (minRating) {
      restaurants = restaurants.filter(r => Number(r.rating) >= Number(minRating));
    }

    res.json({ success: true, count: restaurants.length, data: restaurants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /restaurants/:id - Detail view
app.get('/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await db.findOne('restaurants', r => r.id === req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    const menu = await db.find('menu_items', m => m.restaurant_id === req.params.id);
    const tables = await db.find('restaurant_tables', t => t.restaurant_id === req.params.id);

    res.json({
      success: true,
      data: {
        ...restaurant,
        menu,
        tables
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /restaurants - Create restaurant (Admin only)
app.post('/restaurants', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const {
      name, description, cuisine, address, city, phone,
      image_url, rating, price_tier, opening_time, closing_time, total_tables
    } = req.body;

    if (!name || !cuisine || !address || !city) {
      return res.status(400).json({ success: false, error: 'Name, cuisine, address, and city are required.' });
    }

    const newRestaurant = {
      id: `rest-${uuidv4().substring(0, 8)}`,
      name,
      description: description || '',
      cuisine,
      address,
      city,
      phone: phone || '',
      image_url: image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      rating: rating ? Number(rating) : 4.5,
      price_tier: price_tier || '$$',
      opening_time: opening_time || '11:00',
      closing_time: closing_time || '23:00',
      total_tables: total_tables ? Number(total_tables) : 10,
      created_at: new Date().toISOString()
    };

    await db.insert('restaurants', newRestaurant);

    // Auto-create initial tables for the new restaurant
    const tableCount = newRestaurant.total_tables;
    for (let i = 1; i <= tableCount; i++) {
      const cap = i <= 2 ? 2 : (i <= 7 ? 4 : (i <= 9 ? 6 : 8));
      await db.insert('restaurant_tables', {
        id: `tbl-${newRestaurant.id}-${i}`,
        restaurant_id: newRestaurant.id,
        table_number: i,
        capacity: cap,
        is_active: true
      });
    }

    res.status(201).json({ success: true, message: 'Restaurant created successfully', data: newRestaurant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /restaurants/:id - Update restaurant (Admin only)
app.put('/restaurants/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const updatedCount = await db.update('restaurants', r => r.id === req.params.id, req.body);
    if (updatedCount === 0) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }
    const updated = await db.findOne('restaurants', r => r.id === req.params.id);
    res.json({ success: true, message: 'Restaurant updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /restaurants/:id - Delete restaurant (Admin only)
app.delete('/restaurants/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const deletedCount = await db.delete('restaurants', r => r.id === req.params.id);
    if (deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }
    await db.delete('menu_items', m => m.restaurant_id === req.params.id);
    await db.delete('restaurant_tables', t => t.restaurant_id === req.params.id);
    res.json({ success: true, message: 'Restaurant and related menu/tables deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /restaurants/:id/menu - Get menu items
app.get('/restaurants/:id/menu', async (req, res) => {
  try {
    const menuItems = await db.find('menu_items', m => m.restaurant_id === req.params.id);
    res.json({ success: true, count: menuItems.length, data: menuItems });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /restaurants/:id/menu - Add menu item (Admin only)
app.post('/restaurants/:id/menu', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, description, price, category, dietary_tags, image_url, is_available } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Item name and price are required' });
    }

    const newItem = {
      id: `menu-${uuidv4().substring(0, 8)}`,
      restaurant_id: req.params.id,
      name,
      description: description || '',
      price: Number(price),
      category: category || 'Main Course',
      dietary_tags: dietary_tags || '',
      image_url: image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
      is_available: is_available !== undefined ? Boolean(is_available) : true,
      created_at: new Date().toISOString()
    };

    await db.insert('menu_items', newItem);
    res.status(201).json({ success: true, message: 'Menu item created successfully', data: newItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /restaurants/:id/menu/:itemId - Update menu item (Admin only)
app.put('/restaurants/:id/menu/:itemId', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const updatedCount = await db.update(
      'menu_items',
      m => m.id === req.params.itemId && m.restaurant_id === req.params.id,
      req.body
    );
    if (updatedCount === 0) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }
    const updated = await db.findOne('menu_items', m => m.id === req.params.itemId);
    res.json({ success: true, message: 'Menu item updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /restaurants/:id/menu/:itemId - Delete menu item (Admin only)
app.delete('/restaurants/:id/menu/:itemId', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const deletedCount = await db.delete(
      'menu_items',
      m => m.id === req.params.itemId && m.restaurant_id === req.params.id
    );
    if (deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /restaurants/:id/tables - List tables
app.get('/restaurants/:id/tables', async (req, res) => {
  try {
    const tables = await db.find('restaurant_tables', t => t.restaurant_id === req.params.id);
    res.json({ success: true, count: tables.length, data: tables });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 [Restaurant Service] running on port ${PORT}`);
    console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
