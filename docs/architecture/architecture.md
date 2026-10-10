# TABLESERVE Architecture Documentation

## 1. System Overview
**TABLESERVE** is a production-grade restaurant reservation and ordering platform built upon an event-driven, containerized microservices architecture. It addresses critical real-world challenges in restaurant technology:
- Preventing race conditions and double-bookings on table reservations.
- Server-verified calculation of order pricing to prevent client tampering.
- Microservice resilience and decoupled failure domains.
- Omnichannel customer experience via conversational AI (Amazon Lex).

---

## 2. Microservices Topology

```
                                  +-----------------------+
                                  |   React + Vite SPA    |
                                  |    (Port 3000)        |
                                  +-----------+-----------+
                                              |
                                              v
                                  +-----------------------+
                                  |   API Gateway Hub     |
                                  |    (Port 5000)        |
                                  |  Reverse Proxy & Auth |
                                  |  Amazon Lex Concierge |
                                  +-----------+-----------+
                                              |
      +--------------------+------------------+------------------+--------------------+
      |                    |                                     |                    |
      v                    v                                     v                    v
+---------------+  +--------------------+                  +---------------+  +---------------+
|  Restaurant   |  |   Reservation &    |                  |   Ordering    |  |    Search     |
|   Service     |  |   Payment Service  |                  |   Service     |  |    Service    |
|  (Port 5001)  |  |    (Port 5002)     |                  |  (Port 5003)  |  |  (Port 5004)  |
+-------+-------+  +---------+----------+                  +-------+-------+  +-------+-------+
        |                    |                                     |                  |
        +--------------------+------------------+------------------+------------------+
                                                |
                                                v
                                  +-----------------------+
                                  | Amazon RDS PostgreSQL |
                                  |    (Local Fallback)   |
                                  +-----------------------+
```

---

## 3. Microservice Specifications

### 3.1. Restaurant Service (Port 5001)
- **Role**: Master catalog of restaurants, menus, images, and physical table layout inventory.
- **Key Logic**: Manages operating hours, seat capacities, dietary tags, and pricing.
- **Endpoints**:
  - `GET /restaurants`: Filtered restaurant catalog.
  - `GET /restaurants/:id`: Detailed view with menu items and table layouts.
  - `POST /restaurants`: Admin creation with automatic table layout initialization.
  - `POST /restaurants/:id/menu`: Menu addition with image URL and dietary flags.

### 3.2. Reservation & Payment Service (Port 5002)
- **Role**: High-concurrency table slot locking, double-booking prevention, payment simulation, and SNS notification broadcast.
- **Double-Booking Prevention Mechanism**:
  1. Incoming reservation specifies `(restaurant_id, reservation_date, time_slot, guests)`.
  2. Queries all active tables with `capacity >= guests`.
  3. Sorts qualifying tables in ascending capacity order (allocates smallest fitting table first to optimize seating efficiency).
  4. Evaluates collision against existing non-cancelled bookings.
  5. Atomically binds the table or returns HTTP 409 Conflict if all tables are occupied.
- **Payment Gateway Simulation**:
  - Evaluates mock card number.
  - Cards ending in `0000` trigger simulated bank decline (HTTP 402).
  - Cards ending in other digits generate unique `txn_sim_...` transaction receipt (HTTP 200).
- **Amazon SNS Integration**:
  - Broadcasts `RESERVATION_CONFIRMED` event to AWS SNS Topic (or local notification bus).

### 3.3. Ordering Service (Port 5003)
- **Role**: Order intake, server-side price validation, and multi-stage kitchen lifecycle management.
- **Security Logic**: Never trusts client-submitted item pricing. Looks up official menu prices in the database, sums subtotals, and seals the final bill.
- **Order Lifecycle States**:
  $$\text{PLACED} \longrightarrow \text{PREPARING} \longrightarrow \text{READY} \longrightarrow \text{SERVED}$$
  *(or `CANCELLED`)*

### 3.4. Search Service (Port 5004)
- **Role**: Multi-faceted search engine with full-text matching, dietary filtering, and autocomplete.
- **Filtering Capabilities**:
  - Full-text keyword matching across restaurant names, descriptions, cuisines, cities, and individual menu dishes.
  - Cuisine filter (`Italian`, `Japanese`, `Indian`, `French`, `Mexican`, `Steakhouse`).
  - Dietary option filter (`Vegetarian`, `Vegan`, `Gluten-Free`, `Halal`).
  - Price tiers (`$`, `$$`, `$$$`, `$$$$`).
  - Minimum customer rating thresholds (`4.5+`, `4.7+`, `4.9+`).

### 3.5. API Gateway Hub & Lex Service (Port 5000)
- **Role**: Single reverse proxy entry point for all frontend calls.
- **Auth**: Centralized JWT issuance (`/api/auth/login`, `/api/auth/register`) with role validation (`CUSTOMER`, `ADMIN`).
- **Amazon Lex Hub**: Natural Language Processing for 8 conversational intents with live database fulfillments.
- **Swagger Documentation**: Aggregated OpenAPI specification at `/api-docs`.

---

## 4. AWS Cloud Architecture

### 4.1. VPC & Network Segmentation
- **CIDR**: `10.0.0.0/16`
- **Public Subnets**: `10.0.1.0/24` (AZ1) and `10.0.2.0/24` (AZ2) hosting Internet Gateway, ALB, and NAT Gateway.
- **Private Subnets**: `10.0.11.0/24` (AZ1) and `10.0.12.0/24` (AZ2) hosting EC2 microservices and RDS PostgreSQL. No direct public internet ingress permitted.

### 4.2. Application Load Balancer Path Routing
| Rule Priority | Path Pattern | Target Group | Downstream Service |
| :--- | :--- | :--- | :--- |
| **10** | `/api/restaurants*` | TG-Restaurant | Restaurant EC2 (5001) |
| **20** | `/api/reservations*`, `/api/payments*` | TG-Reservation | Reservation EC2 (5002) |
| **30** | `/api/orders*` | TG-Ordering | Ordering EC2 (5003) |
| **40** | `/api/search*` | TG-Search | Search EC2 (5004) |
| **Default** | `/*` | TG-Gateway | Gateway EC2 (5000) |

### 4.3. High-Availability Database Layer
- **Amazon RDS PostgreSQL 16 Multi-AZ**: Synchronous physical replication across Availability Zones with automatic failover in < 60 seconds.

### 4.4. Amazon Route 53
- **Private Hosted Zone**: `tableserve.internal` resolves internal microservice hostnames securely within the VPC.

---

## 5. Amazon Lex Conversational Bot

TABLESERVE integrates an Amazon Lex v2 bot fulfilling 8 customer intents:
1. **GreetingIntent**: Welcomes user and outlines available actions.
2. **RestaurantSearchIntent**: Discovers restaurants by cuisine or location.
3. **MenuIntent**: Fetches live signature dishes and pricing from the database.
4. **ReservationIntent**: Facilitates table booking with date, time, and guests.
5. **ReservationStatusIntent**: Queries live status of bookings by reservation ID.
6. **CancelReservationIntent**: Cancels a reservation and immediately releases the table slot.
7. **HelpIntent**: Guides the customer through supported voice and text commands.
8. **FallbackIntent**: Gracefully handles unexpected input.
