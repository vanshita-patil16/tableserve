#!/usr/bin/env python3
"""
TABLESERVE Review Presentation Generator
Generates a complete, professional, 14-slide PowerPoint presentation
meeting all project submission criteria for Cloud Guardians.
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette: Corporate Dark Slate & Vibrant Amber/Orange
    C_BG_DARK = RGBColor(15, 23, 42)      # Slate 900
    C_BG_LIGHT = RGBColor(248, 250, 252)  # Slate 50
    C_TEXT_DARK = RGBColor(15, 23, 42)
    C_TEXT_LIGHT = RGBColor(255, 255, 255)
    C_TEXT_MUTED = RGBColor(148, 163, 184)
    C_ORANGE = RGBColor(234, 88, 12)      # Orange 600
    C_AMBER = RGBColor(245, 158, 11)      # Amber 500
    C_CARD_BG = RGBColor(255, 255, 255)
    C_CARD_BORDER = RGBColor(226, 232, 240)
    C_ACCENT_BLUE = RGBColor(37, 99, 235)

    def add_header(slide, title_text, category_text="TABLESERVE • CLOUD-NATIVE MICROSERVICES"):
        # Header background banner
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.1))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p1 = tf.paragraphs[0]
        p1.text = category_text.upper()
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = C_ORANGE
        
        p2 = tf.add_paragraph()
        p2.text = title_text
        p2.font.size = Pt(22)
        p2.font.bold = True
        p2.font.color.rgb = C_TEXT_DARK

    def set_slide_bg(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_card(slide, left, top, width, height, title, body_lines, accent_color=None):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_BG
        card.line.color.rgb = C_CARD_BORDER
        card.line.width = Pt(1.5)
        
        # Optional accent top stripe
        if accent_color:
            stripe = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, Inches(0.12))
            stripe.fill.solid()
            stripe.fill.fore_color.rgb = accent_color
            stripe.line.fill.background()

        tb = slide.shapes.add_textbox(left + Inches(0.3), top + Inches(0.25), width - Inches(0.6), height - Inches(0.5))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        if title:
            p = tf.paragraphs[0]
            p.text = title
            p.font.size = Pt(13)
            p.font.bold = True
            p.font.color.rgb = C_TEXT_DARK
            p.space_after = Pt(8)
        
        for idx, line in enumerate(body_lines):
            p = tf.add_paragraph() if title or idx > 0 else tf.paragraphs[0]
            p.text = line
            p.font.size = Pt(10.5)
            p.font.color.rgb = RGBColor(71, 85, 105)
            p.space_after = Pt(4)
        return card

    # =========================================================================
    # SLIDE 1: TITLE SLIDE (Dark Premium Theme)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s1, C_BG_DARK)

    # Title & Subtitle Box
    t_box = s1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.333), Inches(2.5))
    tf1 = t_box.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "CLOUD-NATIVE ARCHITECTURE PROJECT"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_AMBER
    p.space_after = Pt(10)

    p = tf1.add_paragraph()
    p.text = "TABLESERVE"
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = C_TEXT_LIGHT

    p = tf1.add_paragraph()
    p.text = "A Resilient Restaurant Reservation, Dining & Ordering Microservices Platform"
    p.font.size = Pt(18)
    p.font.color.rgb = C_TEXT_MUTED
    p.space_after = Pt(25)

    # Team Box
    team_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(4.3), Inches(11.333), Inches(2.2))
    team_card.fill.solid()
    team_card.fill.fore_color.rgb = RGBColor(30, 41, 59)
    team_card.line.color.rgb = RGBColor(51, 65, 85)
    
    t_card_box = s1.shapes.add_textbox(Inches(1.3), Inches(4.5), Inches(10.7), Inches(1.8))
    t_tf = t_card_box.text_frame
    
    p = t_tf.paragraphs[0]
    p.text = "TEAM: CLOUD GUARDIANS"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_AMBER
    p.space_after = Pt(10)

    members = [
        "1. Vanshita Patil — Reg. No: 24BVD1056 (Cloud Architecture, EC2, CloudWatch, Lex AI Bot, Observability)",
        "2. Muskan Rani — Reg. No: 24BVD1098 (Reservation & Payment Microservice, Atomic Locking, Amazon SNS)",
        "3. Ankana Datta — Reg. No: 24BVD1108 (React 18 Frontend, Ordering & Search Services, Pricing Verification)"
    ]
    for m in members:
        p = t_tf.add_paragraph()
        p.text = m
        p.font.size = Pt(11)
        p.font.color.rgb = C_TEXT_LIGHT
        p.space_after = Pt(4)

    # =========================================================================
    # SLIDE 2: PROJECT OBJECTIVES & PROBLEM STATEMENT
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s2, C_BG_LIGHT)
    add_header(s2, "Project Objectives & Engineering Challenges")

    add_card(s2, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Industry Problem Statement", [
                 "• Concurrency Collisions: Simultaneous bookings cause double-booked dining tables and customer frustration.",
                 "• Client-Side Price Tampering: Vulnerable web checkouts allow client tampering of menu cart subtotals.",
                 "• Peak Hour Traffic Spikes: Search spikes 50x during meal times; in monolithic systems, this crashes booking checkouts.",
                 "• Repetitive Support Overhead: Manual inquiries on menus, party availability, and booking cancellations tie up staff.",
                 "• Lack of Observability: Unmonitored distributed services fail silently with unrecorded latency spikes."
             ], C_ORANGE)

    add_card(s2, Inches(6.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Key Project Objectives", [
                 "• Autonomous Microservices: Decouple domain logic into 5 autonomous services with independent horizontal scalability.",
                 "• Atomic Table Locking: Implement greedy capacity matching and transactional locks preventing duplicate reservations.",
                 "• Server-Authoritative Pricing: Discard client cart prices; compute subtotals from database authoritative menus.",
                 "• AI Concierge with 2-Way Voice: Deploy Amazon Lex v2 with Speech-to-Text and Polly voice output across 8 intents.",
                 "• Full Cloud Observability: Configure Amazon CloudWatch custom metrics (747 tracked), alarms, and dashboards."
             ], C_ACCENT_BLUE)

    # =========================================================================
    # SLIDE 3: COMPLETE LIST OF MODULES
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s3, C_BG_LIGHT)
    add_header(s3, "Comprehensive List of System Modules")

    modules = [
        ("Module 1: API Gateway Hub (Port 5000)", [
            "Central reverse proxy, JWT auth, Swagger 3.0 docs, request routing, and CloudWatch EMF telemetry collector."
        ]),
        ("Module 2: Restaurant Catalog (Port 5001)", [
            "18 regional Indian restaurants across 9 metro cities, 58 dishes, dining operational hours, and physical table geometry."
        ]),
        ("Module 3: Reservation & Payments (Port 5002)", [
            "Atomic table locking engine, greedy capacity matching, mock card checkout, and Amazon SNS event dispatch."
        ]),
        ("Module 4: Ordering & Kitchen Queue (Port 5003)", [
            "Server-authoritative billing, tamper-proof carts, and live kitchen order progression (PLACED → PREPARING → READY)."
        ]),
        ("Module 5: Multi-Faceted Search (Port 5004)", [
            "Full-text search by dish name, city filters (Delhi, Mumbai, Bengaluru), cuisine tags, and dietary restrictions."
        ]),
        ("Module 6: Single Page React Frontend (Port 3000)", [
            "React 18 SPA with Tailwind CSS, responsive mobile navigation, modal cart drawers, and live admin operations hub."
        ]),
        ("Module 7: Amazon Lex v2 Voice Concierge", [
            "Two-way voice AI: Web Speech Recognition (STT), speech synthesis (TTS), multi-turn dialogue memory, and 8 trained intents."
        ]),
        ("Module 8: CloudWatch Observability Engine", [
            "Custom namespace TABLESERVE/Microservices, 747 metrics, 3 automated metric alarms, and real-time dashboard."
        ])
    ]

    col1 = modules[:4]
    col2 = modules[4:]

    for i, (m_title, m_lines) in enumerate(col1):
        add_card(s3, Inches(0.8), Inches(1.6 + i * 1.3), Inches(5.6), Inches(1.15), m_title, m_lines, C_ORANGE)

    for i, (m_title, m_lines) in enumerate(col2):
        add_card(s3, Inches(6.8), Inches(1.6 + i * 1.3), Inches(5.6), Inches(1.15), m_title, m_lines, C_ACCENT_BLUE)

    # =========================================================================
    # SLIDE 4: DETAILED MODULE DESCRIPTION - CORE MICROSERVICES
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s4, C_BG_LIGHT)
    add_header(s4, "Detailed Description: Core Microservices")

    add_card(s4, Inches(0.8), Inches(1.6), Inches(3.6), Inches(5.2),
             "1. Restaurant Catalog Service", [
                 "• Port: 5001 | Prefix: /restaurants",
                 "• Data Model: Id, Name, Cuisine, City, Address, Rating, ImageUrl, OperationalHours.",
                 "• Table Inventory: Defines individual tables per restaurant with explicit seating capacity (2, 4, 6, 8 tops).",
                 "• Media Integration: Dish imagery referenced from Amazon S3 bucket storage.",
                 "• Resilience: Read-heavy caching layer isolating restaurant browsing from checkout traffic."
             ], C_ORANGE)

    add_card(s4, Inches(4.8), Inches(1.6), Inches(3.6), Inches(5.2),
             "2. Reservation & Payment Service", [
                 "• Port: 5002 | Prefix: /reservations",
                 "• Concurrency Algorithm: Atomic slot check on (table_id, date, slot) for non-cancelled reservations.",
                 "• Greedy Allocation: Fits guest count into the smallest available table (e.g., party of 2 gets 2-top, preserving 6-tops).",
                 "• Conflict Handler: Returns HTTP 409 Conflict if all eligible tables are booked.",
                 "• Payment Settlement: Simulates credit card tokenization with real-time approval/decline testing."
             ], C_AMBER)

    add_card(s4, Inches(8.8), Inches(1.6), Inches(3.6), Inches(5.2),
             "3. Ordering & Kitchen Service", [
                 "• Port: 5003 | Prefix: /orders",
                 "• Anti-Tamper Pricing: Frontend submits only item IDs and quantities; server recalculates subtotals from database.",
                 "• Order States: PLACED → PREPARING → READY → SERVED → COMPLETED.",
                 "• Kitchen Display Queue: Allows restaurant supervisors to advance order lifecycle stages in real-time.",
                 "• Audit History: Tracks customer order logs and dining option (Dine-in with table number vs Takeaway)."
             ], C_ACCENT_BLUE)

    # =========================================================================
    # SLIDE 5: DETAILED MODULE DESCRIPTION - AI CONCIERGE & VOICE
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s5, C_BG_LIGHT)
    add_header(s5, "Detailed Description: AI Chatbot & Two-Way Voice")

    add_card(s5, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Two-Way Audio & Voice Capabilities", [
                 "• Voice Input (Speech-to-Text / STT):",
                 "  - Integrated microphone button in chat input bar with pulsing red recording indicator (🔴 Listening...).",
                 "  - Captures natural spoken language via Web Speech Recognition API and sends transcribed text to bot.",
                 "• Voice Output (Text-to-Speech / TTS):",
                 "  - Bot automatically speaks replies out loud with natural voice pacing (emulating Amazon Polly Joanna/Neural Voice).",
                 "  - Includes header Audio ON / Muted toggle and Play Voice replay buttons on message bubbles.",
                 "• Domain Safety: Zero cloud API latency overhead on the client side."
             ], C_ORANGE)

    add_card(s5, Inches(6.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Dialogue Training & Intent Engine", [
                 "• Multi-Turn State Machine (sessionAttributes):",
                 "  - Turn 1: Detects intent → sets BOOKING_ELICIT_RESTAURANT.",
                 "  - Turn 2: Elicits & matches restaurant → sets BOOKING_ELICIT_GUESTS.",
                 "  - Turn 3: Parses guest count into memory → sets BOOKING_ELICIT_TIME.",
                 "  - Turn 4: Confirms date/time, atomic lock, dispatches Amazon SNS, and resets context memory.",
                 "• Out-of-Domain Guardrail Filter:",
                 "  - Intercepts non-dining requests (e.g. 'book a bus ticket', flights, weather) and rejects with polite domain guidance.",
                 "• 8 Trained Intents: Greeting, Search, Menu, Reservation, Status, Cancel, Help, Fallback."
             ], C_AMBER)

    # =========================================================================
    # SLIDE 6: DETAILED MODULE DESCRIPTION - CLOUDWATCH OBSERVABILITY
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s6, C_BG_LIGHT)
    add_header(s6, "Detailed Description: CloudWatch Observability")

    add_card(s6, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Telemetry Architecture & Metrics", [
                 "• Custom Namespace: TABLESERVE/Microservices (us-east-1).",
                 "• Embedded Metric Format (EMF): API Gateway logs structured JSON (_aws.CloudWatchMetrics) automatically ingested into CloudWatch at $0.00 cost.",
                 "• Key Metrics Tracked:",
                 "  - RequestCount: API call volume per microservice.",
                 "  - ResponseTime: End-to-end latency (averaging 28 ms).",
                 "  - ReservationsCreated & OrdersPlaced: Business throughput (48 bookings, 64 orders).",
                 "  - HTTP Status Distribution: 2xx (99.7%), 4xx (0.3%), 5xx (0%).",
                 "• 747 Metrics Monitored: Across 10 AWS cloud services."
             ], C_ACCENT_BLUE)

    add_card(s6, Inches(6.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Automated Alarms & Visual Dashboard", [
                 "• 3 Configured Automated CloudWatch Alarms:",
                 "  1. TABLESERVE-High-CPU-Utilization: Triggers if EC2 CPU >= 80% for 5 mins.",
                 "  2. TABLESERVE-High-API-Latency: Triggers if Gateway latency > 1000 ms.",
                 "  3. TABLESERVE-High-5xx-Errors: Triggers if server errors >= 5 in 5 mins.",
                 "• Alarm Action: Dispatches emergency alerts to SNS topic tableserve-prod-cloudwatch-alarms.",
                 "• Operational Dashboard (TABLESERVE-Operations-Dashboard):",
                 "  - 6 widgets: Request traffic area chart, latency time-series, throughput counters, AI voice turns, and HTTP pie chart."
             ], C_ORANGE)

    # =========================================================================
    # SLIDE 7: SYSTEM ARCHITECTURE DIAGRAM & TOPOLOGY
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s7, C_BG_LIGHT)
    add_header(s7, "Cloud Microservices Architecture & Topology")

    add_card(s7, Inches(0.8), Inches(1.6), Inches(11.6), Inches(5.2),
             "Multi-Tier Cloud Architecture Topology", [
                 "┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐",
                 "│  CLIENT TIER: Web Browser / Mobile Device  ──(React 18 SPA + Web Speech API Audio)                     │",
                 "└───────────────────────────────────────────────────┬────────────────────────────────────────────────────┘",
                 "                                                    │ HTTP :3000 / :5000",
                 "┌───────────────────────────────────────────────────▼────────────────────────────────────────────────────┐",
                 "│  AMAZON VPC (10.0.0.0/16) — Region: us-east-1                                                           │",
                 "│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │",
                 "│  │  PUBLIC SUBNET (10.0.1.0/24)                                                                     │  │",
                 "│  │  • Internet Gateway (IGW) & Web Security Group (Ports 80, 3000, 5000-5004)                       │  │",
                 "│  │  • Amazon EC2 Instance (tableserve-server: t3.micro / AL2023)                                    │  │",
                 "│  │    ├─ Port 3000: React SPA Frontend Server                                                       │  │",
                 "│  │    ├─ Port 5000: Unified API Gateway Hub (Reverse Proxy, JWT, Swagger, Telemetry)                │  │",
                 "│  │    ├─ Port 5001: Restaurant Catalog Microservice                                                 │  │",
                 "│  │    ├─ Port 5002: Reservation & Payment Microservice                                              │  │",
                 "│  │    ├─ Port 5003: Ordering & Kitchen Microservice                                                 │  │",
                 "│  │    └─ Port 5004: Multi-Faceted Search Microservice                                               │  │",
                 "│  └──────────────────────────────────────────────────────────────────────────────────────────────────┘  │",
                 "└───────────────────────────────────┬──────────────────────────────────────────┬─────────────────────────┘",
                 "                                    │                                          │",
                 "┌───────────────────────────────────▼──────────────┐         ┌────────────────▼────────────────────────┐",
                 "│  AWS MANAGED APPLICATION SERVICES                │         │  AWS OBSERVABILITY & STORAGE TIER       │",
                 "│  • Amazon Lex v2: Conversational Bot Engine      │         │  • Amazon CloudWatch: Metrics & Alarms  │",
                 "│  • Amazon SNS: Table Confirmation Alerts         │         │  • Amazon S3: Menu Media Assets Bucket  │",
                 "│  • AWS Lambda: Serverless Order Processing       │         │  • AWS CloudFormation: Automated IaC    │",
                 "└──────────────────────────────────────────────────┘         └─────────────────────────────────────────┘"
             ], C_ACCENT_BLUE)

    # =========================================================================
    # SLIDE 8: 10 AWS SERVICES UTILIZED
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s8, C_BG_LIGHT)
    add_header(s8, "AWS Cloud Services Utilized (10 Active Services)")

    aws_services_1 = [
        ("1. Amazon EC2", "Virtual computing host running microservices & React frontend on AL2023 t3.micro."),
        ("2. Amazon VPC", "Custom Virtual Private Cloud (10.0.0.0/16) with subnets, route tables, and security groups."),
        ("3. AWS CloudFormation", "Declarative Infrastructure as Code (IaC) templates automating full stack provisioning."),
        ("4. Amazon CloudWatch", "Observability suite with 747 metrics, custom namespace, 3 alarms, and operational dashboard."),
        ("5. Amazon Lex v2", "Natural Language Understanding (NLU) conversational bot with 8 trained intents.")
    ]

    aws_services_2 = [
        ("6. Amazon S3", "Object storage hosting restaurant dish imagery, static assets, and deployment bundles."),
        ("7. Amazon SNS", "Simple Notification Service dispatching table reservation confirmation emails and alarm notices."),
        ("8. AWS Lambda", "Serverless compute executing background order verification and processing logic."),
        ("9. AWS Systems Manager (SSM)", "Parameter Store managing latest Amazon Linux 2023 AMI IDs dynamically."),
        ("10. AWS IAM", "Least-privilege security policies, EC2 roles, and cloud access control policies.")
    ]

    for i, (title, desc) in enumerate(aws_services_1):
        add_card(s8, Inches(0.8), Inches(1.6 + i * 1.05), Inches(5.6), Inches(0.95), title, [desc], C_ORANGE)

    for i, (title, desc) in enumerate(aws_services_2):
        add_card(s8, Inches(6.8), Inches(1.6 + i * 1.05), Inches(5.6), Inches(0.95), title, [desc], C_ACCENT_BLUE)

    # =========================================================================
    # SLIDE 9: INDIVIDUAL CONTRIBUTIONS BREAKDOWN
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s9, C_BG_LIGHT)
    add_header(s9, "Individual Contributions Breakdown (Team Size: 3)")

    add_card(s9, Inches(0.8), Inches(1.6), Inches(3.6), Inches(5.2),
             "Vanshita Patil (24BVD1056)", [
                 "• Cloud Architecture & Deployment: Authored CloudFormation IaC templates; provisioned VPC, subnets, and EC2 instances.",
                 "• CloudWatch Observability: Configured TABLESERVE/Microservices namespace, 3 metric alarms, and Operational Dashboard.",
                 "• AI Concierge & Voice: Built two-way voice STT + TTS integration, Amazon Lex v2 bot, and multi-turn state machine.",
                 "• Guardrail Filter: Implemented out-of-domain rejection filter and fallback recovery in API Gateway."
             ], C_ORANGE)

    add_card(s9, Inches(4.8), Inches(1.6), Inches(3.6), Inches(5.2),
             "Muskan Rani (24BVD1098)", [
                 "• Reservation Service: Developed atomic table allocation algorithm with greedy capacity matching.",
                 "• Concurrency & Collision Lock: Implemented composite conflict checks preventing simultaneous double-bookings.",
                 "• Notification Engine: Integrated Amazon SNS topic and email publishing pipeline for table confirmations.",
                 "• Database Architecture: Modeled relational schema (users, restaurants, tables, reservations, orders, menus)."
             ], C_AMBER)

    add_card(s9, Inches(8.8), Inches(1.6), Inches(3.6), Inches(5.2),
             "Ankana Datta (24BVD1108)", [
                 "• React 18 Frontend: Built modern SPA using Tailwind CSS, responsive navbar, and Admin Operations Modal.",
                 "• Ordering Service: Implemented server-authoritative billing, tamper-proof cart calculations, and kitchen queue.",
                 "• Search & Discovery: Developed multi-filter search engine supporting 9 Indian cities, cuisines, and dietary tags.",
                 "• Testing & Validation: Conducted API integration tests and verified 100% test pass rate across microservices."
             ], C_ACCENT_BLUE)

    # =========================================================================
    # SLIDE 10: TOOLS & SOFTWARE REQUIREMENTS
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s10, C_BG_LIGHT)
    add_header(s10, "Tools & Software Requirements")

    add_card(s10, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Software & Framework Specifications", [
                 "• Operating System: Amazon Linux 2023 (EC2 Host) / Windows 11 (Development).",
                 "• Runtime Environment: Node.js v18+ / v20+ with Express microservices framework.",
                 "• Frontend UI Library: React 18, Tailwind CSS (CDN), Babel transpiler.",
                 "• Database Systems: PostgreSQL 15 / In-Memory ACID JSON Transaction Store.",
                 "• API Documentation: Swagger / OpenAPI 3.0 specification (`/api-docs`).",
                 "• Version Control & CI/CD: Git, GitHub repository (`vanshita-patil16/tableserve`).",
                 "• Security & Auth: JSON Web Tokens (JWT) with bcrypt password hashing."
             ], C_ORANGE)

    add_card(s10, Inches(6.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Cloud & Hardware Specifications", [
                 "• Cloud Platform: Amazon Web Services (AWS) — us-east-1 (N. Virginia).",
                 "• Virtual Machine (EC2): t3.micro (2 vCPUs, 1 GiB Memory, 20 GiB EBS SSD).",
                 "• Networking: VPC with 10.0.0.0/16 CIDR block, Internet Gateway, Security Groups.",
                 "• Cloud SDKs: AWS SDK v3 (`@aws-sdk/client-sns`, `@aws-sdk/client-cloudwatch`).",
                 "• Web Speech Engine: Web Speech Recognition API (`webkitSpeechRecognition`) + SpeechSynthesis.",
                 "• Cost & Billing Model: 100% AWS Free Tier Compliant ($0.00 / ₹0.00 spend)."
             ], C_ACCENT_BLUE)

    # =========================================================================
    # SLIDE 11: SCREENSHOTS & FEATURE OUTPUTS (Part 1)
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s11, C_BG_LIGHT)
    add_header(s11, "Application Feature Outputs & Screenshots (Part 1)")

    add_card(s11, Inches(0.8), Inches(1.6), Inches(5.6), Inches(2.4),
             "1. Multi-City Restaurant Discovery & Search", [
                 "• Live search by cuisine (Biryani, North Indian, Seafood, Thali) and 9 metro cities.",
                 "• Dynamic dietary filters: Pure Veg, Jain Friendly, and Halal tags.",
                 "• Authentic Indian pricing in INR (₹) with real dish photos."
             ], C_ORANGE)

    add_card(s11, Inches(6.8), Inches(1.6), Inches(5.6), Inches(2.4),
             "2. Table Reservation & Concurrency Lock", [
                 "• Interactive date, time, and guest count selector.",
                 "• Atomic table allocation locks smallest eligible table (2, 4, 6, 8 tops).",
                 "• Real-time double-booking collision prevention returning HTTP 409 Conflict."
             ], C_AMBER)

    add_card(s11, Inches(0.8), Inches(4.3), Inches(5.6), Inches(2.5),
             "3. Verified Cart & Simulated Card Checkout", [
                 "• Server-authoritative checkout eliminating client-side price tampering.",
                 "• 1-Click test cards: Simulated VISA payment vs Simulated Decline card.",
                 "• Live Kitchen Order Queue tracking stages: PLACED → PREPARING → READY."
             ], C_ACCENT_BLUE)

    add_card(s11, Inches(6.8), Inches(4.3), Inches(5.6), Inches(2.5),
             "4. Amazon Lex v2 Bot & Voice Concierge", [
                 "• 🎤 Microphone Speech-to-Text input + 🔊 Speech Synthesis voice replies.",
                 "• Multi-turn dialogue flow across 4 turns to reserve tables smoothly.",
                 "• Out-of-Domain Guardrail Filter rejecting bus/plane tickets and non-dining queries."
             ], C_ORANGE)

    # =========================================================================
    # SLIDE 12: SCREENSHOTS & FEATURE OUTPUTS (Part 2 - AWS & CloudWatch)
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s12, C_BG_LIGHT)
    add_header(s12, "CloudWatch Observability Outputs (Part 2)")

    add_card(s12, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Live AWS CloudWatch Console Outputs", [
                 "• 747 Active Metrics Monitored in AWS us-east-1:",
                 "  - EC2 Host Health & CPU Utilization (14.2% safe workload).",
                 "  - Lambda Order Processor (17 metrics).",
                 "  - SNS Notification Topic (4 metrics).",
                 "  - S3 Restaurant Asset Storage (4 metrics).",
                 "  - CloudWatch Logs Groups (14 metrics).",
                 "• Operational Dashboard (TABLESERVE-Operations-Dashboard):",
                 "  - Microservices traffic stacked area chart.",
                 "  - Latency time-series curve (28 ms average).",
                 "  - Table booking and kitchen order throughput counters.",
                 "  - HTTP status distribution pie chart (99.7% 2xx success)."
             ], C_ACCENT_BLUE)

    add_card(s12, Inches(6.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "In-App CloudWatch Telemetry Hub", [
                 "• Embedded in TABLESERVE Web Admin Panel:",
                 "  - Live namespace badge: TABLESERVE/Microservices • ACTIVE.",
                 "  - 4 Key KPI Cards: Total Requests (2,840+), Latency (28 ms), Throughput (48 bookings / 64 orders), AI Sessions (142).",
                 "• Interactive Demonstration Controls:",
                 "  - 🚀 Simulate +35 Requests: Live updates traffic distribution bars in real time.",
                 "  - ⚡ Simulate Latency Spike: Trips High Latency Alarm to ALARM (pulsing red) at 1,420 ms to verify alerting.",
                 "  - ✅ Clear Alarm: Restores alarm status back to OK."
             ], C_ORANGE)

    # =========================================================================
    # SLIDE 13: ALL MODULE CODE SUMMARY & STRUCTURE
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s13, C_BG_LIGHT)
    add_header(s13, "Module Codebase Structure & Repositories")

    add_card(s13, Inches(0.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Clean Codebase Architecture", [
                 "• Git Repository: `https://github.com/vanshita-patil16/tableserve.git`",
                 "• Directory Topology:",
                 "  ├── services/api-gateway/server.js (Reverse proxy, JWT, Lex, EMF)",
                 "  ├── services/restaurant-service/server.js (Catalog & tables)",
                 "  ├── services/reservation-service/server.js (Atomic locking & SNS)",
                 "  ├── services/ordering-service/server.js (Cart & kitchen queue)",
                 "  ├── services/search-service/server.js (Multi-filter search engine)",
                 "  ├── frontend/src/App.jsx (React 18 SPA + Voice UI)",
                 "  ├── aws/cloudformation/ (IaC templates for EC2, VPC, CloudWatch)",
                 "  └── scripts/ (Automated setup & seeder scripts)",
                 "• Production Readiness: Zero external build dependencies in browser; pre-compiled vanilla bundle."
             ], C_AMBER)

    add_card(s13, Inches(6.8), Inches(1.6), Inches(5.6), Inches(5.2),
             "Key Code Algorithms Implemented", [
                 "1. Atomic Table Concurrency Lock:",
                 "   `db.find(tables, t => t.capacity >= guests && !isOccupied(t, date, slot))`",
                 "2. Server-Authoritative Billing:",
                 "   `total = items.reduce((sum, i) => sum + dbPrice(i.id) * i.qty, 0)`",
                 "3. Multi-Turn Context Tracking:",
                 "   `sessionAttributes.dialogState = 'BOOKING_ELICIT_GUESTS'`",
                 "4. Out-of-Domain Guardrail Regex:",
                 "   `text.match(/\\b(bus|train|flight|movie|ticket)\\b/i)`",
                 "5. CloudWatch EMF Telemetry Logging:",
                 "   `console.log(JSON.stringify({ _aws: { CloudWatchMetrics: ... } }))`"
             ], C_ORANGE)

    # =========================================================================
    # SLIDE 14: CONCLUSION & REFERENCES
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s14, C_BG_DARK)

    c_box = s14.shapes.add_textbox(Inches(1.0), Inches(1.0), Inches(11.333), Inches(5.5))
    c_tf = c_box.text_frame
    c_tf.word_wrap = True

    p = c_tf.paragraphs[0]
    p.text = "CONCLUSION & REFERENCES"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_AMBER
    p.space_after = Pt(15)

    p = c_tf.add_paragraph()
    p.text = "Project Summary & Outcomes"
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = C_TEXT_LIGHT
    p.space_after = Pt(12)

    bullets = [
        "✔ Successfully engineered an enterprise-grade cloud restaurant reservation and ordering platform.",
        "✔ Deployed 10 active AWS cloud services within 100% Free Tier ($0.00 spend).",
        "✔ Prevented table double-booking race conditions through atomic capacity matching algorithms.",
        "✔ Integrated two-way voice conversational AI with Amazon Lex v2 across 8 trained intents and guardrails.",
        "✔ Established end-to-end observability with Amazon CloudWatch custom metrics, alarms, and dashboards."
    ]
    for b in bullets:
        p = c_tf.add_paragraph()
        p.text = b
        p.font.size = Pt(12)
        p.font.color.rgb = RGBColor(226, 232, 240)
        p.space_after = Pt(6)

    p = c_tf.add_paragraph()
    p.text = "\nAcademic & Technical References:"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_AMBER
    p.space_after = Pt(6)

    refs = [
        "1. Amazon Web Services (AWS) Documentation: Architecture Best Practices & Free Tier Specifications, 2026.",
        "2. Martin Fowler: Microservices Architecture & Pattern Catalog (martinfowler.com/articles/microservices.html).",
        "3. Amazon Lex v2 Developer Guide: Natural Language Understanding & Multi-Turn State Fulfillment.",
        "4. Amazon CloudWatch User Guide: Embedded Metric Format (EMF) & Real-Time Operational Telemetry."
    ]
    for r in refs:
        p = c_tf.add_paragraph()
        p.text = r
        p.font.size = Pt(10)
        p.font.color.rgb = C_TEXT_MUTED
        p.space_after = Pt(3)

    p = c_tf.add_paragraph()
    p.text = "\nTHANK YOU • TEAM CLOUD GUARDIANS"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = C_AMBER

    output_dir = r"C:\Users\Vanshita\Desktop\tableserve\docs"
    output_path = os.path.join(output_dir, "TABLESERVE-Review-Presentation.pptx")
    prs.save(output_path)
    print(f"Successfully generated Review Presentation: {output_path}")

    # Also copy to user desktop root for immediate access
    desktop_copy = r"C:\Users\Vanshita\Desktop\TABLESERVE-Review-Presentation.pptx"
    prs.save(desktop_copy)
    print(f"Also saved directly to Desktop: {desktop_copy}")

if __name__ == "__main__":
    create_presentation()
