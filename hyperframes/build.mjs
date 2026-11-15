// Erzeugt index.html (die Hyperframes-Komposition) aus der Szenenliste unten.
// Aufruf:  node build.mjs   → danach  npm run render
import { writeFileSync } from "node:fs";

const FADE = 0.6; // Überblendung zwischen den Szenen (Sekunden)
const TAIL = 0.7; // Nachklang nach dem Sprecher

// audio = Länge der Sprachaufnahme; caps = Untertitel mit Startzeit relativ zur Aufnahme
const scenes = [
  { id: 1, audio: 4.13, part: null, kb: { from: [1.0, 0, 0], to: [1.08, -30, 10] }, caps: [] },
  {
    id: 2, audio: 11.08, part: "1 · Ausgangssituation", kb: { from: [1.12, 40, 0], to: [1.02, 0, 0] },
    caps: [
      [0, "An einem heißen Mittag schlief der mächtige Löwe im Schatten eines alten Baumes."],
      [5.3, "Eine kleine Maus huschte durchs Gras – und lief ihm aus Versehen mitten über die Nase."],
    ],
  },
  {
    id: 3, audio: 8.99, part: "2 · Konflikt", kb: { from: [1.0, 0, 0], to: [1.12, -40, -10] },
    caps: [
      [0, "Der Löwe fuhr hoch und packte die Maus mit seiner gewaltigen Pranke."],
      [4.5, "„Wer wagt es, den König der Tiere zu wecken?“, brüllte er."],
    ],
  },
  {
    id: 4, audio: 14.99, part: "2 · Konflikt", kb: { from: [1.1, -30, 0], to: [1.0, 0, 0] },
    caps: [
      [0, "„Verzeih mir, großer Löwe!“, piepste die Maus. „Lass mich frei – eines Tages helfe ich dir dafür.“"],
      [7.0, "Da lachte der Löwe laut: „Du Winzling willst mir helfen?“"],
      [11.65, "Doch weil er so lachen musste, ließ er sie laufen."],
    ],
  },
  {
    id: 5, audio: 8.36, part: "3 · Lösung", kb: { from: [1.0, 0, 0], to: [1.1, 0, -20] },
    caps: [
      [0, "Wenige Tage später geriet der Löwe in das Netz eines Jägers."],
      [4.3, "Er zerrte und brüllte, doch die Seile hielten ihn fest."],
    ],
  },
  {
    id: 6, audio: 9.56, part: "3 · Lösung", kb: { from: [1.0, 0, 0], to: [1.12, -60, -20] },
    caps: [
      [0, "Die Maus hörte sein Brüllen und eilte herbei."],
      [3.15, "Mit ihren scharfen Zähnen nagte sie Seil um Seil durch – bis der Löwe frei war."],
    ],
  },
  {
    id: 7, audio: 12.67, part: "3 · Lösung", kb: { from: [1.1, 30, 0], to: [1.0, 0, 0] },
    caps: [
      [0, "„Du hast über mich gelacht“, sagte die Maus, „und nun habe ich dir das Leben gerettet.“"],
      [6.0, "Der Löwe senkte seinen Kopf: „Danke, kleine Freundin. Ich habe mich in dir getäuscht.“"],
    ],
  },
];
const moral = { audio: 6.27, hold: 3.0, line1At: 1.2, line2At: 4.4 };

const r = (n) => Math.round(n * 100) / 100;
let t = 0;
const html = [];
const anim = [];

for (const s of scenes) {
  s.start = t;
  s.voice = t + FADE;
  s.len = FADE + s.audio + TAIL;
  t += s.len;
}
const moralStart = t;
const total = r(moralStart + FADE + moral.audio + moral.hold);

// Szenenbilder: jede Szene liegt über der vorigen und blendet weich ein
scenes.forEach((s, i) => {
  const last = i === scenes.length - 1;
  const dur = last ? total - s.start : s.len + FADE;
  html.push(
    `<div id="s${s.id}" class="clip scene" style="z-index:${i + 1}" data-start="${r(s.start)}" data-duration="${r(dur)}" data-track-index="0"><img id="bg${s.id}" class="bg" src="assets/szene${s.id}.jpg" alt="" /></div>`,
  );
  if (i > 0) anim.push(`tl.fromTo("#s${s.id}", { opacity: 0 }, { opacity: 1, duration: ${FADE}, ease: "power1.inOut" }, ${r(s.start)});`);
  const [fs, fx, fy] = s.kb.from;
  const [ts, tx, ty] = s.kb.to;
  anim.push(
    `tl.fromTo("#bg${s.id}", { scale: ${fs}, x: ${fx}, y: ${fy} }, { scale: ${ts}, x: ${tx}, y: ${ty}, duration: ${r(dur)}, ease: "none" }, ${r(s.start)});`,
  );
  html.push(
    `<audio id="a${s.id}" src="assets/szene${s.id}.mp3" data-start="${r(s.voice)}" data-duration="${s.audio}" data-track-index="5" data-volume="1"></audio>`,
  );
});

// Titel
const s1 = scenes[0];
html.push(
  `<div id="title" class="clip title" data-start="0" data-duration="${r(s1.len)}" data-track-index="1"><div id="title-main" class="title-main">Der Löwe<br />und die Maus</div><div id="title-sub" class="title-sub">Eine Fabel nach Äsop</div></div>`,
);
anim.push(`tl.fromTo("#title-main", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.3);`);
anim.push(`tl.fromTo("#title-sub", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 1.3);`);
anim.push(`tl.to("#title", { opacity: 0, duration: 0.5, ease: "power1.in" }, ${r(s1.len - 0.5)});`);

// Aufbau-Schildchen (zeigt, in welchem Teil der Fabel wir gerade sind)
const groups = [];
for (const s of scenes) {
  if (!s.part) continue;
  const g = groups.at(-1);
  if (g && g.part === s.part) g.end = s.start + s.len;
  else groups.push({ part: s.part, start: s.start, end: s.start + s.len });
}
groups.forEach((g, i) => {
  const st = g.start + FADE;
  html.push(
    `<div id="part${i}" class="clip part" data-start="${r(st)}" data-duration="${r(g.end - st)}" data-track-index="2">${g.part}</div>`,
  );
  anim.push(`tl.fromTo("#part${i}", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, ${r(st)});`);
  anim.push(`tl.to("#part${i}", { opacity: 0, duration: 0.4, ease: "power1.in" }, ${r(g.end - 0.4)});`);
});

// Untertitel
let c = 0;
for (const s of scenes) {
  s.caps.forEach(([at, text], i) => {
    const st = s.voice + at;
    const en = i + 1 < s.caps.length ? s.voice + s.caps[i + 1][0] : s.voice + s.audio + 0.35;
    const id = `cap${c++}`;
    html.push(
      `<div id="${id}" class="clip cap" data-start="${r(st)}" data-duration="${r(en - st)}" data-track-index="3"><span>${text}</span></div>`,
    );
    anim.push(`tl.fromTo("#${id}", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, ${r(st)});`);
    anim.push(`tl.to("#${id}", { opacity: 0, duration: 0.25, ease: "power1.in" }, ${r(en - 0.25)});`);
  });
}

// Die Lehre
const mv = moralStart + FADE;
html.push(
  `<div id="moral" class="clip moral" data-start="${r(moralStart)}" data-duration="${r(total - moralStart)}" data-track-index="4"><div class="moral-card"><div id="moral-kicker" class="moral-kicker">4 · Die Lehre</div><div id="moral-1" class="moral-line">Auch der Kleinste kann dem Größten helfen.</div><div id="moral-2" class="moral-line moral-strong">Unterschätze niemanden!</div></div></div>`,
);
html.push(
  `<audio id="a8" src="assets/szene8.mp3" data-start="${r(mv)}" data-duration="${moral.audio}" data-track-index="5" data-volume="1"></audio>`,
);
anim.push(`tl.fromTo("#moral", { opacity: 0 }, { opacity: 1, duration: ${FADE}, ease: "power1.inOut" }, ${r(moralStart)});`);
anim.push(`tl.fromTo("#moral-kicker", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, ${r(mv)});`);
anim.push(`tl.fromTo("#moral-1", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, ${r(mv + moral.line1At)});`);
anim.push(`tl.fromTo("#moral-2", { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.6)" }, ${r(mv + moral.line2At)});`);

const page = `<!doctype html>
<!-- Automatisch erzeugt von build.mjs – bitte dort ändern, nicht hier. -->
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="vendor/gsap.min.js"></script>
    <style>
      @font-face {
        font-family: "Fraunces";
        src: url("assets/fonts/fraunces-latin-wght-normal.woff2") format("woff2");
        font-weight: 100 900;
      }
      @font-face {
        font-family: "Nunito";
        src: url("assets/fonts/nunito-latin-wght-normal.woff2") format("woff2");
        font-weight: 200 1000;
      }
      :root {
        --paper: #fff6e0;
        --ink: #3a2412;
        --accent: #c2541b;
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #1c120a; }
      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; font-family: "Nunito", sans-serif; }
      .scene { position: absolute; inset: 0; overflow: hidden; }
      .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .title { position: absolute; z-index: 20; left: 800px; top: 70px; width: 1060px; text-align: center; color: var(--paper); }
      .title-main { font-family: "Fraunces", serif; font-weight: 800; font-size: 138px; line-height: 1.04; letter-spacing: -0.02em; text-shadow: 0 6px 0 rgba(58, 36, 18, 0.55), 0 14px 40px rgba(58, 36, 18, 0.5); }
      .title-sub { margin-top: 34px; display: inline-block; font-size: 46px; font-weight: 800; color: var(--ink); background: var(--paper); padding: 12px 36px; border-radius: 999px; }
      .part { position: absolute; z-index: 30; left: 60px; top: 54px; font-size: 38px; font-weight: 900; color: var(--paper); background: var(--accent); padding: 14px 34px; border-radius: 999px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); }
      .cap { position: absolute; z-index: 40; left: 160px; right: 160px; bottom: 64px; display: flex; justify-content: center; }
      .cap span { display: block; max-width: 1600px; background: rgba(255, 246, 224, 0.95); color: var(--ink); font-family: "Fraunces", serif; font-weight: 600; font-size: 52px; line-height: 1.28; text-align: center; padding: 26px 52px; border-radius: 32px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35); }
      .moral { position: absolute; z-index: 50; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(40, 20, 8, 0.62); }
      .moral-card { width: 1400px; background: var(--paper); border-radius: 48px; padding: 80px 90px 90px; text-align: center; box-shadow: 0 30px 90px rgba(0, 0, 0, 0.5); }
      .moral-kicker { display: inline-block; font-size: 40px; font-weight: 900; color: var(--paper); background: var(--accent); padding: 12px 36px; border-radius: 999px; margin-bottom: 50px; }
      .moral-line { font-family: "Fraunces", serif; font-weight: 700; font-size: 76px; line-height: 1.2; color: var(--ink); }
      .moral-strong { margin-top: 36px; font-size: 84px; font-weight: 900; color: var(--accent); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1920" data-height="1080">
      ${html.join("\n      ")}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      ${anim.join("\n      ")}
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), page);
console.log(`index.html geschrieben – Gesamtlänge ${total} s`);
