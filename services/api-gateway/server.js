const express = require('express');
const cors = require('cors');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const swaggerUi = require('swagger-ui-express');
const db = require('../shared/database');
const { hashPassword, comparePassword, generateToken, authenticateToken, requireRole } = require('../shared/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Upstream service base URLs (configured for local or docker)
const SERVICES = {
  restaurant: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:5001',
  reservation: process.env.RESERVATION_SERVICE_URL || 'http://localhost:5002',
  ordering: process.env.ORDERING_SERVICE_URL || 'http://localhost:5003',
  search: process.env.SEARCH_SERVICE_URL || 'http://localhost:5004'
};

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/api-docs') && !req.path.startsWith('/static')) {
      console.log(`[GATEWAY] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Comprehensive Unified Swagger 3.0 Documentation
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'TABLESERVE - Enterprise Microservices API Gateway',
    version: '1.0.0',
    description: 'Unified API Gateway routing to Restaurant, Reservation & Payment, Ordering, Search, Auth, and Amazon Lex Chatbot services.'
  },
  servers: [{ url: `http://localhost:${PORT}` }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/health': {
      get: { summary: 'API Gateway Health Status', responses: { 200: { description: 'Healthy' } } }
    },
    '/api/auth/register': {
      post: {
        summary: 'Register new user account (Customer or Admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Sarah Connor' },
                  email: { type: 'string', example: 'sarah@example.com' },
                  password: { type: 'string', example: 'Secure@123' },
                  phone: { type: 'string', example: '+1-555-0199' },
                  role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'], default: 'CUSTOMER' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Account registered and JWT returned' } }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Log in with credentials',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@tableserve.com' },
                  password: { type: 'string', example: 'Admin@123' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'JWT authentication token' } }
      }
    },
    '/api/auth/profile': {
      get: {
        summary: 'Get current user profile',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'User profile details' } }
      }
    },
    '/api/chatbot/message': {
      post: {
        summary: 'Interact with TABLESERVE Amazon Lex Bot (8 Intents)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'Find me an Italian restaurant in New York' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Chatbot intent fulfillment and response message' } }
      }
    },
    '/api/restaurants': {
      get: { summary: 'Proxy to Restaurant Service: List restaurants', responses: { 200: { description: 'List' } } }
    },
    '/api/reservations': {
      get: { summary: 'Proxy to Reservation Service: List reservations', security: [{ BearerAuth: [] }], responses: { 200: { description: 'List' } } },
      post: { summary: 'Proxy to Reservation Service: Create reservation', security: [{ BearerAuth: [] }], responses: { 201: { description: 'Created' } } }
    },
    '/api/orders': {
      get: { summary: 'Proxy to Ordering Service: List orders', security: [{ BearerAuth: [] }], responses: { 200: { description: 'List' } } },
      post: { summary: 'Proxy to Ordering Service: Place order', security: [{ BearerAuth: [] }], responses: { 201: { description: 'Created' } } }
    },
    '/api/search': {
      get: { summary: 'Proxy to Search Service: Multi-filter search', responses: { 200: { description: 'Search results' } } }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Proxy Dispatcher Helper
async function proxyRequest(targetBaseUrl, req, res, servicePrefix) {
  try {
    const targetUrl = new URL(targetBaseUrl);
    const cleanPath = req.path === '/' ? '' : req.path;
    targetUrl.pathname = `${servicePrefix}${cleanPath}`;

    // Set query parameters cleanly
    for (const [key, val] of Object.entries(req.query)) {
      targetUrl.searchParams.set(key, val);
    }

    const headers = { ...req.headers };
    delete headers.host;
    delete headers['content-length'];

    const fetchOptions = {
      method: req.method,
      headers: {
        'content-type': 'application/json',
        ...(req.headers.authorization ? { authorization: req.headers.authorization } : {})
      }
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);
    const data = await response.json().catch(() => ({}));

    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({
      success: false,
      error: `Service Unavailable: Failed to connect to downstream service at ${targetBaseUrl}`,
      details: err.message
    });
  }
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const existing = await db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      id: `usr-${uuidv4().substring(0, 8)}`,
      name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      phone: phone || '',
      role: role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
      created_at: new Date().toISOString()
    };

    await db.insert('users', newUser);
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.findOne('users', u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }
    const { password_hash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/users (Admin only)
app.get('/api/auth/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await db.find('users');
    const safeUsers = users.map(({ password_hash, ...rest }) => rest);
    res.json({ success: true, count: safeUsers.length, users: safeUsers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Amazon Lex Chatbot Fulfillment Engine (8 Intents)
// -------------------------------------------------------------
app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { message, sessionAttributes } = req.body;
    const text = (message || '').trim().toLowerCase();

    const restaurants = await db.find('restaurants');
    const menuItems = await db.find('menu_items');
    const reservations = await db.find('reservations');

    let responseIntent = 'FallbackIntent';
    let replyText = '';
    let actionData = null;

    // 1. GreetingIntent
    if (text.match(/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)\b/)) {
      responseIntent = 'GreetingIntent';
      replyText = `Hello! Welcome to TABLESERVE! 👋 I'm your dining concierge. I can help you search restaurants, view menus, make or cancel table reservations, and track order statuses. What would you like to do today?`;
    }
    // 2. HelpIntent
    else if (text.includes('help') || text.includes('what can you do') || text.includes('how to use')) {
      responseIntent = 'HelpIntent';
      replyText = `Here is what I can do for you:\n• "Search restaurants" (e.g., "Find Italian restaurants in New York")\n• "View menu" (e.g., "Show menu for Bella Italia")\n• "Reserve a table" (e.g., "Book table at Bella Italia for 2")\n• "Check my reservation" (e.g., "Check status of res-01")\n• "Cancel reservation" (e.g., "Cancel res-01")\n• "Order food" (e.g., browse menu and add to cart)`;
    }
    // 3. RestaurantSearchIntent
    else if (text.includes('search') || text.includes('find') || text.includes('recommend') ||
             text.includes('italian') || text.includes('japanese') || text.includes('sushi') ||
             text.includes('indian') || text.includes('steakhouse') || text.includes('mexican') || text.includes('french')) {
      responseIntent = 'RestaurantSearchIntent';

      let matched = restaurants;
      if (text.includes('italian')) matched = restaurants.filter(r => r.cuisine === 'Italian');
      else if (text.includes('japanese') || text.includes('sushi')) matched = restaurants.filter(r => r.cuisine === 'Japanese');
      else if (text.includes('indian') || text.includes('curry')) matched = restaurants.filter(r => r.cuisine === 'Indian');
      else if (text.includes('french')) matched = restaurants.filter(r => r.cuisine === 'French');
      else if (text.includes('mexican') || text.includes('taco')) matched = restaurants.filter(r => r.cuisine === 'Mexican');
      else if (text.includes('steak')) matched = restaurants.filter(r => r.cuisine === 'Steakhouse');

      if (matched.length > 0) {
        const topRest = matched[0];
        replyText = `I found ${matched.length} great option(s)! Top pick: **${topRest.name}** (${topRest.cuisine}, rated ${topRest.rating}★). Located at ${topRest.address}, ${topRest.city}. Would you like to view its menu or book a table?`;
        actionData = { type: 'RESTAURANTS_FOUND', list: matched.map(r => ({ id: r.id, name: r.name, cuisine: r.cuisine, rating: r.rating })) };
      } else {
        replyText = `I couldn't find a restaurant matching that exact query. We have great Italian, Japanese, Indian, French, Mexican, and Steakhouse restaurants available!`;
      }
    }
    // 4. MenuIntent
    else if (text.includes('menu') || text.includes('dishes') || text.includes('food') || text.includes('eat')) {
      responseIntent = 'MenuIntent';
      // Look for restaurant name mentioned
      const matchedRest = restaurants.find(r => text.includes(r.name.toLowerCase()) || text.includes(r.cuisine.toLowerCase()));
      const targetRest = matchedRest || restaurants[0];
      const items = menuItems.filter(m => m.restaurant_id === targetRest.id);

      const highlights = items.slice(0, 3).map(i => `• ${i.name} ($${i.price}) - ${i.category}`).join('\n');
      replyText = `Here are signature highlights from **${targetRest.name}**:\n${highlights}\n\nYou can order these directly or view the full menu in the restaurant view!`;
      actionData = { type: 'MENU_SHOWN', restaurantId: targetRest.id, items };
    }
    // 5. CancelReservationIntent
    else if (text.includes('cancel') && (text.includes('reservation') || text.includes('booking') || text.includes('res-'))) {
      responseIntent = 'CancelReservationIntent';
      const idMatch = text.match(/res-[a-z0-9-]+/i);
      if (idMatch) {
        const resId = idMatch[0];
        const targetRes = reservations.find(r => r.id.toLowerCase() === resId.toLowerCase());
        if (targetRes) {
          await db.update('reservations', r => r.id === targetRes.id, { status: 'CANCELLED' });
          replyText = `Your reservation **#${targetRes.id}** has been cancelled successfully. Your table slot has been released back into availability.`;
        } else {
          replyText = `I couldn't find reservation #${resId}. Please check the ID in your Reservations tab.`;
        }
      } else {
        replyText = `To cancel a reservation, please provide your reservation ID (for example: "Cancel reservation res-01").`;
      }
    }
    // 6. ReservationStatusIntent
    else if (text.includes('status') || text.includes('booking') || text.includes('my reservation')) {
      responseIntent = 'ReservationStatusIntent';
      const idMatch = text.match(/res-[a-z0-9-]+/i);
      let targetRes;
      if (idMatch) {
        targetRes = reservations.find(r => r.id.toLowerCase() === idMatch[0].toLowerCase());
      } else {
        targetRes = reservations.filter(r => r.status !== 'CANCELLED')[0];
      }

      if (targetRes) {
        const rest = restaurants.find(r => r.id === targetRes.restaurant_id);
        replyText = `Reservation **#${targetRes.id}** at **${rest ? rest.name : 'Restaurant'}** is **${targetRes.status}** for ${targetRes.guests} guests on ${targetRes.reservation_date} at ${targetRes.time_slot}.`;
        actionData = { type: 'RESERVATION_DETAILS', reservation: targetRes };
      } else {
        replyText = `You don't currently have any active reservations. Would you like to book a table at one of our restaurants?`;
      }
    }
    // 7. ReservationIntent
    else if (text.includes('book') || text.includes('reserve') || text.includes('table')) {
      responseIntent = 'ReservationIntent';
      const matchedRest = restaurants.find(r => text.includes(r.name.toLowerCase()));
      if (matchedRest) {
        replyText = `I'd love to help you book a table at **${matchedRest.name}**! Click "Book Table" on the restaurant card or tell me your preferred date (e.g., 2026-10-15), time slot (e.g., 19:00), and number of guests.`;
      } else {
        replyText = `Certainly! Which restaurant would you like to book a table at? We have Bella Italia, Sakura Bistro, Spice Symphony, Le Petit Bouchon, El Fuego, and The Prime Oakhouse.`;
      }
    }
    // 8. FallbackIntent
    else {
      responseIntent = 'FallbackIntent';
      replyText = `I'm not quite sure I understood that. You can ask me to search restaurants by cuisine, show a menu, check or cancel a reservation, or type "help" for a list of features!`;
    }

    res.json({
      success: true,
      bot: 'AmazonLex-TABLESERVE-v2',
      intent: responseIntent,
      reply: replyText,
      actionData,
      sessionId: req.body.sessionId || uuidv4()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// Reverse Proxy Routes to Microservices
// -------------------------------------------------------------

// Route /api/restaurants* -> Restaurant Service (Port 5001)
app.use('/api/restaurants', async (req, res) => {
  await proxyRequest(SERVICES.restaurant, req, res, '/restaurants');
});

// Route /api/reservations* -> Reservation Service (Port 5002)
app.use('/api/reservations', async (req, res) => {
  await proxyRequest(SERVICES.reservation, req, res, '/reservations');
});

// Route /api/payments* -> Reservation & Payment Service (Port 5002)
app.use('/api/payments', async (req, res) => {
  await proxyRequest(SERVICES.reservation, req, res, '/payments');
});

// Route /api/orders* -> Ordering Service (Port 5003)
app.use('/api/orders', async (req, res) => {
  await proxyRequest(SERVICES.ordering, req, res, '/orders');
});

// Route /api/search* -> Search Service (Port 5004)
app.use('/api/search', async (req, res) => {
  await proxyRequest(SERVICES.search, req, res, '/search');
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    routes: {
      auth: '/api/auth/*',
      chatbot: '/api/chatbot/*',
      restaurants: '/api/restaurants/*',
      reservations: '/api/reservations/*',
      payments: '/api/payments/*',
      orders: '/api/orders/*',
      search: '/api/search/*'
    }
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 [API Gateway] running on port ${PORT}`);
    console.log(`📖 Unified Swagger API Docs: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
