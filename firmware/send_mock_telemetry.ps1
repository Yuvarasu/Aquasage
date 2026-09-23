# AquaSage 25 cm Tank & Digital Twin Mock Telemetry Generator
param(
    [ValidateSet("empty", "normal", "low_5cm", "overflow_5cm", "dirty_water", "stream")]
    [string]$Scenario = "low_5cm",
    [string]$HostIp = "127.0.0.1",
    [int]$Port = 8000,
    [int]$TankHeightCm = 25
)

$url = "http://$HostIp`:$Port/api/v1/sensor-data"

function Send-Packet($scenarioName, $waterHeightCm, $flow1, $flow2, $tds, $turbidity, $pump) {
    $dist = [Math]::Max(0.0, $TankHeightCm - $waterHeightCm)
    $pct = [Math]::Round(($waterHeightCm / $TankHeightCm) * 100.0, 1)

    $payload = @{
        device_id = "ESP32_TANK_01"
        tank_id = 1
        tank = @{
            distance_cm = [Math]::Round($dist, 1)
            water_level_percent = $pct
        }
        flow = @{
            flow_1_lpm = $flow1
            flow_2_lpm = $flow2
            flow_1_total_liters = 25.4
            flow_2_total_liters = 25.2
        }
        water_quality = @{
            tds_ppm = $tds
            turbidity_raw = $turbidity
        }
        pump = @{
            status = $pump
        }
        device = @{
            wifi_rssi = -52
            firmware_version = "1.0.0"
        }
    } | ConvertTo-Json -Depth 5

    Write-Host "`n-------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host ">>> Scenario: $scenarioName" -ForegroundColor Cyan
    Write-Host "    Tank Height    : $TankHeightCm cm"
    Write-Host "    Water Depth    : $waterHeightCm cm ($pct%)"
    Write-Host "    Sensor Distance: $dist cm"
    Write-Host "    TDS Water PPM  : $tds PPM"
    Write-Host "    Turbidity Raw  : $turbidity ADC (~$([Math]::Round($turbidity / 2500.0, 2)) NTU)"
    Write-Host "    Pump Relay     : $(if ($pump) {'ON'} else {'OFF'})"
    Write-Host "-------------------------------------------------------------"

    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $payload -ContentType "application/json" -TimeoutSec 5
        Write-Host "SUCCESS [HTTP 201] Ingested into Digital Twin & SCADA Pipeline!" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "FAILED to send telemetry: $_" -ForegroundColor Red
        return $null
    }
}

switch ($Scenario) {
    "empty" {
        Write-Host "`n[ALERT TEST] Simulating completely empty tank (0 cm water, 25 cm distance)..." -ForegroundColor Yellow
        Send-Packet -scenarioName "EMPTY TANK (25 CM AIR GAP = 0% LEVEL)" -waterHeightCm 0.0 -flow1 0.0 -flow2 0.0 -tds 0.0 -turbidity 1000 -pump $false
    }
    "normal" {
        Send-Packet -scenarioName "NORMAL OPERATION" -waterHeightCm 18.0 -flow1 9.8 -flow2 9.7 -tds 135.0 -turbidity 1020 -pump $true
    }
    "low_5cm" {
        Write-Host "`n[ALERT TEST] Simulating water level dropping to 4.8 cm (<= 5 cm threshold in 25 cm tank)..." -ForegroundColor Yellow
        Send-Packet -scenarioName "CRITICAL LOW WATER (<= 5 CM)" -waterHeightCm 4.8 -flow1 0.0 -flow2 0.0 -tds 142.0 -turbidity 1080 -pump $false
    }
    "overflow_5cm" {
        Write-Host "`n[ALERT TEST] Simulating water level rising to 20.5 cm (<= 4.5 cm from top brim)..." -ForegroundColor Yellow
        Send-Packet -scenarioName "OVERFLOW WARNING (<= 5 CM FROM BRIM)" -waterHeightCm 20.5 -flow1 12.0 -flow2 11.8 -tds 128.0 -turbidity 990 -pump $true
    }
    "dirty_water" {
        Write-Host "`n[ALERT TEST] Simulating high TDS and murky turbidity..." -ForegroundColor Yellow
        Send-Packet -scenarioName "CONTAMINATED WATER" -waterHeightCm 14.0 -flow1 8.5 -flow2 8.4 -tds 680.0 -turbidity 3400 -pump $true
    }
    "stream" {
        Write-Host "`nStreaming 5 simulated packets cycling down to 5 cm..." -ForegroundColor Cyan
        $heights = @(18.0, 12.0, 8.0, 5.0, 4.2)
        foreach ($h in $heights) {
            $p = if ($h -gt 5.0) { $true } else { $false }
            Send-Packet -scenarioName "CYCLING DRAIN TO 5CM" -waterHeightCm $h -flow1 9.5 -flow2 9.4 -tds (130.0 + (Get-Random -Minimum -5 -Maximum 5)) -turbidity (1020 + (Get-Random -Minimum -30 -Maximum 30)) -pump $p
            Start-Sleep -Seconds 2
        }
    }
}
