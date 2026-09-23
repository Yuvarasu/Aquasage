# AquaSage ESP32 Wi-Fi Firmware & Hardware Integration Guide

This guide explains how to connect your **ESP32 microcontroller** over **Wi-Fi** to the **AquaSage FastAPI backend** for real-time sensor data streaming.

---

## 📌 Hardware Pinout & Wiring Diagram

| Sensor / Module | Sensor Pin | ESP32 GPIO Pin | Description / Notes |
| :--- | :--- | :--- | :--- |
| **HC-SR04 Ultrasonic** | `VCC` | `5V / VIN` | Power supply (5V) |
| | `GND` | `GND` | Ground reference |
| | `TRIG` | **`GPIO 5`** | 10 µs trigger pulse output |
| | `ECHO` | **`GPIO 18`** | Echo pulse input *(Use voltage divider 5V->3.3V if needed)* |
| **YF-S201 Flow Sensor 1 (Inlet)** | `VCC` | `5V / VIN` | Flow sensor 1 power |
| | `GND` | `GND` | Ground reference |
| | `SIGNAL (Yellow)` | **`GPIO 19`** | Hardware interrupt pulse counter |
| **YF-S201 Flow Sensor 2 (Outlet)**| `VCC` | `5V / VIN` | Flow sensor 2 power |
| | `GND` | `GND` | Ground reference |
| | `SIGNAL (Yellow)` | **`GPIO 21`** | Hardware interrupt pulse counter |
| **Analog TDS Sensor** | `VCC` | `3.3V` or `5V` | Analog sensor power |
| | `GND` | `GND` | Ground reference |
| | `SIGNAL` | **`GPIO 34`** | ADC1_CH6 (Safe with Wi-Fi active) |
| **Analog Turbidity Sensor** | `VCC` | `5V` | Water turbidity power |
| | `GND` | `GND` | Ground reference |
| | `OUT (Analog)` | **`GPIO 35`** | ADC1_CH7 (Safe with Wi-Fi active) |
| **5V Relay Module (Pump Control)**| `VCC` | `5V / VIN` | Relay coil power |
| | `GND` | `GND` | Ground reference |
| | `IN` | **`GPIO 23`** | Digital output control (HIGH = ON) |
| **Status Indicator** | Built-in LED | **`GPIO 2`** | Blinks during Wi-Fi connection, solid ON when connected |

> [!NOTE]
> **ESP32 ADC Limitation:** When Wi-Fi is active, **ADC2** pins cannot be used for analog reads. This firmware strictly uses **ADC1** pins (`GPIO 34` for TDS, `GPIO 35` for Turbidity) to prevent conflicts.

---

## ⚙️ Wi-Fi & Backend Endpoint Configuration

Open `esp32_aquasage.ino` and configure lines 29-37:

```cpp
// 1. Enter your Wi-Fi credentials
const char* WIFI_SSID     = "Your_WiFi_Name";
const char* WIFI_PASSWORD = "Your_WiFi_Password";

// 2. Set backend IP (Find your computer's IP using 'ipconfig' in cmd/PowerShell)
const char* BACKEND_URL   = "http://10.10.72.216:8000/api/v1/sensor-data";

// 3. Testing without sensors? Keep SIMULATION_MODE true!
#define SIMULATION_MODE true
```

> [!TIP]
> **Benchtop Testing without Physical Sensors:**
> Leave `#define SIMULATION_MODE true`. The ESP32 will connect to Wi-Fi and stream realistic benchtop water levels, dual flow rates, TDS, and turbidity to verify your backend setup immediately!
> When physical sensors are attached to GPIO pins, toggle `#define SIMULATION_MODE false`.

---

## 🚀 Flashing via Arduino IDE

1. **Install ESP32 Board Package**:
   - In Arduino IDE, open **File** > **Preferences**.
   - Under **Additional Boards Manager URLs**, add:
     ```text
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to **Tools** > **Board** > **Boards Manager**, search for `esp32` by Espressif Systems, and click **Install**.

2. **Install ArduinoJson Library**:
   - Go to **Tools** > **Manage Libraries...**
   - Search for **`ArduinoJson`** by *Benoît Blanchon*.
   - Click **Install** (Version 6.x or 7.x).

3. **Select Board & Port**:
   - Board: **DOIT ESP32 DEVKIT V1** (or ESP32 Dev Module).
   - Upload Speed: `921600`.
   - Port: Select the COM port corresponding to your connected ESP32 (e.g., `COM3`, `COM4`).

4. **Upload & Monitor**:
   - Click the **Upload** button (`Ctrl + U`).
   - Open **Serial Monitor** (`Ctrl + Shift + M`) and set baud rate to **`115200`**.

---

## 🛠️ Flashing via PlatformIO (VS Code)

If using PlatformIO:
```bash
cd firmware
pio run --target upload
pio device monitor --baud 115200
```

---

## 🌐 Network Troubleshooting

### 1. Computer & ESP32 on the Same Wi-Fi
- Both devices must be connected to the exact same Wi-Fi network.
- Run `ipconfig` on your Windows PC to verify your Wi-Fi IPv4 address.

### 2. Campus / College Wi-Fi (AP Isolation)
- If you are on an institutional network (e.g. `kcg.edu`), router "Client Isolation" often blocks devices from communicating directly with each other.
- **Solution:** Turn on **Mobile Hotspot** on your phone, connect both your PC and the ESP32 to that hotspot.

### 3. Windows Firewall (Allow Port 8000)
If the ESP32 logs show `[HTTP Fail] Code: -1 (connection refused/timeout)`, allow port 8000 in Windows Defender Firewall:

Run this command in an Administrator PowerShell:
```powershell
New-NetFirewallRule -DisplayName "FastAPI AquaSage Port 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

---

## 🖥️ Starting the Backend Server

Start your FastAPI backend bound to `0.0.0.0` so it accepts connections from external network devices:

```powershell
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify backend reachability from your browser:
- Swagger Documentation: `http://localhost:8000/docs` or `http://10.10.72.216:8000/docs`
- Health check: `http://10.10.72.216:8000/api/v1/health`
