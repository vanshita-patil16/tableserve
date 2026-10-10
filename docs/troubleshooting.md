# TABLESERVE: Troubleshooting & Diagnostic Guide

## 1. Port In Use Errors

### Symptom: `Error: listen EADDRINUSE: address already in use :::5000` (or 5001, 5002, 5003, 5004, 3000)
### Cause:
A previous node process or service is still running in the background holding the port.
### Resolution on Windows:
```powershell
# Find process using the port (e.g. port 5000)
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object OwningProcess

# Or kill all node processes cleanly:
Stop-Process -Name node -Force
```

---

## 2. Node.js Not Recognized on PATH

### Symptom: `'node' is not recognized as the name of a cmdlet...`
### Resolution:
Add the standard Windows Node.js path to the active PowerShell session:
```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
```
Or execute `run-local.bat`, which handles this automatically.

---

## 3. Database State Reset

### Symptom: Need to restore initial seed data after extensive testing
### Resolution:
Run the seeder script:
```powershell
npm run seed
```
This restores all 4 demo users, 6 restaurants, 18 tables, and menus.

---

## 4. Docker Desktop Not Running

### Symptom: `Cannot connect to the Docker daemon at npipe:////./pipe/docker_engine`
### Resolution:
1. Start the **Docker Desktop** application from the Windows Start menu.
2. Wait for the engine to initialize (whale icon steady).
3. If Docker is unavailable on your system, you can use **Native Local Mode**:
   ```powershell
   .\run-local.bat
   ```
   All microservices, frontend, and tests run directly with zero native dependencies.

---

## 5. Double-Booking Conflict During Test Run

### Symptom: HTTP 409 Conflict: `Double-booking prevention: No tables available...`
### Explanation:
This is intentional behavior verifying that the system successfully blocked a duplicate reservation!
To free up table slots:
- Go to **My Bookings** in the top navigation bar.
- Click **"Cancel Booking"** on previous reservations.
- The table slot will immediately be unlocked and available.
