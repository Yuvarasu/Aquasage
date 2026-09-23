/*
 * ============================================================================
 * AquaSage — Smart Water Infrastructure Monitoring Platform
 * ESP32 Wi-Fi Telemetry Firmware (DevKit V1 / ESP32-WROOM-32)
 *
 * Transmits real-time physical sensor metrics to the FastAPI backend:
 *   POST http://<SERVER_IP>:8000/api/v1/sensor-data
 *
 * Supported Sensors:
 *   1. HC-SR04 Ultrasonic Distance Sensor (Water Level %)
 *   2. Dual YF-S201 Flow Rate Sensors (Inflow & Outflow L/min, Total Volume)
 *   3. Analog TDS Sensor (Total Dissolved Solids in PPM)
 *   4. Analog Turbidity Sensor (Water clarity raw ADC)
 *   5. 5V Relay Module (Pump Control)
 *
 * Note: If physical sensors are not wired yet, set SIMULATION_MODE to true
 *       to verify Wi-Fi and backend communication immediately!
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============================================================================
// 1. CONFIGURATION & CREDENTIALS
// ============================================================================

// --- Wi-Fi Credentials ---
// NOTE: Both this ESP32 and your computer running the backend MUST be on the same Wi-Fi.
// If on college/campus Wi-Fi with client isolation, use a Mobile Hotspot!
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// --- Backend API Endpoint ---
// Replace 10.10.72.92 with your computer's local IP address (find via 'ipconfig' on Windows)
const char* BACKEND_URL   = "http://10.10.72.92:8000/api/v1/sensor-data";

// --- Device & Storage Tank Identifiers ---
const char* DEVICE_ID       = "ESP32_TANK_01";
const int   TANK_ID         = 1;
const char* FIRMWARE_VER    = "1.0.0";

// --- Simulation Mode Toggle ---
// Set to true to simulate ALL sensors (flow, water quality, tank)
// Set to false to run normal mode with physical pins
#define SIMULATION_MODE false

// --- Ultrasonic Sensor Mocking ---
// Set to true to mock ONLY the ultrasonic sensor (even when SIMULATION_MODE is false)
// Set to false to read physical HC-SR04 hardware pins (TRIG/ECHO)
#define MOCK_ULTRASONIC true

// Mocking Modes:
// 1 = Dynamic Wave (simulates water draining down to 3.5cm [<= 5cm alert] and refilling)
// 2 = Fixed Value (uses MOCK_ULTRASONIC_DISTANCE_CM below)
// 3 = Critical Low Alert Test (water depth = 4.0cm <= 5cm -> distance = 21.0cm, 16% level)
// 4 = High Overflow Warning Test (water depth = 21.0cm >= 20cm -> distance = 4.0cm, 84% level)
// 5 = Completely Empty Tank (water depth = 0.0cm -> distance = 25.0cm, 0% level)
#define MOCK_ULTRASONIC_MODE 1

// Fixed distance in CM for Mode 2 (e.g. 21.0 cm distance = 4.0 cm water depth = 16% level)
const float MOCK_ULTRASONIC_DISTANCE_CM = 21.0;

// Telemetry transmit interval (in milliseconds)
const unsigned long TELEMETRY_INTERVAL_MS = 3000;

// Tank Geometry (25 cm Benchtop prototype)
const float TANK_HEIGHT_CM = 25.0;     // Total height of the tank container in cm
const float SENSOR_OFFSET_CM = 2.0;    // Clearance between sensor face and max water level
const float LOW_LEVEL_ALERT_CM = 5.0;  // Alert threshold when water level reaches <= 5 cm

// ============================================================================
// 2. HARDWARE PIN DEFINITIONS (ESP32 DevKit V1)
// ============================================================================
// Note: Use ADC1 pins (GPIO 32 - 39) for analog sensors when Wi-Fi is active!
#define PIN_TRIG         5    // HC-SR04 Ultrasonic Trigger
#define PIN_ECHO         18   // HC-SR04 Ultrasonic Echo
#define PIN_FLOW1        27   // Flow Sensor 1 (YF-S201 Inlet) - Interrupt
#define PIN_FLOW2        26   // Flow Sensor 2 (YF-S201 Outlet) - Interrupt
#define PIN_TDS          34   // Analog TDS Sensor (ADC1_CH6)
#define PIN_TURBIDITY    35   // Analog Turbidity Sensor (ADC1_CH7)
#define PIN_PUMP_RELAY   32   // 5V Relay Module (Active LOW / HIGH)
#define PIN_STATUS_LED   2    // Built-in Blue LED on DevKit

// Flow Sensor Calibration: YF-S201 produces ~450 pulses per liter (7.5 Hz per L/min)
const float FLOW_CALIBRATION_FACTOR = 7.5;

// ============================================================================
// 3. GLOBAL VARIABLES & ISR COUNTERS
// ============================================================================
volatile unsigned long flow1_pulse_count = 0;
volatile unsigned long flow2_pulse_count = 0;

float flow1_total_liters = 0.0;
float flow2_total_liters = 0.0;

unsigned long last_transmit_time = 0;
unsigned long last_flow_sample_time = 0;

bool pump_state = true; // Current pump relay state (true = ON, false = OFF)
int simulated_step = 0;

// Interrupt Service Routines (ISRs) in IRAM
void IRAM_ATTR flow1_pulse_isr() {
  flow1_pulse_count++;
}

void IRAM_ATTR flow2_pulse_isr() {
  flow2_pulse_count++;
}

// ============================================================================
// 4. HELPER FUNCTIONS: HARDWARE SENSOR READINGS
// ============================================================================

/**
 * Measure distance in cm using HC-SR04 Ultrasonic Sensor (or mock values)
 */
float readUltrasonicDistanceCM() {
  // If mocking is enabled, return configured synthetic profile
  if (MOCK_ULTRASONIC) {
    static int mock_step = 0;
    mock_step++;

    switch (MOCK_ULTRASONIC_MODE) {
      case 1: {
        // Mode 1: Dynamic smooth draining & filling wave (cycles down to <= 5cm alert and back up)
        int cycle = mock_step % 20;
        // Simulates water depth smoothly dropping from 19.0 cm down to 3.5 cm (<= 5cm alert) and back up
        float water_depth_cm = (cycle < 10) ? (19.0 - (cycle * 1.55)) : (3.5 + ((cycle - 10) * 1.55));
        return constrain(TANK_HEIGHT_CM - water_depth_cm, 2.0, 24.0);
      }
      case 2:
        // Mode 2: Fixed custom distance
        return constrain(MOCK_ULTRASONIC_DISTANCE_CM, 0.0, TANK_HEIGHT_CM);

      case 3:
        // Mode 3: Critical Low Alert Test (water depth = 4.0 cm <= 5 cm -> distance = 21.0 cm, 16% level)
        return 21.0;

      case 4:
        // Mode 4: High Water Warning Test (water depth = 21.0 cm >= 20 cm -> distance = 4.0 cm, 84% level)
        return 4.0;

      case 5:
        // Mode 5: Empty Tank Test (water depth = 0.0 cm -> distance = 25.0 cm = 0% level)
        return 25.0;

      default:
        return 12.5; // 50% level
    }
  }

  // Physical HC-SR04 ultrasonic measurement
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(4);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // Measure pulse duration (timeout: 25000 µs ~ 4 meters)
  long duration = pulseIn(PIN_ECHO, HIGH, 25000);
  
  // HC-SR04 physical blind zone is < 2.0 cm (~116 µs).
  // When an empty tank produces no echo, duration times out (0) or generates a 1-2 µs noise glitch.
  // In a 25cm tank, no echo or glitch < 2cm means EMPTY: distance = 25.0 cm -> 0% water level.
  if (duration <= 0 || duration < 116) {
    return TANK_HEIGHT_CM; // 25.0 cm (Empty Tank = 0% level)
  }

  // Speed of sound: 343 m/s = 0.0343 cm/µs. Distance = (duration / 2) * 0.0343
  float distance = (duration * 0.0343) / 2.0;
  
  if (distance < 2.0 || distance >= TANK_HEIGHT_CM) {
    return TANK_HEIGHT_CM; // Empty Tank = 0% level
  }
  
  return distance;
}

/**
 * Read Analog TDS Sensor and convert to PPM
 */
float readTDS_PPM() {
  const int NUM_SAMPLES = 10;
  int sum = 0;
  for (int i = 0; i < NUM_SAMPLES; i++) {
    sum += analogRead(PIN_TDS);
    delay(5);
  }
  float avg_adc = (float)sum / NUM_SAMPLES;
  float voltage = (avg_adc / 4095.0) * 3.3;

  // Temperature compensated TDS conversion formula
  float compensation_voltage = voltage; // Assumes 25°C baseline
  float tds_val = (133.42 * pow(compensation_voltage, 3) - 255.86 * pow(compensation_voltage, 2) + 857.39 * compensation_voltage) * 0.5;
  return constrain(tds_val, 0.0, 5000.0);
}

/**
 * Read Analog Turbidity Sensor (raw ADC value)
 */
int readTurbidityRaw() {
  const int NUM_SAMPLES = 10;
  long sum = 0;
  for (int i = 0; i < NUM_SAMPLES; i++) {
    sum += analogRead(PIN_TURBIDITY);
    delay(5);
  }
  return sum / NUM_SAMPLES;
}

// ============================================================================
// 5. WI-FI MANAGEMENT & CONNECTION
// ============================================================================

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println();
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED)); // Toggle LED
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_STATUS_LED, HIGH); // Solid ON when connected
    Serial.println();
    Serial.println("=========================================");
    Serial.println(" Wi-Fi Connected Successfully!");
    Serial.print(" ESP32 IP Address : ");
    Serial.println(WiFi.localIP());
    Serial.print(" Subnet Mask      : ");
    Serial.println(WiFi.subnetMask());
    Serial.print(" Gateway IP       : ");
    Serial.println(WiFi.gatewayIP());
    Serial.print(" Wi-Fi RSSI       : ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    Serial.print(" Target Backend   : ");
    Serial.println(BACKEND_URL);
    Serial.println("=========================================");
  } else {
    digitalWrite(PIN_STATUS_LED, LOW);
    Serial.println();
    Serial.println("[WARNING] Wi-Fi connection timed out. Will retry...");
  }
}

// ============================================================================
// 6. TELEMETRY TRANSMISSION (HTTP POST JSON)
// ============================================================================

void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] Wi-Fi not connected. Attempting reconnect...");
    connectWiFi();
    return;
  }

  // --- 1. Acquire Metrics (Physical or Simulated) ---
  float distance_cm = 0.0;
  float water_level_pct = 0.0;
  float flow1_lpm = 0.0;
  float flow2_lpm = 0.0;
  float tds_ppm = 0.0;
  int turbidity_raw = 1000;

  if (SIMULATION_MODE) {
    // Generate realistic benchtop simulation values for 25 cm tank
    simulated_step++;
    // Dynamically cycle water level between 18 cm and 4.5 cm (drops <= 5 cm to trigger alert)
    int cycle = simulated_step % 20;
    float simulated_water_height_cm = (cycle < 10) ? (18.0 - (cycle * 1.35)) : (4.5 + ((cycle - 10) * 1.35));
    distance_cm = constrain(TANK_HEIGHT_CM - simulated_water_height_cm, 2.0, 24.0);
    water_level_pct = ((TANK_HEIGHT_CM - distance_cm) / TANK_HEIGHT_CM) * 100.0;
    water_level_pct = round(water_level_pct * 10.0) / 10.0;

    flow1_lpm = 9.8 + (random(-20, 20) / 100.0);
    flow2_lpm = flow1_lpm - 0.1; // Balanced flow with nominal pipe loss
    flow1_total_liters += (flow1_lpm / 60.0) * (TELEMETRY_INTERVAL_MS / 1000.0);
    flow2_total_liters += (flow2_lpm / 60.0) * (TELEMETRY_INTERVAL_MS / 1000.0);

    // Mock Water Quality: TDS (PPM) and Turbidity (raw ADC)
    tds_ppm = 135.0 + (random(-30, 30) / 10.0);  // Clean drinking water baseline
    turbidity_raw = 1020 + random(-40, 40);        // Clear water turbidity baseline
    pump_state = (simulated_water_height_cm > 5.0); // Pump turns OFF when water drops to <= 5 cm
  } else {
    // Read physical hardware sensors
    distance_cm = readUltrasonicDistanceCM();
    water_level_pct = ((TANK_HEIGHT_CM - distance_cm) / TANK_HEIGHT_CM) * 100.0;
    water_level_pct = constrain(water_level_pct, 0.0, 100.0);

    // Calculate flow rate over sample duration
    unsigned long now = millis();
    float dt_sec = (now - last_flow_sample_time) / 1000.0;
    if (dt_sec >= 1.0) {
      noInterrupts();
      unsigned long p1 = flow1_pulse_count;
      unsigned long p2 = flow2_pulse_count;
      flow1_pulse_count = 0;
      flow2_pulse_count = 0;
      interrupts();

      flow1_lpm = (p1 / dt_sec) / FLOW_CALIBRATION_FACTOR;
      flow2_lpm = (p2 / dt_sec) / FLOW_CALIBRATION_FACTOR;
      flow1_total_liters += (flow1_lpm / 60.0) * dt_sec;
      flow2_total_liters += (flow2_lpm / 60.0) * dt_sec;
      last_flow_sample_time = now;
    }

    tds_ppm = readTDS_PPM();
    turbidity_raw = readTurbidityRaw();
    digitalWrite(PIN_PUMP_RELAY, pump_state ? HIGH : LOW);
  }

  int wifi_rssi = WiFi.RSSI();

  // --- 2. Serialize JSON Payload (Compatible with ArduinoJson 6 & 7) ---
  StaticJsonDocument<1024> doc;
  doc.clear();
  doc["device_id"] = DEVICE_ID;
  doc["tank_id"]   = TANK_ID;

  doc["tank"]["distance_cm"]         = round(distance_cm * 10.0) / 10.0;
  doc["tank"]["water_level_percent"] = round(water_level_pct * 10.0) / 10.0;

  doc["flow"]["flow_1_lpm"]          = round(flow1_lpm * 10.0) / 10.0;
  doc["flow"]["flow_2_lpm"]          = round(flow2_lpm * 10.0) / 10.0;
  doc["flow"]["flow_1_total_liters"] = round(flow1_total_liters * 10.0) / 10.0;
  doc["flow"]["flow_2_total_liters"] = round(flow2_total_liters * 10.0) / 10.0;

  doc["water_quality"]["tds_ppm"]       = round(tds_ppm * 10.0) / 10.0;
  doc["water_quality"]["turbidity_raw"] = turbidity_raw;

  doc["pump"]["status"] = pump_state;

  doc["device"]["wifi_rssi"]        = wifi_rssi;
  doc["device"]["firmware_version"] = FIRMWARE_VER;

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.print("[TX Payload] ");
  Serial.println(jsonString);

  // --- 3. Execute HTTP POST to FastAPI Backend ---
  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000); // 5 sec timeout

  unsigned long start_ms = millis();
  int httpResponseCode = http.POST(jsonString);
  unsigned long elapsed_ms = millis() - start_ms;

  // --- 4. Process Response ---
  if (httpResponseCode == 201) {
    Serial.printf("[HTTP 201 Created] (%lums) Level: %.1f%% | F1: %.1f L/m | F2: %.1f L/m | TDS: %.1f ppm | RSSI: %d dBm\n",
                  elapsed_ms, water_level_pct, flow1_lpm, flow2_lpm, tds_ppm, wifi_rssi);
  } else if (httpResponseCode > 0) {
    Serial.printf("[HTTP Error %d] Response: %s\n", httpResponseCode, http.getString().c_str());
  } else {
    Serial.printf("[HTTP Fail] Code: %d (%s). Check backend IP & Windows Firewall!\n",
                  httpResponseCode, http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}

// ============================================================================
// 7. ARDUINO SETUP & MAIN LOOP
// ============================================================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("=================================================");
  Serial.println("  AquaSage ESP32 Wi-Fi Telemetry Client v1.0.0   ");
  Serial.println("=================================================");
  if (SIMULATION_MODE) {
    Serial.println("[MODE] SIMULATION_MODE is ACTIVE (no sensors needed)");
  } else {
    Serial.println("[MODE] PHYSICAL HARDWARE SENSORS ACTIVE");
  }

  // Configure Pins
  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT_PULLDOWN);
  pinMode(PIN_PUMP_RELAY, OUTPUT);
  digitalWrite(PIN_PUMP_RELAY, HIGH); // Default ON for active HIGH

  // Configure Flow Sensor Interrupts
  pinMode(PIN_FLOW1, INPUT_PULLUP);
  pinMode(PIN_FLOW2, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW1), flow1_pulse_isr, RISING);
  attachInterrupt(digitalPinToInterrupt(PIN_FLOW2), flow2_pulse_isr, RISING);

  // Initialize Wi-Fi
  connectWiFi();

  last_flow_sample_time = millis();
  last_transmit_time = millis();
}

void loop() {
  // Ensure Wi-Fi remains connected
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Periodic Telemetry Transmission
  unsigned long now = millis();
  if (now - last_transmit_time >= TELEMETRY_INTERVAL_MS) {
    last_transmit_time = now;
    sendTelemetry();
  }

  delay(50); // Yield to FreeRTOS scheduler & Wi-Fi stack
}
