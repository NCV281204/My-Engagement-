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
// If no music file can be loaded, the built-in tune plays instead. Without this check the browser keeps waiting
// for the missing file: the music button looks "on" but nothing is heard.
let fileMissing = false, tapped = false;
const noFile = () => { fileMissing = true; if (tapped && !userPaused && mode === "file") startSynth(); };
(bgm.querySelector("source:last-of-type") || bgm).addEventListener("error", noFile);
bgm.addEventListener("error", noFile);

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
  if (mode === "synth" || fileMissing || bgm.networkState === 3) { startSynth(); return; }
  unlockCtx(); // unlock sound inside the tap, in case the built-in tune is needed
  bgm.play().catch((e) => {
    if (e.name === "NotSupportedError" || bgm.networkState === 3) { startSynth(); return; }   // no music file found: built-in tune
    if (e.name === "NotAllowedError") {                                                        // the browser blocked it: try again on the next touch
      const retry = () => { if (!userPaused && !isPlaying()) play(); };
      ["pointerdown", "touchend", "keydown"].forEach((t) => addEventListener(t, retry, { once: true, passive: true }));
    }
  });
}
function pause() {
  if (mode === "synth") { ctx.suspend(); ui(false); } else bgm.pause();
}

// The music never starts by itself: it starts only when the guest taps the open button (see the gate section below).
mbtn.addEventListener("click", () => {
  if (isPlaying()) { userPaused = true; pause(); } else { userPaused = false; play(); }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { resumeLater = isPlaying(); if (resumeLater) pause(); }
  else if (resumeLater && !userPaused) { resumeLater = false; play(); }
});

// ===== Butterfly drawing (used by the white blurred butterflies below) =====
const WING = '<path d="M50 38C42 4 8 0 6 22c-1 14 24 24 44 18z" style="fill:var(--c1)" stroke="#8a3a3a" stroke-width="1.2"/>' +
  '<path d="M50 42C36 46 14 48 18 64c4 12 28 2 32-18z" style="fill:var(--c1)" stroke="#8a3a3a" stroke-width="1.2"/>' +
  '<circle cx="24" cy="22" r="7" style="fill:var(--c2)" opacity=".75"/><circle cx="30" cy="58" r="5" style="fill:var(--c2)" opacity=".75"/>';
const BUTTERFLY = '<svg viewBox="0 0 100 80" aria-hidden="true"><g class="wl">' + WING + '</g>' +
  '<g transform="translate(100 0) scale(-1 1)"><g class="wr">' + WING + '</g></g>' +
  '<ellipse cx="50" cy="42" rx="2.6" ry="15" fill="#6b2a2a"/>' +
  '<path d="M49 28C46 18 42 14 38 12M51 28C54 18 58 14 62 12" stroke="#6b2a2a" stroke-width="1.2" fill="none"/></svg>';
// ===== Cover: golden sparkles that keep falling softly =====
(function () {
  const box = document.querySelector(".dust");
  if (!box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#fff8dc", "#ffe9a0", "#ffffff", "#f6d77a"];
  for (let i = 0; i < 22; i++) {
    const p = document.createElement("i");
    if (i % 3 === 0) p.className = "st";                      // every third one is a little star
    p.style.cssText = `--x:${(Math.random() * 100).toFixed(1)}%;--s:${(6 + Math.random() * 12).toFixed(0)}px;` +
      `--d:${(9 + Math.random() * 9).toFixed(1)}s;--dl:${(-Math.random() * 16).toFixed(1)}s;` +
      `--sw:${(Math.random() * 60 - 30).toFixed(0)}px;--c:${colors[i % colors.length]}`;
    box.append(p);
  }
})();

// ===== Photos: each one floats in when it scrolls into view =====
const photoObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); photoObserver.unobserve(e.target); }
    }), { threshold: 0.15 })
  : null;
document.querySelectorAll(".gallery figure").forEach((f) => photoObserver ? photoObserver.observe(f) : f.classList.add("in"));

// ===== White blurred butterflies: soft, out-of-focus butterflies that keep drifting up the screen =====
const BUTTERFLY_W = BUTTERFLY.replace(/#8a3a3a/g, "#ffffff").replace(/#6b2a2a/g, "#f3dede");
function whiteButterflies() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || $("whitebf")) return;
  const layer = document.createElement("div");
  layer.id = "whitebf"; layer.setAttribute("aria-hidden", "true"); document.body.append(layer);
  // different blur = different distance; phones with 4 CPU cores or fewer get 5 butterflies instead of 9, to keep the scrolling smooth
  const blurs = [1.5, 3, 5, 2, 4, 6, 2.5, 3.5, 5].slice(0, (navigator.hardwareConcurrency || 8) <= 4 ? 5 : 9);
  const fly = (el, i, first) => {
    const w = innerWidth, h = innerHeight, size = +el.dataset.size, op = +el.dataset.op;
    const sx = Math.random() * w - size / 2, sy = h + 40 + Math.random() * 80;       // start below the screen
    const ex = Math.random() * w - size / 2, ey = -size - 80 - Math.random() * 80;    // leave through the top
    const amp = 50 + Math.random() * 70, turns = 2 + Math.random() * 2.5, steps = 28, frames = [];
    let px = sx, py = sy;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const x = sx + (ex - sx) * t + Math.sin(t * Math.PI * turns + i) * amp * Math.sin(t * Math.PI);
      const y = sy + (ey - sy) * t;
      const rot = k ? Math.atan2(y - py, x - px) * 180 / Math.PI + 90 : 0;
      frames.push({ transform: `translate(${x}px,${y}px) rotate(${rot}deg)`, opacity: t < 0.1 ? op * t / 0.1 : t > 0.9 ? op * (1 - t) / 0.1 : op, offset: t });
      px = x; py = y;
    }
    const dur = 11000 + Math.random() * 8000;
    const anim = el.animate(frames, { duration: dur, easing: "linear", fill: "both" });
    if (first) anim.currentTime = Math.random() * dur * 0.6;   // spread them out so the screen is not empty at the start
    anim.onfinish = () => fly(el, i, false);                   // when one leaves, it comes back on a new path
  };
  blurs.forEach((b, i) => {
    const size = 40 + b * 7 + Math.random() * 20, el = document.createElement("div");
    el.className = "bf wh";
    el.dataset.size = size; el.dataset.op = (0.9 - b * 0.05).toFixed(2);
    el.style.cssText = `width:${size}px;height:${size * 0.8}px;--c1:#ffffff;--c2:#fdeff2;--blur:${b}px`;
    el.innerHTML = BUTTERFLY_W; layer.append(el);
    fly(el, i, true);
  });
}

// ===== Gate: the golden gate video (video/gate.mp4, 60 fps) =====
// Tap the button: the text fades and the video plays. While the doors swing open the whole gate DISSOLVES into the cover,
// which is already animating underneath, so the guest never sees a frozen last frame or a hard cut.
// Only opacity and transform are animated, so the browser runs the dissolve on the GPU at the screen's own refresh rate (60 / 90 / 120 Hz).
const GATE_REVEAL_AT = 1.9;   // seconds into the video: the cover starts animating under the gate
const GATE_FADE_AT = 2.05;    // seconds into the video: the doors start to swing open and the gate starts to dissolve
const GATE_FADE_MS = 750;     // length of the dissolve (keep equal to --gate-fade in style.css); it ends as the clip ends
// The video is added here, so index.html does not need to change. It also removes the old code-drawn doors if they are still in the page.
const gateVid = (() => {
  const stage = document.querySelector(".stage");
  if (!stage) return null;
  stage.querySelectorAll(".door").forEach((d) => d.remove());
  let v = $("gateVid");
  if (!v) {
    v = document.createElement("video");
    v.id = "gateVid"; v.className = "gatevid";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", "");
    v.setAttribute("aria-hidden", "true"); v.tabIndex = -1;
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.disablePictureInPicture = true; v.disableRemotePlayback = true;
    v.preload = "auto"; v.poster = "images/gate-poster.jpg"; v.src = "video/gate.mp4";
    stage.prepend(v);
  }
  return v;
})();

// Warm-up, so the tap feels instant and nothing pops in during the dissolve:
// 1) the cover picture and rings are loaded and decoded now, while the guest looks at the gate;
// 2) a muted video may start by itself, so it plays one frame and rewinds. The decoder is then ready and the tap starts the clip at once.
//    (If the browser refuses, nothing is lost: the tap simply starts the clip the normal way.)
["images/bg-pink.jpg", "images/rings.png"].forEach((src) => { const im = new Image(); im.src = src; if (im.decode) im.decode().catch(() => {}); });
if (gateVid && !(navigator.connection && navigator.connection.saveData)) {
  const warm = () => {
    const p = gateVid.play();
    if (p && p.then) p.then(() => { if (!tapped) { gateVid.pause(); gateVid.currentTime = 0; } }).catch(() => {});
  };
  if (gateVid.readyState >= 2) warm(); else gateVid.addEventListener("loadeddata", warm, { once: true });
}

$("open").addEventListener("click", () => {
  userPaused = false; tapped = true;
  const g = $("gate"), vid = gateVid;
  let revealed = false, dissolved = false, done = false, raf = 0, removeT = 0;

  const reveal = () => {                    // start the cover animation under the gate
    if (revealed) return; revealed = true;
    document.body.classList.add("revealed");
  };
  const end = () => {                       // the gate is invisible by now: take it out of the page
    if (done) return; done = true;
    cancelAnimationFrame(raf); clearTimeout(removeT);
    if (vid) vid.pause();
    g.remove();
    document.body.classList.remove("locked");   // unlock scrolling only now: changing the page layout while the doors move would make them stutter
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });   // "instant": the page has smooth scrolling on, which would slide here
    setTimeout(whiteButterflies, 250);      // the butterflies are heavy to draw, so they start only after the transition is over
  };
  const dissolve = () => {                  // fade the whole gate out over the cover (GPU opacity, see style.css)
    reveal();
    if (dissolved) return; dissolved = true;
    g.classList.add("dissolve");
    removeT = setTimeout(end, GATE_FADE_MS + 120);
  };
  const clock = (t) => {                    // t = the video's own time, so a slow connection can never get ahead of the picture
    if (t >= GATE_REVEAL_AT) reveal();
    if (t >= GATE_FADE_AT) dissolve();
  };

  g.classList.add("open");                  // fades out the title, names and button
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches || !vid || vid.error;
  if (still) {                              // less motion, or no video: simple fade
    try { play(); } catch (e) { console.warn("Music could not start:", e); }
    setTimeout(dissolve, 350); return;
  }

  vid.addEventListener("ended", dissolve, { once: true });
  vid.addEventListener("error", dissolve, { once: true });
  setTimeout(dissolve, 9000);               // safety net: never leave a guest stuck on the gate
  const p = vid.play();                     // the video goes first, so it gets the first frames before the music starts working
  if (p && p.catch) p.catch(dissolve);      // the browser refused to play: just open the invitation
  try { play(); } catch (e) { console.warn("Music could not start:", e); }   // the tap starts the music (a failure here must never block the gate)

  if (vid.requestVideoFrameCallback) {      // called once per video frame that is really shown, with its exact time
    const step = (now, meta) => { clock(meta.mediaTime); if (!dissolved) vid.requestVideoFrameCallback(step); };
    vid.requestVideoFrameCallback(step);
  } else {                                  // older browsers: check on every screen refresh instead
    const watch = () => { clock(vid.currentTime); if (!dissolved) raf = requestAnimationFrame(watch); };
    raf = requestAnimationFrame(watch);
  }
});
$("open").focus();
