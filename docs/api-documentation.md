# TABLESERVE: REST API & OpenAPI Specification

Interactive Swagger UI is hosted live at: [http://localhost:5000/api-docs](http://localhost:5000/api-docs).

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new customer or admin user account.
```json
// Request Body
{
  "name": "Sarah Connor",
  "email": "sarah@example.com",
  "password": "Password@123",
  "role": "CUSTOMER"
}

// Response (201 Created)
{
  "success": true,
  "message": "Account registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "usr-9a8b7c", "name": "Sarah Connor", "email": "sarah@example.com", "role": "CUSTOMER" }
}
```

### `POST /api/auth/login`
Validates credentials and returns JWT bearer token.
```json
// Request Body
{
  "email": "admin@tableserve.com",
  "password": "Admin@123"
}
```

---

## 2. Restaurant Service Endpoints

### `GET /api/restaurants`
Query Parameters:
- `cuisine` (e.g. `Italian`, `Japanese`)
- `city` (e.g. `New York`)
- `minRating` (e.g. `4.5`)

### `GET /api/restaurants/:id`
Returns full restaurant details with active menu items and table layouts.

### `POST /api/restaurants` *(Admin Only)*
Creates a new restaurant and auto-provisions tables.

### `POST /api/restaurants/:id/menu` *(Admin Only)*
Adds a new dish with image URL, dietary tags, and pricing.

---

## 3. Search Service Endpoints

### `GET /api/search`
Multi-faceted search across restaurant metadata and menu item dishes.
Query Parameters:
- `q`: Full-text keyword matching (name, description, or dishes).
- `cuisine`: Exact cuisine filter.
- `dietary`: Dietary tag (e.g. `Vegetarian`, `Gluten-Free`, `Halal`).
- `priceTier`: `$`, `$$`, `$$$`, `$$$$`.
- `minRating`: Minimum rating threshold.

---

## 4. Reservation & Payment Endpoints

### `GET /api/reservations/availability`
Checks available table slots for a party size on a specific date.
Query Parameters: `restaurant_id`, `date`, `guests`.

### `POST /api/reservations` *(Protected)*
Locks a table slot with atomic double-booking prevention.
```json
// Request Body
{
  "restaurant_id": "rest-01",
  "reservation_date": "2026-11-20",
  "time_slot": "19:00",
  "guests": 2,
  "special_requests": "Window table"
}

// Response (201 Created)
{
  "success": true,
  "message": "Reservation confirmed successfully!",
  "data": {
    "id": "res-91a2b3",
    "table_number": 3,
    "status": "CONFIRMED"
  },
  "snsNotification": { "eventType": "RESERVATION_CONFIRMED" }
}
```

### `POST /api/payments/simulate` *(Protected)*
Simulates mock card payment gateway transaction.
- Cards ending in `0000` simulate declined transactions (HTTP 402).
- Valid cards return HTTP 200 with unique `transaction_id`.

---

## 5. Ordering Endpoints

### `POST /api/orders` *(Protected)*
Submits customer order. Prices are verified and calculated on the server.
```json
// Request Body
{
  "restaurant_id": "rest-01",
  "order_type": "DINE_IN",
  "table_number": 3,
  "items": [
    { "menu_item_id": "menu-01-01", "quantity": 1 },
    { "menu_item_id": "menu-01-02", "quantity": 2 }
  ]
}
```

### `PUT /api/orders/:id/status` *(Admin Only)*
Transitions order lifecycle: `PLACED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `SERVED`.

---

## 6. Amazon Lex Chatbot Endpoint

### `POST /api/chatbot/message`
Conversational NLP endpoint fulfilling all 8 Amazon Lex intents.
```json
// Request Body
{
  "message": "Find me Italian food in New York"
}

// Response (200 OK)
{
  "success": true,
  "bot": "AmazonLex-TABLESERVE-v2",
  "intent": "RestaurantSearchIntent",
  "reply": "I found 1 great option(s)! Top pick: Bella Italia Trattoria (Italian, rated 4.8★).",
  "actionData": { "type": "RESTAURANTS_FOUND" }
}
```
