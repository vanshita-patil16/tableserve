# TABLESERVE: Installation Guide

## 1. System Requirements
- **Operating System**: Windows 10/11, macOS 12+, or Ubuntu 20.04+ Linux
- **Node.js**: v18.0.0 or higher (Tested on Node v20 & v24)
- **Git**: v2.30+
- **Docker & Docker Compose** (Optional for local mode, required for containerized deployment)
- **RAM**: Minimum 4GB (8GB recommended)

---

## 2. Windows Installation (Zero-Docker Native Setup)

### Step 1: Clone or Open Repository
```powershell
cd C:\Users\Vanshita\.gemini\antigravity\scratch\tableserve
```

### Step 2: Install Root Dependencies
```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
npm install
```

### Step 3: Seed Database & Verify Initial State
```powershell
npm run seed
```

### Step 4: Run the Complete Platform
```powershell
npm start
# or double click: run-local.bat
```

---

## 3. Docker Compose Installation

### Step 1: Ensure Docker Desktop is Running
Verify in terminal:
```powershell
docker --version
docker compose version
```

### Step 2: Build & Start Containers
```powershell
docker compose up --build -d
# or double click: run-docker.bat
```

### Step 3: Verify Running Services
```powershell
docker compose ps
```
Expected output:
- `tableserve-postgres` (Port 5432)
- `tableserve-restaurant-service` (Port 5001)
- `tableserve-reservation-service` (Port 5002)
- `tableserve-ordering-service` (Port 5003)
- `tableserve-search-service` (Port 5004)
- `tableserve-api-gateway` (Port 5000)
- `tableserve-frontend` (Port 3000)
