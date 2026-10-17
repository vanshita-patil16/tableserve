#!/usr/bin/env python3
"""
Generates a high-resolution, publication-grade Cloud Architecture Diagram
for TABLESERVE (AWS us-east-1) using Matplotlib and Pillow.
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

def generate_diagram():
    fig, ax = plt.subplots(figsize=(16, 11), dpi=300)
    fig.patch.set_facecolor('#0f172a') # Slate 900
    ax.set_facecolor('#0f172a')

    # Coordinates: 0 to 16 horizontal, 0 to 11 vertical
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 11)
    ax.axis('off')

    # --- Title Banner ---
    title_box = patches.FancyBboxPatch((0.5, 9.8), 15.0, 0.9, boxstyle="round,pad=0.2",
                                       fc='#1e293b', ec='#f97316', lw=2)
    ax.add_patch(title_box)
    ax.text(8.0, 10.35, "TABLESERVE: CLOUD MICROSERVICES ARCHITECTURE TOPOLOGY",
            ha='center', va='center', color='#ffffff', fontsize=16, fontweight='bold', family='sans-serif')
    ax.text(8.0, 9.95, "Amazon Web Services (AWS) • Region: us-east-1 (N. Virginia) • 100% Free Tier Eligible",
            ha='center', va='center', color='#cbd5e1', fontsize=10, family='sans-serif')

    # --- 1. Client Layer ---
    client_box = patches.FancyBboxPatch((0.5, 8.4), 15.0, 1.05, boxstyle="round,pad=0.15",
                                        fc='#1e293b', ec='#3b82f6', lw=1.5)
    ax.add_patch(client_box)
    ax.text(1.0, 8.95, "CLIENT LAYER\n(Web & Mobile)", color='#60a5fa', fontsize=11, fontweight='bold', va='center')
    
    # Client Subcomponents
    c1 = patches.FancyBboxPatch((3.2, 8.55), 3.6, 0.75, boxstyle="round,pad=0.1", fc='#334155', ec='#94a3b8', lw=1)
    ax.add_patch(c1)
    ax.text(5.0, 8.92, "React 18 SPA Frontend\n(:3000 / Tailwind CSS)", color='#ffffff', fontsize=9, ha='center', va='center')

    c2 = patches.FancyBboxPatch((7.2, 8.55), 3.8, 0.75, boxstyle="round,pad=0.1", fc='#334155', ec='#94a3b8', lw=1)
    ax.add_patch(c2)
    ax.text(9.1, 8.92, "Two-Way Voice Audio\n(Web Speech STT + TTS)", color='#ffffff', fontsize=9, ha='center', va='center')

    c3 = patches.FancyBboxPatch((11.4, 8.55), 3.8, 0.75, boxstyle="round,pad=0.1", fc='#334155', ec='#94a3b8', lw=1)
    ax.add_patch(c3)
    ax.text(13.3, 8.92, "Admin Operations Hub\n(Live Telemetry & Queue)", color='#ffffff', fontsize=9, ha='center', va='center')

    # Arrow from Client to VPC
    ax.annotate('', xy=(8.0, 7.85), xytext=(8.0, 8.4),
                arrowprops=dict(facecolor='#f97316', edgecolor='#ea580c', width=2.5, headwidth=8))
    ax.text(8.2, 8.1, "HTTPS / REST (:3000 & :5000)", color='#fed7aa', fontsize=8.5, fontweight='bold')

    # --- 2. Amazon VPC Outer Box ---
    vpc_box = patches.FancyBboxPatch((0.5, 0.5), 10.5, 7.3, boxstyle="round,pad=0.2",
                                     fc='#020617', ec='#22c55e', lw=2, linestyle='--')
    ax.add_patch(vpc_box)
    ax.text(1.0, 7.55, "AMAZON VPC (10.0.0.0/16) — us-east-1", color='#4ade80', fontsize=11, fontweight='bold')

    # Public Subnet
    subnet_box = patches.FancyBboxPatch((0.8, 0.8), 9.9, 6.4, boxstyle="round,pad=0.15",
                                        fc='#0f172a', ec='#475569', lw=1.5)
    ax.add_patch(subnet_box)
    ax.text(1.2, 6.95, "PUBLIC SUBNET (10.0.1.0/24) • IGW • Web Security Group (Ports 80, 3000, 5000-5004)",
            color='#94a3b8', fontsize=9, fontweight='bold')

    # EC2 Instance Box
    ec2_box = patches.FancyBboxPatch((1.1, 1.1), 9.3, 5.5, boxstyle="round,pad=0.15",
                                     fc='#1e293b', ec='#f97316', lw=1.5)
    ax.add_patch(ec2_box)
    ax.text(1.4, 6.3, "Amazon EC2 Instance: tableserve-server (t3.micro / Amazon Linux 2023)",
            color='#fb923c', fontsize=10, fontweight='bold')

    # API Gateway Box inside EC2
    gw_box = patches.FancyBboxPatch((1.4, 4.6), 8.7, 1.3, boxstyle="round,pad=0.1",
                                    fc='#334155', ec='#fbbf24', lw=1.5)
    ax.add_patch(gw_box)
    ax.text(5.75, 5.5, "UNIFIED API GATEWAY HUB (Port 5000)", color='#fbbf24', fontsize=10.5, fontweight='bold', ha='center')
    ax.text(5.75, 4.95, "Reverse Proxy • JWT / RBAC Auth • Swagger 3.0 (/api-docs)\nCloudWatch EMF Telemetry • Lex v2 Fulfillment Engine • Out-of-Domain Guardrails",
            color='#f8fafc', fontsize=8, ha='center', va='center')

    # 4 Microservices Grid inside EC2
    ms_y = 2.7
    ms_h = 1.3
    
    # MS 1: Restaurant Catalog
    ms1 = patches.FancyBboxPatch((1.4, ms_y), 2.0, ms_h, boxstyle="round,pad=0.08", fc='#1e293b', ec='#38bdf8', lw=1.2)
    ax.add_patch(ms1)
    ax.text(2.4, ms_y + 0.9, "Restaurant Catalog", color='#38bdf8', fontsize=8.5, fontweight='bold', ha='center')
    ax.text(2.4, ms_y + 0.5, "Port: 5001\n18 Restaurants\nTable Layouts", color='#e2e8f0', fontsize=7.5, ha='center', va='center')

    # MS 2: Reservation & Payment
    ms2 = patches.FancyBboxPatch((3.6, ms_y), 2.1, ms_h, boxstyle="round,pad=0.08", fc='#1e293b', ec='#f43f5e', lw=1.2)
    ax.add_patch(ms2)
    ax.text(4.65, ms_y + 0.9, "Reservation & Pay", color='#f43f5e', fontsize=8.5, fontweight='bold', ha='center')
    ax.text(4.65, ms_y + 0.5, "Port: 5002\nAtomic Lock\nSNS Confirm", color='#e2e8f0', fontsize=7.5, ha='center', va='center')

    # MS 3: Ordering Service
    ms3 = patches.FancyBboxPatch((5.9, ms_y), 2.0, ms_h, boxstyle="round,pad=0.08", fc='#1e293b', ec='#a855f7', lw=1.2)
    ax.add_patch(ms3)
    ax.text(6.9, ms_y + 0.9, "Ordering Service", color='#a855f7', fontsize=8.5, fontweight='bold', ha='center')
    ax.text(6.9, ms_y + 0.5, "Port: 5003\nVerified Bills\nKitchen Queue", color='#e2e8f0', fontsize=7.5, ha='center', va='center')

    # MS 4: Search Service
    ms4 = patches.FancyBboxPatch((8.1, ms_y), 2.0, ms_h, boxstyle="round,pad=0.08", fc='#1e293b', ec='#34d399', lw=1.2)
    ax.add_patch(ms4)
    ax.text(9.1, ms_y + 0.9, "Search Service", color='#34d399', fontsize=8.5, fontweight='bold', ha='center')
    ax.text(9.1, ms_y + 0.5, "Port: 5004\nFull-Text Search\n9 Metro Cities", color='#e2e8f0', fontsize=7.5, ha='center', va='center')

    # Connecting arrows from Gateway to Microservices
    for x_pos in [2.4, 4.65, 6.9, 9.1]:
        ax.annotate('', xy=(x_pos, ms_y + ms_h), xytext=(x_pos, 4.6),
                    arrowprops=dict(facecolor='#94a3b8', edgecolor='#64748b', width=1.2, headwidth=5))

    # Shared Database Box
    db_box = patches.FancyBboxPatch((1.4, 1.4), 8.7, 0.95, boxstyle="round,pad=0.1",
                                    fc='#020617', ec='#64748b', lw=1.2)
    ax.add_patch(db_box)
    ax.text(5.75, 1.9, "SHARED RELATIONAL DATABASE (ACID Transactional Store)", color='#94a3b8', fontsize=9, fontweight='bold', ha='center')
    ax.text(5.75, 1.6, "PostgreSQL Tables: users • restaurants • tables • reservations • orders • menu_items",
            color='#64748b', fontsize=8, ha='center')

    # Microservices to DB arrows
    for x_pos in [2.4, 4.65, 6.9, 9.1]:
        ax.annotate('', xy=(x_pos, 2.35), xytext=(x_pos, ms_y),
                    arrowprops=dict(facecolor='#64748b', edgecolor='#475569', width=1, headwidth=4))

    # --- 3. AWS Managed Cloud Services Tier (Right Column) ---
    aws_col_x = 11.4
    aws_box = patches.FancyBboxPatch((aws_col_x, 0.5), 4.1, 7.3, boxstyle="round,pad=0.2",
                                     fc='#1e293b', ec='#eab308', lw=1.5)
    ax.add_patch(aws_box)
    ax.text(aws_col_x + 0.3, 7.55, "AWS CLOUD SERVICES", color='#fde047', fontsize=11, fontweight='bold')

    services_data = [
        ("Amazon CloudWatch", "747 Metrics • 3 Alarms • Dashboard\nNamespace: TABLESERVE/Microservices", "#38bdf8", 6.2),
        ("Amazon Lex v2", "NLU Conversational Bot Engine\n8 Intents • Two-Way Voice STT/TTS", "#a855f7", 5.0),
        ("Amazon SNS", "Pub/Sub Notification Dispatch\nTable Booking Confirmation Emails", "#f43f5e", 3.8),
        ("Amazon S3", "Cloud Storage Bucket\nMenu Photos & Static Web Assets", "#22c55e", 2.6),
        ("AWS Lambda", "Serverless Async Order Processing\nKitchen Lifecycle Verification", "#fb923c", 1.4),
        ("AWS CloudFormation & SSM", "Infrastructure as Code (IaC) Stack\nDynamic AMI Parameter Store", "#cbd5e1", 0.7)
    ]

    for title, desc, color, y_val in services_data:
        s_box = patches.FancyBboxPatch((aws_col_x + 0.2, y_val), 3.7, 0.9, boxstyle="round,pad=0.08",
                                       fc='#0f172a', ec=color, lw=1.2)
        ax.add_patch(s_box)
        ax.text(aws_col_x + 0.35, y_val + 0.6, title, color=color, fontsize=8.5, fontweight='bold')
        ax.text(aws_col_x + 0.35, y_val + 0.25, desc, color='#cbd5e1', fontsize=7.2, va='center')

    # Integration Cross-Arrows
    # Gateway to CloudWatch
    ax.annotate('', xy=(aws_col_x + 0.2, 6.6), xytext=(10.1, 5.3),
                arrowprops=dict(facecolor='#38bdf8', edgecolor='#0284c7', width=1.5, headwidth=6, linestyle=':'))
    # Gateway to Lex
    ax.annotate('', xy=(aws_col_x + 0.2, 5.4), xytext=(10.1, 5.0),
                arrowprops=dict(facecolor='#a855f7', edgecolor='#7e22ce', width=1.5, headwidth=6, linestyle=':'))
    # Reservation to SNS
    ax.annotate('', xy=(aws_col_x + 0.2, 4.2), xytext=(5.7, 3.3),
                arrowprops=dict(facecolor='#f43f5e', edgecolor='#be123c', width=1.5, headwidth=6, linestyle=':'))
    # S3 to Restaurant
    ax.annotate('', xy=(3.4, 3.3), xytext=(aws_col_x + 0.2, 3.0),
                arrowprops=dict(facecolor='#22c55e', edgecolor='#15803d', width=1.5, headwidth=6, linestyle=':'))

    plt.tight_layout()

    out_docs = r"C:\Users\Vanshita\Desktop\tableserve\docs\architecture\tableserve-architecture.png"
    out_desktop = r"C:\Users\Vanshita\Desktop\tableserve-architecture.png"
    
    os.makedirs(os.path.dirname(out_docs), exist_ok=True)
    plt.savefig(out_docs, dpi=300, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.savefig(out_desktop, dpi=300, bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()

    print(f"Successfully generated Architecture Diagram:")
    print(f"  Docs: {out_docs}")
    print(f"  Desktop: {out_desktop}")

if __name__ == "__main__":
    generate_diagram()
