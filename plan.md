# Smart Attendance System – Build Plan

**Current version: v1.0 (MVP / POC)**
**Goal of v1:** One working end-to-end flow. A student taps an RFID card, the NodeMCU sends the card ID over Wi-Fi, the server saves attendance in MongoDB, and the teacher sees it on a web page.

> If this flow works, v1 is done. Anything not needed for this flow is moved to later versions.

---

## 1. Scope of v1

### In scope (must have)
| # | Feature | Done when |
|---|---------|-----------|
| 1 | Read RFID card with RC522 | Card UID prints in Serial Monitor |
| 2 | NodeMCU connects to Wi-Fi | Gets an IP address |
| 3 | NodeMCU sends UID to server (HTTP POST) | Server receives the UID |
| 4 | Buzzer + LED feedback | 1 beep = marked, 2 beeps = error / unknown card |
| 5 | Register student (name, roll no, card UID) | Student is saved in DB |
| 6 | Mark attendance from scan | Record saved with date and time |
| 7 | No duplicate for same student on same day | 2nd scan says "already marked" |
| 8 | Teacher page: today's attendance table | Page shows name, roll no, time |
| 9 | Teacher page: all students list | Shows students with Present / Absent for today |
| 10 | Filter attendance by date | Pick a date, table updates |

### Out of scope for v1 (later versions)
Teacher login, subject/class-wise attendance, reports (Excel/PDF), SMS/email alerts, mobile app, cloud hosting, multiple readers, WiFiManager, HTTPS.

---

## 2. System Overview

```
[RFID Card] -> [RC522] -> [NodeMCU ESP8266] --Wi-Fi (HTTP POST)--> [Node + Express API] -> [MongoDB]
                                  |                                         ^
                          [LED + Buzzer]                                    |
                                                          [React Web App] --+  (GET data)
```

**Rule for the network:** the NodeMCU, the laptop running the server, and the Wi-Fi router must all be on the **same network**. The NodeMCU must use the laptop's **local IP** (for example `192.168.1.x`), never `localhost`.

---

## 3. Hardware

### Components
- NodeMCU ESP8266 (ESP-12E)
- RFID reader RC522 + 2–3 RFID cards/tags
- Buzzer (active), LED + 220 Ω resistor
- Breadboard, jumper wires, USB cable

### Wiring (RC522 runs on **3.3V only, not 5V**)
| RC522 pin | NodeMCU pin |
|-----------|-------------|
| SDA (SS) | D2 |
| SCK | D5 |
| MOSI | D7 |
| MISO | D6 |
| RST | D1 |
| 3.3V | 3V3 |
| GND | GND |
| IRQ | not connected |

| Output | NodeMCU pin |
|--------|-------------|
| LED (+ resistor) | D4 |
| Buzzer (+) | D8 |
| Buzzer / LED (-) | GND |

---

## 4. Tech Stack

| Part | Tool |
|------|------|
| Firmware | Arduino IDE, ESP8266 board package |
| Libraries | `MFRC522` (miguelbalboa), `ESP8266WiFi`, `ESP8266HTTPClient`, `ArduinoJson` |
| Backend | Node.js, Express.js, Mongoose, `cors`, `dotenv` |
| Database | MongoDB (local install or MongoDB Atlas free tier) |
| Frontend | React (Vite), `axios` |
| Tools | VS Code, Postman (for API testing) |

---

## 5. Folder Structure

```
smart-attendance/
├── plan.md
├── firmware/
│   └── attendance_nodemcu/
│       └── attendance_nodemcu.ino
├── server/
│   ├── package.json
│   ├── .env                  # PORT, MONGO_URI, DEVICE_KEY
│   ├── server.js
│   ├── models/
│   │   ├── Student.js
│   │   └── Attendance.js
│   └── routes/
│       ├── students.js
│       └── attendance.js
└── client/
    ├── package.json
    └── src/
        ├── App.jsx
        ├── api.js
        └── pages/
            ├── TodayAttendance.jsx
            ├── Students.jsx
            └── History.jsx
```

---

## 6. Database Design (MongoDB)

**Student**
| Field | Type | Notes |
|-------|------|-------|
| name | String | required |
| rollNo | String | required, unique |
| cardUid | String | required, unique (e.g. `A1B2C3D4`) |
| createdAt | Date | auto |

**Attendance**
| Field | Type | Notes |
|-------|------|-------|
| student | ObjectId (ref Student) | required |
| date | String `YYYY-MM-DD` | required |
| time | String `HH:mm:ss` | required |
| createdAt | Date | auto |

Unique index on `(student, date)` so one student cannot be marked twice in a day.

**LastUnknownScan** (kept in server memory for v1, no collection needed): stores the most recent UID that did not match any student, so the teacher can register a new card without typing the UID.

---

## 7. API Design

Base URL: `http://<laptop-ip>:5000/api`

| Method | Endpoint | Used by | Purpose |
|--------|----------|---------|---------|
| POST | `/scan` | NodeMCU | Send card UID, mark attendance |
| GET | `/students` | Web | List all students |
| POST | `/students` | Web | Register a student |
| DELETE | `/students/:id` | Web | Remove a student |
| GET | `/students/last-unknown` | Web | Get last unregistered UID scanned |
| GET | `/attendance?date=YYYY-MM-DD` | Web | Attendance for a date (default: today) |
| GET | `/attendance/summary?date=YYYY-MM-DD` | Web | All students with Present/Absent |

### `POST /scan`
Header: `x-device-key: <DEVICE_KEY from .env>` (simple protection so random requests are rejected)

Request body:
```json
{ "uid": "A1B2C3D4" }
```

Responses (the NodeMCU reads the `status` field):
| HTTP | `status` | Meaning | Device feedback |
|------|----------|---------|-----------------|
| 201 | `marked` | Attendance saved | 1 beep + LED on |
| 200 | `duplicate` | Already marked today | 2 short beeps |
| 404 | `unknown` | Card not registered (UID stored as last-unknown) | 3 short beeps |
| 401 | `unauthorized` | Wrong device key | 1 long beep |

Each response also includes `name` and `rollNo` when known (useful for debugging).

---

## 8. Firmware Logic (NodeMCU)

```
setup():
  start Serial, SPI, RC522
  set LED and buzzer pins
  connect to Wi-Fi (wait until connected, print IP)

loop():
  if Wi-Fi lost -> reconnect
  if no new card -> return
  read UID -> convert to uppercase hex string
  if same UID as last scan within 3 seconds -> ignore (stops double reads)
  POST {"uid": "<UID>"} to http://<laptop-ip>:5000/api/scan with x-device-key header
  read response status -> beep pattern from the table above
  halt card (PICC_HaltA) and stop crypto
```

Settings at the top of the `.ino` file (the only things to edit): `WIFI_SSID`, `WIFI_PASS`, `SERVER_URL`, `DEVICE_KEY`.

---

## 9. Backend Logic (Express)

`/scan` steps:
1. Check `x-device-key`; if wrong, return 401.
2. Find student by `cardUid`.
3. If not found, save UID as last-unknown and return 404 `unknown`.
4. Get today's date and current time on the server (so the device does not need a clock).
5. Try to create the Attendance record; if the unique index fails, return 200 `duplicate`.
6. Otherwise return 201 `marked`.

Server setup: enable `cors`, `express.json()`, listen on `0.0.0.0` so the NodeMCU can reach it from the Wi-Fi network.

---

## 10. Frontend (React)

Three simple pages with a top navigation bar.

1. **Today** – table of today's scans (Name, Roll No, Time). Auto-refreshes every 5 seconds so the teacher sees new scans live.
2. **Students** – form (Name, Roll No, Card UID) plus a **"Use last scanned card"** button that fills the UID from `/students/last-unknown`. Below it, a table of students with a Delete button.
3. **History** – date picker. Shows the Present/Absent list for the chosen date and the count (e.g. `Present 18 / 25`).

Styling: keep it plain CSS. No UI library in v1.

---

## 11. Build Order (step by step)

| Step | Task | Test before moving on |
|------|------|-----------------------|
| 1 | Wire the RC522 to the NodeMCU, upload a card-read sketch | UID shows in Serial Monitor |
| 2 | Add Wi-Fi connection to the sketch | IP address printed |
| 3 | Set up server, connect MongoDB, make the Student and Attendance models | Server starts, "MongoDB connected" in console |
| 4 | Build `/students` APIs | Add and list a student in Postman |
| 5 | Build `/scan` API | Postman scan returns `marked`, then `duplicate`, then `unknown` |
| 6 | Connect the NodeMCU to `/scan` with LED + buzzer feedback | Real card scan creates a DB record |
| 7 | Build the React pages | Today page shows the scan within 5 seconds |
| 8 | Full demo run with 3+ cards | Checklist in section 12 passes |

---

## 12. Test Checklist for v1

- [ ] NodeMCU connects to Wi-Fi after power-on
- [ ] Registered card scan creates one attendance record
- [ ] Scanning the same card again does not create a second record
- [ ] Unregistered card is rejected with 3 beeps and its UID appears under "Use last scanned card"
- [ ] Wrong device key is rejected
- [ ] Today page updates by itself after a scan
- [ ] History page shows correct Present/Absent for an older date
- [ ] System still works after restarting the server and the NodeMCU

---

## 13. Known Risks and Fixes

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| RC522 not detected | Wrong wiring or powered with 5V | Recheck pins, use 3.3V |
| NodeMCU can't reach server | Using `localhost`, different network, firewall | Use laptop's IPv4 address, same Wi-Fi, allow port 5000 in firewall |
| Same card saved many times | Card held on reader for long | 3-second ignore window in firmware + unique DB index |
| Board won't upload code | Wrong board/port selected | Choose "NodeMCU 1.0 (ESP-12E Module)" and the right COM port |
| Server IP changes | Router gives a new IP | Set a fixed IP for the laptop or update `SERVER_URL` |

---

## 14. Definition of Done for v1

1. Hardware is on the breadboard and powered through USB.
2. Server and web app run on the laptop.
3. A live demo works: scan card, hear a beep, see the name on the web page within a few seconds.
4. Everything is in one folder with a short README on how to run it.

---

## 15. Version Roadmap

| Version | Planned additions |
|---------|-------------------|
| **v1.0** | Basic flow described in this document |
| v1.1 | Teacher login (JWT), edit student details |
| v1.2 | Subjects / class timetable, attendance per subject |
| v1.3 | Download report as Excel / PDF, attendance percentage |
| v1.4 | WiFiManager (set Wi-Fi without re-flashing), OLED display on the device |
| v2.0 | Cloud deployment, absent alerts by SMS or email, mobile-friendly app |

## 16. Change Log

| Version | Date | Notes |
|---------|------|-------|
| v1.0 | 24 Oct 2026 | First plan created |
