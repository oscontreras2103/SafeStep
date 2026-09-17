# SafeStep 🛡️
> *"Usar SafeStep es dar pasos seguros"*

Sistema asistencial de telemetría y detección temprana de caídas para pacientes hospitalarios y adultos mayores, basado en **ESP32**, sensor inercial **MPU6050**, **Google Firebase Realtime Database** y la API oficial de **Meta WhatsApp Cloud**.

---

## 📋 Descripción del Proyecto
SafeStep es un dispositivo IoT wearable y plataforma clínica diseñada como Trabajo de Grado. El sistema monitorea en tiempo real la cinemática del paciente a 50 Hz, clasifica eventos anómalos mediante umbrales de aceleración vectorial calibrados experimentalmente, y emite alertas críticas multicanal:
1. **Notificación directa a WhatsApp** del personal asistencial con datos del paciente, habitación, aceleración pico y hora oficial de Bogotá (NTP UTC-5).
2. **Streaming global en la nube** hacia Google Firebase Realtime Database con latencia sub-segundo.
3. **Centro de Monitoreo Web** (tanto local en el ESP32 como en la nube para Vercel/Netlify) con Pop-up de emergencia visual y alarma sonora de dos tonos.

---

## 🛠️ Arquitectura de Hardware y Pines
- **Placa**: DOIT ESP32 DevKit V1 (240 MHz, Dual Core)
- **Sensor Inercial**: MPU6050 (Acelerómetro $\pm 8\text{g}$ + Giroscopio $\pm 500^\circ/\text{s}$)
- **Conexión I2C**:
  - `GPIO 21` ➡️ **SDA**
  - `GPIO 22` ➡️ **SCL**
  - `3.3V / 5V` ➡️ **VCC**
  - `GND` ➡️ **GND**

---

## 📊 Umbrales de Detección Calibrados

| Nivel | Rango de Magnitud | Acción Clínica | Notificación WhatsApp |
| :--- | :--- | :--- | :---: |
| **Estable** | $< 20.0\text{ m/s}^2$ | Reposo seguro | No |
| **Moderado** | $20.0 \le \text{mag} < 30.0\text{ m/s}^2$ | Posible caída (revisión preventiva) | Sí |
| **Fuerte** | $\ge 30.0\text{ m/s}^2$ | ¡Caída detectada! (Asistencia inmediata) | Sí + Pop-up + Sirena |

---

## 🚀 Puesta en Marcha

### 1. Requisitos
- [PlatformIO IDE](https://platformio.org/) (extensión para VS Code o CLI).
- Placa ESP32 y sensor MPU6050.

### 2. Configuración de Credenciales
Crea el archivo `include/secrets.h` a partir de la plantilla:
```bash
cp include/secrets.example.h include/secrets.h
```
Edita `include/secrets.h` con:
- Tu SSID y contraseña Wi-Fi.
- Tu token de acceso de Meta for Developers (WhatsApp Cloud API).
- La URL de tu base de datos Firebase Realtime Database.

### 3. Compilación y Carga
```bash
# Compilar proyecto
platformio run --environment esp32doit-devkit-v1

# Cargar firmware al ESP32
platformio run --target upload

# Abrir monitor serial (115200 baud)
platformio device monitor
```

---

## 🌐 Aplicación Web en la Nube (`web_cloud/`)
La carpeta `web_cloud/` contiene el dashboard clínico listo para despliegue público en **Vercel** o **Netlify**:
- `index.html`: Interfaz del centro de monitoreo clínico.
- `styles.css`: Hoja de estilos con efectos de desenfoque, glow de emergencia y diseño responsivo.
- `app.js`: Cliente de streaming en tiempo real conectado a Firebase vía Server-Sent Events (SSE).
- `vercel.json`: Reglas de enrutamiento para Vercel.

---

## 📄 Licencia y Créditos
Desarrollado como Trabajo de Grado &copy; 2026. Todos los derechos reservados.
