const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const db = require('../shared/database');

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

// OpenAPI Specification
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'TABLESERVE - Search Service API',
    version: '1.0.0',
    description: 'Microservice providing multi-faceted restaurant search, full-text matching, dietary filtering, and autocomplete suggestions.'
  },
  servers: [{ url: `http://localhost:${PORT}` }],
  paths: {
    '/health': {
      get: { summary: 'Health check', responses: { 200: { description: 'Healthy' } } }
    },
    '/search': {
      get: {
        summary: 'Multi-filter and text search across restaurants and menus',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'cuisine', in: 'query', schema: { type: 'string' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'minRating', in: 'query', schema: { type: 'number' } },
          { name: 'priceTier', in: 'query', schema: { type: 'string' } },
          { name: 'dietary', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['rating', 'name'] } }
        ],
        responses: { 200: { description: 'Search results' } }
      }
    },
    '/search/cuisines': {
      get: { summary: 'List available cuisines', responses: { 200: { description: 'Cuisines with counts' } } }
    },
    '/search/suggest': {
      get: {
        summary: 'Autocomplete search suggestions',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Suggestions list' } }
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'search-service',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// GET /search - Comprehensive multi-faceted search
app.get('/search', async (req, res) => {
  try {
    const { q, cuisine, city, minRating, priceTier, dietary, sortBy, sortOrder } = req.query;

    let restaurants = await db.find('restaurants');
    const menuItems = await db.find('menu_items');

    // Safe string extractor
    const toStr = val => (Array.isArray(val) ? val[0] : val) || '';

    const qStr = toStr(q);
    const cuisineStr = toStr(cuisine);
    const cityStr = toStr(city);
    const dietaryStr = toStr(dietary);
    const priceTierStr = toStr(priceTier);

    // 1. Text Search matching restaurant name, cuisine, description, city, OR dishes
    if (qStr && qStr.trim()) {
      const searchTerm = qStr.trim().toLowerCase();
      restaurants = restaurants.filter(restaurant => {
        const matchName = (restaurant.name || '').toLowerCase().includes(searchTerm);
        const matchCuisine = (restaurant.cuisine || '').toLowerCase().includes(searchTerm);
        const matchDesc = (restaurant.description || '').toLowerCase().includes(searchTerm);
        const matchCity = (restaurant.city || '').toLowerCase().includes(searchTerm);

        // Also check if any menu item in this restaurant matches the search term
        const matchingDish = menuItems.some(
          m => m.restaurant_id === restaurant.id &&
               ((m.name || '').toLowerCase().includes(searchTerm) ||
                (m.description || '').toLowerCase().includes(searchTerm))
        );

        return matchName || matchCuisine || matchDesc || matchCity || matchingDish;
      });
    }

    // 2. Filter by Cuisine
    if (cuisineStr && cuisineStr.trim()) {
      const c = cuisineStr.trim().toLowerCase();
      restaurants = restaurants.filter(r => (r.cuisine || '').toLowerCase() === c);
    }

    // 3. Filter by City
    if (cityStr && cityStr.trim()) {
      const ct = cityStr.trim().toLowerCase();
      restaurants = restaurants.filter(r => (r.city || '').toLowerCase() === ct);
    }

    // 4. Filter by Minimum Rating
    if (minRating) {
      const rVal = parseFloat(toStr(minRating));
      if (!isNaN(rVal)) {
        restaurants = restaurants.filter(r => parseFloat(r.rating) >= rVal);
      }
    }

    // 5. Filter by Price Tier ($, $$, $$$, $$$$)
    if (priceTierStr && priceTierStr.trim()) {
      restaurants = restaurants.filter(r => r.price_tier === priceTierStr.trim());
    }

    // 6. Filter by Dietary Requirements (e.g. Vegetarian, Halal, Gluten-Free, Vegan)
    if (dietaryStr && dietaryStr.trim()) {
      const targetTag = dietaryStr.trim().toLowerCase();
      restaurants = restaurants.filter(restaurant => {
        const dishes = menuItems.filter(m => m.restaurant_id === restaurant.id);
        return dishes.some(d => (d.dietary_tags || '').toLowerCase().includes(targetTag));
      });
    }

    // 7. Sorting
    if (sortBy === 'rating') {
      const order = sortOrder === 'asc' ? 1 : -1;
      restaurants.sort((a, b) => (parseFloat(a.rating) - parseFloat(b.rating)) * order);
    } else if (sortBy === 'name') {
      const order = sortOrder === 'desc' ? -1 : 1;
      restaurants.sort((a, b) => a.name.localeCompare(b.name) * order);
    }

    // Enrich each restaurant with menu highlights
    const enrichedResults = restaurants.map(r => {
      const dishes = menuItems.filter(m => m.restaurant_id === r.id);
      return {
        ...r,
        featuredDishes: dishes.slice(0, 3).map(d => ({ id: d.id, name: d.name, price: d.price }))
      };
    });

    res.json({
      success: true,
      total: enrichedResults.length,
      filtersApplied: { q, cuisine, city, minRating, priceTier, dietary, sortBy },
      data: enrichedResults
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /search/cuisines - List distinct cuisines with counts
app.get('/search/cuisines', async (req, res) => {
  try {
    const restaurants = await db.find('restaurants');
    const counts = {};
    for (const r of restaurants) {
      counts[r.cuisine] = (counts[r.cuisine] || 0) + 1;
    }

    const result = Object.keys(counts).map(cuisine => ({
      cuisine,
      count: counts[cuisine]
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /search/cities - List distinct cities
app.get('/search/cities', async (req, res) => {
  try {
    const restaurants = await db.find('restaurants');
    const uniqueCities = [...new Set(restaurants.map(r => r.city).filter(Boolean))];
    res.json({ success: true, data: uniqueCities });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /search/suggest - Autocomplete suggestions
app.get('/search/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ success: true, suggestions: [] });
    }

    const term = q.trim().toLowerCase();
    const restaurants = await db.find('restaurants');
    const menuItems = await db.find('menu_items');

    const suggestions = [];

    // Restaurant names
    for (const r of restaurants) {
      if (r.name.toLowerCase().includes(term)) {
        suggestions.push({ type: 'restaurant', text: r.name, id: r.id });
      }
      if (r.cuisine.toLowerCase().includes(term) && !suggestions.some(s => s.text === r.cuisine)) {
        suggestions.push({ type: 'cuisine', text: r.cuisine });
      }
    }

    // Dish names
    for (const m of menuItems) {
      if (m.name.toLowerCase().includes(term) && !suggestions.some(s => s.text === m.name)) {
        suggestions.push({ type: 'dish', text: m.name, restaurant_id: m.restaurant_id });
      }
    }

    res.json({ success: true, suggestions: suggestions.slice(0, 8) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 [Search Service] running on port ${PORT}`);
    console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
