# Test script to verify AquaSage Ingestion API before flashing ESP32
param(
    [string]$HostIp = "10.10.72.92",
    [int]$Port = 8000
)

$url = "http://$HostIp`:$Port/api/v1/sensor-data"

$payload = @{
    device_id = "ESP32_TANK_01"
    tank_id = 1
    tank = @{
        distance_cm = 8.5
        water_level_percent = 71.7
    }
    flow = @{
        flow_1_lpm = 9.8
        flow_2_lpm = 9.5
        flow_1_total_liters = 15.2
        flow_2_total_liters = 14.8
    }
    water_quality = @{
        tds_ppm = 125.0
        turbidity_raw = 1050
    }
    pump = @{
        status = $true
    }
    device = @{
        wifi_rssi = -55
        firmware_version = "1.0.0"
    }
} | ConvertTo-Json -Depth 5

Write-Host "Sending test ESP32 telemetry packet to $url..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $payload -ContentType "application/json" -TimeoutSec 5
    Write-Host "Success! Response received (Status 201 Created):" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 4
} catch {
    Write-Host "Failed to connect to backend: $_" -ForegroundColor Red
    Write-Host "Make sure the backend is running with: uvicorn app.main:app --host 0.0.0.0 --port 8000" -ForegroundColor Yellow
}
