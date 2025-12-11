#define BLYNK_TEMPLATE_ID "TMPL3nkbcyHtQ"
#define BLYNK_TEMPLATE_NAME "Sanjay"
#define BLYNK_AUTH_TOKEN "VKGfQMseCybZT2-v0EI7a2Sk8N9ep-sI"

#include <ESP8266WiFi.h>
#include <BlynkSimpleEsp8266.h>
#include <WiFiManager.h>
#include <Servo.h>

char ssid[] = "Sanjay";
char pass[] = "123456ss";

// Motor driver pins
int IN1 = D1;
int IN2 = D2;
int IN3 = D3;
int IN4 = D4;

// Relay pins
int grassRelay = D5;
int seedRelay  = D6;
int pumpRelay  = D7;

// Buzzer and LED relay pin
int buzzerLedRelay = D0;

// Sensor pins
int rainSensorPin = A0;
int pirSensorPin = D8;

// Moisture sensor pin - TX pin (GPIO1)
int moistureSensorPin = 1;

// Servo motor pin
int servoPin = D9;
Servo pumpServo;

// Servo control variables
int servoPosition = 0;
bool servoMovingForward = true;
bool servoCycleActive = false;
bool servoCycleComplete = false;
unsigned long lastServoUpdate = 0;
const unsigned long servoUpdateInterval = 15;

// Moisture check during servo
unsigned long lastMoistureCheck = 0;
const unsigned long moistureCheckInterval = 100;

// Sensor variables
int rainThreshold = 200;
bool isRaining = false;
bool motionDetected = false;
bool autoMode = false;
bool alertActive = false;
unsigned long lastSensorRead = 0;
const unsigned long sensorInterval = 2000;

// Event logging variables
unsigned long lastEventLog = 0;
const unsigned long eventLogInterval = 60000; // Log events every 60 seconds
bool lastRainState = false;
bool lastMoistureState = false;

// Hourly and Daily summary variables
unsigned long lastHourlySummary = 0;
const unsigned long hourlySummaryInterval = 3600000; // 1 hour in milliseconds
int hourlyReportCount = 0; // Track how many hourly reports sent

// Current hour stats
int rainDetectionCount = 0;
int motionDetectionCount = 0;
int moistureDryCount = 0;
int moistureWetCount = 0;
int pumpActivationCount = 0;
int alertActivationCount = 0;
unsigned long totalPumpRunTime = 0;
unsigned long pumpStartTime = 0;
int lightReadingsSum = 0;
int lightReadingsCount = 0;
int maxLightReading = 0;
int minLightReading = 1024;

// Daily accumulated stats (sum of all hours)
int dailyRainDetections = 0;
int dailyMotionDetections = 0;
int dailyMoistureDryCount = 0;
int dailyMoistureWetCount = 0;
int dailyPumpActivations = 0;
int dailyAlertActivations = 0;
unsigned long dailyTotalPumpTime = 0;
int dailyLightSum = 0;
int dailyLightCount = 0;
int dailyMaxLight = 0;
int dailyMinLight = 1024;

// Moisture irrigation variables
bool moistureIrrigationActive = false;
bool soilIsDry = false;
bool pumpRunning = false;
bool initialCycleDone = false;
bool wetDetectedDuringCycle = false;
unsigned long irrigationStartTime = 0;
unsigned long lastServoCycleTime = 0;
const unsigned long servoCycleInterval = 5000;
const unsigned long maxIrrigationTime = 10000;

// Alert timing variables
unsigned long alertStartTime = 0;
const unsigned long alertDuration = 5000;
bool autoAlertActive = false;

// Motor speed setting
int motorSpeed = 255;

// Stop button state
bool emergencyStop = false;

// Function to read moisture sensor (Digital: HIGH = dry, LOW = wet)
bool readMoistureSensor() {
  bool isDry = digitalRead(moistureSensorPin) == HIGH;
  return isDry;
}

// Function to log sensor events to Blynk
void logSensorEvents() {
  if (millis() - lastEventLog < eventLogInterval) {
    return; // Not time to log yet
  }
  
  lastEventLog = millis();
  
  // 1. Rainfall Data Event
  int rainValue = analogRead(rainSensorPin);
  if (isRaining) {
    // Log rainfall detected event
    Blynk.logEvent("rainfall_data", String("Rainfall detected! Rain sensor value: ") + String(rainValue));
  }
  
  // 2. Soil Moisture Levels Event
  String moistureStatus = soilIsDry ? "DRY" : "WET";
  if (soilIsDry != lastMoistureState) {
    // Log when moisture state changes
    Blynk.logEvent("soil_moisture_levels", String("Soil moisture changed to: ") + moistureStatus);
    lastMoistureState = soilIsDry;
  }
  
  // 3. Sunlight Intensity Event (using rain sensor as light sensor)
  // Lower values = more light (less resistance)
  // Higher values = less light (more resistance)
  String lightLevel;
  if (rainValue < 100) {
    lightLevel = "Very Bright";
  } else if (rainValue < 300) {
    lightLevel = "Bright";
  } else if (rainValue < 500) {
    lightLevel = "Moderate";
  } else if (rainValue < 700) {
    lightLevel = "Dim";
  } else {
    lightLevel = "Dark";
  }
  Blynk.logEvent("sunlight_intensity", String("Light level: ") + lightLevel + " (Value: " + String(rainValue) + ")");
  
  // 4. Temperature & Humidity Event
  // Note: You'll need DHT sensor for actual temp/humidity
  // For now, logging system status
  String systemStatus = String("System Status - Auto Mode: ") + (autoMode ? "ON" : "OFF") + 
                       ", Pump: " + (pumpRunning ? "ON" : "OFF") +
                       ", Motion: " + (motionDetected ? "Detected" : "Clear");
  Blynk.logEvent("temperature_humidity", systemStatus);
}

// Function to generate and send hourly summary
void sendHourlySummary() {
  if (millis() - lastHourlySummary < hourlySummaryInterval) {
    return; // Not time for summary yet
  }
  
  lastHourlySummary = millis();
  hourlyReportCount++;
  
  // Calculate averages and totals for this hour
  int avgLightReading = (lightReadingsCount > 0) ? (lightReadingsSum / lightReadingsCount) : 0;
  unsigned long pumpMinutes = totalPumpRunTime / 60000;
  unsigned long pumpSeconds = (totalPumpRunTime % 60000) / 1000;
  
  // Determine light condition average
  String avgLightCondition;
  if (avgLightReading < 100) avgLightCondition = "Very Bright";
  else if (avgLightReading < 300) avgLightCondition = "Bright";
  else if (avgLightReading < 500) avgLightCondition = "Moderate";
  else if (avgLightReading < 700) avgLightCondition = "Dim";
  else avgLightCondition = "Dark";
  
  // Check if it's time for daily report (24 hours = 24 hourly reports)
  if (hourlyReportCount >= 24) {
    // === SEND DAILY REPORT ===
    sendDailyReport();
    hourlyReportCount = 0; // Reset for next day
  } else {
    // === SEND HOURLY REPORT ===
    
    // RAINFALL HOURLY
    String rainfallSummary = String("⏰ HOUR ") + String(hourlyReportCount) + " - RAINFALL\n" +
                            "Rain Detections: " + String(rainDetectionCount) + "\n" +
                            "Current: " + (isRaining ? "🌧️ RAINING" : "☀️ Clear");
    Blynk.logEvent("rainfall_data", rainfallSummary);
    
    // SOIL MOISTURE HOURLY
    String moistureSummary = String("⏰ HOUR ") + String(hourlyReportCount) + " - SOIL MOISTURE\n" +
                            "Dry→Wet: " + String(moistureWetCount) + " | Wet→Dry: " + String(moistureDryCount) + "\n" +
                            "Current: " + (soilIsDry ? "🌵 DRY" : "💧 WET") + "\n" +
                            "Pump Cycles: " + String(pumpActivationCount);
    Blynk.logEvent("soil_moisture_levels", moistureSummary);
    
    // SUNLIGHT HOURLY
    String sunlightSummary = String("⏰ HOUR ") + String(hourlyReportCount) + " - SUNLIGHT\n" +
                            "Avg: " + avgLightCondition + " (" + String(avgLightReading) + ")\n" +
                            "Range: " + String(minLightReading) + " - " + String(maxLightReading);
    Blynk.logEvent("sunlight_intensity", sunlightSummary);
    
    // SYSTEM HOURLY
    String systemSummary = String("⏰ HOUR ") + String(hourlyReportCount) + " - SYSTEM\n" +
                          "Motion: " + String(motionDetectionCount) + " | Alerts: " + String(alertActivationCount) + "\n" +
                          "Pump Time: " + String(pumpMinutes) + "m " + String(pumpSeconds) + "s";
    Blynk.logEvent("temperature_humidity", systemSummary);
  }
  
  // Accumulate into daily stats
  dailyRainDetections += rainDetectionCount;
  dailyMotionDetections += motionDetectionCount;
  dailyMoistureDryCount += moistureDryCount;
  dailyMoistureWetCount += moistureWetCount;
  dailyPumpActivations += pumpActivationCount;
  dailyAlertActivations += alertActivationCount;
  dailyTotalPumpTime += totalPumpRunTime;
  dailyLightSum += (lightReadingsSum);
  dailyLightCount += lightReadingsCount;
  if (maxLightReading > dailyMaxLight) dailyMaxLight = maxLightReading;
  if (minLightReading < dailyMinLight) dailyMinLight = minLightReading;
  
  // Reset hourly counters
  rainDetectionCount = 0;
  motionDetectionCount = 0;
  moistureDryCount = 0;
  moistureWetCount = 0;
  pumpActivationCount = 0;
  alertActivationCount = 0;
  totalPumpRunTime = 0;
  lightReadingsSum = 0;
  lightReadingsCount = 0;
  maxLightReading = 0;
  minLightReading = 1024;
}

// Function to send daily summary report (after 24 hours)
void sendDailyReport() {
  // Calculate daily averages
  int dailyAvgLight = (dailyLightCount > 0) ? (dailyLightSum / dailyLightCount) : 0;
  unsigned long dailyPumpHours = dailyTotalPumpTime / 3600000;
  unsigned long dailyPumpMinutes = (dailyTotalPumpTime % 3600000) / 60000;
  
  // Determine daily light condition
  String dailyAvgLightCondition;
  if (dailyAvgLight < 100) dailyAvgLightCondition = "Very Bright";
  else if (dailyAvgLight < 300) dailyAvgLightCondition = "Bright";
  else if (dailyAvgLight < 500) dailyAvgLightCondition = "Moderate";
  else if (dailyAvgLight < 700) dailyAvgLightCondition = "Dim";
  else dailyAvgLightCondition = "Dark";
  
  // === DAILY REPORTS ===
  
  // RAINFALL DAILY
  String dailyRainfall = String("📅 DAILY REPORT - RAINFALL\n") +
                        "━━━━━━━━━━━━━━━━━━━━\n" +
                        "Total Rain Events: " + String(dailyRainDetections) + "\n" +
                        "Status: " + (isRaining ? "🌧️ Currently Raining" : "☀️ Clear") + "\n" +
                        "24-Hour Summary Complete";
  Blynk.logEvent("rainfall_data", dailyRainfall);
  
  // SOIL MOISTURE DAILY
  String dailyMoisture = String("📅 DAILY REPORT - SOIL MOISTURE\n") +
                        "━━━━━━━━━━━━━━━━━━━━\n" +
                        "Dry Events: " + String(dailyMoistureDryCount) + " | Wet Events: " + String(dailyMoistureWetCount) + "\n" +
                        "Total Irrigations: " + String(dailyPumpActivations) + "\n" +
                        "Current: " + (soilIsDry ? "🌵 DRY" : "💧 WET");
  Blynk.logEvent("soil_moisture_levels", dailyMoisture);
  
  // SUNLIGHT DAILY
  String dailySunlight = String("📅 DAILY REPORT - SUNLIGHT\n") +
                        "━━━━━━━━━━━━━━━━━━━━\n" +
                        "Avg Condition: " + dailyAvgLightCondition + " (" + String(dailyAvgLight) + ")\n" +
                        "Peak: " + String(dailyMaxLight) + " | Low: " + String(dailyMinLight) + "\n" +
                        "Total Readings: " + String(dailyLightCount);
  Blynk.logEvent("sunlight_intensity", dailySunlight);
  
  // SYSTEM DAILY
  String dailySystem = String("📅 DAILY REPORT - SYSTEM\n") +
                      "━━━━━━━━━━━━━━━━━━━━\n" +
                      "Motion Events: " + String(dailyMotionDetections) + "\n" +
                      "Total Alerts: " + String(dailyAlertActivations) + "\n" +
                      "Pump Runtime: " + String(dailyPumpHours) + "h " + String(dailyPumpMinutes) + "m\n" +
                      "🎉 Day Complete!";
  Blynk.logEvent("temperature_humidity", dailySystem);
  
  // Reset daily counters
  dailyRainDetections = 0;
  dailyMotionDetections = 0;
  dailyMoistureDryCount = 0;
  dailyMoistureWetCount = 0;
  dailyPumpActivations = 0;
  dailyAlertActivations = 0;
  dailyTotalPumpTime = 0;
  dailyLightSum = 0;
  dailyLightCount = 0;
  dailyMaxLight = 0;
  dailyMinLight = 1024;
}

// Function to log immediate critical events
void logCriticalEvents() {
  // Log rain state change immediately
  if (isRaining != lastRainState) {
    if (isRaining) {
      int rainValue = analogRead(rainSensorPin);
      Blynk.logEvent("rainfall_data", String("⚠️ Rain detected! Sensor: ") + String(rainValue));
    }
    lastRainState = isRaining;
  }
  
  // Log critical moisture changes immediately
  if (moistureIrrigationActive && soilIsDry != lastMoistureState) {
    String status = soilIsDry ? "🌵 SOIL DRY - Irrigation needed" : "💧 SOIL WET - Stopping irrigation";
    Blynk.logEvent("soil_moisture_levels", status);
    lastMoistureState = soilIsDry;
  }
}

void setup()
{
  // Motor pins
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  
  analogWrite(IN1, 0);
  analogWrite(IN2, 0);
  analogWrite(IN3, 0);
  analogWrite(IN4, 0);

  // Relay pins
  pinMode(grassRelay, OUTPUT);
  pinMode(seedRelay, OUTPUT);
  pinMode(pumpRelay, OUTPUT);
  pinMode(buzzerLedRelay, OUTPUT);
  
  digitalWrite(grassRelay, HIGH);
  digitalWrite(seedRelay, HIGH);
  digitalWrite(pumpRelay, HIGH);
  digitalWrite(buzzerLedRelay, HIGH);

  // Sensor pins
  pinMode(pirSensorPin, INPUT);
  pinMode(moistureSensorPin, INPUT);

  // Initialize servo
  pumpServo.attach(servoPin);
  pumpServo.write(0);
  servoPosition = 0;

  stopRobot();
  delay(1000);

  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);
  Blynk.config(BLYNK_AUTH_TOKEN);
  Blynk.connect();
  
  // Initial event log on startup
  delay(2000);
  Blynk.logEvent("temperature_humidity", "🤖 Smart Farm Robot initialized and connected!");
}

// Servo control function - runs one cycle (0->90->0)
void updateServo() {
  if (!servoCycleActive) {
    return;
  }

  if (millis() - lastServoUpdate < servoUpdateInterval) {
    return;
  }
  
  lastServoUpdate = millis();

  if (servoMovingForward) {
    servoPosition++;
    if (servoPosition >= 90) {
      servoPosition = 90;
      servoMovingForward = false;
    }
  } else {
    servoPosition--;
    if (servoPosition <= 0) {
      servoPosition = 0;
      servoMovingForward = true;
      servoCycleActive = false;
      servoCycleComplete = true;
    }
  }
  
  pumpServo.write(servoPosition);
}

// Start a new servo cycle
void startServoCycle() {
  servoPosition = 0;
  servoMovingForward = true;
  servoCycleActive = true;
  servoCycleComplete = false;
  wetDetectedDuringCycle = false;
  pumpServo.write(0);
}

// Pump control functions
void startPump() {
  digitalWrite(pumpRelay, LOW);
  pumpRunning = true;
  pumpStartTime = millis(); // Track when pump started
  pumpActivationCount++;
  Blynk.virtualWrite(V8, 1);
}

void stopPump() {
  digitalWrite(pumpRelay, HIGH);
  if (pumpRunning && pumpStartTime > 0) {
    totalPumpRunTime += (millis() - pumpStartTime);
  }
  pumpRunning = false;
  pumpStartTime = 0;
  Blynk.virtualWrite(V8, 0);
}

// Check moisture while servo is running
void checkMoistureDuringServo() {
  if (!servoCycleActive) return;
  if (!moistureIrrigationActive) return;
  
  if (millis() - lastMoistureCheck < moistureCheckInterval) return;
  lastMoistureCheck = millis();
  
  soilIsDry = readMoistureSensor();
  Blynk.virtualWrite(V13, soilIsDry ? "DRY" : "WET");
  
  // Log critical moisture events
  logCriticalEvents();
  
  if (!soilIsDry) {
    // WET detected - stop everything immediately
    wetDetectedDuringCycle = true;
    servoCycleActive = false;
    
    // First stop the pump
    if (pumpRunning) {
      stopPump();
    }
    
    // Then return servo to root position (0°)
    pumpServo.write(0);
    servoPosition = 0;
    servoMovingForward = true;
    
    // Stop irrigation completely
    moistureIrrigationActive = false;
    initialCycleDone = false;
    Blynk.virtualWrite(V14, 0);
  }
}

// Moisture-based irrigation handler
void handleMoistureIrrigation() {
  if (!moistureIrrigationActive) return;
  
  // Check if max irrigation time reached
  if (millis() - irrigationStartTime >= maxIrrigationTime) {
    stopPump();
    servoCycleActive = false;
    moistureIrrigationActive = false;
    initialCycleDone = false;
    pumpServo.write(0);
    servoPosition = 0;
    Blynk.virtualWrite(V14, 0);
    return;
  }
  
  // Continuously check moisture while servo is running
  checkMoistureDuringServo();
  
  // If wet was detected during cycle, exit (already handled in checkMoistureDuringServo)
  if (wetDetectedDuringCycle) return;
  
  // PHASE 1: Initial servo cycle (before pump starts)
  if (!initialCycleDone) {
    if (servoCycleComplete) {
      // Cycle done and stayed DRY throughout - start pump
      startPump();
      initialCycleDone = true;
      lastServoCycleTime = millis();
      servoCycleComplete = false;
    }
    return;
  }
  
  // PHASE 2: Pump is running - do servo cycles every 5 seconds
  if (pumpRunning) {
    // Start new servo cycle every 5 seconds
    if (!servoCycleActive && (millis() - lastServoCycleTime >= servoCycleInterval)) {
      startServoCycle();
    }
    
    // When servo cycle completes (and stayed dry), continue pumping
    if (servoCycleComplete) {
      servoCycleComplete = false;
      lastServoCycleTime = millis();
    }
  }
}

// Stop moisture irrigation
void stopMoistureIrrigation() {
  if (moistureIrrigationActive) {
    moistureIrrigationActive = false;
    initialCycleDone = false;
    servoCycleActive = false;
    servoCycleComplete = false;
    wetDetectedDuringCycle = false;
    stopPump();
    pumpServo.write(0);
    servoPosition = 0;
    Blynk.virtualWrite(V14, 0);
  }
}

// Alert functions
void activateAlert() {
  digitalWrite(buzzerLedRelay, LOW);
  alertActive = true;
  alertActivationCount++;
  Blynk.virtualWrite(V11, 1);
  Blynk.virtualWrite(V12, 1);
}

void deactivateAlert() {
  digitalWrite(buzzerLedRelay, HIGH);
  alertActive = false;
  autoAlertActive = false;
  Blynk.virtualWrite(V11, 0);
  Blynk.virtualWrite(V12, 0);
}

// Sensor functions
void readSensors() {
  int rainValue = analogRead(rainSensorPin);
  
  // Track light readings for daily average
  lightReadingsSum += rainValue;
  lightReadingsCount++;
  if (rainValue > maxLightReading) maxLightReading = rainValue;
  if (rainValue < minLightReading) minLightReading = rainValue;
  
  bool wasRaining = isRaining;
  isRaining = (rainValue < rainThreshold);
  
  // Count rain detections
  if (isRaining && !wasRaining) {
    rainDetectionCount++;
  }
  
  bool wasMoistureDry = soilIsDry;
  soilIsDry = readMoistureSensor();
  
  // Count moisture changes
  if (soilIsDry && !wasMoistureDry) {
    moistureDryCount++;
  } else if (!soilIsDry && wasMoistureDry) {
    moistureWetCount++;
  }
  
  bool wasMotionDetected = motionDetected;
  bool pir = digitalRead(pirSensorPin);
  motionDetected = !pir;
  
  // Count motion detections
  if (motionDetected && !wasMotionDetected) {
    motionDetectionCount++;
  }
}

void handleAutoMode() {
  if (!autoMode) return;
  
  if (moistureIrrigationActive) {
    stopMoistureIrrigation();
  }
  
  bool shouldAlert = isRaining || motionDetected;
  
  if (shouldAlert && !autoAlertActive) {
    activateAlert();
    autoAlertActive = true;
    alertStartTime = millis();
    
    stopRobot();
    digitalWrite(grassRelay, HIGH);
    digitalWrite(seedRelay, HIGH);
    stopPump();
  }
  
  if (autoAlertActive && (millis() - alertStartTime > alertDuration)) {
    deactivateAlert();
  }
  
  if (autoAlertActive) {
    stopRobot();
    digitalWrite(grassRelay, HIGH);
    digitalWrite(seedRelay, HIGH);
    stopPump();
    return;
  }
}

// Movement functions
void forward() {
  if (emergencyStop || (isRaining && autoMode)) return;
  analogWrite(IN1, motorSpeed);
  analogWrite(IN2, 0);
  analogWrite(IN3, motorSpeed);
  analogWrite(IN4, 0);
}

void backward() {
  if (emergencyStop || (isRaining && autoMode)) return;
  analogWrite(IN1, 0);
  analogWrite(IN2, motorSpeed);
  analogWrite(IN3, 0);
  analogWrite(IN4, motorSpeed);
}

void left() {
  if (emergencyStop || (isRaining && autoMode)) return;
  analogWrite(IN1, 0);
  analogWrite(IN2, 0);
  analogWrite(IN3, motorSpeed);
  analogWrite(IN4, motorSpeed);
}

void right() {
  if (emergencyStop || (isRaining && autoMode)) return;
  analogWrite(IN1, motorSpeed);
  analogWrite(IN2, motorSpeed);
  analogWrite(IN3, 0);
  analogWrite(IN4, 0);
}

void stopRobot() {
  analogWrite(IN1, 0);
  analogWrite(IN2, 0);
  analogWrite(IN3, 0);
  analogWrite(IN4, 0);
}

// Blynk controls
BLYNK_WRITE(V1) { 
  if (emergencyStop || (autoMode && (isRaining || motionDetected))) {
    Blynk.virtualWrite(V1, 0);
    return;
  }
  param.asInt() ? forward() : stopRobot();
}

BLYNK_WRITE(V2) { 
  if (emergencyStop || (autoMode && (isRaining || motionDetected))) {
    Blynk.virtualWrite(V2, 0);
    return;
  }
  param.asInt() ? backward() : stopRobot();
}

BLYNK_WRITE(V3) { 
  if (emergencyStop || (autoMode && (isRaining || motionDetected))) {
    Blynk.virtualWrite(V3, 0);
    return;
  }
  param.asInt() ? left() : stopRobot();
}

BLYNK_WRITE(V4) { 
  if (emergencyStop || (autoMode && (isRaining || motionDetected))) {
    Blynk.virtualWrite(V4, 0);
    return;
  }
  param.asInt() ? right() : stopRobot();
}

// Emergency Stop (V5)
BLYNK_WRITE(V5) { 
  emergencyStop = param.asInt();
  if (emergencyStop) {
    stopRobot();
    digitalWrite(grassRelay, HIGH);
    digitalWrite(seedRelay, HIGH);
    stopPump();
    stopMoistureIrrigation();
    deactivateAlert();
    
    Blynk.virtualWrite(V1, 0);
    Blynk.virtualWrite(V2, 0);
    Blynk.virtualWrite(V3, 0);
    Blynk.virtualWrite(V4, 0);
    Blynk.virtualWrite(V6, 0);
    Blynk.virtualWrite(V7, 0);
    Blynk.virtualWrite(V8, 0);
    Blynk.virtualWrite(V14, 0);
  }
}

BLYNK_WRITE(V6) { 
  if (emergencyStop || (autoMode && (isRaining || motionDetected))) {
    Blynk.virtualWrite(V6, 0);
    return;
  }
  digitalWrite(grassRelay, param.asInt() ? LOW : HIGH); 
}

BLYNK_WRITE(V7) { 
  if (emergencyStop || (autoMode && (isRaining || motionDetected))) {
    Blynk.virtualWrite(V7, 0);
    return;
  }
  digitalWrite(seedRelay, param.asInt() ? LOW : HIGH); 
}

// Manual Pump Control (V8)
BLYNK_WRITE(V8) { 
  if (emergencyStop) {
    Blynk.virtualWrite(V8, 0);
    return;
  }
  if (autoMode && (isRaining || motionDetected)) {
    Blynk.virtualWrite(V8, 0);
    return;
  }
  
  if (param.asInt()) {
    startPump();
  } else {
    stopPump();
  }
}

// Auto Mode (V9)
BLYNK_WRITE(V9) { 
  autoMode = param.asInt();
  
  if (autoMode && moistureIrrigationActive) {
    stopMoistureIrrigation();
  }
  
  if (!autoMode && autoAlertActive) {
    deactivateAlert();
  }
}

BLYNK_WRITE(V10) { 
  rainThreshold = param.asInt();
}

BLYNK_WRITE(V11) { 
  if (autoMode) {
    Blynk.virtualWrite(V11, alertActive ? 1 : 0);
    return;
  }
  if (param.asInt()) {
    alertActive ? deactivateAlert() : activateAlert();
  }
}

BLYNK_WRITE(V12) { 
  if (autoMode) {
    Blynk.virtualWrite(V12, alertActive ? 1 : 0);
    return;
  }
  if (param.asInt()) {
    alertActive ? deactivateAlert() : activateAlert();
  }
}

// Moisture Irrigation Button (V14)
BLYNK_WRITE(V14) {
  if (autoMode) {
    Blynk.virtualWrite(V14, 0);
    return;
  }
  
  if (emergencyStop) {
    Blynk.virtualWrite(V14, 0);
    return;
  }
  
  if (param.asInt()) {
    // Button pressed - Start servo cycle with continuous moisture check
    moistureIrrigationActive = true;
    initialCycleDone = false;
    wetDetectedDuringCycle = false;
    irrigationStartTime = millis();
    lastMoistureCheck = millis();
    
    // Start initial servo cycle
    startServoCycle();
    
    Blynk.virtualWrite(V13, "CHECKING...");
    
    // Log irrigation start event
    Blynk.logEvent("soil_moisture_levels", "💧 Moisture-based irrigation started");
  } else {
    // Button released/turned off manually
    if (moistureIrrigationActive) {
      stopMoistureIrrigation();
      Blynk.logEvent("soil_moisture_levels", "⏹️ Irrigation stopped manually");
    }
  }
}

void loop()
{
  Blynk.run();
  
  updateServo();
  handleMoistureIrrigation();
  
  if (millis() - lastSensorRead > sensorInterval) {
    readSensors();
    handleAutoMode();
    
    // Log critical events immediately when conditions change
    logCriticalEvents();
    
    lastSensorRead = millis();
  }
  
  // Log periodic sensor data events (every 60 seconds)
  logSensorEvents();
  
  // Send hourly summary report (and daily report after 24 hours)
  sendHourlySummary();
}