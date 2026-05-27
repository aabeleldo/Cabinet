#include "Arduino.h"
#include "HX711.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <MFRC522Debug.h>
#include "secrets.h"

// --- WiFi & Server ---
const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;
const char* serverURL = SERVER_URL;

// --- RFID ---
MFRC522DriverPinSimple ss_pin(2);
MFRC522DriverSPI driver{ss_pin};
MFRC522 mfrc522{driver};

// --- Load Cell ---
const int LOADCELL_DOUT_PIN = 16;
const int LOADCELL_SCK_PIN = 4;
HX711 scale;

// --- State ---
String lastUID = "";
unsigned long lastPostTime = 0;
const unsigned long POST_INTERVAL = 3000;
const float WEIGHT_OFFSET = 0.0;

String UIDString(MFRC522Constants::Uid uid);

String getItemName(String uid) {
  if (uid == "cbf9f206") return "Creatine";
  return uid;
}

void postWeight(String uid, float weight) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, skipping POST.");
    return;
  }
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  String name = getItemName(uid);
  String payload = "{\"rfid\":\"" + uid + "\","
                   "\"name\":\"" + name + "\","
                   "\"weight\":" + String(weight, 2) + ","
                   "\"cabinet_id\":\"cabinet_1\"}";
  int responseCode = http.POST(payload);
  Serial.println("POST response: " + String(responseCode));
  http.end();
}

void setup() {
  Serial.begin(115200);
  while (!Serial);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());

  mfrc522.PCD_Init();
  Serial.println("RFID ready.");

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(208.49);
  delay(500);
  scale.tare();
  Serial.println("Scale ready.");
}

void loop() {
  mfrc522.PCD_Init();
  delay(50);

  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    lastUID = UIDString(mfrc522.uid);
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();

    unsigned long now = millis();
    if (now - lastPostTime >= POST_INTERVAL) {
      lastPostTime = now;

      float weight = 0.0;
      if (scale.is_ready()) {
        weight = scale.get_units(3) - WEIGHT_OFFSET;
      }

      Serial.println("UID: " + lastUID + " | Weight: " + String(weight, 2) + "g");

      if (weight < 10.0) {
        Serial.println("Weight too low, skipping POST.");
      } else {
        postWeight(lastUID, weight);
      }
    }
  } else {
    if (lastUID != "") {
      Serial.println("Card removed.");
      lastUID = "";
    }
    Serial.println("No card.");
  }

  delay(500);
}

String UIDString(MFRC522Constants::Uid uid) {
  String result = "";
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) result += "0";
    result += String(uid.uidByte[i], HEX);
  }
  return result;
}