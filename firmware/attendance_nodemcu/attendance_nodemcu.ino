/*
 * Smart Attendance System - NodeMCU ESP8266 + RC522 RFID
 * Version: 1.0 (MVP)
 *
 * Hardware Connections:
 * RC522 RFID Reader (runs on 3.3V ONLY):
 *   SDA (SS) -> D2 (GPIO 4)
 *   SCK      -> D5 (GPIO 14)
 *   MOSI     -> D7 (GPIO 13)
 *   MISO     -> D6 (GPIO 12)
 *   RST      -> D1 (GPIO 5)
 *   3.3V     -> 3V3
 *   GND      -> GND
 *
 * Feedback Components:
 *   LED (+)    -> D4 (GPIO 2) [with 220 Ohm resistor]
 *   Buzzer (+) -> D8 (GPIO 15)
 *   GND (-)    -> GND
 *
 * Libraries required in Arduino IDE:
 * 1. MFRC522 by GithubCommunity / miguelbalboa
 * 2. ArduinoJson by Benoit Blanchon (v6 or v7)
 * 3. ESP8266WiFi & ESP8266HTTPClient (built-in with ESP8266 core)
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// ======================== CONFIGURATION ========================
const char* WIFI_SSID     = "YOUR_WIFI_NAME";         // Replace with your Wi-Fi SSID
const char* WIFI_PASS     = "YOUR_WIFI_PASSWORD";     // Replace with your Wi-Fi Password
const char* SERVER_URL    = "http://192.168.1.100:5000/api/scan"; // Replace with your laptop's local IP address
const char* DEVICE_KEY    = "esp8266-rfid-secret";    // Must match DEVICE_KEY in server/.env
// ===============================================================

// Pin Definitions
#define RST_PIN   D1    // GPIO 5
#define SS_PIN    D2    // GPIO 4
#define LED_PIN   D4    // GPIO 2
#define BUZZER_PIN D8   // GPIO 15

MFRC522 mfrc522(SS_PIN, RST_PIN);  // Create MFRC522 instance

// Double-scan prevention variables
String lastScannedUid = "";
unsigned long lastScanTime = 0;
const unsigned long DEBOUNCE_DELAY_MS = 3000; // Ignore repeated scans within 3 seconds

// Beep and feedback functions
void soundBeep(int durationMs) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(durationMs);
  digitalWrite(BUZZER_PIN, LOW);
}

void feedbackMarked() {
  Serial.println(F("[FEEDBACK] Success - 1 Beep + LED"));
  digitalWrite(LED_PIN, HIGH);
  soundBeep(350);
  delay(650); // Keep LED on for total 1s
  digitalWrite(LED_PIN, LOW);
}

void feedbackDuplicate() {
  Serial.println(F("[FEEDBACK] Duplicate - 2 Short Beeps"));
  soundBeep(120);
  delay(100);
  soundBeep(120);
}

void feedbackUnknown() {
  Serial.println(F("[FEEDBACK] Unknown Card - 3 Short Beeps"));
  for (int i = 0; i < 3; i++) {
    soundBeep(100);
    delay(100);
  }
}

void feedbackUnauthorized() {
  Serial.println(F("[FEEDBACK] Unauthorized Device - 1 Long Beep"));
  soundBeep(900);
}

void feedbackNetworkError() {
  Serial.println(F("[FEEDBACK] Connection Error - Rapid Beeps"));
  for (int i = 0; i < 4; i++) {
    soundBeep(60);
    delay(60);
  }
}

// Convert byte array UID to uppercase Hex String (e.g. "A1B2C3D4")
String getCardUidString(MFRC522::Uid *uid) {
  String uidStr = "";
  for (byte i = 0; i < uid->size; i++) {
    if (uid->uidByte[i] < 0x10) {
      uidStr += "0";
    }
    uidStr += String(uid->uidByte[i], HEX);
  }
  uidStr.toUpperCase();
  return uidStr;
}

// Wi-Fi Connection
void connectToWiFi() {
  Serial.println();
  Serial.print(F("[WIFI] Connecting to "));
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print(F("[WIFI] Connected! IP Address: "));
    Serial.println(WiFi.localIP());
    // Single boot beep to confirm ready
    soundBeep(150);
  } else {
    Serial.println();
    Serial.println(F("[WIFI] Connection failed. Will retry in loop..."));
  }
}

// Send UID to server via HTTP POST
void sendScanToServer(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[ERROR] Wi-Fi not connected. Attempting reconnection..."));
    connectToWiFi();
    if (WiFi.status() != WL_CONNECTED) {
      feedbackNetworkError();
      return;
    }
  }

  WiFiClient client;
  HTTPClient http;

  Serial.println();
  Serial.print(F("[HTTP] Sending POST to: "));
  Serial.println(SERVER_URL);

  if (http.begin(client, SERVER_URL)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-key", DEVICE_KEY);

    // Build JSON payload: {"uid": "..."}
    String requestBody = "{\"uid\":\"" + uid + "\"}";
    Serial.print(F("[HTTP] Payload: "));
    Serial.println(requestBody);

    int httpCode = http.POST(requestBody);
    Serial.print(F("[HTTP] Response code: "));
    Serial.println(httpCode);

    if (httpCode > 0) {
      String response = http.getString();
      Serial.print(F("[HTTP] Response body: "));
      Serial.println(response);

      // Parse JSON response status
      StaticJsonDocument<256> doc;
      DeserializationError err = deserializeJson(doc, response);

      const char* status = (!err && doc.containsKey("status")) ? doc["status"] : "";

      if (httpCode == 201 || strcmp(status, "marked") == 0) {
        const char* name = doc["name"] | "Student";
        Serial.print(F(">>> Marked: "));
        Serial.println(name);
        feedbackMarked();
      } else if (httpCode == 200 || strcmp(status, "duplicate") == 0) {
        Serial.println(F(">>> Already marked for today"));
        feedbackDuplicate();
      } else if (httpCode == 404 || strcmp(status, "unknown") == 0) {
        Serial.println(F(">>> Unknown card!"));
        feedbackUnknown();
      } else if (httpCode == 401 || strcmp(status, "unauthorized") == 0) {
        Serial.println(F(">>> Unauthorized device key!"));
        feedbackUnauthorized();
      } else {
        Serial.print(F(">>> Unhandled status: "));
        Serial.println(status);
        feedbackNetworkError();
      }
    } else {
      Serial.printf("[HTTP] POST failed, error: %s\n", http.errorToString(httpCode).c_str());
      feedbackNetworkError();
    }
    http.end();
  } else {
    Serial.println(F("[HTTP] Unable to connect to server"));
    feedbackNetworkError();
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println(F("\n=== Smart RFID Attendance System v1.0 ==="));

  // Configure output pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // Initialize SPI bus and RC522
  SPI.begin();
  mfrc522.PCD_Init();
  delay(50);
  mfrc522.PCD_DumpVersionToSerial();
  Serial.println(F("[RC522] Ready. Scan an RFID card/tag."));

  // Connect to Wi-Fi
  connectToWiFi();
}

void loop() {
  // Reconnect Wi-Fi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Look for new RFID card
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Select one of the cards
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Convert UID to string
  String cardUid = getCardUidString(&(mfrc522.uid));
  Serial.print(F("\n[CARD DETECTED] UID: "));
  Serial.println(cardUid);

  unsigned long currentMillis = millis();

  // Prevent multiple reads of the same card within debounce window
  if (cardUid == lastScannedUid && (currentMillis - lastScanTime < DEBOUNCE_DELAY_MS)) {
    Serial.println(F("[INFO] Card debounced (held on reader). Skipping duplicate read."));
  } else {
    lastScannedUid = cardUid;
    lastScanTime = currentMillis;

    // Send UID to server
    sendScanToServer(cardUid);
  }

  // Halt PICC & Stop encryption on PCD
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  delay(150);
}
