# 🍽️ TABLESERVE: Enterprise Restaurant Reservation & Ordering Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18.3-blue.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-v4.21-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-CloudFormation%20%7C%20Lex-orange.svg)](https://aws.amazon.com/)
[![Swagger](https://img.shields.io/badge/OpenAPI-3.0%20Swagger-85EA2D.svg)](http://localhost:5000/api-docs)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen.svg)](docs/testing/smoke-tests.md)

**TABLESERVE** is an enterprise-grade restaurant reservation and online ordering platform built on a containerized, event-driven microservices architecture. It features atomic **double-booking prevention**, server-verified pricing, simulated credit card payment gateways, an **Amazon Lex v2 conversational AI concierge** supporting 8 intents, and complete **AWS CloudFormation** Infrastructure as Code.

---

## 🚀 Quick Start (One Windows Laptop)

You can launch the **entire platform locally** in one click with zero setup hurdles!

### Option 1: Native Windows 1-Click Runner
Double-click `run-local.bat` in the project root, or execute in PowerShell:
```powershell
.\run-local.bat
```
*Or via Node.js:*
```powershell
npm run seed     # Populate database with rich demo data
npm start        # Launches all 4 microservices, Gateway, and React UI concurrently
```

### Option 2: Docker Compose Multi-Container Stack
```powershell
docker compose up --build -d
# or double click: run-docker.bat
```

---

## 🌐 Live System Endpoints

| Component | Port | URL | Description |
| :--- | :---: | :--- | :--- |
| **React Frontend UI** | `3000` | [http://localhost:3000](http://localhost:3000) | Responsive SPA with live search, cart, bookings, admin, and Lex bot |
| **API Gateway Hub** | `5000` | [http://localhost:5000](http://localhost:5000) | Reverse proxy, JWT auth, and Amazon Lex intent fulfillment |
| **Swagger OpenAPI Docs**| `5000` | [http://localhost:5000/api-docs](http://localhost:5000/api-docs) | Interactive API exploration and test playground |
| **Restaurant Service** | `5001` | [http://localhost:5001](http://localhost:5001) | Restaurant and menu CRUD, table layouts |
| **Reservation & Payment**| `5002` | [http://localhost:5002](http://localhost:5002) | Double-booking lock, payment simulation, SNS events |
| **Ordering Service** | `5003` | [http://localhost:5003](http://localhost:5003) | Verified pricing calculation, kitchen status pipeline |
| **Search Service** | `5004` | [http://localhost:5004](http://localhost:5004) | Multi-faceted text search, cuisine, dietary, and rating filters |

---

## 🔐 Demo User Credentials

The frontend contains **1-Click Demo Buttons** inside the "Sign In" modal:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `admin@tableserve.com` | `Admin@123` | Master restaurant & menu CRUD, Kitchen order queue status updates, System health monitor |
| **Customer** | `john.doe@example.com` | `Customer@123` | Table reservations, online orders, personal order tracking |

---

## 🏗️ Architecture & Microservices

```
                                 [ Browser Clients / Mobile ]
                                              |
                                              v
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

## 🤖 Amazon Lex Chatbot (8 Intents)

A conversational AI assistant is integrated into the bottom-right corner of the React UI and backed by the API Gateway:
1. **`GreetingIntent`**: Welcomes user and outlines available services.
2. **`HelpIntent`**: Lists supported voice/text commands.
3. **`RestaurantSearchIntent`**: Discovers restaurants by cuisine (`"Find Italian restaurants"`).
4. **`MenuIntent`**: Fetches live signature dishes and prices (`"Show menu for Bella Italia"`).
5. **`ReservationIntent`**: Guides table booking (`"Book a table for 2 tomorrow at 7pm"`).
6. **`ReservationStatusIntent`**: Queries live status of bookings (`"Check status of res-01"`).
7. **`CancelReservationIntent`**: Cancels reservation and immediately releases table slot.
8. **`FallbackIntent`**: Graceful fallback when input is ambiguous.

---

## ☁️ AWS Cloud Infrastructure

The template at [`aws/cloudformation/tableserve-infrastructure.yaml`](aws/cloudformation/tableserve-infrastructure.yaml) provisions:
- **VPC & Subnets**: Multi-AZ VPC (`10.0.0.0/16`), 2 Public Subnets, 2 Private Subnets, Internet Gateway, NAT Gateway.
- **Application Load Balancer**: Path-based routing rules for `/api/restaurants*`, `/api/reservations*`, `/api/orders*`, `/api/search*`.
- **EC2 Microservices**: Dedicated instances in private subnets with least-privilege IAM roles.
- **Amazon RDS PostgreSQL (Multi-AZ)**: High-availability automated failover database.
- **Amazon S3**: Static website hosting for React frontend & public bucket for menu photos.
- **Amazon ECR**: Container repositories for microservice images.
- **Amazon SNS**: Event topic broadcasting reservation confirmations to SMS/Email.
- **Amazon Route 53**: Private hosted zone (`tableserve.internal`) for zero-trust service discovery.
- **Draw.io Diagram**: Fully editable architectural diagram at [`docs/architecture/tableserve-architecture.drawio`](docs/architecture/tableserve-architecture.drawio).

---

## 🧪 Testing & Verification

### Run Unit Tests
```powershell
npm run test:unit
```
*Verifies atomic table locking, greedy table capacity allocation, restaurant CRUD, and order lifecycle transitions.*

### Run End-to-End API Tests
```powershell
npm test
```
*Executes all 27 automated integration tests across Auth, Restaurants, Search, Reservations, Payments, Orders, and all 8 Lex Intents with 100% pass rate.*

### Import Postman Collection
Import [`docs/api/tableserve.postman_collection.json`](docs/api/tableserve.postman_collection.json) into Postman to run automated request suites with preset environment variables.

---

## 📁 Repository Structure

```
tableserve/
├── package.json                   # Root orchestrator & shared dependencies
├── docker-compose.yml             # Multi-container local & production stack
├── run-local.bat                  # 1-Click native Windows launcher
├── run-docker.bat                 # 1-Click Docker Compose launcher
├── start-all.js                   # Node stack concurrency runner
├── services/
│   ├── shared/                    # Database abstraction & JWT auth middleware
│   ├── api-gateway/               # Unified proxy, Auth & Lex fulfillment hub
│   ├── restaurant-service/        # Restaurant and menu CRUD (Port 5001)
│   ├── reservation-service/       # Table locking, payments & SNS (Port 5002)
│   ├── ordering-service/          # Order placement & status lifecycle (Port 5003)
│   └── search-service/            # Full-text & multi-faceted search (Port 5004)
├── frontend/                      # React 18 + Tailwind responsive web UI
│   ├── src/App.jsx                # Full interactive Single Page Application
│   ├── server.cjs                 # High-performance frontend web server (Port 3000)
│   └── index.html                 # Entry point with Tailwind & Lucide
├── aws/
│   ├── cloudformation/            # Production AWS CloudFormation YAML template
│   └── lex/                       # Amazon Lex v2 Bot JSON export
├── database/
│   ├── init.sql                   # PostgreSQL schema DDL
│   ├── seed.sql                   # Rich sample data SQL
│   └── seeder.js                  # Universal Node.js database seeder
├── tests/
│   ├── unit/                      # Concurrency & lifecycle unit tests
│   └── api-tests.js               # Comprehensive 27-step E2E API test suite
└── docs/
    ├── architecture/              # Architecture markdown & Draw.io diagram
    ├── api/                       # API spec & Postman collection v2.1
    ├── database-schema.md         # ER diagrams & schema specifications
    ├── installation.md            # Installation guide
    ├── local-run-guide.md         # Local run manual
    ├── cloudformation-guide.md    # AWS CloudFormation deployment guide
    ├── aws-integration-guide.md   # SNS, Lex, S3, and ECR integration guide
    ├── troubleshooting.md         # Diagnostic & troubleshooting guide
    ├── professor-demonstration-guide.md # Demonstration script & defense Q&A
    └── presentation-notes.md      # Slide notes & speaker script
```

---

## 📜 Documentation Directory
- 📖 [Professor Demonstration Guide](docs/professor-demonstration-guide.md)
- 🏗️ [Architecture Documentation](docs/architecture/architecture.md)
- 🗄️ [Database Schema Documentation](docs/database-schema.md)
- ☁️ [CloudFormation Deployment Guide](docs/cloudformation-guide.md)
- 🔌 [AWS Integration Guide](docs/aws-integration-guide.md)
- 📑 [API Documentation](docs/api-documentation.md)
- 🛠️ [Troubleshooting Guide](docs/troubleshooting.md)
- 🎤 [Presentation Notes](docs/presentation-notes.md)
- ✅ [Smoke Test Checklist](docs/testing/smoke-tests.md)

---
*Built with precision for enterprise reliability, high-concurrency correctness, and cloud readiness.*
