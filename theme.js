(function () {
  const body = document.body;

  // ---- Inject top-right controls + palette panel ----
  const controls = document.createElement('div');
  controls.className = 'controls';
  controls.innerHTML = `
    <button class="palette-toggle" id="paletteToggle" aria-label="Color palette" aria-expanded="false">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
      </svg>
    </button>
    <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
      <svg class="theme-icon sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <svg class="theme-icon moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>`;
  body.appendChild(controls);

  const panel = document.createElement('div');
  panel.className = 'palette-panel';
  panel.id = 'palettePanel';
  panel.innerHTML = `
    <div class="palette-grid" id="paletteGrid"></div>
    <div class="palette-actions">
      <button id="paletteReset">RESET</button>
      <button id="paletteRefresh">REFRESH</button>
    </div>`;
  body.appendChild(panel);

  // ---- Color palettes (background + accent pairs) ----
  // dark: true => light overlays/text; dark: false => dark overlays/text
  const PALETTES = [
    { bg: '#000000', accent: '#ffffff', text: '#ffffff', dark: true },  // Black & white (default)
    { bg: '#0d1b2a', accent: '#4cc9f0', text: '#e0e1dd', dark: true },  // Midnight
    { bg: '#0b1d13', accent: '#5fd068', text: '#eaf4e8', dark: true },  // Forest
    { bg: '#1c0f1f', accent: '#c77dff', text: '#f3e8ff', dark: true },  // Plum
    { bg: '#1f120a', accent: '#ff7b54', text: '#ffece4', dark: true },  // Ember
    { bg: '#14171c', accent: '#ffd166', text: '#f0f0f0', dark: true },  // Gold
    { bg: '#ffffff', accent: '#111111', text: '#111111', dark: false }, // White & black
    { bg: '#faf3e0', accent: '#e07a5f', text: '#3d405b', dark: false }, // Cream
    { bg: '#eafbf0', accent: '#2a9d8f', text: '#264653', dark: false }, // Mint
    { bg: '#f3eff7', accent: '#7b5ea7', text: '#2e2a3a', dark: false }, // Lavender
    { bg: '#eef6fb', accent: '#3a86ff', text: '#1d3557', dark: false }, // Sky
    { bg: '#fdeef2', accent: '#d6336c', text: '#3a2e34', dark: false }, // Rose
  ];

  const DEFAULT = PALETTES[0];

  // ---- Color helpers (mirror accent lightness when flipping schemes) ----
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return [h, s, l];
  }
  function hslToRgb(h, s, l) {
    if (s === 0) { const v = l * 255; return [v, v, v]; }
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
  }
  function mirrorLightness(hex) {
    const [r, g, b] = hexToRgb(hex);
    const [h, s, l] = rgbToHsl(r, g, b);
    const [nr, ng, nb] = hslToRgb(h, s, 1 - l);
    return rgbToHex(nr, ng, nb);
  }

  // Flip a scheme to its light/dark inverse: swap bg<->text, mirror accent lightness.
  function invert(s) {
    return { bg: s.text, text: s.bg, accent: mirrorLightness(s.accent), dark: !s.dark };
  }

  // ---- Apply a scheme via inline CSS variables ----
  let state = DEFAULT;

  function applyState(s) {
    state = s;
    const o = s.dark
      ? { card: '0.05', border: '0.1', hover: '0.1', date: '0.6', cBg: '0.1', cBorder: '0.2', cHover: '0.15', base: '255, 255, 255' }
      : { card: '0.03', border: '0.1', hover: '0.05', date: '0.6', cBg: '0.05', cBorder: '0.1', cHover: '0.1', base: '0, 0, 0' };
    const set = (k, v) => body.style.setProperty(k, v);
    set('--bg', s.bg);
    set('--text', s.text);
    set('--accent', s.accent);
    set('--accent-dim', s.accent);
    set('--card-bg', `rgba(${o.base}, ${o.card})`);
    set('--card-border', `rgba(${o.base}, ${o.border})`);
    set('--card-bg-hover', `rgba(${o.base}, ${o.hover})`);
    set('--date', `rgba(${o.base}, ${o.date})`);
    set('--control-bg', `rgba(${o.base}, ${o.cBg})`);
    set('--control-border', `rgba(${o.base}, ${o.cBorder})`);
    set('--control-bg-hover', `rgba(${o.base}, ${o.cHover})`);
    // light-mode class only drives the sun/moon icon swap
    body.classList.toggle('light-mode', !s.dark);
    localStorage.setItem('scheme', JSON.stringify(s));
    markActive();
  }

  function markActive() {
    const idx = PALETTES.findIndex(p =>
      p.bg === state.bg && p.accent === state.accent && p.text === state.text && p.dark === state.dark
    );
    document.querySelectorAll('.swatch').forEach((sw, i) => {
      sw.classList.toggle('active', i === idx);
    });
  }

  // ---- Build swatches ----
  const grid = document.getElementById('paletteGrid');
  PALETTES.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'swatch';
    btn.style.background = `linear-gradient(135deg, ${p.bg} 0 50%, ${p.accent} 50% 100%)`;
    btn.setAttribute('aria-label', `Palette ${i + 1}`);
    btn.addEventListener('click', () => applyState(p));
    grid.appendChild(btn);
  });

  // ---- Restore saved scheme (with migration from the old `theme` key) ----
  let initial = DEFAULT;
  const savedScheme = localStorage.getItem('scheme');
  if (savedScheme) {
    try {
      const s = JSON.parse(savedScheme);
      if (s && s.bg && s.accent && s.text) initial = s;
    } catch (e) { /* ignore malformed */ }
  } else if (localStorage.getItem('theme') === 'light') {
    initial = invert(DEFAULT);
  }
  applyState(initial);

  // ---- Light / dark toggle: flip the CURRENT scheme, don't reset ----
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => applyState(invert(state)));

  // ---- Panel open/close ----
  const paletteToggle = document.getElementById('paletteToggle');
  const palettePanel = document.getElementById('palettePanel');
  paletteToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = palettePanel.classList.toggle('open');
    paletteToggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!palettePanel.contains(e.target) && !paletteToggle.contains(e.target)) {
      palettePanel.classList.remove('open');
      paletteToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // ---- RESET -> default black & white; REFRESH -> random palette ----
  document.getElementById('paletteReset').addEventListener('click', () => applyState(DEFAULT));
  document.getElementById('paletteRefresh').addEventListener('click', () => {
    const i = Math.floor(Math.random() * PALETTES.length);
    applyState(PALETTES[i]);
  });
})();
