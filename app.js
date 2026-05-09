const EMOTIONS = [
  { id: "neutral", label: "Neutral", duration: 2200, checked: true },
  { id: "happy", label: "Happy", duration: 2400, checked: true },
  { id: "beam", label: "Beam", duration: 620, checked: false },
  { id: "curious", label: "Curious", duration: 2200, checked: true },
  { id: "sleepy", label: "Sleepy", duration: 2500, checked: false },
  { id: "excited", label: "Excited", duration: 1800, checked: false },
  { id: "wink", label: "Wink", duration: 1900, checked: false },
  { id: "surprised", label: "Surprised", duration: 2000, checked: false },
  { id: "look-left", label: "Look Left", duration: 1200, checked: false },
  { id: "look-right", label: "Look Right", duration: 1200, checked: false },
  { id: "look-down", label: "Look Down", duration: 1100, checked: false },
  { id: "look-up", label: "Look Up", duration: 1100, checked: false },
];

const PROFILE_PRESETS = {
  calm: {
    glow: 14,
    speed: 0.8,
    autoBlink: true,
    ambientGlance: false,
    glanceChance: 8,
    saccadeEnabled: true,
    saccadeIntensity: 18,
    logoMode: false,
    sequence: ["neutral", "happy", "beam", "curious"],
  },
  smile: {
    glow: 22,
    speed: 0.95,
    autoBlink: true,
    ambientGlance: true,
    glanceChance: 18,
    saccadeEnabled: true,
    saccadeIntensity: 22,
    logoMode: false,
    sequence: ["happy", "beam", "neutral", "look-left", "neutral", "look-right", "happy", "neutral"],
  },
  cute: {
    glow: 24,
    speed: 1.1,
    autoBlink: true,
    ambientGlance: true,
    glanceChance: 32,
    saccadeEnabled: true,
    saccadeIntensity: 34,
    logoMode: false,
    sequence: ["happy", "beam", "curious", "wink", "neutral", "look-up"],
  },
  alert: {
    glow: 28,
    speed: 1.5,
    autoBlink: true,
    ambientGlance: true,
    glanceChance: 44,
    saccadeEnabled: true,
    saccadeIntensity: 45,
    logoMode: false,
    sequence: ["curious", "look-left", "look-right", "surprised", "neutral"],
  },
  logo: {
    glow: 10,
    speed: 0.75,
    autoBlink: true,
    ambientGlance: false,
    glanceChance: 0,
    saccadeEnabled: false,
    saccadeIntensity: 0,
    logoMode: true,
    sequence: ["neutral", "happy"],
  },
};

const state = {
  width: 320,
  height: 140,
  eyeScale: 1,
  color: "#29f2ff",
  glow: 20,
  speed: 1,
  autoBlink: true,
  ambientGlance: true,
  glanceChance: 28,
  saccadeEnabled: true,
  saccadeIntensity: 35,
  logoMode: false,
  profile: "custom",
  sequence: ["neutral", "curious", "neutral", "look-right", "neutral"],
};

const dom = {
  widthInput: document.querySelector("#widthInput"),
  heightInput: document.querySelector("#heightInput"),
  eyeScaleInput: document.querySelector("#eyeScaleInput"),
  eyeScaleValue: document.querySelector("#eyeScaleValue"),
  colorInput: document.querySelector("#colorInput"),
  glowInput: document.querySelector("#glowInput"),
  speedInput: document.querySelector("#speedInput"),
  speedValue: document.querySelector("#speedValue"),
  blinkToggle: document.querySelector("#blinkToggle"),
  glanceToggle: document.querySelector("#glanceToggle"),
  glanceChanceInput: document.querySelector("#glanceChanceInput"),
  glanceChanceValue: document.querySelector("#glanceChanceValue"),
  saccadeToggle: document.querySelector("#saccadeToggle"),
  saccadeInput: document.querySelector("#saccadeInput"),
  saccadeValue: document.querySelector("#saccadeValue"),
  profileSelect: document.querySelector("#profileSelect"),
  logoModeToggle: document.querySelector("#logoModeToggle"),
  emotionChecklist: document.querySelector("#emotionChecklist"),
  timelineList: document.querySelector("#timelineList"),
  previewMount: document.querySelector("#previewMount"),
  codeOutput: document.querySelector("#codeOutput"),
  copyCodeBtn: document.querySelector("#copyCodeBtn"),
  copyCssBtn: document.querySelector("#copyCssBtn"),
  exportGifBtn: document.querySelector("#exportGifBtn"),
  exportPresetBtn: document.querySelector("#exportPresetBtn"),
  importPresetBtn: document.querySelector("#importPresetBtn"),
  importPresetFile: document.querySelector("#importPresetFile"),
};

const baseSvg = `
<div class="robot-eyes" data-emotion="neutral" aria-label="Animated robot eyes" role="img">
  <svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <g class="eye-slot eye-left-slot" transform="translate(78 30)">
      <g class="eye-jitter eye-left-jitter">
        <g class="eye-motion eye-left">
          <rect class="eye-shape" width="64" height="80" rx="22" />
          <path class="eye-smile" d="M10 30 C10 16 20 8 32 8 C44 8 54 16 54 30 C48 24 40 22 32 22 C24 22 16 24 10 30 Z" />
          <rect class="eye-highlight" x="9" y="8" width="16" height="10" rx="5" />
        </g>
      </g>
    </g>
    <g class="eye-slot eye-right-slot" transform="translate(178 30)">
      <g class="eye-jitter eye-right-jitter">
        <g class="eye-motion eye-right">
          <rect class="eye-shape" width="64" height="80" rx="22" />
          <path class="eye-smile" d="M10 30 C10 16 20 8 32 8 C44 8 54 16 54 30 C48 24 40 22 32 22 C24 22 16 24 10 30 Z" />
          <rect class="eye-highlight" x="9" y="8" width="16" height="10" rx="5" />
        </g>
      </g>
    </g>
  </svg>
</div>
`;

let dragEmotionId = "";
let previewExpressionTimer = 0;
let previewSaccadeTimer = 0;
let previewSaccadeHitTimer = 0;
let previewBlinkTimer = 0;
let lastEffectiveConfig = null;
let gifScriptPromise = null;
let selectedTimelineIndex = -1;
let timelineSortable = null;

function getGifWorkerScriptPath() {
  if (window.location.protocol === "file:") {
    return "https://cdn.jsdelivr.net/npm/gif.js.optimized/dist/gif.worker.js";
  }
  return new URL("./vendor/gif.worker.js", window.location.href).href;
}

function emotionExists(id) {
  return EMOTIONS.some((item) => item.id === id);
}

function sanitizeSequence(sequence) {
  const filtered = [];
  sequence.forEach((id) => {
    if (!emotionExists(id)) return;
    filtered.push(id);
  });
  return filtered.length ? filtered : ["neutral"];
}

function markCustomProfile() {
  state.profile = "custom";
  dom.profileSelect.value = "custom";
}

function syncControlsFromState() {
  dom.widthInput.value = String(state.width);
  dom.heightInput.value = String(state.height);
  dom.eyeScaleInput.value = String(state.eyeScale);
  dom.eyeScaleValue.textContent = `${state.eyeScale.toFixed(1)}x`;
  dom.colorInput.value = state.color;
  dom.glowInput.value = String(state.glow);
  dom.speedInput.value = String(state.speed);
  dom.speedValue.textContent = `${state.speed.toFixed(1)}x`;
  dom.blinkToggle.checked = state.autoBlink;
  dom.glanceToggle.checked = state.ambientGlance;
  dom.glanceChanceInput.value = String(state.glanceChance);
  dom.glanceChanceValue.textContent = `${state.glanceChance}%`;
  dom.saccadeToggle.checked = state.saccadeEnabled;
  dom.saccadeInput.value = String(state.saccadeIntensity);
  dom.saccadeValue.textContent = `${state.saccadeIntensity}%`;
  dom.logoModeToggle.checked = state.logoMode;
  dom.profileSelect.value = state.profile;
}

function getDurationForEmotion(id, speed) {
  const found = EMOTIONS.find((item) => item.id === id);
  const base = found ? found.duration : 2200;
  return Math.max(220, Math.round(base / speed));
}

function getEffectiveConfig(config) {
  const effective = {
    ...config,
    sequence: sanitizeSequence([...config.sequence]),
  };

  if (effective.logoMode) {
    const logoBlocked = new Set(["excited", "surprised", "wink", "look-left", "look-right", "look-down", "look-up"]);
    effective.sequence = effective.sequence.filter((id) => !logoBlocked.has(id));
    effective.sequence = sanitizeSequence(effective.sequence);
    effective.glow = Math.min(effective.glow, 12);
    effective.speed = Math.min(effective.speed, 0.95);
    effective.ambientGlance = false;
    effective.glanceChance = Math.min(effective.glanceChance, 8);
    effective.saccadeEnabled = false;
    effective.saccadeIntensity = Math.min(effective.saccadeIntensity, 12);
  }

  return effective;
}

function getLibraryCss(config) {
  const glowBlur = Math.round((config.glow / 60) * 14 + 1);
  const glowAlpha = (config.glow / 60) * 0.42 + 0.06;
  const glowFilter =
    config.glow === 0
      ? "none"
      : `drop-shadow(0 0 ${glowBlur}px color-mix(in srgb, ${config.color} ${Math.round(glowAlpha * 100)}%, #ffffff 10%))`;

  return `
.robot-eyes {
  width: ${config.width}px;
  height: ${config.height}px;
  display: inline-grid;
  place-items: center;
  --sx: 0px;
  --sy: 0px;
}
.robot-eyes svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  transform: scale(${config.eyeScale});
  transform-origin: center;
}
.robot-eyes .eye-jitter {
  transform-origin: center;
  transform-box: fill-box;
  transition: transform 56ms linear;
}
.robot-eyes.saccade-on.saccade-hit .eye-jitter {
  transform: translate(var(--sx), var(--sy));
}
.robot-eyes .eye-motion {
  transform-origin: center;
  transform-box: fill-box;
  transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
}
.robot-eyes.emotion-blink .eye-motion {
  transform: scaleY(0.12) translateY(16px) !important;
  animation: none !important;
  transition: transform 90ms cubic-bezier(0.4, 0, 1, 1) !important;
}
.robot-eyes.beam-approach .eye-motion {
  transform: scaleY(0.66) scaleX(1.05) translateY(2px) !important;
  animation: none !important;
  transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1) !important;
}
.robot-eyes .eye-shape {
  fill: ${config.color};
  filter: ${glowFilter};
}
.robot-eyes .eye-smile {
  display: none;
  fill: ${config.color};
  filter: ${glowFilter};
}
.robot-eyes .eye-highlight {
  fill: color-mix(in srgb, ${config.color} 50%, #ffffff 50%);
  opacity: .88;
}
.robot-eyes[data-emotion="neutral"] .eye-motion {
  transform: scale(1);
}
.robot-eyes[data-emotion="happy"] .eye-motion {
  transform: translateY(6px) scaleX(1.08) scaleY(.72);
}
.robot-eyes[data-emotion="beam"] .eye-motion {
  transform: translateY(6px) scaleX(1.02);
}
.robot-eyes[data-emotion="beam"] .eye-shape,
.robot-eyes[data-emotion="beam"] .eye-highlight {
  display: none;
}
.robot-eyes[data-emotion="beam"] .eye-smile {
  display: block;
}
.robot-eyes[data-emotion="curious"] .eye-left {
  transform: translateY(-2px) scaleY(1.1);
}
.robot-eyes[data-emotion="curious"] .eye-right {
  transform: translateY(11px) scaleY(.58);
}
.robot-eyes[data-emotion="sleepy"] .eye-motion {
  transform: translateY(16px) scaleY(.36) scaleX(1.08);
}
.robot-eyes[data-emotion="excited"] .eye-motion {
  animation: excitedHop 430ms ease-in-out infinite alternate;
}
.robot-eyes[data-emotion="wink"] .eye-left {
  transform: scaleY(1);
}
.robot-eyes[data-emotion="wink"] .eye-right {
  animation: winkRight 900ms ease-in-out infinite;
}
.robot-eyes[data-emotion="surprised"] .eye-motion {
  transform: translateY(-2px) scaleY(1.25) scaleX(.9);
}
.robot-eyes[data-emotion="look-left"] .eye-motion {
  transform: translateX(-14px) scaleX(.94) scaleY(.96);
}
.robot-eyes[data-emotion="look-right"] .eye-motion {
  transform: translateX(14px) scaleX(.94) scaleY(.96);
}
.robot-eyes[data-emotion="look-down"] .eye-motion {
  transform: translateY(12px) scaleY(.86) scaleX(1.05);
}
.robot-eyes[data-emotion="look-up"] .eye-motion {
  transform: translateY(-12px) scaleY(1.06) scaleX(.98);
}
.robot-eyes.auto-blink:not([data-emotion="sleepy"]) .eye-motion {
  animation: none;
}
.robot-eyes.blink-pulse .eye-motion {
  animation: blinkSoft 170ms cubic-bezier(0.2, 0.8, 0.2, 1) 1;
}
.robot-eyes[data-emotion="excited"].auto-blink .eye-motion,
.robot-eyes[data-emotion="wink"].auto-blink .eye-right,
.robot-eyes[data-emotion="look-left"].auto-blink .eye-motion,
.robot-eyes[data-emotion="look-right"].auto-blink .eye-motion,
.robot-eyes[data-emotion="look-down"].auto-blink .eye-motion,
.robot-eyes[data-emotion="look-up"].auto-blink .eye-motion {
  animation: none;
}
@keyframes blinkSoft {
  0%, 38%          { transform: scaleY(1); animation-timing-function: ease-in; }
  42%              { transform: scaleY(0.1) translateY(18px); animation-timing-function: ease-out; }
  47%              { transform: scaleY(1.04); animation-timing-function: ease-in-out; }
  50%, 100%        { transform: scaleY(1); }
}
@keyframes winkRight {
  0%, 38%          { transform: scaleY(1); animation-timing-function: ease-in; }
  42%              { transform: scaleY(0.1) translateY(18px); animation-timing-function: ease-out; }
  47%              { transform: scaleY(1.03); animation-timing-function: ease-in-out; }
  50%, 84%         { transform: scaleY(1); animation-timing-function: ease-in; }
  88%              { transform: scaleY(0.1) translateY(18px); animation-timing-function: ease-out; }
  93%, 100%        { transform: scaleY(1); }
}
@keyframes excitedHop {
  0%   { transform: translateY(-3px) scaleY(1.04) scaleX(0.97); }
  100% { transform: translateY(3px)  scaleY(0.96) scaleX(1.02); }
}
`;
}

function getLibraryJs(config) {
  const timingList = config.sequence.map((id) => getDurationForEmotion(id, config.speed));

  return `
(() => {
  const root = document.querySelector('.robot-eyes');
  if (!root) return;

  const sequence = ${JSON.stringify(config.sequence)};
  const timings = ${JSON.stringify(timingList)};
  const glanceModes = ['look-left', 'look-right', 'look-down', 'look-up'];
  const ambientGlance = ${String(config.ambientGlance)};
  const glanceChance = ${Number(config.glanceChance) || 0};
  const autoBlink = ${String(config.autoBlink)};
  const saccadeEnabled = ${String(config.saccadeEnabled)};
  const saccadeIntensity = ${Number(config.saccadeIntensity) || 0};

  root.classList.toggle('auto-blink', autoBlink);
  root.classList.toggle('saccade-on', saccadeEnabled);

  const withGlance = (baseEmotion) => {
    if (!ambientGlance) return baseEmotion;
    if (Math.random() * 100 >= glanceChance) return baseEmotion;
    return glanceModes[Math.floor(Math.random() * glanceModes.length)];
  };

  const runSaccade = () => {
    if (!saccadeEnabled) return;
    const maxShift = Math.max(.8, (saccadeIntensity / 100) * 3.2);
    const sx = ((Math.random() * 2 - 1) * maxShift).toFixed(2);
    const sy = ((Math.random() * 2 - 1) * maxShift).toFixed(2);
    root.style.setProperty('--sx', sx + 'px');
    root.style.setProperty('--sy', sy + 'px');
    root.classList.add('saccade-hit');
    setTimeout(() => root.classList.remove('saccade-hit'), 55 + Math.floor(Math.random() * 75));
    setTimeout(runSaccade, 900 + Math.floor(Math.random() * 2200));
  };

  const runBlink = () => {
    if (!autoBlink) return;
    const delay = 2800 + Math.floor(Math.random() * 5200);
    setTimeout(() => {
      root.classList.add('blink-pulse');
      setTimeout(() => root.classList.remove('blink-pulse'), 180);
      runBlink();
    }, delay);
  };

  let index = 0;
  const run = () => {
    const baseEmotion = sequence[index % sequence.length] || 'neutral';
    const appliedEmotion = withGlance(baseEmotion);
    const baseDelay = timings[index % timings.length] || 2000;
    const nextDelay = appliedEmotion === baseEmotion ? baseDelay : Math.max(620, Math.round(baseDelay * 0.45));
    index += 1;
    root.classList.add('emotion-blink');
    root.classList.remove('beam-approach');
    if (appliedEmotion === 'beam') {
      setTimeout(() => {
        root.classList.add('beam-approach');
      }, 55);
      setTimeout(() => {
        root.dataset.emotion = appliedEmotion;
      }, 135);
      setTimeout(() => {
        root.classList.remove('beam-approach');
      }, 360);
    } else {
      setTimeout(() => {
        root.dataset.emotion = appliedEmotion;
      }, 95);
    }
    setTimeout(() => root.classList.remove('emotion-blink'), 220);
    setTimeout(run, nextDelay);
  };

  run();
  runSaccade();
  runBlink();
})();
`;
}

function getFullEmbedCode(config) {
  return `<!-- Robot Eye Expression Library: Start -->
${baseSvg.trim()}
<style>
${getLibraryCss(config).trim()}
</style>
<script>
${getLibraryJs(config).trim()}
</script>
<!-- Robot Eye Expression Library: End -->`;
}

function getCssJsCode(config) {
  return `<style>\n${getLibraryCss(config).trim()}\n</style>\n<script>\n${getLibraryJs(config).trim()}\n</script>`;
}

function clearPreviewTimers() {
  window.clearTimeout(previewExpressionTimer);
  window.clearTimeout(previewSaccadeTimer);
  window.clearTimeout(previewSaccadeHitTimer);
  window.clearTimeout(previewBlinkTimer);
}

function startPreviewSaccadeLoop(root, config) {
  root.classList.toggle("saccade-on", config.saccadeEnabled);
  if (!config.saccadeEnabled) {
    root.classList.remove("saccade-hit");
    return;
  }

  const tick = () => {
    const maxShift = Math.max(0.8, (config.saccadeIntensity / 100) * 3.2);
    const sx = ((Math.random() * 2 - 1) * maxShift).toFixed(2);
    const sy = ((Math.random() * 2 - 1) * maxShift).toFixed(2);
    root.style.setProperty("--sx", `${sx}px`);
    root.style.setProperty("--sy", `${sy}px`);
    root.classList.add("saccade-hit");
    previewSaccadeHitTimer = window.setTimeout(() => {
      root.classList.remove("saccade-hit");
    }, 55 + Math.floor(Math.random() * 75));
    previewSaccadeTimer = window.setTimeout(tick, 900 + Math.floor(Math.random() * 2200));
  };

  previewSaccadeTimer = window.setTimeout(tick, 900 + Math.floor(Math.random() * 1200));
}

function startPreviewBlinkLoop(root, config) {
  root.classList.toggle("auto-blink", config.autoBlink);
  root.classList.remove("blink-pulse");
  if (!config.autoBlink) return;

  const tick = () => {
    const delay = 2800 + Math.floor(Math.random() * 5200);
    previewBlinkTimer = window.setTimeout(() => {
      root.classList.add("blink-pulse");
      window.setTimeout(() => root.classList.remove("blink-pulse"), 180);
      tick();
    }, delay);
  };

  tick();
}

function createPreview(config) {
  clearPreviewTimers();
  dom.previewMount.innerHTML = baseSvg;

  const styleTag = document.createElement("style");
  styleTag.id = "previewStyles";
  styleTag.textContent = getLibraryCss({ ...config, width: 320, height: 140 });
  dom.previewMount.appendChild(styleTag);

  const root = dom.previewMount.querySelector(".robot-eyes");
  root.classList.toggle("auto-blink", config.autoBlink);

  const withGlance = (baseEmotion) => {
    if (!config.ambientGlance) return baseEmotion;
    if (Math.random() * 100 >= config.glanceChance) return baseEmotion;
    const glanceModes = ["look-left", "look-right", "look-down", "look-up"];
    return glanceModes[Math.floor(Math.random() * glanceModes.length)];
  };

  let queueIndex = 0;
  const runPreview = () => {
    const baseEmotion = config.sequence[queueIndex % config.sequence.length] || "neutral";
    const appliedEmotion = withGlance(baseEmotion);
    const baseWait = getDurationForEmotion(baseEmotion, config.speed);
    const wait = appliedEmotion === baseEmotion ? baseWait : Math.max(620, Math.round(baseWait * 0.45));
    queueIndex += 1;
    root.classList.add('emotion-blink');
    root.classList.remove('beam-approach');
    if (appliedEmotion === 'beam') {
      setTimeout(() => {
        root.classList.add('beam-approach');
      }, 55);
      setTimeout(() => {
        root.dataset.emotion = appliedEmotion;
      }, 135);
      setTimeout(() => {
        root.classList.remove('beam-approach');
      }, 360);
    } else {
      setTimeout(() => {
        root.dataset.emotion = appliedEmotion;
      }, 95);
    }
    setTimeout(() => root.classList.remove('emotion-blink'), 220);
    previewExpressionTimer = window.setTimeout(runPreview, wait);
  };

  runPreview();
  startPreviewSaccadeLoop(root, config);
  startPreviewBlinkLoop(root, config);
}

function renderChecklist() {
  dom.emotionChecklist.innerHTML = "";

  EMOTIONS.forEach((emotion) => {
    const item = document.createElement("div");
    item.className = "emotion-item";
    item.dataset.emotionId = emotion.id;
    item.innerHTML = `
      <button class="emotion-add" type="button" aria-label="Add ${emotion.label} to timeline" title="Add to timeline" data-emotion-id="${emotion.id}">
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <span class="emotion-label">${emotion.label}</span>
    `;
    dom.emotionChecklist.appendChild(item);
  });
}

function renderTimeline() {
  dom.timelineList.innerHTML = "";
  const sequence = sanitizeSequence(state.sequence);

  sequence.forEach((id, index) => {
    const info = EMOTIONS.find((item) => item.id === id);
    const chip = document.createElement("div");
    chip.className = "timeline-item";
    if (index === selectedTimelineIndex) chip.classList.add("is-selected");
    chip.draggable = true;
    chip.dataset.id = id;
    chip.dataset.index = String(index);
    chip.innerHTML = `
      <button class="timeline-grip" type="button" aria-label="Drag to reorder" title="Drag to reorder">
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <circle cx="3" cy="3" r="1"></circle>
          <circle cx="9" cy="3" r="1"></circle>
          <circle cx="3" cy="6" r="1"></circle>
          <circle cx="9" cy="6" r="1"></circle>
          <circle cx="3" cy="9" r="1"></circle>
          <circle cx="9" cy="9" r="1"></circle>
        </svg>
      </button>
      <span class="timeline-label">${info ? info.label : id}</span>
      <button class="timeline-remove" type="button" aria-label="Remove ${info ? info.label : id}" title="Remove">x</button>
    `;
    dom.timelineList.appendChild(chip);
  });
}

function removeTimelineItem(index) {
  if (!Number.isInteger(index) || index < 0 || index >= state.sequence.length) return;
  const next = [...state.sequence];
  next.splice(index, 1);
  state.sequence = sanitizeSequence(next);
  selectedTimelineIndex = -1;
  markCustomProfile();
  refreshAll();
}

function refreshAll() {
  state.sequence = sanitizeSequence(state.sequence);
  if (selectedTimelineIndex >= state.sequence.length) {
    selectedTimelineIndex = -1;
  }
  syncControlsFromState();
  renderChecklist();
  renderTimeline();
  bindTimelineDnD();

  const effectiveConfig = getEffectiveConfig(state);
  lastEffectiveConfig = effectiveConfig;
  createPreview(effectiveConfig);
  dom.codeOutput.value = getFullEmbedCode(effectiveConfig);
}

function previewEmotionOnly(emotionId) {
  if (!emotionExists(emotionId)) return;
  const previewConfig = getEffectiveConfig({
    ...state,
    sequence: [emotionId],
    ambientGlance: state.ambientGlance,
  });
  createPreview(previewConfig);
}

function applyProfile(profileName) {
  const preset = PROFILE_PRESETS[profileName];
  if (!preset) return;

  state.profile = profileName;
  state.glow = preset.glow;
  state.speed = preset.speed;
  state.autoBlink = preset.autoBlink;
  state.ambientGlance = preset.ambientGlance;
  state.glanceChance = preset.glanceChance;
  state.saccadeEnabled = preset.saccadeEnabled;
  state.saccadeIntensity = preset.saccadeIntensity;
  state.logoMode = preset.logoMode;
  state.sequence = sanitizeSequence(preset.sequence);
  refreshAll();
}

function setSequenceFromChecklist() {
  const checkedOrder = [...dom.emotionChecklist.querySelectorAll("input:checked")].map((input) => input.value);
  const checkedSet = new Set(checkedOrder);

  const kept = state.sequence.filter((id) => checkedSet.has(id));
  const appended = checkedOrder.filter((id) => !kept.includes(id));
  state.sequence = sanitizeSequence([...kept, ...appended]);
}

function duplicateTimelineItem(index) {
  if (!Number.isInteger(index) || index < 0 || index >= state.sequence.length) return;
  const next = [...state.sequence];
  next.splice(index + 1, 0, next[index]);
  state.sequence = sanitizeSequence(next);
  selectedTimelineIndex = index;
  markCustomProfile();
  refreshAll();
}

function serializePresetConfig() {
  return {
    width: state.width,
    height: state.height,
    eyeScale: state.eyeScale,
    color: state.color,
    glow: state.glow,
    speed: state.speed,
    autoBlink: state.autoBlink,
    ambientGlance: state.ambientGlance,
    glanceChance: state.glanceChance,
    saccadeEnabled: state.saccadeEnabled,
    saccadeIntensity: state.saccadeIntensity,
    logoMode: state.logoMode,
    profile: state.profile,
    sequence: [...state.sequence],
  };
}

function applyImportedConfig(payload) {
  const source = payload && typeof payload === "object" && payload.config ? payload.config : payload;
  if (!source || typeof source !== "object") {
    throw new Error("Invalid preset format.");
  }

  state.width = Number(source.width) || state.width;
  state.height = Number(source.height) || state.height;
  state.eyeScale = Number.isFinite(Number(source.eyeScale)) ? Number(source.eyeScale) : state.eyeScale;
  state.color = typeof source.color === "string" ? source.color : state.color;
  state.glow = Number.isFinite(Number(source.glow)) ? Number(source.glow) : state.glow;
  state.speed = Number.isFinite(Number(source.speed)) ? Number(source.speed) : state.speed;
  state.autoBlink = typeof source.autoBlink === "boolean" ? source.autoBlink : state.autoBlink;
  state.ambientGlance = typeof source.ambientGlance === "boolean" ? source.ambientGlance : state.ambientGlance;
  state.glanceChance = Number.isFinite(Number(source.glanceChance)) ? Number(source.glanceChance) : state.glanceChance;
  state.saccadeEnabled = typeof source.saccadeEnabled === "boolean" ? source.saccadeEnabled : state.saccadeEnabled;
  state.saccadeIntensity = Number.isFinite(Number(source.saccadeIntensity)) ? Number(source.saccadeIntensity) : state.saccadeIntensity;
  state.logoMode = typeof source.logoMode === "boolean" ? source.logoMode : state.logoMode;
  state.profile = typeof source.profile === "string" && ["custom", "calm", "cute", "alert", "logo"].includes(source.profile)
    ? source.profile
    : "custom";
  state.sequence = sanitizeSequence(Array.isArray(source.sequence) ? source.sequence : state.sequence);
}

function exportPresetJson() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    config: serializePresetConfig(),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "robot-eye-preset.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function loadGifLibrary() {
  if (window.GIF) return Promise.resolve();
  if (gifScriptPromise) return gifScriptPromise;

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("GIF library failed to load."));
      document.head.appendChild(script);
    });
  };

  gifScriptPromise = (async () => {
    try {
      await loadScript("./vendor/gif.js");
      return;
    } catch (error) {
      await loadScript("https://cdn.jsdelivr.net/npm/gif.js.optimized/dist/gif.js");
    }
  })();

  gifScriptPromise.catch(() => {
    gifScriptPromise = null;
  });

  return gifScriptPromise;
}

function setActionButtonLoading(button, isLoading, text) {
  if (!button) return;
  if (isLoading) {
    button.classList.add("is-loading");
    button.disabled = true;
    button.textContent = text || "Rendering...";
    button.setAttribute("aria-busy", "true");
    return;
  }

  button.classList.remove("is-loading");
  button.disabled = false;
  button.removeAttribute("aria-busy");
}

function setGifButtonLoading(isLoading, text) {
  setActionButtonLoading(dom.exportGifBtn, isLoading, text || "Rendering GIF...");
}

function toSvgMatrix(transformValue) {
  if (!transformValue || transformValue === "none") return "matrix(1 0 0 1 0 0)";
  return transformValue.replace(/,\s*/g, " ");
}

function parseHexColor(hexColor) {
  const hex = String(hexColor || "").trim();
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!match) return { r: 41, g: 242, b: 255 };
  const raw = match[1].length === 3
    ? match[1].split("").map((char) => char + char).join("")
    : match[1];
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  };
}

function mixWithWhiteRgb(hexColor, ratio) {
  const { r, g, b } = parseHexColor(hexColor);
  const amount = Math.max(0, Math.min(1, ratio));
  const mr = Math.round(r * (1 - amount) + 255 * amount);
  const mg = Math.round(g * (1 - amount) + 255 * amount);
  const mb = Math.round(b * (1 - amount) + 255 * amount);
  return `rgb(${mr}, ${mg}, ${mb})`;
}

function getLightMatteKeyRgb(hexColor) {
  const { r, g, b } = parseHexColor(hexColor);
  const mix = 0.9;
  return {
    r: Math.round(r * (1 - mix) + 255 * mix),
    g: Math.round(g * (1 - mix) + 255 * mix),
    b: Math.round(b * (1 - mix) + 255 * mix),
  };
}

function rgbToTransparentInt(rgb) {
  return ((rgb.r & 255) << 16) | ((rgb.g & 255) << 8) | (rgb.b & 255);
}

function buildFrameSvgMarkup(root, config, squareSize) {
  const leftJitter = root.querySelector(".eye-left-jitter");
  const rightJitter = root.querySelector(".eye-right-jitter");
  const leftMotion = root.querySelector(".eye-left");
  const rightMotion = root.querySelector(".eye-right");
  const leftShape = leftMotion.querySelector(".eye-shape");
  const rightShape = rightMotion.querySelector(".eye-shape");
  const leftSmile = leftMotion.querySelector(".eye-smile");
  const rightSmile = rightMotion.querySelector(".eye-smile");
  const leftHighlight = leftMotion.querySelector(".eye-highlight");
  const rightHighlight = rightMotion.querySelector(".eye-highlight");

  const leftJitterTransform = toSvgMatrix(getComputedStyle(leftJitter).transform);
  const rightJitterTransform = toSvgMatrix(getComputedStyle(rightJitter).transform);
  const leftMotionTransform = toSvgMatrix(getComputedStyle(leftMotion).transform);
  const rightMotionTransform = toSvgMatrix(getComputedStyle(rightMotion).transform);

  const shapeFill = config.color;
  const highlightFill = mixWithWhiteRgb(config.color, 0.45);
  const highlightOpacity = Number(getComputedStyle(leftHighlight).opacity || 1).toFixed(2);
  const leftShapeDisplay = getComputedStyle(leftShape).display === "none" ? "none" : "inline";
  const rightShapeDisplay = getComputedStyle(rightShape).display === "none" ? "none" : "inline";
  const leftSmileDisplay = getComputedStyle(leftSmile).display === "none" ? "none" : "inline";
  const rightSmileDisplay = getComputedStyle(rightSmile).display === "none" ? "none" : "inline";
  const leftHighlightDisplay = getComputedStyle(leftHighlight).display === "none" ? "none" : "inline";
  const rightHighlightDisplay = getComputedStyle(rightHighlight).display === "none" ? "none" : "inline";

  // Keep export framing tied to the actual SVG scene (viewBox 320x140),
  // so custom admin panel sizes do not shift content to a corner.
  const sceneWidth = 320;
  const sceneHeight = 140;
  const scale = squareSize / Math.max(sceneWidth, sceneHeight);
  const scaledWidth = sceneWidth * scale;
  const scaledHeight = sceneHeight * scale;
  const offsetX = (squareSize - scaledWidth) / 2;
  const offsetY = (squareSize - scaledHeight) / 2;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${squareSize}" height="${squareSize}" viewBox="0 0 ${squareSize} ${squareSize}" preserveAspectRatio="xMidYMid meet">
  <g transform="translate(${offsetX} ${offsetY}) scale(${scale})" shape-rendering="geometricPrecision">
    <g transform="translate(78 30)">
      <g transform="${leftJitterTransform}">
        <g transform="${leftMotionTransform}">
          <rect width="64" height="80" rx="22" fill="${shapeFill}" display="${leftShapeDisplay}" />
          <path d="M10 30 C10 16 20 8 32 8 C44 8 54 16 54 30 C48 24 40 22 32 22 C24 22 16 24 10 30 Z" fill="${shapeFill}" display="${leftSmileDisplay}" />
          <rect x="9" y="8" width="16" height="10" rx="5" fill="${highlightFill}" opacity="${highlightOpacity}" display="${leftHighlightDisplay}" />
        </g>
      </g>
    </g>
    <g transform="translate(178 30)">
      <g transform="${rightJitterTransform}">
        <g transform="${rightMotionTransform}">
          <rect width="64" height="80" rx="22" fill="${shapeFill}" display="${rightShapeDisplay}" />
          <path d="M10 30 C10 16 20 8 32 8 C44 8 54 16 54 30 C48 24 40 22 32 22 C24 22 16 24 10 30 Z" fill="${shapeFill}" display="${rightSmileDisplay}" />
          <rect x="9" y="8" width="16" height="10" rx="5" fill="${highlightFill}" opacity="${highlightOpacity}" display="${rightHighlightDisplay}" />
        </g>
      </g>
    </g>
  </g>
</svg>`;
}

function svgToImage(svgMarkup) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Frame rendering failed."));
    };
    image.src = url;
  });
}

function waitMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function cleanupKeyColorPixels(context, width, height, keyRgb) {
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3] / 255;

    if (alpha < 0.2) {
      data[index] = keyRgb.r;
      data[index + 1] = keyRgb.g;
      data[index + 2] = keyRgb.b;
      data[index + 3] = 255;
      continue;
    }

    if (alpha < 0.92) {
      const matteBlend = Math.min(1, (1 - alpha) * 0.75);
      data[index] = Math.round(red * (1 - matteBlend) + keyRgb.r * matteBlend);
      data[index + 1] = Math.round(green * (1 - matteBlend) + keyRgb.g * matteBlend);
      data[index + 2] = Math.round(blue * (1 - matteBlend) + keyRgb.b * matteBlend);
    }

    const dr = red - keyRgb.r;
    const dg = green - keyRgb.g;
    const db = blue - keyRgb.b;
    const distanceSq = dr * dr + dg * dg + db * db;
    if (distanceSq < 2400) {
      data[index] = keyRgb.r;
      data[index + 1] = keyRgb.g;
      data[index + 2] = keyRgb.b;
    }

    data[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
}

async function renderTransparentGifBlob(config, root, onStatus) {
  await loadGifLibrary();

  const size = 640;
  const renderSize = 960;
  const fps = 22;
  const frameDelay = Math.round(1000 / fps);
  const cycleDuration = config.sequence.reduce((sum, id) => sum + getDurationForEmotion(id, config.speed), 0);
  const captureDuration = Math.min(4400, Math.max(2800, cycleDuration));
  const frameCount = Math.min(96, Math.max(48, Math.round((captureDuration / 1000) * fps)));

  const workerScriptPath = getGifWorkerScriptPath();
  const keyRgb = getLightMatteKeyRgb(config.color);
  const transparentKey = rgbToTransparentInt(keyRgb);
  const matteFill = `rgb(${keyRgb.r}, ${keyRgb.g}, ${keyRgb.b})`;
  const gif = new window.GIF({
    workers: 1,
    quality: 2,
    width: size,
    height: size,
    transparent: transparentKey,
    dither: false,
    workerScript: workerScriptPath,
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });

  const renderCanvas = document.createElement("canvas");
  renderCanvas.width = renderSize;
  renderCanvas.height = renderSize;
  const renderContext = renderCanvas.getContext("2d", { alpha: true, willReadFrequently: true });

  for (let index = 0; index < frameCount; index += 1) {
    const frameSvg = buildFrameSvgMarkup(root, config, size);
    const image = await svgToImage(frameSvg);
    renderContext.fillStyle = matteFill;
    renderContext.fillRect(0, 0, renderSize, renderSize);
    renderContext.drawImage(image, 0, 0, renderSize, renderSize);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.fillStyle = matteFill;
    context.fillRect(0, 0, size, size);
    context.drawImage(renderCanvas, 0, 0, size, size);

    cleanupKeyColorPixels(context, size, size, keyRgb);

    gif.addFrame(canvas, { copy: true, delay: frameDelay });
    if (onStatus) onStatus(`Capturing ${index + 1}/${frameCount}...`);
    await waitMs(frameDelay);
  }

  if (onStatus) onStatus("Encoding GIF...");

  const gifBlob = await new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      try {
        gif.abort();
      } catch (error) {
        // Ignore abort failures.
      }
      reject(new Error("GIF rendering timed out."));
    }, 70000);

    gif.on("progress", (ratio) => {
      const percent = Math.max(1, Math.min(99, Math.round(ratio * 100)));
      if (onStatus) onStatus(`Encoding ${percent}%...`);
    });

    gif.on("finished", (blob) => {
      window.clearTimeout(timeoutId);
      resolve(blob);
    });

    gif.on("abort", () => {
      window.clearTimeout(timeoutId);
      reject(new Error("GIF rendering aborted."));
    });

    gif.render();
  });

  return gifBlob;
}

async function exportTransparentGif() {
  const config = lastEffectiveConfig || getEffectiveConfig(state);
  const root = dom.previewMount.querySelector(".robot-eyes");
  if (!root) {
    popNotice("Preview is not ready.");
    return;
  }

  const previousLabel = dom.exportGifBtn.textContent;
  setGifButtonLoading(true, "Rendering GIF...");

  try {
    const gifBlob = await renderTransparentGifBlob(config, root, (message) => {
      setGifButtonLoading(true, message);
    });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const url = URL.createObjectURL(gifBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `robot-eye-loop-${stamp}.gif`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    const sizeMb = (gifBlob.size / (1024 * 1024)).toFixed(2);
    popNotice(`Transparent GIF exported (${sizeMb} MB).`);
  } catch (error) {
    popNotice("GIF export failed. Check browser network permissions.");
  } finally {
    setGifButtonLoading(false);
    dom.exportGifBtn.textContent = previousLabel;
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    popNotice("Code copied to clipboard.");
  } catch (error) {
    popNotice("Clipboard permission was blocked by the browser.");
  }
}

function popNotice(message) {
  const el = document.createElement("div");
  el.className = "copy-pop";
  el.textContent = message;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 1300);
}

function bindTimelineDnD() {
  if (timelineSortable) {
    timelineSortable.destroy();
    timelineSortable = null;
  }

  // Setup timeline reordering with Sortable
  timelineSortable = Sortable.create(dom.timelineList, {
    animation: 180,
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    handle: ".timeline-grip",
    draggable: ".timeline-item",
    ghostClass: "timeline-ghost",
    chosenClass: "timeline-chosen",
    dragClass: "timeline-dragging",
    fallbackTolerance: 3,
    onEnd: () => {
      const nextSequence = [...dom.timelineList.querySelectorAll(".timeline-item")].map((item) => item.dataset.id || "neutral");
      state.sequence = sanitizeSequence(nextSequence);
      markCustomProfile();
      refreshAll();
    },
  });

  // Add emotion to timeline via + button click (using delegation, attach once)
  if (!dom.emotionChecklist._clickListenerAttached) {
    dom.emotionChecklist.addEventListener("click", (event) => {
      const addBtn = event.target.closest(".emotion-add");
      if (!addBtn) return;
      
      const emotionId = addBtn.dataset.emotionId;
      if (!emotionId || !EMOTIONS.find((e) => e.id === emotionId)) return;
      
      state.sequence = [...state.sequence, emotionId];
      state.sequence = sanitizeSequence(state.sequence);
      markCustomProfile();
      refreshAll();
    });

    dom.emotionChecklist.addEventListener("click", (event) => {
      if (event.target.closest(".emotion-add")) return;
      const item = event.target.closest(".emotion-item");
      if (!item) return;
      const emotionId = item.dataset.emotionId;
      if (!emotionId || !emotionExists(emotionId)) return;
      previewEmotionOnly(emotionId);
    });
    dom.emotionChecklist._clickListenerAttached = true;
  }

  // Timeline item selection (using delegation, attach once)
  if (!dom.timelineList._clickListenerAttached) {
    dom.timelineList.addEventListener("click", (event) => {
      const removeBtn = event.target.closest(".timeline-remove");
      if (removeBtn) {
        const item = removeBtn.closest(".timeline-item");
        if (!item) return;
        const index = Number(item.dataset.index);
        removeTimelineItem(index);
        return;
      }

      if (event.target.closest(".timeline-grip")) return;

      const item = event.target.closest(".timeline-item");
      if (!item) return;

      const index = Number(item.dataset.index);
      selectedTimelineIndex = selectedTimelineIndex === index ? -1 : index;
      renderTimeline();
    });
    dom.timelineList._clickListenerAttached = true;
  }

  // Deselect on document click (attach once)
  if (!document._timelinePointerListenerAttached) {
    document.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".timeline-item")) return;
      if (selectedTimelineIndex === -1) return;
      selectedTimelineIndex = -1;
      renderTimeline();
    });
    document._timelinePointerListenerAttached = true;
  }
}

function bindInputs() {
  dom.widthInput.addEventListener("input", (event) => {
    state.width = Number(event.target.value) || 320;
    markCustomProfile();
    refreshAll();
  });

  dom.heightInput.addEventListener("input", (event) => {
    state.height = Number(event.target.value) || 140;
    markCustomProfile();
    refreshAll();
  });

  dom.eyeScaleInput.addEventListener("input", (event) => {
    state.eyeScale = parseFloat(event.target.value) || 1;
    dom.eyeScaleValue.textContent = `${state.eyeScale.toFixed(1)}x`;
    markCustomProfile();
    refreshAll();
  });

  dom.colorInput.addEventListener("input", (event) => {
    state.color = event.target.value;
    markCustomProfile();
    refreshAll();
  });

  dom.glowInput.addEventListener("input", (event) => {
    state.glow = Number(event.target.value);
    markCustomProfile();
    refreshAll();
  });

  dom.speedInput.addEventListener("input", (event) => {
    state.speed = Number(event.target.value) || 1;
    markCustomProfile();
    refreshAll();
  });

  dom.blinkToggle.addEventListener("change", (event) => {
    state.autoBlink = event.target.checked;
    markCustomProfile();
    refreshAll();
  });

  dom.glanceToggle.addEventListener("change", (event) => {
    state.ambientGlance = event.target.checked;
    markCustomProfile();
    refreshAll();
  });

  dom.glanceChanceInput.addEventListener("input", (event) => {
    state.glanceChance = Number(event.target.value) || 0;
    markCustomProfile();
    refreshAll();
  });

  dom.saccadeToggle.addEventListener("change", (event) => {
    state.saccadeEnabled = event.target.checked;
    markCustomProfile();
    refreshAll();
  });

  dom.saccadeInput.addEventListener("input", (event) => {
    state.saccadeIntensity = Number(event.target.value) || 0;
    markCustomProfile();
    refreshAll();
  });

  dom.logoModeToggle.addEventListener("change", (event) => {
    state.logoMode = event.target.checked;
    markCustomProfile();
    refreshAll();
  });

  dom.profileSelect.addEventListener("change", (event) => {
    const value = event.target.value;
    if (value === "custom") {
      markCustomProfile();
      refreshAll();
      return;
    }
    applyProfile(value);
  });

  dom.emotionChecklist.addEventListener("change", () => {
    setSequenceFromChecklist();
    markCustomProfile();
    refreshAll();
  });

  dom.copyCodeBtn.addEventListener("click", () => {
    const config = lastEffectiveConfig || getEffectiveConfig(state);
    copyText(getFullEmbedCode(config));
  });

  dom.copyCssBtn.addEventListener("click", () => {
    const config = lastEffectiveConfig || getEffectiveConfig(state);
    copyText(getCssJsCode(config));
  });

  dom.exportGifBtn.addEventListener("click", async () => {
    await exportTransparentGif();
  });

  dom.exportPresetBtn.addEventListener("click", () => {
    exportPresetJson();
    popNotice("Preset JSON exported.");
  });

  dom.importPresetBtn.addEventListener("click", () => {
    dom.importPresetFile.click();
  });

  dom.importPresetFile.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      applyImportedConfig(parsed);
      refreshAll();
      popNotice("Preset JSON imported.");
    } catch (error) {
      popNotice("Invalid preset JSON file.");
    } finally {
      event.target.value = "";
    }
  });
}

renderChecklist();
bindTimelineDnD();
bindInputs();
refreshAll();
