#pragma once

// Identificación del Paciente y Ubicación
#define PATIENT_NAME "Belen Hortiz"
#define PATIENT_ROOM "Habitación 305"

// Configuración Horaria Bogotá (UTC-5)
#define TIMEZONE_OFFSET_SEC (-5 * 3600)
#define DAYLIGHT_OFFSET_SEC 0
#define NTP_SERVER_1 "pool.ntp.org"
#define NTP_SERVER_2 "time.google.com"

// Intervalos de tiempo (ms)
#define SENSOR_SAMPLE_INTERVAL_MS 20 // 50 Hz de muestreo
#define ALERT_MIN_INTERVAL_MS 5000   // Tiempo mínimo entre alertas (cooldown)
#define FIREBASE_SYNC_INTERVAL_MS 1000 // Sincronización continua de telemetría a la nube

// Umbrales de aceleración SafeStep (m/s^2)
// Moderado: 20.0 a 30.0 m/s² (Posible caída)
// Fuerte: > 30.0 m/s² (Caída detectada)
#define THRESH_MODERADO 20.0f
#define THRESH_FUERTE   30.0f
#define THRESH_FALL_IMPACT THRESH_FUERTE

// Capacidad del historial web
#define MAX_ALERTS 50
