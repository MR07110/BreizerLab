/* ═══════════════════════════════════════════════
   BezierLab Pro — script.js
   All features: localStorage, undo/redo, live inputs,
   code parsing, compare, export, cheatsheet, presets
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ──────────────────────────────────────────────
  // 0. DOM REFS
  // ──────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // SVG
  const svg = $('#bezierCanvas');
  const curvePath = $('#curvePath');
  const areaPath = $('#areaPath');
  const lineP1 = $('#lineP1');
  const lineP2 = $('#lineP2');
  const handleP1 = $('#handleP1');
  const handleP2 = $('#handleP2');
  const gridGroup = $('#gridGroup');
  const labelGroup = $('#labelGroup');
  const lblP1g = $('#lblP1g');
  const lblP2g = $('#lblP2g');
  const lblP1tx = $('#lblP1tx');
  const lblP2tx = $('#lblP2tx');
  const lblP1bg = $('#lblP1bg');
  const lblP2bg = $('#lblP2bg');
  const svgTooltip = $('#svgTooltip');
  const ttTx = $('#ttTx');
  const ttBg = $('#ttBg');
  const cmpPath2 = $('#cmpPath2');
  const cmpPath3 = $('#cmpPath3');

  // Header
  const codeInput = $('#codeInput');
  const codeInputBadge = $('#codeInputBadge');
  const undoBtn = $('#undoBtn');
  const redoBtn = $('#redoBtn');
  const resetAllBtn = $('#resetAllBtn');
  const themeToggle = $('#themeToggle');

  // Editor toolbar
  const zoomLevelEl = $('#zoomLevel');
  const coordDisplay = $('#coordDisplay');
  const gridToggleBtn = $('#gridToggleBtn');
  const snapToggleBtn = $('#snapToggleBtn');
  const compareToggleBtn = $('#compareToggleBtn');

  // Code bar
  const codeDisplay = $('#codeDisplay');
  const copyMainBtn = $('#copyMainBtn');

  // Preview
  const animBall = $('#animBall');
  const animBox = $('#animBox');
  const progressBar = $('#progressBar');
  const track1 = $('#track1');
  const track2 = $('#track2');
  const timeDisplay = $('#timeDisplay');
  const durationInput = $('#durationInput');
  const autoLoopCheck = $('#autoLoopCheck');
  const manualSlider = $('#manualSlider');
  const easingOverlay = $('#easingOverlay');

  // Right panel inputs
  const inputX1 = $('#inputX1');
  const inputY1 = $('#inputY1');
  const inputX2 = $('#inputX2');
  const inputY2 = $('#inputY2');
  const sldX1 = $('#sldX1');
  const sldY1 = $('#sldY1');
  const sldX2 = $('#sldX2');
  const sldY2 = $('#sldY2');
  const rvX1 = $('#rvX1');
  const rvY1 = $('#rvY1');
  const rvX2 = $('#rvX2');
  const rvY2 = $('#rvY2');
  const velocityCanvas = $('#velocityCanvas');

  // Compare
  const cmpVal1 = $('#cmpVal1');
  const cmpInput2 = $('#cmpInput2');
  const cmpInput3 = $('#cmpInput3');
  const ctBall1 = $('#ctBall1');
  const ctBall2 = $('#ctBall2');
  const ctBall3 = $('#ctBall3');
  const showCompareChk = $('#showCompareChk');
  const compareLinesChk = $('#compareLinesChk');

  // Presets
  const pgStandard = $('#pgStandard');
  const pgMaterial = $('#pgMaterial');
  const pgAdvanced = $('#pgAdvanced');
  const pgCustom = $('#pgCustom');
  const historyList = $('#historyList');

  // Tools
  const selectorInp = $('#selectorInp');
  const propertyInp = $('#propertyInp');
  const codeOut = $('#codeOut');
  const coText = $('#coText');
  const coTitle = $('#coTitle');
  const perfModeChk = $('#perfModeChk');
  const labelsChk = $('#labelsChk');
  const areaChk = $('#areaChk');
  const glowChk = $('#glowChk');

  // Modals
  const cheatsheetModal = $('#cheatsheetModal');
  const cheatsheetGrid = $('#cheatsheetGrid');
  const customPresetModal = $('#customPresetModal');
  const presetNameInp = $('#presetNameInp');
  const presetPreviewVals = $('#presetPreviewVals');

  // Toast
  const toast = $('#toast');

  // ──────────────────────────────────────────────
  // 1. STATE
  // ──────────────────────────────────────────────
  const SVG_SIZE = 400;
  const Y0 = 360;
  const Y1 = 40;
  const YR = Y0 - Y1;

  let current = { x1: 0.3, y1: 0.58, x2: 0.7, y2: 0.42 };
  let compareCurves = { c2: null, c3: null };
  let historyStack = [];
  let historyPos = -1;
  const MAX_HISTORY = 80;
  let customPresets = [];
  let animId = null;
  let animStart = 0;
  let isPaused = false;
  let pausedT = 0;
  let duration = 2.0;
  let zoom = 1;
  let showGrid = true;
  let snapEnabled = false;
  let compareMode = false;
  let showLabels = true;
  let showArea = true;
  let showGlow = true;
  let showCompareLines = true;
  const presets = {};

  // ──────────────────────────────────────────────
  // 2. UTILS
  // ──────────────────────────────────────────────
  function bezierToSvg(x, y) {
    return { cx: x * SVG_SIZE, cy: Y0 - y * YR };
  }

  function svgToBezier(cx, cy) {
    return {
      x: Math.min(1, Math.max(0, cx / SVG_SIZE)),
      y: Math.min(2.5, Math.max(-1.5, (Y0 - cy) / YR)),
    };
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function bezierCode(x1, y1, x2, y2) {
    return `cubic-bezier(${x1.toFixed(3)}, ${y1.toFixed(3)}, ${x2.toFixed(3)}, ${y2.toFixed(3)})`;
  }

  function parseBezier(str) {
    const m = str.match(
      /cubic-bezier\s*\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/i
    );
    if (!m) return null;
    return {
      x1: clamp(parseFloat(m[1]), 0, 1),
      y1: parseFloat(m[2]),
      x2: clamp(parseFloat(m[3]), 0, 1),
      y2: parseFloat(m[4]),
    };
  }

  // ──────────────────────────────────────────────
  // 3. CUBIC BEZIER MATH
  // ──────────────────────────────────────────────
  function cubicBezierEval(t, x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;

    function sampleX(t) { return ((ax * t + bx) * t + cx) * t; }
    function sampleDerivativeX(t) { return (3 * ax * t + 2 * bx) * t + cx; }

    function solveX(x) {
      let g = x;
      for (let i = 0; i < 8; i++) {
        const v = sampleX(g) - x;
        if (Math.abs(v) < 1e-7) return g;
        const d = sampleDerivativeX(g);
        if (Math.abs(d) < 1e-6) break;
        g -= v / d;
      }
      let t0 = 0, t1 = 1;
      g = x;
      if (g < t0) return t0;
      if (g > t1) return t1;
      while (t0 < t1) {
        const v = sampleX(g);
        if (Math.abs(v - x) < 1e-7) return g;
        if (x > v) t0 = g;
        else t1 = g;
        g = (t1 - t0) * 0.5 + t0;
      }
      return g;
    }
    const st = solveX(t);
    return ((ay * st + by) * st + cy) * st;
  }

  function valueAt(t, c = current) {
    return cubicBezierEval(t, c.x1, c.y1, c.x2, c.y2);
  }

  // ──────────────────────────────────────────────
  // 4. UPDATE ALL UI
  // ──────────────────────────────────────────────
  let updateLock = false;

  function updateUI(source = null) {
    if (updateLock) return;
    updateLock = true;

    const c = current;
    const p1 = bezierToSvg(c.x1, c.y1);
    const p2 = bezierToSvg(c.x2, c.y2);

    handleP1.setAttribute('cx', p1.cx); handleP1.setAttribute('cy', p1.cy);
    handleP2.setAttribute('cx', p2.cx); handleP2.setAttribute('cy', p2.cy);
    lineP1.setAttribute('x2', p1.cx); lineP1.setAttribute('y2', p1.cy);
    lineP2.setAttribute('x2', p2.cx); lineP2.setAttribute('y2', p2.cy);

    const d = `M 0 ${Y0} C ${p1.cx} ${p1.cy}, ${p2.cx} ${p2.cy}, ${SVG_SIZE} ${Y1}`;
    curvePath.setAttribute('d', d);
    if (showArea) {
      areaPath.setAttribute('d', `${d} L ${SVG_SIZE} ${Y0} L 0 ${Y0} Z`);
      areaPath.style.opacity = '0.07';
    } else {
      areaPath.setAttribute('d', '');
      areaPath.style.opacity = '0';
    }

    if (showGlow) curvePath.setAttribute('filter', 'url(#glow)');
    else curvePath.removeAttribute('filter');

    if (showLabels) {
      lblP1g.style.opacity = '1'; lblP2g.style.opacity = '1';
      const pad = 28;
      let lx1 = p1.cx + (p1.cx > SVG_SIZE / 2 ? -pad : pad);
      let ly1 = p1.cy - 16;
      lblP1tx.textContent = `${c.x1.toFixed(3)}, ${c.y1.toFixed(3)}`;
      lblP1bg.setAttribute('x', lx1 - 4);
      lblP1bg.setAttribute('y', ly1 - 12);
      lblP1bg.setAttribute('width', lblP1tx.getComputedTextLength() + 8);
      lblP1bg.setAttribute('height', '18');
      lblP1tx.setAttribute('x', lx1); lblP1tx.setAttribute('y', ly1);

      let lx2 = p2.cx + (p2.cx > SVG_SIZE / 2 ? -pad : pad);
      let ly2 = p2.cy - 16;
      lblP2tx.textContent = `${c.x2.toFixed(3)}, ${c.y2.toFixed(3)}`;
      lblP2bg.setAttribute('x', lx2 - 4);
      lblP2bg.setAttribute('y', ly2 - 12);
      lblP2bg.setAttribute('width', lblP2tx.getComputedTextLength() + 8);
      lblP2bg.setAttribute('height', '18');
      lblP2tx.setAttribute('x', lx2); lblP2tx.setAttribute('y', ly2);
    } else {
      lblP1g.style.opacity = '0'; lblP2g.style.opacity = '0';
    }

    updateCompareCurvesUI();

    const code = bezierCode(c.x1, c.y1, c.x2, c.y2);
    if (source !== 'codeInput') codeInput.value = code;
    codeDisplay.textContent = code;
    codeInputBadge.className = 'ci-badge ok';

    if (source !== 'inputs') {
      inputX1.value = c.x1.toFixed(3); inputY1.value = c.y1.toFixed(3);
      inputX2.value = c.x2.toFixed(3); inputY2.value = c.y2.toFixed(3);
    }
    sldX1.value = c.x1; sldY1.value = c.y1; sldX2.value = c.x2; sldY2.value = c.y2;
    rvX1.textContent = c.x1.toFixed(3); rvY1.textContent = c.y1.toFixed(3);
    rvX2.textContent = c.x2.toFixed(3); rvY2.textContent = c.y2.toFixed(3);

    coordDisplay.textContent = `P1 (${c.x1.toFixed(3)}, ${c.y1.toFixed(3)}) · P2 (${c.x2.toFixed(3)}, ${c.y2.toFixed(3)})`;

    drawVelocityGraph();
    drawEasingOverlay();
    cmpVal1.textContent = code;

    updatePresetActiveStates();
    saveToLocalStorage();
    updateLock = false;
  }

  function updateCompareCurvesUI() {
    const drawCmp = (pathEl, cObj) => {
      if (!cObj || !showCompareLines) {
        pathEl.style.opacity = '0';
        pathEl.setAttribute('d', '');
        return;
      }
      pathEl.style.opacity = '1';
      const p1 = bezierToSvg(cObj.x1, cObj.y1);
      const p2 = bezierToSvg(cObj.x2, cObj.y2);
      pathEl.setAttribute('d', `M 0 ${Y0} C ${p1.cx} ${p1.cy}, ${p2.cx} ${p2.cy}, ${SVG_SIZE} ${Y1}`);
    };
    drawCmp(cmpPath2, compareCurves.c2);
    drawCmp(cmpPath3, compareCurves.c3);
  }

  function updatePresetActiveStates() {
    $$('.pbtn').forEach((btn) => {
      const p = JSON.parse(btn.dataset.preset || '{}');
      const isActive =
        Math.abs(p.x1 - current.x1) < 0.0005 && Math.abs(p.y1 - current.y1) < 0.0005 &&
        Math.abs(p.x2 - current.x2) < 0.0005 && Math.abs(p.y2 - current.y2) < 0.0005;
      btn.classList.toggle('active', isActive);
    });
  }

  // ──────────────────────────────────────────────
  // 5. GRID
  // ──────────────────────────────────────────────
  function drawGrid() {
    gridGroup.innerHTML = '';
    if (!showGrid) return;
    const step = 40 / zoom;
    for (let i = 0; i <= SVG_SIZE; i += step) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', i); line.setAttribute('y1', 0); line.setAttribute('x2', i); line.setAttribute('y2', SVG_SIZE);
      line.setAttribute('class', i % (step * 2) === 0 ? 'grid-maj' : 'grid-min');
      gridGroup.appendChild(line);
    }
    for (let i = 0; i <= SVG_SIZE; i += step) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0); line.setAttribute('y1', i); line.setAttribute('x2', SVG_SIZE); line.setAttribute('y2', i);
      line.setAttribute('class', i % (step * 2) === 0 ? 'grid-maj' : 'grid-min');
      gridGroup.appendChild(line);
    }
  }

  // ──────────────────────────────────────────────
  // 6. VELOCITY & EASING GRAPHS
  // ──────────────────────────────────────────────
  function drawVelocityGraph() {
    const canvas = velocityCanvas;
    const w = canvas.parentElement.clientWidth || 240;
    canvas.width = w; canvas.height = 60;
    const ctx = canvas.getContext('2d'), h = 60;
    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, w, 0);
    const c1 = getComputedStyle(document.documentElement).getPropertyValue('--c1').trim() || '#0ea5e9';
    const c2 = getComputedStyle(document.documentElement).getPropertyValue('--c2').trim() || '#8b5cf6';
    grad.addColorStop(0, c1); grad.addColorStop(1, c2);

    ctx.beginPath(); ctx.strokeStyle = grad; ctx.lineWidth = 1.8;
    for (let i = 0; i <= w; i++) { const t = i / w, val = valueAt(t), x = i, y = h - val * h; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();

    ctx.beginPath(); ctx.strokeStyle = 'rgba(128,128,128,.2)'; ctx.lineWidth = 0.8; ctx.setLineDash([4, 4]);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke(); ctx.setLineDash([]);
  }

  function drawEasingOverlay() {
    const canvas = easingOverlay, parent = canvas.parentElement;
    const w = parent.clientWidth, h = 44;
    canvas.width = w; canvas.height = h;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath(); ctx.strokeStyle = 'rgba(128,128,128,.25)'; ctx.lineWidth = 1.5;
    for (let i = 0; i <= w; i++) { const t = i / w, val = valueAt(t), y = h - val * h; i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y); }
    ctx.stroke();
  }

  // ──────────────────────────────────────────────
  // 7. ANIMATION
  // ──────────────────────────────────────────────
  function stopAnim() { if (animId) cancelAnimationFrame(animId); animId = null; isPaused = false; }

  function startAnim(fromStart = true) {
    stopAnim();
    if (fromStart) { animBall.style.left = '5px'; animBox.style.left = '6px'; animBox.style.transform = 'scale(1)'; animBox.style.opacity = '1'; progressBar.style.width = '0%'; pausedT = 0; }
    const maxLeft1 = track1.clientWidth - 40, maxLeft2 = track2.clientWidth - 28;
    animStart = performance.now() - (fromStart ? 0 : pausedT * duration * 1000);
    isPaused = false;

    function step(now) {
      if (isPaused) return;
      const elapsed = now - animStart;
      if (elapsed >= duration * 1000) {
        animBall.style.left = maxLeft1 + 'px'; animBox.style.left = maxLeft2 + 'px';
        animBox.style.transform = 'scale(1)'; animBox.style.opacity = '1';
        progressBar.style.width = '100%'; timeDisplay.textContent = duration.toFixed(2) + 's';
        manualSlider.value = 1; stopAnim();
        if (autoLoopCheck.checked) setTimeout(() => startAnim(true), 250);
        return;
      }
      const t = elapsed / (duration * 1000), val = valueAt(t);
      animBall.style.left = 5 + val * maxLeft1 + 'px';
      animBox.style.left = 6 + val * maxLeft2 + 'px';
      animBox.style.transform = `scale(${0.3 + val * 0.7})`; animBox.style.opacity = 0.2 + val * 0.8;
      progressBar.style.width = val * 100 + '%'; timeDisplay.textContent = (t * duration).toFixed(2) + 's';
      manualSlider.value = t; pausedT = t;
      animId = requestAnimationFrame(step);
    }
    animId = requestAnimationFrame(step);
  }

  function pauseAnim() { if (animId) { isPaused = true; stopAnim(); } }

  function resetAnim() {
    stopAnim(); animBall.style.left = '5px'; animBox.style.left = '6px';
    animBox.style.transform = 'scale(1)'; animBox.style.opacity = '1';
    progressBar.style.width = '0%'; timeDisplay.textContent = '0.00s';
    manualSlider.value = 0; pausedT = 0;
  }

  // ──────────────────────────────────────────────
  // 8. HISTORY / UNDO-REDO
  // ──────────────────────────────────────────────
  function pushHistory() {
    const copy = { ...current };
    if (historyPos < historyStack.length - 1) historyStack = historyStack.slice(0, historyPos + 1);
    const last = historyStack[historyStack.length - 1];
    if (last && Math.abs(last.x1 - copy.x1) < 0.0005 && Math.abs(last.y1 - copy.y1) < 0.0005 &&
        Math.abs(last.x2 - copy.x2) < 0.0005 && Math.abs(last.y2 - copy.y2) < 0.0005) return;
    historyStack.push(copy);
    if (historyStack.length > MAX_HISTORY) historyStack.shift();
    historyPos = historyStack.length - 1;
    updateUndoRedoButtons(); renderHistoryUI(); saveToLocalStorage();
  }

  function undo() { if (historyPos <= 0) return; historyPos--; current = { ...historyStack[historyPos] }; updateUI('undo'); updateUndoRedoButtons(); renderHistoryUI(); }
  function redo() { if (historyPos >= historyStack.length - 1) return; historyPos++; current = { ...historyStack[historyPos] }; updateUI('redo'); updateUndoRedoButtons(); renderHistoryUI(); }
  function updateUndoRedoButtons() { undoBtn.disabled = historyPos <= 0; redoBtn.disabled = historyPos >= historyStack.length - 1; }

  // ──────────────────────────────────────────────
  // 9. HISTORY UI
  // ──────────────────────────────────────────────
  function renderHistoryUI() {
    const items = historyStack.slice().reverse();
    historyList.innerHTML = items.map((h, i) => `
      <div class="hist-item" data-hidx="${historyStack.length - 1 - i}">
        <div class="hist-mini"><svg viewBox="0 0 40 20"><path d="M0 18 C${(h.x1*40)} ${18-h.y1*16} ${(h.x2*40)} ${18-h.y2*16} 40 2" stroke="var(--acc)" stroke-width="1.5" fill="none"/></svg></div>
        <span class="hist-vals">${h.x1.toFixed(2)},${h.y1.toFixed(2)} ${h.x2.toFixed(2)},${h.y2.toFixed(2)}</span>
        <button class="hist-del" data-hdel="${historyStack.length - 1 - i}" title="Delete">✕</button>
      </div>`).join('');

    historyList.querySelectorAll('.hist-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.hist-del')) return;
        const idx = parseInt(el.dataset.hidx);
        if (!isNaN(idx) && historyStack[idx]) { historyPos = idx; current = { ...historyStack[idx] }; updateUI('history'); updateUndoRedoButtons(); renderHistoryUI(); }
      });
    });
    historyList.querySelectorAll('.hist-del').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); const idx = parseInt(btn.dataset.hdel);
        if (!isNaN(idx)) { historyStack.splice(idx, 1); if (historyPos >= historyStack.length) historyPos = historyStack.length - 1; if (historyPos < 0) historyPos = -1; updateUndoRedoButtons(); renderHistoryUI(); saveToLocalStorage(); }
      });
    });
  }

  // ──────────────────────────────────────────────
  // 10. PRESETS
  // ──────────────────────────────────────────────
  function loadPresets() {
    presets.standard = [
      { name: 'ease', x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 }, { name: 'ease-in', x1: 0.42, y1: 0, x2: 1, y2: 1 },
      { name: 'ease-out', x1: 0, y1: 0, x2: 0.58, y2: 1 }, { name: 'ease-in-out', x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
      { name: 'linear', x1: 0, y1: 0, x2: 1, y2: 1 }, { name: 'step-start', x1: 0, y1: 0, x2: 0, y2: 1 }, { name: 'step-end', x1: 1, y1: 0, x2: 1, y2: 1 }
    ];
    presets.material = [
      { name: 'Standard', x1: 0.4, y1: 0, x2: 0.2, y2: 1 }, { name: 'Decelerate', x1: 0, y1: 0, x2: 0.2, y2: 1 },
      { name: 'Accelerate', x1: 0.4, y1: 0, x2: 1, y2: 1 }, { name: 'Sharp', x1: 0.4, y1: 0, x2: 0.6, y2: 1 }, { name: 'Emphasized', x1: 0.4, y1: 0, x2: 0, y2: 1 }
    ];
    presets.advanced = [
      { name: 'Bounce', x1: 0.68, y1: -0.55, x2: 0.27, y2: 1.55 }, { name: 'Spring', x1: 0.42, y1: 0, x2: 0.58, y2: 1.2 },
      { name: 'Elastic', x1: 0.68, y1: -0.6, x2: 0.32, y2: 1.6 }, { name: 'Smooth', x1: 0.76, y1: 0, x2: 0.24, y2: 1 },
      { name: 'Snappy', x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 }, { name: 'Overshoot', x1: 0.34, y1: 1.4, x2: 0.64, y2: 1 },
      { name: 'Anticipate', x1: 0.68, y1: -0.3, x2: 0.32, y2: 1.3 }
    ];
  }

  function renderPresetGroup(container, items, source) {
    container.innerHTML = items.map((p) =>
      `<button class="pbtn" data-preset='${JSON.stringify(p)}' data-source="${source}">${p.name}${source === 'custom' ? '<span class="pbtn-del" data-del="true">✕</span>' : ''}</button>`
    ).join('');

    if (source === 'custom') {
      container.querySelectorAll('.pbtn-del').forEach((delBtn) => {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const pData = JSON.parse(e.target.closest('.pbtn').dataset.preset);
          customPresets = customPresets.filter((cp) => !(Math.abs(cp.x1 - pData.x1) < 0.0005 && Math.abs(cp.y1 - pData.y1) < 0.0005 && Math.abs(cp.x2 - pData.x2) < 0.0005 && Math.abs(cp.y2 - pData.y2) < 0.0005));
          renderAllPresets(); saveToLocalStorage();
        });
      });
    }
  }

  function renderAllPresets() {
    renderPresetGroup(pgStandard, presets.standard, 'standard');
    renderPresetGroup(pgMaterial, presets.material, 'material');
    renderPresetGroup(pgAdvanced, presets.advanced, 'advanced');
    if (customPresets.length === 0) {
      pgCustom.innerHTML = '<div class="empty-msg"><span>No custom presets yet</span><small>Click + to save</small></div>';
    } else { renderPresetGroup(pgCustom, customPresets, 'custom'); }
    $$('.pbtn').forEach((btn) => {
      btn.addEventListener('click', (e) => { if (e.target.closest('.pbtn-del')) return; const p = JSON.parse(btn.dataset.preset); current = { x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2 }; updateUI('preset'); pushHistory(); resetAnim(); });
    });
    updatePresetActiveStates();
  }

  function addCustomPreset() { presetPreviewVals.textContent = bezierCode(current.x1, current.y1, current.x2, current.y2); presetNameInp.value = ''; customPresetModal.classList.add('open'); presetNameInp.focus(); }

  function saveCustomPreset() {
    const name = presetNameInp.value.trim() || 'Preset ' + (customPresets.length + 1);
    const exists = customPresets.find((p) => Math.abs(p.x1 - current.x1) < 0.0005 && Math.abs(p.y1 - current.y1) < 0.0005 && Math.abs(p.x2 - current.x2) < 0.0005 && Math.abs(p.y2 - current.y2) < 0.0005);
    if (exists) { showToast('Preset already exists!', 'info'); return; }
    customPresets.push({ name, x1: current.x1, y1: current.y1, x2: current.x2, y2: current.y2 });
    renderAllPresets(); saveToLocalStorage(); customPresetModal.classList.remove('open'); showToast('Preset saved! ✓', 'success');
  }

  // ──────────────────────────────────────────────
  // 11. DRAG HANDLERS
  // ──────────────────────────────────────────────
  let activeHandle = null, dragOff = { x: 0, y: 0 };

  function getEventPos(e) {
    const rect = svg.getBoundingClientRect(), sx = SVG_SIZE / rect.width, sy = SVG_SIZE / rect.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX, cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
  }

  function startDrag(h, e) { activeHandle = h; h.classList.add('dragging'); const pos = getEventPos(e); dragOff.x = pos.x - parseFloat(h.getAttribute('cx')); dragOff.y = pos.y - parseFloat(h.getAttribute('cy')); e.preventDefault(); }

  function onDrag(e) { if (!activeHandle) return; const pos = getEventPos(e); let cx = pos.x - dragOff.x, cy = pos.y - dragOff.y; if (snapEnabled) { cx = Math.round(cx / 5) * 5; cy = Math.round(cy / 5) * 5; } const b = svgToBezier(cx, cy); if (activeHandle === handleP1) { current.x1 = b.x; current.y1 = b.y; } else { current.x2 = b.x; current.y2 = b.y; } updateUI('drag'); }

  function stopDrag() { if (activeHandle) { activeHandle.classList.remove('dragging'); pushHistory(); } activeHandle = null; }

  handleP1.addEventListener('mousedown', (e) => startDrag(handleP1, e));
  handleP2.addEventListener('mousedown', (e) => startDrag(handleP2, e));
  handleP1.addEventListener('touchstart', (e) => startDrag(handleP1, e), { passive: false });
  handleP2.addEventListener('touchstart', (e) => startDrag(handleP2, e), { passive: false });
  window.addEventListener('mousemove', onDrag); window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchmove', (e) => { if (activeHandle) { e.preventDefault(); onDrag(e); } }, { passive: false });
  window.addEventListener('touchend', stopDrag);

  // ──────────────────────────────────────────────
  // 12. ZOOM
  // ──────────────────────────────────────────────
  function updateZoom(newZ) { zoom = Math.min(3, Math.max(0.25, newZ)); zoomLevelEl.textContent = Math.round(zoom * 100) + '%'; const vb = SVG_SIZE / zoom, offset = (SVG_SIZE - vb) / 2; svg.setAttribute('viewBox', `${offset} ${offset} ${vb} ${vb}`); drawGrid(); }
  $('#zoomInBtn').addEventListener('click', () => updateZoom(zoom + 0.25));
  $('#zoomOutBtn').addEventListener('click', () => updateZoom(zoom - 0.25));
  $('#resetZoomBtn').addEventListener('click', () => updateZoom(1));

  // ──────────────────────────────────────────────
  // 13. COMPARE MODE
  // ──────────────────────────────────────────────
  function setCompareCurve(num, str) { const parsed = parseBezier(str); if (!parsed) { showToast('Invalid format! Example: cubic-bezier(0.3, 0.5, 0.7, 0.4)', 'error'); return; } if (num === 2) compareCurves.c2 = parsed; else compareCurves.c3 = parsed; updateCompareCurvesUI(); saveToLocalStorage(); }

  function runCompareAnimation() {
    const curves = [current, compareCurves.c2, compareCurves.c3].filter(Boolean);
    const balls = [ctBall1, ctBall2, ctBall3].slice(0, curves.length);
    const tracks = [ctBall1.parentElement, ctBall2.parentElement, ctBall3.parentElement].slice(0, curves.length);
    balls.forEach((b) => { b.style.left = '3px'; });
    const startT = performance.now(), dur = duration * 1000;
    function step(now) { const elapsed = now - startT, t = Math.min(1, elapsed / dur); curves.forEach((c, i) => { const val = cubicBezierEval(t, c.x1, c.y1, c.x2, c.y2), maxL = tracks[i].clientWidth - 22; balls[i].style.left = 3 + val * maxL + 'px'; }); if (t < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  // ──────────────────────────────────────────────
  // 14. CHEATSHEET
  // ──────────────────────────────────────────────
  function openCheatsheet() {
    const all = [...presets.standard.map((p) => ({ ...p, cat: 'CSS' })), ...presets.material.map((p) => ({ ...p, cat: 'Material' })), ...presets.advanced.map((p) => ({ ...p, cat: 'Advanced' })), ...customPresets.map((p) => ({ ...p, cat: 'Custom' }))];
    cheatsheetGrid.innerHTML = all.map((p) => `<div class="cs-card" data-x1="${p.x1}" data-y1="${p.y1}" data-x2="${p.x2}" data-y2="${p.y2}"><span class="cs-name">${p.name} <small>${p.cat}</small></span><svg class="cs-svg" viewBox="0 0 100 40"><path d="M0 36 C${p.x1*100} ${36-p.y1*32} ${p.x2*100} ${36-p.y2*32} 100 4" stroke="var(--acc)" stroke-width="2" fill="none"/></svg><span class="cs-vals">${p.x1.toFixed(2)},${p.y1.toFixed(2)} / ${p.x2.toFixed(2)},${p.y2.toFixed(2)}</span></div>`).join('');
    cheatsheetGrid.querySelectorAll('.cs-card').forEach((card) => { card.addEventListener('click', () => { current = { x1: parseFloat(card.dataset.x1), y1: parseFloat(card.dataset.y1), x2: parseFloat(card.dataset.x2), y2: parseFloat(card.dataset.y2) }; updateUI('cheatsheet'); pushHistory(); resetAnim(); cheatsheetModal.classList.remove('open'); showToast('Curve selected!', 'success'); }); });
    cheatsheetModal.classList.add('open');
  }

  // ──────────────────────────────────────────────
  // 15. EXPORT
  // ──────────────────────────────────────────────
  function getExportText(format) {
    const { x1, y1, x2, y2 } = current, d = duration;
    switch (format) {
      case 'css': return `cubic-bezier(${x1.toFixed(3)}, ${y1.toFixed(3)}, ${x2.toFixed(3)}, ${y2.toFixed(3)})`;
      case 'js': return `// JavaScript easing\nfunction ease(t) {\n  return cubicBezier(t, ${x1.toFixed(3)}, ${y1.toFixed(3)}, ${x2.toFixed(3)}, ${y2.toFixed(3)});\n}`;
      case 'react': return `import { useSpring } from 'react-spring';\n\nuseSpring({\n  config: { duration: ${Math.round(d*1000)}, easing: t => {} }\n});`;
      case 'gsap': return `gsap.to(el, {\n  duration: ${d.toFixed(2)},\n  ease: "cubicBezier(${x1}, ${y1}, ${x2}, ${y2})"\n});`;
      case 'framer': return `<motion.div animate={{ x: 100 }} transition={{ duration: ${d.toFixed(2)}, ease: [${x1}, ${y1}, ${x2}, ${y2}] }} />`;
      case 'swift': return `Animation.timingCurve(${x1}, ${y1}, ${x2}, ${y2}, duration: ${d.toFixed(2)})`;
      case 'keyframes': return `@keyframes anim {\n  from { transform: translateX(0); }\n  to { transform: translateX(100px); }\n}\n.element { animation: anim ${d.toFixed(2)}s cubic-bezier(${x1}, ${y1}, ${x2}, ${y2}); }`;
      case 'transition': return `${selectorInp.value || '.el'} { transition: ${propertyInp.value || 'all'} ${d.toFixed(2)}s cubic-bezier(${x1}, ${y1}, ${x2}, ${y2}); }`;
      default: return '';
    }
  }

  function copyFormat(format) { navigator.clipboard.writeText(getExportText(format)).then(() => showToast(`${format.toUpperCase()} copied! ✓`, 'success')); }
  function copyAllFormats() { const all = ['CSS','JavaScript','React Spring','GSAP','Framer Motion','SwiftUI'].map((n) => `// ${n}\n${getExportText(n.toLowerCase().replace(' ','').includes('react')?'react':n.toLowerCase().replace(' ','').includes('framer')?'framer':n.toLowerCase().replace(' ','').includes('swift')?'swift':n.toLowerCase().replace(' ','').includes('gsap')?'gsap':n.toLowerCase().replace(' ','').includes('java')?'js':'css')}\n`).join('\n'); navigator.clipboard.writeText(all).then(() => showToast('All formats copied! ✓', 'success')); }

  // ──────────────────────────────────────────────
  // 16. URL SHARE
  // ──────────────────────────────────────────────
  function shareUrl() { const p = new URLSearchParams(); p.set('x1', current.x1.toFixed(3)); p.set('y1', current.y1.toFixed(3)); p.set('x2', current.x2.toFixed(3)); p.set('y2', current.y2.toFixed(3)); p.set('d', duration.toFixed(2)); navigator.clipboard.writeText(location.origin+location.pathname+'?'+p).then(() => showToast('URL copied! 📎', 'success')); }
  function loadFromUrl() { const p = new URLSearchParams(location.search); if (p.has('x1')) { current.x1 = clamp(+p.get('x1'), 0, 1); current.y1 = +p.get('y1')||0; current.x2 = clamp(+p.get('x2'), 0, 1); current.y2 = +p.get('y2')||1; if (p.has('d')) duration = clamp(+p.get('d'), .1, 10); durationInput.value = duration.toFixed(2); updateUI('url'); pushHistory(); } }

  // ──────────────────────────────────────────────
  // 17. JSON EXPORT/IMPORT
  // ──────────────────────────────────────────────
  function jsonExport() { const data = { version:'1.0', current:{...current}, duration, customPresets }; const b = new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'bezierlab-preset.json'; a.click(); URL.revokeObjectURL(u); showToast('JSON exported!', 'success'); }
  function jsonImport(file) { const r = new FileReader(); r.onload = (e) => { try { const d = JSON.parse(e.target.result); if (d.current) { current = d.current; updateUI('import'); pushHistory(); resetAnim(); } if (d.duration) { duration = clamp(d.duration, .1, 10); durationInput.value = duration.toFixed(2); } if (d.customPresets) { customPresets = d.customPresets; renderAllPresets(); } saveToLocalStorage(); showToast('JSON imported! ✓', 'success'); } catch(_) { showToast('Invalid JSON!', 'error'); } }; r.readAsText(file); }

  // ──────────────────────────────────────────────
  // 18. LOCALSTORAGE
  // ──────────────────────────────────────────────
  function saveToLocalStorage() { try { localStorage.setItem('bezierlab-pro', JSON.stringify({ current, duration, historyStack, historyPos, customPresets, compareCurves, showCompareLines, theme: document.documentElement.getAttribute('data-theme')||'light' })); } catch(_) {} }
  function loadFromLocalStorage() { try { const r = localStorage.getItem('bezierlab-pro'); if (!r) return false; const d = JSON.parse(r); if (d.current) current = d.current; if (d.duration) duration = clamp(d.duration, .1, 10); if (d.historyStack) historyStack = d.historyStack; if (typeof d.historyPos==='number') historyPos = d.historyPos; if (d.customPresets) customPresets = d.customPresets; if (d.compareCurves) compareCurves = d.compareCurves; if (typeof d.showCompareLines==='boolean') showCompareLines = d.showCompareLines; if (d.theme) document.documentElement.setAttribute('data-theme', d.theme); return true; } catch(_) { return false; } }

  // ──────────────────────────────────────────────
  // 19. TOAST
  // ──────────────────────────────────────────────
  function showToast(msg, type='info') { toast.textContent = msg; toast.className = 'toast '+type+' show'; clearTimeout(toast._t); toast._t = setTimeout(() => toast.className = 'toast', 2000); }

  // ──────────────────────────────────────────────
  // 20. RESET ALL TO DEFAULT
  // ──────────────────────────────────────────────
  function resetAllToDefault() {
    current = { x1: 0.3, y1: 0.58, x2: 0.7, y2: 0.42 };
    duration = 2.0; durationInput.value = '2.00';
    compareCurves = { c2: null, c3: null };
    cmpInput2.value = ''; cmpInput3.value = '';
    historyStack = [{ ...current }]; historyPos = 0;
    showCompareLines = true;
    if (showCompareChk) showCompareChk.checked = true;
    if (compareLinesChk) compareLinesChk.checked = true;
    showGrid = true; gridToggleBtn.dataset.on = 'true'; gridToggleBtn.classList.add('active');
    snapEnabled = false; snapToggleBtn.dataset.on = 'false'; snapToggleBtn.classList.remove('active');
    compareMode = false; compareToggleBtn.dataset.on = 'false'; compareToggleBtn.classList.remove('active');
    showLabels = true; if (labelsChk) labelsChk.checked = true;
    showArea = true; if (areaChk) areaChk.checked = true;
    showGlow = true; if (glowChk) glowChk.checked = true;
    zoom = 1; updateZoom(1);
    stopAnim(); resetAnim();
    updateUI('reset'); renderHistoryUI(); updateUndoRedoButtons();
    drawGrid(); updateCompareCurvesUI(); saveToLocalStorage();
    showToast('All settings reset to default', 'info');
  }

  // ──────────────────────────────────────────────
  // 21. THEME
  // ──────────────────────────────────────────────
  function toggleTheme() { const ct = document.documentElement.getAttribute('data-theme'); document.documentElement.setAttribute('data-theme', ct === 'dark' ? 'light' : 'dark'); saveToLocalStorage(); }

  // ──────────────────────────────────────────────
  // 22. KEYBOARD SHORTCUTS
  // ──────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase(), ctrl = e.ctrlKey || e.metaKey, shift = e.shiftKey;
    if (ctrl && shift && key === 'u') { e.preventDefault(); shareUrl(); return; }
    if (ctrl && shift && key === 'r') { e.preventDefault(); resetAllToDefault(); return; }
    if (ctrl && key === 'z') { e.preventDefault(); undo(); return; }
    if (ctrl && key === 'y') { e.preventDefault(); redo(); return; }
    if (ctrl && key === 'h') { e.preventDefault(); openCheatsheet(); return; }
    if (ctrl && ['1','2','3','4','5','6','7','8'].includes(key)) { e.preventDefault(); copyFormat(['css','js','react','gsap','framer','swift','keyframes','transition'][parseInt(key)-1]); return; }
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (key) {
      case ' ': e.preventDefault(); animId && !isPaused ? pauseAnim() : startAnim(true); break;
      case 'r': resetAnim(); break;
      case 'g': showGrid = !showGrid; gridToggleBtn.dataset.on = showGrid; gridToggleBtn.classList.toggle('active', showGrid); drawGrid(); break;
      case 's': snapEnabled = !snapEnabled; snapToggleBtn.dataset.on = snapEnabled; snapToggleBtn.classList.toggle('active', snapEnabled); break;
      case 'c': compareMode = !compareMode; compareToggleBtn.dataset.on = compareMode; compareToggleBtn.classList.toggle('active', compareMode); updateCompareCurvesUI(); break;
      case 'f': $('#editorContainer').requestFullscreen?.(); break;
      case 't': toggleTheme(); break;
      case 'escape': cheatsheetModal.classList.remove('open'); customPresetModal.classList.remove('open'); break;
    }
  });

  // ──────────────────────────────────────────────
  // 23. EVENT BINDINGS
  // ──────────────────────────────────────────────
  codeInput.addEventListener('input', () => { const v = codeInput.value.trim(); const p = parseBezier(v); if (p) { current = p; updateUI('codeInput'); pushHistory(); resetAnim(); codeInputBadge.className = 'ci-badge ok'; } else if (v === '') { codeInputBadge.className = 'ci-badge'; } else { codeInputBadge.className = 'ci-badge err'; } });
  codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const p = parseBezier(codeInput.value.trim()); if (p) { current = p; updateUI('codeInput'); pushHistory(); resetAnim(); } } });

  const handleLiveInput = () => { current.x1 = clamp(+inputX1.value||0, 0, 1); current.y1 = +inputY1.value||0; current.x2 = clamp(+inputX2.value||0, 0, 1); current.y2 = +inputY2.value||0; updateUI('inputs'); pushHistory(); resetAnim(); };
  [inputX1, inputY1, inputX2, inputY2].forEach((i) => { i.addEventListener('input', handleLiveInput); i.addEventListener('change', handleLiveInput); });

  [sldX1, sldY1, sldX2, sldY2].forEach((s) => { s.addEventListener('input', () => { current.x1 = +sldX1.value; current.y1 = +sldY1.value; current.x2 = +sldX2.value; current.y2 = +sldY2.value; updateUI('sliders'); }); s.addEventListener('change', () => { pushHistory(); resetAnim(); }); });

  $('#playBtn').addEventListener('click', () => startAnim(true));
  $('#pauseBtn').addEventListener('click', pauseAnim);
  $('#resetBtn').addEventListener('click', resetAnim);
  manualSlider.addEventListener('input', () => { stopAnim(); const t = +manualSlider.value, v = valueAt(t), m1 = track1.clientWidth-40, m2 = track2.clientWidth-28; animBall.style.left = 5+v*m1+'px'; animBox.style.left = 6+v*m2+'px'; animBox.style.transform = `scale(${.3+v*.7})`; animBox.style.opacity = .2+v*.8; progressBar.style.width = v*100+'%'; timeDisplay.textContent = (t*duration).toFixed(2)+'s'; pausedT = t; });
  durationInput.addEventListener('change', () => { duration = clamp(+durationInput.value||2, .1, 10); durationInput.value = duration.toFixed(2); resetAnim(); drawEasingOverlay(); saveToLocalStorage(); });

  copyMainBtn.addEventListener('click', () => copyFormat('css'));
  $('#copyAllBtn').addEventListener('click', copyAllFormats);
  $$('.fmtbtn').forEach((b) => b.addEventListener('click', () => copyFormat(b.dataset.fmt)));

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  themeToggle.addEventListener('click', toggleTheme);

  // Reset All
  resetAllBtn.addEventListener('click', () => { if (confirm('Reset all settings to default? This cannot be undone.')) resetAllToDefault(); });

  // Compare checkboxes
  showCompareChk.addEventListener('change', () => { showCompareLines = showCompareChk.checked; if (compareLinesChk) compareLinesChk.checked = showCompareLines; updateCompareCurvesUI(); saveToLocalStorage(); });
  compareLinesChk.addEventListener('change', () => { showCompareLines = compareLinesChk.checked; if (showCompareChk) showCompareChk.checked = showCompareLines; updateCompareCurvesUI(); saveToLocalStorage(); });

  gridToggleBtn.addEventListener('click', () => { showGrid = !showGrid; gridToggleBtn.dataset.on = showGrid; gridToggleBtn.classList.toggle('active', showGrid); drawGrid(); });
  snapToggleBtn.addEventListener('click', () => { snapEnabled = !snapEnabled; snapToggleBtn.dataset.on = snapEnabled; snapToggleBtn.classList.toggle('active', snapEnabled); });
  compareToggleBtn.addEventListener('click', () => { compareMode = !compareMode; compareToggleBtn.dataset.on = compareMode; compareToggleBtn.classList.toggle('active', compareMode); updateCompareCurvesUI(); });

  $('#fullscreenBtn').addEventListener('click', () => $('#editorContainer').requestFullscreen?.());
  $('#urlShareBtn').addEventListener('click', shareUrl);
  $('#jsonExportBtn').addEventListener('click', jsonExport);
  $('#jsonImportBtn').addEventListener('click', () => $('#jsonFileInput').click());
  $('#jsonFileInput').addEventListener('change', (e) => { if (e.target.files[0]) jsonImport(e.target.files[0]); e.target.value = ''; });

  $('#cheatsheetBtn').addEventListener('click', openCheatsheet);
  $('#closeCheatBtn').addEventListener('click', () => cheatsheetModal.classList.remove('open'));
  cheatsheetModal.addEventListener('click', (e) => { if (e.target === cheatsheetModal) cheatsheetModal.classList.remove('open'); });

  $('#addCustomPresetBtn').addEventListener('click', addCustomPreset);
  $('#closePresetModal').addEventListener('click', () => customPresetModal.classList.remove('open'));
  $('#cancelPresetBtn').addEventListener('click', () => customPresetModal.classList.remove('open'));
  customPresetModal.addEventListener('click', (e) => { if (e.target === customPresetModal) customPresetModal.classList.remove('open'); });
  $('#savePresetBtn').addEventListener('click', saveCustomPreset);
  presetNameInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveCustomPreset(); });

  $('#clearHistoryBtn').addEventListener('click', () => { historyStack = [historyStack[historyStack.length-1]||current].filter(Boolean); historyPos = 0; renderHistoryUI(); updateUndoRedoButtons(); saveToLocalStorage(); showToast('History cleared', 'info'); });

  $('#setCmp2Btn').addEventListener('click', () => setCompareCurve(2, cmpInput2.value));
  $('#setCmp3Btn').addEventListener('click', () => setCompareCurve(3, cmpInput3.value));
  cmpInput2.addEventListener('keydown', (e) => { if (e.key === 'Enter') setCompareCurve(2, cmpInput2.value); });
  cmpInput3.addEventListener('keydown', (e) => { if (e.key === 'Enter') setCompareCurve(3, cmpInput3.value); });
  $('#cmpPlayBtn').addEventListener('click', runCompareAnimation);

  $$('.ptab').forEach((t) => t.addEventListener('click', () => { $$('.ptab').forEach((x) => x.classList.remove('active')); t.classList.add('active'); $$('.ptab-content').forEach((x) => x.classList.remove('active')); $(`#ptc-${t.dataset.pt}`)?.classList.add('active'); }));
  $$('.rtab').forEach((t) => t.addEventListener('click', () => { $$('.rtab').forEach((x) => x.classList.remove('active')); t.classList.add('active'); $$('.rtab-content').forEach((x) => x.classList.remove('active')); $(`#rtc-${t.dataset.rt}`)?.classList.add('active'); }));

  $('#genTransBtn').addEventListener('click', () => { coTitle.textContent = 'CSS Transition'; coText.textContent = getExportText('transition'); codeOut.style.display = 'block'; showToast('Code generated!', 'success'); });
  $('#genKfBtn').addEventListener('click', () => { coTitle.textContent = '@keyframes'; coText.textContent = getExportText('keyframes'); codeOut.style.display = 'block'; showToast('Code generated!', 'success'); });
  $('#copyCOBtn').addEventListener('click', () => navigator.clipboard.writeText(coText.textContent).then(() => showToast('Copied!', 'success')));

  perfModeChk.addEventListener('change', () => document.body.classList.toggle('perf-mode', perfModeChk.checked));
  labelsChk.addEventListener('change', () => { showLabels = labelsChk.checked; updateUI('labels'); });
  areaChk.addEventListener('change', () => { showArea = areaChk.checked; updateUI('area'); });
  glowChk.addEventListener('change', () => { showGlow = glowChk.checked; updateUI('glow'); });

  window.addEventListener('resize', () => { drawEasingOverlay(); drawVelocityGraph(); });

  // ──────────────────────────────────────────────
  // 24. INITIALIZATION
  // ──────────────────────────────────────────────
  function init() {
    loadPresets();
    const hasSaved = loadFromLocalStorage();
    durationInput.value = duration.toFixed(2);
    if (!hasSaved) { historyStack = [{ ...current }]; historyPos = 0; }
    if (historyStack.length === 0) { historyStack = [{ ...current }]; historyPos = 0; }
    if (historyPos >= historyStack.length) historyPos = historyStack.length - 1;
    if (historyPos < 0) historyPos = 0;
    if (historyStack.length > 0) current = { ...historyStack[historyPos] };

    if (showCompareChk) showCompareChk.checked = showCompareLines;
    if (compareLinesChk) compareLinesChk.checked = showCompareLines;

    renderAllPresets(); renderHistoryUI(); updateUndoRedoButtons();
    updateUI('init'); drawGrid(); resetAnim(); loadFromUrl();
    updateCompareCurvesUI(); saveToLocalStorage();
  }

  init();

  console.log('🚀 BezierLab Pro v2.0 initialized');
  console.log('   ✓ Reset All (Ctrl+Shift+R)  ✓ Compare On/Off  ✓ Settings override');
})();
