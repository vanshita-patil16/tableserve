# TABLESERVE: Project Presentation & Slide Notes

## Slide 1: Title & Introduction
- **Title**: TABLESERVE — Enterprise Restaurant Reservation & Ordering Platform
- **Subtitle**: A Resilient Event-Driven Microservices Architecture on AWS
- **Presenter Notes**:
  - "Good morning Professor and evaluators. Today I am presenting TABLESERVE, an end-to-end cloud platform designed to solve critical challenges in restaurant management: race conditions in table reservations, server-verified ordering, distributed microservice resilience, and conversational AI."

---

## Slide 2: Problem Statement & Engineering Challenges
- **Key Challenges in Restaurant Tech**:
  1. *Race Conditions*: Simultaneous bookings causing double-booked tables and angry patrons.
  2. *Security Vulnerabilities*: Client-side tampering of order prices in checkout carts.
  3. *Traffic Spikes*: Search traffic surging 50x during dinner rushes without affecting kitchen orders.
  4. *Customer Support Overhead*: Repetitive inquiries about menus and reservation statuses.

---

## Slide 3: System Architecture & Microservices Topology
- **Decomposition**:
  - *Restaurant Service (5001)*: Catalog, images, physical table layouts.
  - *Reservation & Payment Service (5002)*: Atomic table locking, mock card processing, SNS notifications.
  - *Ordering Service (5003)*: Kitchen display, verified bill calculation, lifecycle management.
  - *Search Service (5004)*: Multi-faceted search by cuisine, dietary needs, ratings, price tiers.
  - *API Gateway Hub (5000)*: Centralized reverse proxy, JWT issuance, unified Swagger docs, Amazon Lex fulfillment.

---

## Slide 4: Concurrency & Double-Booking Prevention
- **Algorithm**:
  - Capacity Matching: $\text{Table Capacity} \ge \text{Guest Count}$.
  - Greedy Allocation: Selects smallest fitting table first to preserve larger tables.
  - Conflict Check: Evaluates `(table_id, reservation_date, time_slot)` where `status != CANCELLED`.
  - Immediate Release: Cancelling a reservation releases the slot back to the public pool in real time.

---

## Slide 5: Amazon Web Services (AWS) Deployment
- **VPC Design**:
  - Multi-AZ segmentation (`us-east-1a`, `us-east-1b`).
  - Public Subnets: Internet Gateway, ALB, NAT Gateway.
  - Private Subnets: EC2 microservices and RDS PostgreSQL Multi-AZ instance.
- **Application Load Balancer**:
  - Path-based listener rules routing `/api/restaurants*`, `/api/reservations*`, `/api/orders*`, `/api/search*`.
- **Infrastructure as Code**:
  - CloudFormation template (`tableserve-infrastructure.yaml`) provisions all 20+ AWS resources declaratively.

---

## Slide 6: Amazon Lex Conversational Concierge
- **8 Natural Language Intents**:
  - Greeting, RestaurantSearch, Menu, Reservation, ReservationStatus, CancelReservation, Help, Fallback.
  - Dynamic live fulfillment against backend microservices.
  - Fully integrated into React frontend with responsive floating widget.

---

## Slide 7: Live Demonstration & Results
- **Walkthrough**:
  - Live search by cuisine & dietary flags.
  - Add to cart and simulated card payment.
  - Table booking with double-booking prevention validation.
  - Live chatbot conversation across all 8 intents.
  - Automated unit and E2E test suites (100% pass rate).

---

## Slide 8: Conclusion & Q&A
- **Summary**:
  - Full microservices stack runnable locally with 1 command or deployable to AWS via CloudFormation.
  - Production-quality code, zero shortcuts, complete documentation.
  - "Thank you. I am now open to your questions."
