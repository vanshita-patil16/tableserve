const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const swaggerUi = require('swagger-ui-express');
const db = require('../shared/database');
const { authenticateToken, requireRole } = require('../shared/auth');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

// OpenAPI Specification
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'TABLESERVE - Ordering Service API',
    version: '1.0.0',
    description: 'Microservice managing order placement, order items, status lifecycle (Placed, Preparing, Ready, Served), and order history.'
  },
  servers: [{ url: `http://localhost:${PORT}` }],
  paths: {
    '/health': {
      get: { summary: 'Health check', responses: { 200: { description: 'Healthy' } } }
    },
    '/orders': {
      get: {
        summary: 'List orders (Customer sees own, Admin sees all)',
        responses: { 200: { description: 'List of orders' } }
      },
      post: {
        summary: 'Place new order',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['restaurant_id', 'items'],
                properties: {
                  restaurant_id: { type: 'string' },
                  order_type: { type: 'string', enum: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'] },
                  table_number: { type: 'integer' },
                  special_notes: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['menu_item_id', 'quantity'],
                      properties: {
                        menu_item_id: { type: 'string' },
                        quantity: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Order placed' } }
      }
    },
    '/orders/{id}': {
      get: {
        summary: 'Get order details with items',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Order details' } }
      }
    },
    '/orders/{id}/status': {
      put: {
        summary: 'Update order lifecycle status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['PLACED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED']
                  }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Status updated' } }
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ordering-service',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// GET /orders - List orders
app.get('/orders', authenticateToken, async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'ADMIN') {
      orders = await db.find('orders');
    } else {
      orders = await db.find('orders', o => o.user_id === req.user.id);
    }

    const allOrderItems = await db.find('order_items');
    const restaurants = await db.find('restaurants');

    const enriched = orders.map(order => {
      const items = allOrderItems.filter(item => item.order_id === order.id);
      const restaurant = restaurants.find(r => r.id === order.restaurant_id);
      return {
        ...order,
        restaurant_name: restaurant ? restaurant.name : 'Unknown Restaurant',
        restaurant_image: restaurant ? restaurant.image_url : '',
        items
      };
    });

    enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /orders/:id - Single order details
app.get('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const order = await db.findOne('orders', o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (req.user.role !== 'ADMIN' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const items = await db.find('order_items', item => item.order_id === order.id);
    const restaurant = await db.findOne('restaurants', r => r.id === order.restaurant_id);

    res.json({
      success: true,
      data: {
        ...order,
        restaurant_name: restaurant ? restaurant.name : 'Unknown Restaurant',
        restaurant,
        items
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /orders - Place new order
app.post('/orders', authenticateToken, async (req, res) => {
  try {
    const { restaurant_id, items, order_type, table_number, special_notes } = req.body;

    if (!restaurant_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'restaurant_id and a non-empty items array are required'
      });
    }

    const restaurant = await db.findOne('restaurants', r => r.id === restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    // Fetch actual menu items to calculate server-verified pricing
    const menuItems = await db.find('menu_items', m => m.restaurant_id === restaurant_id);
    const menuMap = new Map(menuItems.map(m => [m.id, m]));

    let calculatedTotal = 0;
    const resolvedItems = [];

    for (const requestedItem of items) {
      const menuItem = menuMap.get(requestedItem.menu_item_id);
      if (!menuItem) {
        return res.status(400).json({
          success: false,
          error: `Invalid menu item ID: ${requestedItem.menu_item_id}`
        });
      }

      const qty = Math.max(1, parseInt(requestedItem.quantity) || 1);
      const subtotal = Number((menuItem.price * qty).toFixed(2));
      calculatedTotal += subtotal;

      resolvedItems.push({
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: qty,
        subtotal
      });
    }

    const orderId = `ord-${uuidv4().substring(0, 8)}`;
    const newOrder = {
      id: orderId,
      user_id: req.user.id,
      restaurant_id,
      order_type: order_type || 'DINE_IN',
      table_number: table_number ? parseInt(table_number) : null,
      total_amount: Number(calculatedTotal.toFixed(2)),
      status: 'PLACED',
      payment_status: 'PAID', // Simulated paid upon placement in fast checkout
      special_notes: special_notes || '',
      created_at: new Date().toISOString()
    };

    await db.insert('orders', newOrder);

    // Insert order items
    for (const item of resolvedItems) {
      await db.insert('order_items', {
        id: `ord-item-${uuidv4().substring(0, 8)}`,
        order_id: orderId,
        menu_item_id: item.menu_item_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        ...newOrder,
        items: resolvedItems
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /orders/:id/status - Update order lifecycle status
app.put('/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['PLACED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${allowed.join(', ')}`
      });
    }

    const order = await db.findOne('orders', o => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Only Admin can update status, or customer can CANCEL if still in PLACED state
    if (req.user.role !== 'ADMIN') {
      if (order.user_id !== req.user.id || status !== 'CANCELLED' || order.status !== 'PLACED') {
        return res.status(403).json({
          success: false,
          error: 'Only administrators or kitchen staff can change order processing stages.'
        });
      }
    }

    await db.update('orders', o => o.id === req.params.id, { status });

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      orderId: req.params.id,
      newStatus: status
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /orders/restaurant/:restaurantId - Kitchen Display view
app.get('/orders/restaurant/:restaurantId', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const orders = await db.find('orders', o => o.restaurant_id === req.params.restaurantId);
    const allOrderItems = await db.find('order_items');

    const ordersWithItems = orders.map(order => ({
      ...order,
      items: allOrderItems.filter(i => i.order_id === order.id)
    }));

    ordersWithItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, count: ordersWithItems.length, data: ordersWithItems });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 [Ordering Service] running on port ${PORT}`);
    console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
