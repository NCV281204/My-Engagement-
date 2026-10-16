const $ = (id) => document.getElementById(id);

const guest = new URLSearchParams(location.search).get("guest") || CONFIG.guest;
$("groom").textContent = $("groom2").textContent = CONFIG.groom;
$("bride").textContent = $("bride2").textContent = CONFIG.bride;
$("guest").textContent = $("gateGuest").textContent = guest;
$("dateCover").textContent = $("dateMain").textContent = dateText;
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
const end = new Date(start.getTime() + CONFIG.hours * 3600000);
function tick() {
  const ms = start - Date.now();
  const box = $("count");
  if (ms <= 0) { box.className = "count done"; box.textContent = "Congratulations!"; return; }
  const p = [[864e5, "ថ្ងៃ"], [36e5, "ម៉ោង"], [6e4, "នាទី"], [1e3, "វិនាទី"]];
  let rest = ms;
  box.innerHTML = p.map(([u, label], i) => {
    const v = Math.floor(rest / u); rest -= v * u;
    return `<div>${kh(String(v).padStart(2, "0"))}<small>${label}</small></div>`;
  }).join("");
}
tick(); setInterval(tick, 1000);

// Add to calendar (.ics)
$("cal").addEventListener("click", () => {
  const f = (t) => t.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Invitation//KM","BEGIN:VEVENT",
    `UID:${f(start)}@invitation`,`DTSTAMP:${f(new Date())}`,`DTSTART:${f(start)}`,`DTEND:${f(end)}`,
    `SUMMARY:ពិធីភ្ជាប់ពាក្យ ${CONFIG.groom} និង ${CONFIG.bride}`,
    `LOCATION:${[CONFIG.venue, CONFIG.address].filter(Boolean).join(" ") || CONFIG.mapLink}`,"END:VEVENT","END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "engagement.ics"; a.click(); URL.revokeObjectURL(a.href);
});
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

// Open-invitation screen: the tap starts the music.
$("open").addEventListener("click", () => {
  userPaused = false;
  play();
  const g = $("gate");
  g.classList.add("out");
  document.body.classList.remove("locked");
  window.scrollTo(0, 0);
  setTimeout(() => g.remove(), 700);
});
$("open").focus();
