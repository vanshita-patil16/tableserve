# TABLESERVE: Local Run Guide

## Quick Start on One Windows Laptop

### 1. Launching All Services in One Command
Double-click `run-local.bat` in the project root, or execute in PowerShell:
```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
node start-all.js
```

This single command boots the entire architecture concurrently:
- 🌐 **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- ⚡ **API Gateway**: [http://localhost:5000](http://localhost:5000)
- 📖 **Interactive Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- 🍽️ **Restaurant Service**: [http://localhost:5001](http://localhost:5001)
- 📅 **Reservation & Payment Service**: [http://localhost:5002](http://localhost:5002)
- 🧾 **Ordering Service**: [http://localhost:5003](http://localhost:5003)
- 🔍 **Search Service**: [http://localhost:5004](http://localhost:5004)

---

## 2. Default Demo User Accounts

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@tableserve.com` | `Admin@123` | Full CRUD on Restaurants & Menus, Kitchen Display status updates, System Monitor |
| **Customer 1** | `john.doe@example.com` | `Customer@123` | Table reservations, online orders, personal history |
| **Customer 2** | `alice.smith@example.com` | `Customer@123` | Table reservations, online orders |

> [!TIP]
> The top navigation bar includes **1-Click Demo Buttons** inside the "Sign In" modal to switch roles instantly without typing credentials!

---

## 3. Running Automated Tests Locally
Run the unit test suite:
```powershell
npm run test:unit
```
Run the full End-to-End API test suite:
```powershell
npm test
```
