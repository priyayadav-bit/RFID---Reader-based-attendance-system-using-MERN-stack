# Smart Attendance System (NodeMCU ESP8266 + MERN Stack) - v1.0 POC

Real-time RFID-based smart attendance tracking system built with NodeMCU ESP8266, RC522 RFID reader, Express, MongoDB, and React (Vite).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+ recommended) & **npm**
- **MongoDB** (Local instance running at `mongodb://127.0.0.1:27017` or MongoDB Atlas Free Tier)
- **Arduino IDE** (with ESP8266 board core installed)

---

### 2. Backend Setup
1. Open terminal in `server/`:
   ```bash
   cd server
   npm install
   ```
2. Configure `.env` in `server/`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/smart-attendance
   DEVICE_KEY=esp8266-rfid-secret
   ```
   *(If using MongoDB Atlas, replace `MONGO_URI` with your connection string).*

3. (Optional) Seed sample students & attendance for instant testing:
   ```bash
   npm run seed
   ```

4. Start the backend:
   ```bash
   npm run dev
   # Server runs on http://0.0.0.0:5000
   ```

---

### 3. Frontend Web Dashboard Setup
1. Open another terminal in `client/`:
   ```bash
   cd client
   npm install
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   # Dashboard opens at http://localhost:3000
   ```

---

### 4. Hardware Wiring & Firmware Upload

#### Pin Connections (RC522 runs on **3.3V ONLY**):
| Component | RC522 / Output Pin | NodeMCU Pin |
|---|---|---|
| RFID Reader | SDA (SS) | **D2** (GPIO 4) |
| RFID Reader | SCK | **D5** (GPIO 14) |
| RFID Reader | MOSI | **D7** (GPIO 13) |
| RFID Reader | MISO | **D6** (GPIO 12) |
| RFID Reader | RST | **D1** (GPIO 5) |
| RFID Reader | 3.3V | **3V3** |
| RFID Reader | GND | **GND** |
| Status LED | Anode (+) via 220Ω | **D4** (GPIO 2) |
| Active Buzzer | (+) | **D8** (GPIO 15) |
| LED / Buzzer | Cathode (-) | **GND** |

#### Flashing the Firmware:
1. Open `firmware/attendance_nodemcu/attendance_nodemcu.ino` in Arduino IDE.
2. In **Tools > Manage Libraries**, install:
   - `MFRC522` by miguelbalboa
   - `ArduinoJson` by Benoit Blanchon (v6 or v7)
3. In `attendance_nodemcu.ino`, update:
   - `WIFI_SSID`: Your Wi-Fi network name
   - `WIFI_PASS`: Your Wi-Fi password
   - `SERVER_URL`: `http://<your-laptop-ip>:5000/api/scan` (e.g. `http://192.168.29.151:5000/api/scan`)
   - `DEVICE_KEY`: `esp8266-rfid-secret` (must match `.env`)
4. Select board **NodeMCU 1.0 (ESP-12E Module)** and your COM port.
5. Click **Upload**. Open Serial Monitor at **115200 baud**.

---

## 📡 API Reference

Base URL: `http://<laptop-ip>:5000/api`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/scan` | NodeMCU RFID scan endpoint (`x-device-key` header required) |
| `GET` | `/students` | Get list of all registered students |
| `POST` | `/students` | Register a new student (`name`, `rollNo`, `cardUid`) |
| `DELETE` | `/students/:id` | Remove a student |
| `GET` | `/students/last-unknown` | Retrieve UID of the most recent unrecognized card scan |
| `GET` | `/attendance?date=YYYY-MM-DD` | Attendance records for date (defaults to today) |
| `GET` | `/attendance/summary?date=YYYY-MM-DD` | Roll call with Present/Absent status and rate |
| `GET` | `/health` | Server and MongoDB connection status & local network IPs |

---

## 🧪 Testing Checklist (v1.0 MVP)

- [x] NodeMCU connects to Wi-Fi and prints IP in Serial Monitor
- [x] Unregistered card scan triggers 3 beeps and stores UID in `/api/students/last-unknown`
- [x] Teacher clicks **"Use last scanned card"** to autofill UID and registers the student
- [x] Registered card scan triggers 1 beep + LED on; attendance is recorded
- [x] Second scan of same card on same day triggers 2 short beeps ("Already marked today")
- [x] Today live dashboard auto-refreshes every 5s with new scans
- [x] History page displays correct Present/Absent counts and percentage