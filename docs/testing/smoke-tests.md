# TABLESERVE: Smoke Test Checklist

Use this checklist to perform rapid sanity and regression verification before presenting or deploying.

| # | Feature / Test Item | Verification Procedure | Expected Outcome | Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Gateway Health** | `curl http://localhost:5000/health` | HTTP 200 with `status: "OK"` and registered route list | [x] PASS |
| **2** | **Restaurant Health** | `curl http://localhost:5001/health` | HTTP 200 with `status: "OK"` | [x] PASS |
| **3** | **Reservation Health** | `curl http://localhost:5002/health` | HTTP 200 with `status: "OK"` | [x] PASS |
| **4** | **Ordering Health** | `curl http://localhost:5003/health` | HTTP 200 with `status: "OK"` | [x] PASS |
| **5** | **Search Health** | `curl http://localhost:5004/health` | HTTP 200 with `status: "OK"` | [x] PASS |
| **6** | **Swagger UI** | Open `http://localhost:5000/api-docs` | Interactive Swagger UI displays all microservice endpoints | [x] PASS |
| **7** | **Customer Auth** | Login with `john.doe@example.com` / `Customer@123` | Returns signed JWT token and user profile | [x] PASS |
| **8** | **Admin Auth** | Login with `admin@tableserve.com` / `Admin@123` | Returns JWT with `role: "ADMIN"` | [x] PASS |
| **9** | **Restaurant Catalog** | `GET /api/restaurants` | Returns 6 initial restaurants with images and ratings | [x] PASS |
| **10**| **Text Search** | `GET /api/search?q=truffle` | Returns Bella Italia Trattoria (matches menu item) | [x] PASS |
| **11**| **Cuisine Filter** | `GET /api/search?cuisine=Japanese` | Returns Sakura Japanese Bistro | [x] PASS |
| **12**| **Dietary Filter** | `GET /api/search?dietary=Vegetarian` | Returns restaurants serving vegetarian options | [x] PASS |
| **13**| **Availability Check**| `GET /api/reservations/availability?...` | Returns list of time slots with available table counts | [x] PASS |
| **14**| **Create Reservation**| `POST /api/reservations` | Returns HTTP 201 with allocated table number & SNS alert | [x] PASS |
| **15**| **Double-Booking Lock**| Book all tables for same slot | Blocks duplicate with HTTP 409 Conflict | [x] PASS |
| **16**| **Cancel Reservation**| `PUT /api/reservations/:id/cancel` | Status updates to CANCELLED and table slot is freed | [x] PASS |
| **17**| **Simulate Payment**| Card ending in `4242` vs `0000` | 4242 returns 200 COMPLETED; 0000 returns 402 FAILED | [x] PASS |
| **18**| **Place Order** | `POST /api/orders` | Calculates server-verified total price and returns 201 | [x] PASS |
| **19**| **Advance Order** | `PUT /api/orders/:id/status` | Moves status PLACED -> PREPARING -> READY -> SERVED | [x] PASS |
| **20**| **Amazon Lex Chatbot**| Test all 8 intents in chat widget | Returns tailored responses and executes live fulfillments | [x] PASS |
| **21**| **React Frontend UI** | Open `http://localhost:3000` | Beautiful responsive SPA with search, cart, and modals | [x] PASS |
| **22**| **Unit Test Suite** | `npm run test:unit` | All tests pass (100%) | [x] PASS |
| **23**| **E2E Test Suite** | `npm test` | All 27 API tests pass (100%) | [x] PASS |
