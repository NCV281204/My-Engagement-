const $ = (id) => document.getElementById(id);

const guest = new URLSearchParams(location.search).get("guest") || CONFIG.guest;
$("groom").textContent = $("groom2").textContent = CONFIG.groom;
$("bride").textContent = $("bride2").textContent = CONFIG.bride;
$("guest").textContent = $("gateGuest").textContent = guest;
$("dateCover").textContent = $("dateMain").textContent = dateText;
// Big date, for example ១៦.១០.២០២៦ (works even if config.js is an older copy)
const bigDate = typeof dateShort === "string" ? dateShort : (() => { const [y, m, d] = CONFIG.date.split("-"); return `${kh(d)}.${kh(m)}.${kh(y)}`; })();
$("dateBig").textContent = bigDate;
$("venue").textContent = CONFIG.venue;
$("address").textContent = CONFIG.address;
$("venueBox").hidden = !(CONFIG.venue || CONFIG.address);

// Turn a pasted Google Maps link into a map that can be shown inside the page.
function mapEmbedUrl(link) {
  try {
    if (/google\.[^/]+\/maps\/embed/.test(link)) return link;       // "Embed a map" link: use as is
    const text = (v) => decodeURIComponent(v.replace(/\+/g, " "));
    let m = link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);           // exact pin
    let q = m ? `${m[1]},${m[2]}` : "";
    if (!q && (m = link.match(/\/maps\/place\/([^/@?]+)/))) q = text(m[1]);        // place name
    if (!q && (m = link.match(/[?&](?:q|query|destination|daddr)=([^&#]+)/))) q = text(m[1]);
    if (!q && (m = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/))) q = `${m[1]},${m[2]}`;
    return q ? `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed` : "";
  } catch (e) { return ""; }
}
const embed = mapEmbedUrl(CONFIG.mapLink);
if (embed) { $("mapFrame").src = embed; }
else {
  $("mapFrame").hidden = true; $("mapNote").hidden = false;
  console.warn("Map link not recognised. Short links (maps.app.goo.gl) cannot be shown inside the page.");
}
$("mapLink").href = CONFIG.mapLink;
document.title = `ពិធីភ្ជាប់ពាក្យ ${CONFIG.groom} និង ${CONFIG.bride}`;

// Countdown
const start = new Date(`${CONFIG.date}T${CONFIG.time}:00+07:00`);
function tick() {
  const ms = start - Date.now();
  const box = $("count");
  if (ms <= 0) {                       // the time has come: hide the countdown completely
    box.style.display = "none"; $("countTitle").style.display = "none";
    clearInterval(timer); return;
  }
  const p = [[864e5, "ថ្ងៃ"], [36e5, "ម៉ោង"], [6e4, "នាទី"], [1e3, "វិនាទី"]];
  let rest = ms;
  box.innerHTML = p.map(([u, label], i) => {
    const v = Math.floor(rest / u); rest -= v * u;
    return `<div>${kh(String(v).padStart(2, "0"))}<small>${label}</small></div>`;
  }).join("");
}
const timer = setInterval(tick, 1000);
tick();

// ===== Music =====
// Plays music/music.mp3 (or music.mp3 next to index.html). If neither file is found,
// a built-in music-box tune plays instead, so the invitation is never silent.
const bgm = $("bgm"), mbtn = $("musicBtn");
bgm.volume = 0.7;
let mode = "file", ctx = null, master = null, feedTimer = null, nextStart = 0;
let userPaused = false, resumeLater = false;
const ui = (on) => mbtn.setAttribute("aria-pressed", String(on));
const isPlaying = () => (mode === "file" ? !bgm.paused : !!ctx && ctx.state === "running");
bgm.addEventListener("play", () => ui(true));
bgm.addEventListener("pause", () => { if (mode === "file") ui(false); });

function unlockCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.45; master.connect(ctx.destination);
  }
  ctx.resume();
  return true;
}
// One loop of the tune (about 53 seconds); returns its length in seconds.
function scheduleTune(t0) {
  const eighth = 60 / 72 / 2, pat = [0, 1, 2, 3, 2, 1, 2, 1];
  const chords = { C: [60, 64, 67, 72], G: [55, 59, 62, 67], Am: [57, 60, 64, 69], F: [53, 57, 60, 65] };
  const note = (m, at, vol) => [[1, 1], [2, 0.35]].forEach(([mult, amp]) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 440 * 2 ** ((m - 69) / 12) * mult;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol * amp, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 2.5);
    o.connect(g); g.connect(master); o.start(at); o.stop(at + 2.6);
  });
  ["C", "G", "Am", "F", "C", "G", "F", "G"].forEach((c, ci) => {
    for (let bar = 0; bar < 2; bar++) {
      const b0 = (ci * 2 + bar) * 8, ch = chords[c];
      pat.forEach((idx, k) => note(k === 0 ? ch[idx] - 12 : ch[idx], t0 + (b0 + k) * eighth, k ? 0.2 : 0.28));
      (bar ? [[0, 3], [2, 1], [4, 2], [6, 0]] : [[0, 3], [3, 2], [4, 3], [6, 1]])
        .forEach(([pos, idx]) => note(ch[idx] + 12, t0 + (b0 + pos) * eighth, 0.26));
    }
  });
  return 16 * 8 * eighth;
}
function startSynth() {
  if (!unlockCtx()) return;
  if (mode !== "synth") console.warn("music/music.mp3 was not found, so the built-in tune is playing.");
  mode = "synth"; ui(true);
  if (!nextStart) nextStart = ctx.currentTime + 0.1;
  const feed = () => { while (ctx.state === "running" && ctx.currentTime > nextStart - 4) nextStart += scheduleTune(nextStart); };
  feed();
  if (!feedTimer) feedTimer = setInterval(feed, 500);
}

function play() {
  if (mode === "synth") { startSynth(); return; }
  unlockCtx(); // unlock sound inside the tap, in case the built-in tune is needed
  bgm.play().catch((e) => { if (e.name === "NotSupportedError" || bgm.networkState === 3) startSynth(); });
}
function pause() {
  if (mode === "synth") { ctx.suspend(); ui(false); } else bgm.pause();
}

bgm.play().catch(() => {}); // works only if the browser allows it; the open button below is the reliable start
mbtn.addEventListener("click", () => {
  if (isPlaying()) { userPaused = true; pause(); } else { userPaused = false; play(); }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { resumeLater = isPlaying(); if (resumeLater) pause(); }
  else if (resumeLater && !userPaused) { resumeLater = false; play(); }
});

// ===== Butterflies: they fly out from the button when the invitation opens =====
const WING = '<path d="M50 38C42 4 8 0 6 22c-1 14 24 24 44 18z" style="fill:var(--c1)" stroke="#8a3a3a" stroke-width="1.2"/>' +
  '<path d="M50 42C36 46 14 48 18 64c4 12 28 2 32-18z" style="fill:var(--c1)" stroke="#8a3a3a" stroke-width="1.2"/>' +
  '<circle cx="24" cy="22" r="7" style="fill:var(--c2)" opacity=".75"/><circle cx="30" cy="58" r="5" style="fill:var(--c2)" opacity=".75"/>';
const BUTTERFLY = '<svg viewBox="0 0 100 80" aria-hidden="true"><g class="wl">' + WING + '</g>' +
  '<g transform="translate(100 0) scale(-1 1)"><g class="wr">' + WING + '</g></g>' +
  '<ellipse cx="50" cy="42" rx="2.6" ry="15" fill="#6b2a2a"/>' +
  '<path d="M49 28C46 18 42 14 38 12M51 28C54 18 58 14 62 12" stroke="#6b2a2a" stroke-width="1.2" fill="none"/></svg>';
function releaseButterflies(from) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const layer = document.createElement("div");
  layer.id = "butterflies"; layer.setAttribute("aria-hidden", "true"); document.body.append(layer);
  const palette = [["#f2c84f", "#fff2b3"], ["#e8a0a8", "#fbe3e6"], ["#c76b78", "#f0c3c9"], ["#f6dca0", "#ffffff"], ["#d9a335", "#fff2b3"]];
  const N = 11; let done = 0;
  for (let i = 0; i < N; i++) {
    const size = 34 + Math.random() * 30, [c1, c2] = palette[i % palette.length];
    const el = document.createElement("div");
    el.className = "bf"; el.style.cssText = `width:${size}px;height:${size * 0.8}px;--c1:${c1};--c2:${c2}`;
    el.innerHTML = BUTTERFLY; layer.append(el);
    // path: start at the button, wobble from side to side, leave through the top of the screen
    const sx = from.x - size / 2 + (Math.random() - 0.5) * 60, sy = from.y - size / 2;
    const ex = Math.random() * innerWidth, ey = -120 - Math.random() * 80;
    const amp = 40 + Math.random() * 50, turns = 2 + Math.random() * 2, steps = 24, frames = [];
    let px = sx, py = sy;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps, e = t * t * (3 - 2 * t);
      const x = sx + (ex - sx) * e + Math.sin(t * Math.PI * turns + i) * amp * Math.sin(t * Math.PI);
      const y = sy + (ey - sy) * e;
      const rot = k ? Math.atan2(y - py, x - px) * 180 / Math.PI + 90 : 0;
      frames.push({ transform: `translate(${x}px,${y}px) rotate(${rot}deg)`, opacity: t < 0.06 ? t / 0.06 : t > 0.88 ? (1 - t) / 0.12 : 1, offset: t });
      px = x; py = y;
    }
    const anim = el.animate(frames, { duration: 4200 + Math.random() * 2600, delay: 150 + i * 170, easing: "linear", fill: "both" });
    anim.onfinish = () => { el.remove(); if (++done === N) layer.remove(); };
  }
}

// Open-invitation screen: the tap starts the music.
$("open").addEventListener("click", () => {
  userPaused = false;
  play();
  const r = $("open").getBoundingClientRect();
  releaseButterflies({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  const g = $("gate");
  g.classList.add("open");                    // the two doors slide apart
  document.body.classList.remove("locked");
  document.body.classList.add("revealed");    // starts the cover animation
  window.scrollTo(0, 0);
  setTimeout(() => g.remove(), 1500);
});
$("open").focus();
