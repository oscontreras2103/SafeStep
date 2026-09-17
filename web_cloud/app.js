const FIREBASE_BASE = "https://safestep-97183-default-rtdb.firebaseio.com/patients/305";

let soundEnabled = true;
let audioCtx = null;
let previousLevel = "Estable";
let isModalOpen = false;
let alarmInterval = null;
let lastHandledAlertKey = "";

// Desbloquear AudioContext en cualquier interacción del usuario
['click', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: false, passive: true });
});

function toggleAudio() {
  soundEnabled = !soundEnabled;
  if (!soundEnabled) stopUrgentAlarm();
  document.getElementById("soundIcon").innerText = soundEnabled ? "🔔" : "🔕";
  document.getElementById("soundLabel").innerText = soundEnabled ? "Alarma Sonora Activa" : "Alarma Silenciada";
}

function startUrgentAlarm() {
  if (!soundEnabled) return;
  stopUrgentAlarm();
  playAlarmBurst();
  alarmInterval = setInterval(playAlarmBurst, 1300);
}

function stopUrgentAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}

function playAlarmBurst() {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    let now = audioCtx.currentTime;

    // Tono 1 sirena de emergencia (880 Hz)
    let osc1 = audioCtx.createOscillator();
    let g1 = audioCtx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.linearRampToValueAtTime(587, now + 0.28);
    g1.gain.setValueAtTime(0.4, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(g1);
    g1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.28);

    // Tono 2 más agudo e insistente (988 Hz)
    let osc2 = audioCtx.createOscillator();
    let g2 = audioCtx.createGain();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(988, now + 0.32);
    osc2.frequency.linearRampToValueAtTime(659, now + 0.6);
    g2.gain.setValueAtTime(0.45, now + 0.32);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(g2);
    g2.connect(audioCtx.destination);
    osc2.start(now + 0.32);
    osc2.stop(now + 0.6);
  } catch(e) {
    console.error("Error reproduciendo alarma:", e);
  }
}

function showFallModal(data) {
  isModalOpen = true;
  document.getElementById("modalPatient").innerText = data.patient_name || document.getElementById("patientName").innerText;
  document.getElementById("modalRoom").innerText = data.patient_room || document.getElementById("patientRoom").innerText;
  document.getElementById("modalImpact").innerText = (data.mag ? Number(data.mag).toFixed(2) : "--") + " m/s²";
  document.getElementById("modalTime").innerText = data.time || new Date().toLocaleTimeString();

  document.getElementById("fallModal").style.display = "flex";
  startUrgentAlarm();
}

function dismissFallAlert() {
  isModalOpen = false;
  stopUrgentAlarm();
  document.getElementById("fallModal").style.display = "none";
}

function formatUptime(seconds) {
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds % 3600) / 60);
  let s = seconds % 60;
  return (h > 0 ? h + "h " : "") + m + "m " + s + "s";
}

function applyTelemetryData(j) {
  if (!j) return;

  if (j.patient_name) document.getElementById("patientName").innerText = j.patient_name;
  if (j.patient_room) document.getElementById("patientRoom").innerText = j.patient_room;
  if (j.time) document.getElementById("navBogotaTime").innerText = "Bogotá: " + j.time;

  document.getElementById("ax").innerText = Number(j.ax || 0).toFixed(3);
  document.getElementById("ay").innerText = Number(j.ay || 0).toFixed(3);
  document.getElementById("az").innerText = Number(j.az || 0).toFixed(3);
  document.getElementById("gx").innerText = Number(j.gx || 0).toFixed(3);
  document.getElementById("gy").innerText = Number(j.gy || 0).toFixed(3);
  document.getElementById("gz").innerText = Number(j.gz || 0).toFixed(3);
  document.getElementById("temp").innerText = Number(j.temp || 0).toFixed(1);
  document.getElementById("magVal").innerText = Number(j.mag || 0).toFixed(2);
  document.getElementById("rssi").innerText = j.wifi_rssi || "--";
  document.getElementById("uptime").innerText = formatUptime(j.uptime_s || 0);

  // Barra de impacto escalada a 50 m/s2 (30 m/s2 = 60%)
  let pct = Math.min(100, Math.max(0, (Number(j.mag || 0) / 50.0) * 100));
  document.getElementById("magBar").style.width = pct + "%";

  // Estado
  let pill = document.getElementById("statusPill");
  let icon = document.getElementById("statusIcon");
  let txt = document.getElementById("statusText");
  txt.innerText = j.level || "Estable";

  if (j.level === "Fuerte") {
    pill.className = "status-pill status-fuerte";
    icon.innerText = "🚨";
    txt.innerText = "¡Caída Detectada! (Atención Inmediata)";
    if (!isModalOpen) {
      showFallModal(j);
    }
  } else if (j.level === "Moderado") {
    pill.className = "status-pill status-moderado";
    icon.innerText = "⚠️";
    txt.innerText = "Posible Caída (Se Recomienda Revisión)";
  } else {
    pill.className = "status-pill status-estable";
    icon.innerText = "●";
    txt.innerText = "Estable / Normal";
  }
  previousLevel = j.level;
}

function updateAlertsList(dataObj) {
  let tbody = document.getElementById("alertsBody");
  if (!dataObj || Object.keys(dataObj).length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No se han registrado caídas ni eventos anómalos.</td></tr>';
    return;
  }

  // Convertir objeto de Firebase en array ordenado de más reciente a más antiguo
  let keys = Object.keys(dataObj);
  let list = keys.map(k => ({ id: k, ...dataObj[k] })).reverse();

  // Si el evento más reciente es Fuerte y no se ha notificado aún
  if (list.length > 0 && list[0].level === "Fuerte" && list[0].id !== lastHandledAlertKey) {
    lastHandledAlertKey = list[0].id;
    if (!isModalOpen) {
      showFallModal({
        patient_name: document.getElementById("patientName").innerText,
        patient_room: document.getElementById("patientRoom").innerText,
        mag: list[0].mag,
        time: list[0].time
      });
    }
  }

  let html = "";
  list.forEach(item => {
    let levelClass = "badge-estable";
    let actionTxt = "En reposo seguro";
    if (item.level === "Fuerte") {
      levelClass = "badge-fuerte";
      actionTxt = "🚨 Caída detectada: Se solicita atención inmediata";
    } else if (item.level === "Moderado") {
      levelClass = "badge-moderado";
      actionTxt = "⚠️ Posible caída: Se recomienda revisión";
    } else if (item.level === "Leve") {
      levelClass = "badge-leve";
      actionTxt = "⚡ Movimiento leve: Monitoreo continuo";
    }

    let waBadge = item.sent 
      ? '<span class="badge-wa">✓ Enviado a WhatsApp</span>'
      : '<span class="badge-wa badge-wa-err">✕ No enviado</span>';

    html += `
      <tr>
        <td style="font-family:'JetBrains Mono',monospace; font-weight:600;">${item.time}</td>
        <td><span class="badge-level ${levelClass}">${item.level}</span></td>
        <td style="font-family:'JetBrains Mono',monospace; font-weight:700;">${Number(item.mag).toFixed(2)} m/s²</td>
        <td>${waBadge}</td>
        <td style="font-size:0.83rem; color:var(--text-secondary);">${actionTxt}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// 1. STREAMING EN TIEMPO REAL CON FIREBASE REALTIME DATABASE (SSE)
function initFirebaseStreaming() {
  try {
    const sse = new EventSource(`${FIREBASE_BASE}/telemetry.json`);

    sse.addEventListener('put', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.path === "/") {
          applyTelemetryData(payload.data);
        } else if (payload.data) {
          // Actualización de campo individual
          fetchTelemetryFallback();
        }
      } catch(err) {
        console.error("Error parseando SSE:", err);
      }
    });

    sse.onopen = () => {
      document.getElementById("cloudStatus").style.borderColor = "rgba(16, 185, 129, 0.35)";
      document.getElementById("cloudStatusText").innerText = "En Vivo: Google Firebase";
    };

    sse.onerror = (e) => {
      document.getElementById("cloudStatusText").innerText = "Reconectando nube...";
    };
  } catch(e) {
    console.error("EventSource no soportado:", e);
    setInterval(fetchTelemetryFallback, 800);
  }
}

// Fallback por HTTP polling si el navegador corta EventSource
function fetchTelemetryFallback() {
  fetch(`${FIREBASE_BASE}/telemetry.json`)
    .then(r => r.json())
    .then(applyTelemetryData)
    .catch(console.error);
}

function fetchAlerts() {
  fetch(`${FIREBASE_BASE}/alerts.json`)
    .then(r => r.json())
    .then(updateAlertsList)
    .catch(console.error);
}

// Iniciar
initFirebaseStreaming();
fetchTelemetryFallback();
fetchAlerts();
setInterval(fetchAlerts, 2000);
