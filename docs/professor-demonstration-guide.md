# TABLESERVE: Professor Demonstration & Defense Guide

This guide is structured for a 10 to 15 minute academic demonstration and project defense of **TABLESERVE**.

---

## 1. Exact Startup Commands

### Option A: Local Startup on Windows (Instant 1-Command Run)
```powershell
# Open Windows PowerShell or Command Prompt in the project folder
cd C:\Users\Vanshita\.gemini\antigravity\scratch\tableserve

# Run the master launcher script
.\run-local.bat
```
*Or directly via Node.js:*
```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
node database/seeder.js
node start-all.js
```

### Option B: Docker Compose Startup
```powershell
# In the project root with Docker Desktop running
.\run-docker.bat
# Or
docker compose up --build
```

### Live Endpoints to Open in Browser:
- **React Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Gateway**: [http://localhost:5000](http://localhost:5000)
- **Interactive Swagger Documentation**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **Gateway Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 2. Structured Demonstration Walkthrough

### Step 1: Authentication & Role-Based Access Control (1 min)
1. Open [http://localhost:3000](http://localhost:3000).
2. Click **"Sign In"** in the top navigation bar.
3. Show the **1-Click Demo Accounts**:
   - Click **"Demo Customer"** (`john.doe@example.com`): Displays customer bookings, active orders, and personalized shopping cart.
   - Click **"Demo Admin"** (`admin@tableserve.com`): Unlocks the top **"Admin Panel"** button.
4. Click the **"Admin Panel"** button to show:
   - Live Microservice Health Monitor across ports 5000, 5001, 5002, 5003, 5004.
   - Master restaurant management catalog.
   - Live Kitchen Order Queue.

---

### Step 2: Multi-Faceted Search & Discovery (2 mins)
1. On the home page, demonstrate the search bar:
   - Type `"truffle"` in the search bar: Shows *Bella Italia Trattoria* because its menu contains "Truffle Tagliolini".
   - Clear and click the **"Japanese"** cuisine pill: Filters to *Sakura Japanese Bistro*.
2. Open the **"Filters"** bar:
   - Select Dietary: **"Vegetarian"**
   - Select Rating: **"4.7+ Stars"**
   - Shows dynamic query execution handled by the Search Microservice on port 5004.

---

### Step 3: Menu Browsing & Verified Order Placement (3 mins)
1. Click **"Menu & Order"** on *Bella Italia Trattoria*.
2. Highlight menu cards displaying dish images, dietary badges, categories, and prices.
3. Add **1x Burrata Pugliese** ($18.00) and **1x Truffle Tagliolini** ($28.50) to the order.
4. The Cart Drawer opens automatically showing Total: **$46.50**.
5. Select Dining Option: **Dine-In** and set Table Number to **3**.
6. Click **"Checkout & Pay ($46.50)"**.
7. In the **Payment Simulation Modal**:
   - First, click **"Test Card: DECLINE (•••• 0000)"**: Show simulated payment gateway rejection (*"Card issuer rejected the transaction"*).
   - Next, click **"Test Card: VISA (•••• 4242)"**: Payment succeeds instantly, generates transaction ID `txn_sim_...`, and places order.
8. Show the **"My Orders"** modal displaying the new order in **PLACED** state.
9. Open **Admin Panel** -> **Kitchen Orders** -> Advance the order from **PLACED** to **PREPARING** to **READY**!

---

### Step 4: Table Reservation with Double-Booking Prevention (3 mins)
1. Click **"Book Table"** on *Bella Italia Trattoria*.
2. Show the reservation dialog:
   - Select tomorrow's date.
   - Select Party Size: **2 Guests**.
   - Note the real-time availability badges on time slots (`Available` vs `Booked`).
3. Select slot **"19:00"** and enter special request: *"Anniversary celebration by the window"*.
4. Click **"Lock Table & Confirm"**:
   - Table #1 or #2 is atomically assigned.
   - The confirmation receipt displays the assigned Table number and the simulated AWS SNS receipt payload.
5. **Demonstrate Double-Booking Prevention**:
   - Book the remaining 2-guest tables for that same time slot until all tables with capacity $\ge 2$ are occupied.
   - Attempting to book again triggers the double-booking collision handler: HTTP 409 Conflict with message: *"No tables available for this time slot. Please pick an alternative time slot."*
6. In **"My Bookings"**, click **"Cancel Booking"**:
   - Status changes to `CANCELLED`.
   - The table slot is immediately released and becomes available for new bookings!

---

### Step 5: Amazon Lex Chatbot Interaction (3 mins)
Click the floating robot icon in the bottom-right corner to open the Amazon Lex widget:
Demonstrate the 8 conversational intents live:

| # | What to Type | Intent Triggered | Expected Response |
| :--- | :--- | :--- | :--- |
| **1** | `"Hello TABLESERVE!"` | `GreetingIntent` | Welcomes user and introduces concierge features. |
| **2** | `"Help"` | `HelpIntent` | Lists all 6 primary actions the bot can fulfill. |
| **3** | `"Find Italian restaurants in New York"` | `RestaurantSearchIntent` | Recommends *Bella Italia Trattoria* with rating and address. |
| **4** | `"Show menu for Bella Italia"` | `MenuIntent` | Displays live signature dishes and prices from database. |
| **5** | `"Book a table at Bella Italia for 2"` | `ReservationIntent` | Prompts for booking details and guides table reservation. |
| **6** | `"Check status of my reservation"` | `ReservationStatusIntent` | Displays live status and date/time of booking. |
| **7** | `"Cancel reservation res-01"` | `CancelReservationIntent` | Cancels booking and releases table slot. |
| **8** | `"Quantum physics teleportation"` | `FallbackIntent` | Graceful fallback prompt guiding the user back to dining actions. |

---

## 3. AWS Architecture Explanation

*Refer to `docs/architecture/tableserve-architecture.drawio` or display the Mermaid diagram.*

1. **Virtual Private Cloud (VPC)**:
   - CIDR block `10.0.0.0/16` across two Availability Zones (`us-east-1a` and `us-east-1b`).
2. **Public Subnets**:
   - Host the Internet Gateway, Application Load Balancer, and NAT Gateway for secure outbound internet access.
3. **Private Subnets**:
   - Contain the EC2 instances running the 4 microservices and Amazon RDS PostgreSQL. Direct public internet access to the database or microservices is prohibited.
4. **Application Load Balancer (ALB)**:
   - Employs **Path-Based Routing** rules to route traffic:
     - `/api/restaurants*` $\rightarrow$ Restaurant Service Target Group
     - `/api/reservations*` and `/api/payments*` $\rightarrow$ Reservation Service Target Group
     - `/api/orders*` $\rightarrow$ Ordering Service Target Group
     - `/api/search*` $\rightarrow$ Search Service Target Group
     - Default `/*` $\rightarrow$ Gateway / S3 Static Web Distribution
5. **Amazon RDS PostgreSQL (Multi-AZ)**:
   - Primary DB instance with synchronous standby replica in a second AZ for automated failover.
6. **Amazon SNS**:
   - Publishes `RESERVATION_CONFIRMED` notifications to SMS/Email subscribers upon successful table locking.
7. **Amazon S3**:
   - Hosts static React frontend assets and restaurant menu image media.
8. **Route 53**:
   - Private hosted zone `tableserve.internal` for zero-trust internal microservice communication.

---

## 4. Questions the Professor May Ask & Winning Answers

### Q1: "How do you guarantee that two users don't book the exact same table at the exact same second?"
> **Answer**:  
> "We implement a multi-layered concurrency lock. At the database level, we have a unique composite constraint on `(table_id, reservation_date, time_slot)` for active bookings. At the service level, the Reservation Service executes an atomic slot check: it queries active tables that meet the party size requirement, sorts them ascending by capacity to maximize seating efficiency, checks for collision against existing non-cancelled bookings, and locks the table within a single transactional boundary. If a collision occurs, the service rejects the request with HTTP 409 Conflict."

### Q2: "Why choose microservices over a monolithic architecture for this restaurant platform?"
> **Answer**:  
> "Restaurant platforms exhibit vastly different traffic profiles across domains. The Search Service experiences 10x to 50x higher read traffic during peak meal hours compared to table reservations or orders. By isolating Search, Restaurant Catalog, Reservations, and Ordering into autonomous services, each can be scaled independently on EC2 Auto Scaling Groups behind ALB target groups without having to scale the entire stack. Furthermore, a failure in the Search or Menu service does not bring down in-flight reservations or kitchen order processing."

### Q3: "How does the Amazon Lex chatbot connect to your backend APIs?"
> **Answer**:  
> "The chatbot uses a dual fulfillment architecture. In AWS, Amazon Lex triggers an AWS Lambda fulfillment webhook or runtime API call. In our application, we created a native Lex V2 fulfillment engine in the API Gateway that recognizes all 8 Lex intents (Greeting, Reservation, Search, Menu, Status, Cancel, Help, Fallback). When an intent like `MenuIntent` or `CancelReservationIntent` is identified, the engine executes direct queries against the live database and returns real-time responses to the user."

### Q4: "How do you prevent client-side price tampering when placing orders?"
> **Answer**:  
> "The frontend only sends the `menu_item_id` and `quantity` in the order payload. The Ordering Service completely ignores any prices submitted by the client. It queries the authentic menu prices directly from the database, calculates each line item subtotal, and computes the authoritative `total_amount` on the server before inserting into the database."

### Q5: "What role does CloudFormation play in this project?"
> **Answer**:  
> "Our CloudFormation template (`tableserve-infrastructure.yaml`) defines our Infrastructure as Code (IaC). It provisions the entire cloud environment declaratively in a reproducible, single-click deployment: VPC, Multi-AZ public and private subnets, NAT Gateways, Security Groups, ALB with path routing listener rules, EC2 microservice instances, RDS PostgreSQL Multi-AZ, S3 buckets, ECR container registries, SNS topics, Route 53 private zones, and IAM least-privilege roles."
