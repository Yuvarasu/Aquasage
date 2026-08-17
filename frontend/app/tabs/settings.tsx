import Slider from "@react-native-community/slider";
import {
  Activity,
  Gauge,
  Power,
  Radio,
  Sliders
} from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTelemetryStore } from "../../src/store/useTelemetryStore";
import { ApiService } from "../../src/services/apiService";

export default function SettingsScreen() {
  const { data, updateTelemetry, isSimulating, toggleSimulation } =
    useTelemetryStore();
  const isFault = data.pumpStatus === "fault";
  const isRunning = data.pumpStatus === "running";

  const handlePressureChange = (val: number) => {
    updateTelemetry({ pressure: val });
    ApiService.ingestSensorReading({
      device_id: 1,
      tank_id: 1,
      distance_cm: 28.0,
      water_level_pct: data.tankLevel,
      flow_rate_lmin: data.flowRate,
      daily_consumption_liters: data.dailyConsumptionLiters,
      tds_ppm: 140.0,
      pressure_bar: val,
    });
  };

  const handleFlowChange = (val: number) => {
    updateTelemetry({ flowRate: val });
    ApiService.ingestSensorReading({
      device_id: 1,
      tank_id: 1,
      distance_cm: 28.0,
      water_level_pct: data.tankLevel,
      flow_rate_lmin: val,
      daily_consumption_liters: data.dailyConsumptionLiters,
      tds_ppm: 140.0,
      pressure_bar: data.pressure,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#071426" }}>
      <StatusBar barStyle="light-content" backgroundColor="#071426" />

      {/* --- HEADER --- */}
      <View
        style={{
          paddingTop: 48,
          paddingBottom: 12,
          paddingHorizontal: 20,
          backgroundColor: "#071426",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text
            style={{
              color: "#FFFFFF",
              fontWeight: "900",
              fontSize: 18,
              letterSpacing: 2,
            }}
          >
            SCADA HARDWARE
          </Text>
          <Text
            style={{
              color: "#94A3B8",
              fontSize: 11,
              fontFamily: "monospace",
              marginTop: 2,
            }}
          >
            Realtime Simulator & Network Configs
          </Text>
        </View>

        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: "#10233A",
            borderWidth: 1,
            borderColor: "#1E293B",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sliders size={18} color="#00C2FF" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- SIMULATOR TOGGLE CARD --- */}
        <View
          style={{
            backgroundColor: "#10233A",
            borderWidth: 1,
            borderColor: "rgba(6, 182, 212, 0.2)",
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flex: 1,
              marginRight: 12,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: "rgba(6, 182, 212, 0.1)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Radio size={16} color="#00C2FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 13 }}
              >
                Internal Telemetry Simulator
              </Text>
              <Text style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>
                {isSimulating
                  ? "Autonomous packet stream active"
                  : "Manual override mode engaged"}
              </Text>
            </View>
          </View>
          <Switch
            value={isSimulating}
            onValueChange={toggleSimulation}
            trackColor={{ false: "#1E293B", true: "#06B6D4" }}
            thumbColor={"#FFFFFF"}
          />
        </View>

        {/* --- SECTION LABEL --- */}
        <Text
          style={{
            color: "#94A3B8",
            fontSize: 11,
            fontWeight: "bold",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 8,
            paddingHorizontal: 4,
          }}
        >
          Live Telemetry Overrides
        </Text>

        {/* --- SLIDER 1: PRESSURE OVERRIDE --- */}
        <View
          style={{
            backgroundColor: "#10233A",
            borderWidth: 1,
            borderColor: "rgba(6, 182, 212, 0.2)",
            borderRadius: 20,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Gauge size={16} color="#00C2FF" style={{ marginRight: 8 }} />
              <Text
                style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 13 }}
              >
                Pressure Override
              </Text>
            </View>
            <Text
              style={{
                color: "#00C2FF",
                fontSize: 14,
                fontWeight: "900",
                fontFamily: "monospace",
              }}
            >
              {data.pressure.toFixed(1)} BAR
            </Text>
          </View>

          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={8}
            value={data.pressure}
            onValueChange={handlePressureChange}
            minimumTrackTintColor="#06B6D4"
            maximumTrackTintColor="#1E293B"
            thumbTintColor="#00C2FF"
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: "#64748B",
                fontSize: 10,
                fontFamily: "monospace",
              }}
            >
              0.0 BAR
            </Text>
            <Text
              style={{
                color: "#64748B",
                fontSize: 10,
                fontFamily: "monospace",
              }}
            >
              8.0 BAR (MAX)
            </Text>
          </View>
        </View>

        {/* --- SLIDER 2: FLOW RATE OVERRIDE --- */}
        <View
          style={{
            backgroundColor: "#10233A",
            borderWidth: 1,
            borderColor: "rgba(59, 130, 246, 0.2)",
            borderRadius: 20,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Activity size={16} color="#38BDF8" style={{ marginRight: 8 }} />
              <Text
                style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 13 }}
              >
                Flow Rate Override
              </Text>
            </View>
            <Text
              style={{
                color: "#38BDF8",
                fontSize: 14,
                fontWeight: "900",
                fontFamily: "monospace",
              }}
            >
              {data.flowRate.toFixed(1)} L/min
            </Text>
          </View>

          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={120}
            value={data.flowRate}
            onValueChange={handleFlowChange}
            minimumTrackTintColor="#3B82F6"
            maximumTrackTintColor="#1E293B"
            thumbTintColor="#38BDF8"
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: "#64748B",
                fontSize: 10,
                fontFamily: "monospace",
              }}
            >
              0 L/min
            </Text>
            <Text
              style={{
                color: "#64748B",
                fontSize: 10,
                fontFamily: "monospace",
              }}
            >
              120 L/min (MAX)
            </Text>
          </View>
        </View>

        {/* --- SECTION LABEL --- */}
        <Text
          style={{
            color: "#94A3B8",
            fontSize: 11,
            fontWeight: "bold",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 8,
            marginTop: 4,
            paddingHorizontal: 4,
          }}
        >
          Actuator State Control
        </Text>

        {/* --- PUMP CONTROL CARD --- */}
        <View
          style={{
            backgroundColor: "#10233A",
            borderWidth: 1,
            borderColor: isFault
              ? "rgba(239, 68, 68, 0.3)"
              : "rgba(74, 222, 128, 0.2)",
            borderRadius: 20,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Power
                size={16}
                color={isFault ? "#EF4444" : "#4ADE80"}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 13 }}
              >
                Main Pump Actuator
              </Text>
            </View>
            <View
              style={{
                backgroundColor: isFault
                  ? "rgba(239, 68, 68, 0.2)"
                  : isRunning
                    ? "rgba(74, 222, 128, 0.2)"
                    : "rgba(148, 163, 184, 0.2)",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: isFault
                  ? "rgba(239, 68, 68, 0.3)"
                  : isRunning
                    ? "rgba(74, 222, 128, 0.3)"
                    : "rgba(148, 163, 184, 0.3)",
              }}
            >
              <Text
                style={{
                  color: isFault
                    ? "#EF4444"
                    : isRunning
                      ? "#4ADE80"
                      : "#94A3B8",
                  fontSize: 9,
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                {data.pumpStatus}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() => updateTelemetry({ pumpStatus: "running" })}
              style={{
                flex: 1,
                marginRight: 8,
                backgroundColor: isRunning ? "#059669" : "#0F172A",
                borderWidth: 1,
                borderColor: isRunning ? "#10B981" : "#1E293B",
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 11 }}
              >
                PUMP START
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => updateTelemetry({ pumpStatus: "stopped" })}
              style={{
                flex: 1,
                marginRight: 8,
                backgroundColor:
                  data.pumpStatus === "stopped" ? "#475569" : "#0F172A",
                borderWidth: 1,
                borderColor:
                  data.pumpStatus === "stopped" ? "#64748B" : "#1E293B",
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 11 }}
              >
                PUMP STOP
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => updateTelemetry({ pumpStatus: "fault" })}
              style={{
                flex: 1,
                backgroundColor: isFault ? "#DC2626" : "#0F172A",
                borderWidth: 1,
                borderColor: isFault ? "#EF4444" : "#1E293B",
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 11 }}
              >
                SIM FAULT
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
