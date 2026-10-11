const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const swaggerUi = require('swagger-ui-express');
const db = require('../shared/database');
const { authenticateToken } = require('../shared/auth');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

const { execFile } = require('child_process');

// AWS SNS Notification Dispatcher (Dispatches to real AWS SNS Topic + local fallback)
async function dispatchSnsNotification(reservation, user, restaurant) {
  const messagePayload = {
    eventType: 'RESERVATION_CONFIRMED',
    reservationId: reservation.id,
    customerName: user ? user.name : 'Valued Customer',
    customerEmail: user ? user.email : '',
    restaurantName: restaurant ? restaurant.name : 'TABLESERVE Partner',
    date: reservation.reservation_date,
    time: reservation.time_slot,
    guests: reservation.guests,
    timestamp: new Date().toISOString()
  };

  const topicArn = process.env.AWS_SNS_TOPIC_ARN || 'arn:aws:sns:us-east-1:515794172620:tableserve-reservation-confirmations';
  const region = process.env.AWS_REGION || 'us-east-1';

  const subject = `TABLESERVE: Reservation Confirmed at ${messagePayload.restaurantName}`;
  const messageText = `Dear ${messagePayload.customerName},\n\n` +
    `Your table reservation has been successfully CONFIRMED at ${messagePayload.restaurantName}!\n\n` +
    `• Reservation ID: #${messagePayload.reservationId}\n` +
    `• Date & Time: ${messagePayload.date} at ${messagePayload.time}\n` +
    `• Party Size: ${messagePayload.guests} Guests\n` +
    `• Status: CONFIRMED\n\n` +
    `Thank you for dining with TABLESERVE!\n- TABLESERVE Concierge Team`;

  console.log(`[AWS SNS] Dispatching real notification to topic: ${topicArn}`);

  // Call AWS CLI sns publish (pre-installed natively on Amazon Linux 2023 EC2)
  execFile('aws', [
    'sns', 'publish',
    '--topic-arn', topicArn,
    '--subject', subject,
    '--message', messageText,
    '--region', region
  ], (err, stdout, stderr) => {
    if (err) {
      console.warn(`[AWS SNS Notice] AWS CLI SNS publish: ${err.message || stderr}`);
    } else {
      console.log(`🎉 [AWS SNS SUCCESS] Real Email dispatched to subscribers! Result: ${stdout.trim()}`);
    }
  });

  console.log(`🔔 [SNS Event Notification] Broadcasted to subscribers:`);
  console.log(`   Reservation: #${reservation.id} | Restaurant: ${messagePayload.restaurantName}`);
  console.log(`   Customer: ${messagePayload.customerName} (${messagePayload.customerEmail}) | Slot: ${reservation.reservation_date} ${reservation.time_slot}`);

  return messagePayload;
}

// Swagger Specification
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'TABLESERVE - Reservation & Payment Service API',
    version: '1.0.0',
    description: 'Microservice managing table reservations, double-booking prevention, simulated payments, and SNS notifications.'
  },
  servers: [{ url: `http://localhost:${PORT}` }],
  paths: {
    '/health': {
      get: { summary: 'Health check', responses: { 200: { description: 'Healthy' } } }
    },
    '/reservations': {
      get: {
        summary: 'List reservations (Customer: own reservations; Admin: all)',
        responses: { 200: { description: 'List of reservations' } }
      },
      post: {
        summary: 'Create reservation with double-booking lock',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['restaurant_id', 'reservation_date', 'time_slot', 'guests'],
                properties: {
                  restaurant_id: { type: 'string' },
                  reservation_date: { type: 'string', example: '2026-10-15' },
                  time_slot: { type: 'string', example: '19:00' },
                  guests: { type: 'integer', example: 2 },
                  special_requests: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Reservation confirmed' },
          409: { description: 'Double-booking collision / slot unavailable' }
        }
      }
    },
    '/reservations/availability': {
      get: {
        summary: 'Check available time slots and tables',
        parameters: [
          { name: 'restaurant_id', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'date', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'guests', in: 'query', schema: { type: 'integer' } }
        ],
        responses: { 200: { description: 'Availability overview' } }
      }
    },
    '/payments/simulate': {
      post: {
        summary: 'Simulate payment processing',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'reference_id', 'reference_type'],
                properties: {
                  amount: { type: 'number', example: 50.00 },
                  reference_id: { type: 'string' },
                  reference_type: { type: 'string', enum: ['RESERVATION', 'ORDER'] },
                  card_number: { type: 'string', example: '4242424242424242' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Payment result' } }
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'reservation-service',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// GET /reservations/availability - Check availability for a date & restaurant
app.get('/reservations/availability', async (req, res) => {
  try {
    const { restaurant_id, date, guests } = req.query;
    if (!restaurant_id || !date) {
      return res.status(400).json({ success: false, error: 'restaurant_id and date are required' });
    }

    const guestCount = guests ? parseInt(guests) : 2;
    const allTables = await db.find('restaurant_tables', t => t.restaurant_id === restaurant_id && t.is_active);
    const qualifyingTables = allTables.filter(t => t.capacity >= guestCount);

    const standardSlots = ['12:00', '13:00', '14:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
    const activeReservations = await db.find(
      'reservations',
      r => r.restaurant_id === restaurant_id && r.reservation_date === date && r.status !== 'CANCELLED'
    );

    const slotStatus = standardSlots.map(slot => {
      const bookedTableIds = new Set(
        activeReservations.filter(r => r.time_slot === slot).map(r => r.table_id)
      );
      const availableTableCount = qualifyingTables.filter(t => !bookedTableIds.has(t.id)).length;

      return {
        slot,
        isAvailable: availableTableCount > 0,
        availableTables: availableTableCount,
        totalQualifyingTables: qualifyingTables.length
      };
    });

    res.json({
      success: true,
      restaurant_id,
      date,
      guestCount,
      slots: slotStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /reservations - List reservations
app.get('/reservations', authenticateToken, async (req, res) => {
  try {
    let reservations;
    if (req.user.role === 'ADMIN') {
      reservations = await db.find('reservations');
    } else {
      reservations = await db.find('reservations', r => r.user_id === req.user.id);
    }

    // Enrich with restaurant info
    const restaurants = await db.find('restaurants');
    const enriched = reservations.map(r => {
      const rest = restaurants.find(resItem => resItem.id === r.restaurant_id);
      return {
        ...r,
        restaurant_name: rest ? rest.name : 'Unknown Restaurant',
        restaurant_address: rest ? rest.address : '',
        restaurant_image: rest ? rest.image_url : ''
      };
    });

    // Sort newest first
    enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /reservations/:id - Single reservation details
app.get('/reservations/:id', authenticateToken, async (req, res) => {
  try {
    const reservation = await db.findOne('reservations', r => r.id === req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    // Check ownership or admin
    if (req.user.role !== 'ADMIN' && reservation.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied to this reservation' });
    }

    const restaurant = await db.findOne('restaurants', r => r.id === reservation.restaurant_id);
    const table = await db.findOne('restaurant_tables', t => t.id === reservation.table_id);

    res.json({
      success: true,
      data: {
        ...reservation,
        restaurant,
        table
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /reservations - Create reservation (WITH STRICT DOUBLE-BOOKING PREVENTION)
app.post('/reservations', authenticateToken, async (req, res) => {
  try {
    const { restaurant_id, reservation_date, time_slot, guests, special_requests } = req.body;

    if (!restaurant_id || !reservation_date || !time_slot || !guests) {
      return res.status(400).json({
        success: false,
        error: 'restaurant_id, reservation_date, time_slot, and guests are required'
      });
    }

    const guestCount = parseInt(guests);
    if (guestCount <= 0 || guestCount > 20) {
      return res.status(400).json({ success: false, error: 'Guest count must be between 1 and 20' });
    }

    // Atomic Double-Booking Lock Evaluation
    const lockResult = await db.lockReservationSlot({
      restaurantId: restaurant_id,
      date: reservation_date,
      timeSlot: time_slot,
      guests: guestCount
    });

    if (!lockResult.success) {
      return res.status(409).json({
        success: false,
        error: 'Double-booking prevention: No tables available for this time slot. Please pick an alternative time slot.',
        code: lockResult.reason
      });
    }

    const allocatedTable = lockResult.table;
    const newReservation = {
      id: `res-${uuidv4().substring(0, 8)}`,
      user_id: req.user.id,
      restaurant_id,
      table_id: allocatedTable.id,
      table_number: allocatedTable.table_number,
      reservation_date,
      time_slot,
      guests: guestCount,
      status: 'CONFIRMED',
      special_requests: special_requests || '',
      created_at: new Date().toISOString()
    };

    await db.insert('reservations', newReservation);

    // Trigger SNS confirmation dispatch
    const restaurant = await db.findOne('restaurants', r => r.id === restaurant_id);
    const user = await db.findOne('users', u => u.id === req.user.id);
    const snsReceipt = await dispatchSnsNotification(newReservation, user, restaurant);

    res.status(201).json({
      success: true,
      message: 'Reservation confirmed successfully!',
      data: newReservation,
      snsNotification: snsReceipt
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /reservations/:id/cancel - Cancel reservation & free slot
app.put('/reservations/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const reservation = await db.findOne('reservations', r => r.id === req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    if (req.user.role !== 'ADMIN' && reservation.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await db.update('reservations', r => r.id === req.params.id, { status: 'CANCELLED' });

    console.log(`[Reservation Service] Released table slot for cancelled reservation #${req.params.id}`);

    res.json({
      success: true,
      message: 'Reservation cancelled successfully. Table slot released.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /payments/simulate - Payment Gateway Simulation
app.post('/payments/simulate', authenticateToken, async (req, res) => {
  try {
    const { amount, reference_type, reference_id, card_number, payment_method } = req.body;

    if (!amount || !reference_id || !reference_type) {
      return res.status(400).json({
        success: false,
        error: 'amount, reference_id, and reference_type are required'
      });
    }

    const cardNumStr = String(card_number || '4242');
    const isDecline = cardNumStr.endsWith('0000'); // Testing rule: ends in 0000 -> card declined

    const transactionId = `txn_sim_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const last4 = cardNumStr.slice(-4);

    const paymentRecord = {
      id: `pay-${uuidv4().substring(0, 8)}`,
      reference_type,
      reference_id,
      amount: Number(amount),
      currency: 'USD',
      payment_method: payment_method || 'CREDIT_CARD',
      status: isDecline ? 'FAILED' : 'COMPLETED',
      transaction_id: transactionId,
      card_last4: last4,
      created_at: new Date().toISOString()
    };

    await db.insert('payments', paymentRecord);

    if (isDecline) {
      return res.status(402).json({
        success: false,
        error: 'Payment declined: Card issuer rejected the transaction (Test rule: cards ending in 0000 are declined).',
        data: paymentRecord
      });
    }

    // Update order status if paying for order
    if (reference_type === 'ORDER') {
      await db.update('orders', o => o.id === reference_id, { payment_status: 'PAID' });
    }

    res.json({
      success: true,
      message: 'Payment simulated and processed successfully',
      data: paymentRecord
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /payments/:transactionId - Lookup payment
app.get('/payments/:transactionId', authenticateToken, async (req, res) => {
  try {
    const payment = await db.findOne('payments', p => p.transaction_id === req.params.transactionId);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 [Reservation & Payment Service] running on port ${PORT}`);
    console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
