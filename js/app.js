/* Fabel-Werkstatt – Lern-App zum Thema Fabel (Klasse 6) */
(function () {
  "use strict";

  var VERSION = "1.0.0";
  var STORE_KEY = "fabelwerkstatt.v1";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Fortschritt (bleibt im Browser gespeichert) ---------- */
  var state = { done: {}, best: null };
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (saved && typeof saved === "object") {
      state.done = saved.done || {};
      state.best = typeof saved.best === "number" ? saved.best : null;
    }
  } catch (e) { /* ohne Speicher läuft die App trotzdem */ }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* egal */ }
  }

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- Navigation ---------- */
  var current = 0;

  function show(n) {
    current = n;
    $$(".view").forEach(function (v) { v.hidden = v.id !== "view-" + n; });
    $$(".step").forEach(function (s) {
      var no = Number(s.dataset.go);
      s.classList.toggle("is-current", no === n);
      s.classList.toggle("is-done", !!state.done[no]);
      if (no === n) s.setAttribute("aria-current", "step"); else s.removeAttribute("aria-current");
    });
    var film = $("#film");
    if (film && n !== 4) film.pause();
    if (n === 5) startQuiz();
    window.scrollTo(0, 0);
    if (location.hash !== "#" + n) history.replaceState(null, "", n ? "#" + n : location.pathname);
  }

  function markDone(n) {
    state.done[n] = true;
    save();
    var next = $("#next" + n);
    if (next) next.disabled = false;
    $$(".step").forEach(function (s) {
      if (Number(s.dataset.go) === n) s.classList.add("is-done");
    });
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-go]");
    if (t && !t.disabled) show(Number(t.dataset.go));
  });

  /* ---------- Station 1: Merkmal-Karten ---------- */
  $$(".flip").forEach(function (card) {
    card.addEventListener("click", function () {
      var open = card.classList.toggle("is-open");
      card.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---------- Auswahlfragen (Station 1 und 4) ---------- */
  function setupChoices(id, station) {
    var box = $("#" + id);
    var fb = $("#" + id + "-fb");
    $$(".choice", box).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var ok = btn.dataset.ok === "1";
        btn.classList.add(ok ? "is-right" : "is-wrong");
        fb.textContent = (ok ? "✔ " : "✘ ") + btn.dataset.why;
        fb.className = "feedback " + (ok ? "is-right" : "is-wrong");
        if (ok) {
          $$(".choice", box).forEach(function (b) { b.disabled = true; });
          markDone(station);
        } else {
          btn.disabled = true;
        }
      });
    });
  }
  setupChoices("check1", 1);
  setupChoices("check4", 4);

  /* ---------- Station 2: Tiere zuordnen ---------- */
  var PAIRS = [
    { animal: "Fuchs", the: "Der Fuchs", icon: "🦊", trait: "listig und schlau" },
    { animal: "Löwe", the: "Der Löwe", icon: "🦁", trait: "mächtig und stolz" },
    { animal: "Wolf", the: "Der Wolf", icon: "🐺", trait: "gierig und böse" },
    { animal: "Lamm", the: "Das Lamm", icon: "🐑", trait: "wehrlos und unschuldig" },
    { animal: "Ameise", the: "Die Ameise", icon: "🐜", trait: "fleißig" },
    { animal: "Hase", the: "Der Hase", icon: "🐰", trait: "ängstlich" }
  ];

  (function setupMatch() {
    var colA = $("#match-animals");
    var colT = $("#match-traits");
    var fb = $("#match-fb");
    var picked = null;
    var solved = 0;

    PAIRS.forEach(function (p, i) {
      var b = el("button", "match-item match-animal");
      b.dataset.i = i;
      b.appendChild(el("span", "match-icon", p.icon));
      b.appendChild(el("span", null, p.animal));
      colA.appendChild(b);
    });
    shuffle(PAIRS.map(function (p, i) { return { i: i, trait: p.trait }; })).forEach(function (t) {
      var b = el("button", "match-item match-trait", t.trait);
      b.dataset.i = t.i;
      colT.appendChild(b);
    });

    colA.addEventListener("click", function (ev) {
      var b = ev.target.closest(".match-animal");
      if (!b || b.disabled) return;
      $$(".match-animal", colA).forEach(function (x) { x.classList.remove("is-picked"); });
      b.classList.add("is-picked");
      picked = b;
      fb.textContent = "Und welche Eigenschaft passt zum Tier „" + PAIRS[b.dataset.i].animal + "“?";
      fb.className = "feedback";
    });

    colT.addEventListener("click", function (ev) {
      var b = ev.target.closest(".match-trait");
      if (!b || b.disabled) return;
      if (!picked) {
        fb.textContent = "Tippe zuerst ein Tier an.";
        fb.className = "feedback";
        return;
      }
      if (b.dataset.i === picked.dataset.i) {
        var p = PAIRS[b.dataset.i];
        picked.classList.remove("is-picked");
        picked.classList.add("is-right");
        b.classList.add("is-right");
        picked.disabled = true;
        b.disabled = true;
        b.textContent = p.icon + " " + p.trait;
        picked = null;
        solved++;
        fb.className = "feedback is-right";
        if (solved === PAIRS.length) {
          fb.textContent = "✔ Super! Alle Tiere richtig zugeordnet. Diese Eigenschaften haben die Tiere in fast allen Fabeln.";
          markDone(2);
        } else {
          fb.textContent = "✔ Richtig! " + p.the + " ist in Fabeln " + p.trait + ".";
        }
      } else {
        b.classList.add("shake");
        setTimeout(function () { b.classList.remove("shake"); }, 450);
        fb.textContent = "✘ Das passt noch nicht. Überlege: Wie verhält sich dieses Tier in Geschichten?";
        fb.className = "feedback is-wrong";
      }
    });
  })();

  /* ---------- Station 3: Reihenfolge ---------- */
  var ORDER = [
    { part: "Ausgangssituation", text: "Ein Rabe sitzt auf einem Ast und hält ein Stück Käse im Schnabel." },
    { part: "Konflikt", text: "Der Fuchs will den Käse haben und schmeichelt: „Du singst sicher wunderschön!“" },
    { part: "Lösung", text: "Der Rabe krächzt los – der Käse fällt herunter und der Fuchs schnappt ihn." },
    { part: "Lehre", text: "Trau keinem, der dir nur schmeichelt." }
  ];

  (function setupOrder() {
    var slotsBox = $("#order-slots");
    var pool = $("#order-pool");
    var fb = $("#order-fb");
    var check = $("#order-check");
    var picked = null;
    var solved = false;

    ORDER.forEach(function (o, i) {
      var s = el("button", "slot");
      s.dataset.slot = i;
      s.appendChild(el("span", "slot-label", (i + 1) + " · " + o.part));
      s.appendChild(el("span", "slot-text", "Hier antippen"));
      slotsBox.appendChild(s);
    });
    shuffle(ORDER.map(function (o, i) { return { i: i, text: o.text }; })).forEach(function (c) {
      var b = el("button", "strip", c.text);
      b.dataset.i = c.i;
      pool.appendChild(b);
    });

    function refresh() {
      var filled = $$(".slot", slotsBox).filter(function (s) { return s.dataset.card != null; }).length;
      check.disabled = solved || filled < ORDER.length;
    }

    function clearSlot(s) {
      var strip = $('.strip[data-i="' + s.dataset.card + '"]', pool);
      if (strip) strip.hidden = false;
      delete s.dataset.card;
      s.classList.remove("is-filled", "is-right", "is-wrong");
      $(".slot-text", s).textContent = "Hier antippen";
    }

    pool.addEventListener("click", function (ev) {
      var b = ev.target.closest(".strip");
      if (!b || solved) return;
      $$(".strip", pool).forEach(function (x) { x.classList.remove("is-picked"); });
      b.classList.add("is-picked");
      picked = b;
    });

    slotsBox.addEventListener("click", function (ev) {
      var s = ev.target.closest(".slot");
      if (!s || solved) return;
      if (s.dataset.card != null) clearSlot(s);
      if (picked) {
        s.dataset.card = picked.dataset.i;
        s.classList.add("is-filled");
        $(".slot-text", s).textContent = picked.textContent;
        picked.classList.remove("is-picked");
        picked.hidden = true;
        picked = null;
      }
      fb.textContent = "";
      refresh();
    });

    check.addEventListener("click", function () {
      var wrong = 0;
      $$(".slot", slotsBox).forEach(function (s) {
        if (s.dataset.card === s.dataset.slot) {
          s.classList.add("is-right");
        } else {
          wrong++;
          clearSlot(s);
        }
      });
      if (wrong === 0) {
        solved = true;
        fb.textContent = "✔ Perfekt! So ist die Fabel aufgebaut: Ausgangssituation – Konflikt – Lösung – Lehre.";
        fb.className = "feedback is-right";
        markDone(3);
      } else {
        fb.textContent = "✘ Fast! " + wrong + (wrong === 1 ? " Streifen liegt" : " Streifen liegen") + " noch falsch. Die grünen Felder stimmen schon.";
        fb.className = "feedback is-wrong";
      }
      refresh();
    });
  })();

  /* ---------- Station 5: Quiz mit Herrn Uhu ---------- */
  var QUESTIONS = [
    {
      q: "Was ist eine Fabel?",
      a: ["Eine kurze Geschichte mit einer Lehre", "Ein langes Märchen mit Zauberei", "Ein Bericht aus der Zeitung", "Ein Gedicht ohne Handlung"],
      why: "Eine Fabel ist kurz und will uns etwas beibringen."
    },
    {
      q: "Wer spielt in Fabeln meistens die Hauptrolle?",
      a: ["Tiere, die wie Menschen sprechen und handeln", "Könige und Prinzessinnen", "Zauberer und Hexen", "Kinder aus der Nachbarschaft"],
      why: "In Fabeln handeln Tiere wie Menschen."
    },
    {
      q: "Welche Eigenschaft hat der Fuchs in den meisten Fabeln?",
      a: ["Er ist listig und schlau.", "Er ist faul.", "Er ist ängstlich.", "Er ist dumm."],
      why: "Der Fuchs ist das listige Tier – er trickst andere gerne aus."
    },
    {
      q: "In welcher Reihenfolge ist eine Fabel aufgebaut?",
      a: ["Ausgangssituation – Konflikt – Lösung – Lehre", "Lehre – Konflikt – Ausgangssituation – Lösung", "Konflikt – Lehre – Lösung – Ausgangssituation", "Lösung – Ausgangssituation – Lehre – Konflikt"],
      why: "Erst erfahren wir, was los ist, dann kommt der Streit, dann die Lösung und zum Schluss die Lehre."
    },
    {
      q: "Wie nennt man die Lehre einer Fabel auch?",
      a: ["Moral", "Überschrift", "Refrain", "Einleitung"],
      why: "Die Moral ist der Rat, den uns die Fabel mitgibt."
    },
    {
      q: "Warum lässt der Löwe die Maus frei?",
      a: ["Weil er über ihr Versprechen so lachen muss", "Weil ein Jäger kommt", "Weil die Maus ihn beißt", "Weil er Angst vor Mäusen hat"],
      why: "Der Löwe findet es lächerlich, dass eine winzige Maus ihm helfen will – und lässt sie lachend laufen."
    },
    {
      q: "Wie rettet die Maus den Löwen?",
      a: ["Sie nagt die Seile des Netzes durch.", "Sie holt die anderen Löwen.", "Sie verjagt den Jäger.", "Sie gräbt einen Tunnel."],
      why: "Mit ihren scharfen Zähnen nagt sie Seil um Seil durch."
    },
    {
      q: "Welche Lehre steckt in „Der Löwe und die Maus“?",
      a: ["Auch Kleine können Großen helfen – unterschätze niemanden.", "Wer schläft, wird geweckt.", "Löwen sind gefährliche Tiere.", "Mäuse sollten immer weglaufen."],
      why: "Der mächtige Löwe braucht am Ende die Hilfe der kleinen Maus."
    },
    {
      q: "Warum erzählen Fabeln von Tieren statt von Menschen?",
      a: ["So kann man Fehler von Menschen zeigen, ohne jemanden direkt zu beleidigen.", "Weil Menschen in Geschichten verboten waren.", "Weil Tiere wirklich sprechen können.", "Weil Fabeln nur für Tiere geschrieben wurden."],
      why: "Die Tiere stehen für Menschen. So fühlt sich niemand persönlich angegriffen – und kann trotzdem daraus lernen."
    },
    {
      q: "Wer war ein berühmter Fabeldichter aus dem alten Griechenland?",
      a: ["Äsop", "Goethe", "Die Brüder Grimm", "Astrid Lindgren"],
      why: "Äsop lebte vor über 2500 Jahren. Viele bekannte Fabeln gehen auf ihn zurück."
    }
  ];

  var PRAISE = [
    "Bravo! Genau richtig!",
    "Stark! Du hast gut aufgepasst.",
    "Hervorragend – weiter so!",
    "Volltreffer! Ich bin stolz auf dich.",
    "Klasse gemacht!",
    "Wunderbar! Das sitzt."
  ];
  var COMFORT = [
    "Fast! Beim nächsten Mal klappt es.",
    "Nicht schlimm – aus Fehlern lernt man am meisten.",
    "Kopf hoch! Lies dir die Erklärung durch.",
    "Guter Versuch! Jetzt weißt du es.",
    "Macht nichts – auch der Löwe hat sich einmal geirrt."
  ];

  var quiz = null;

  function startQuiz(force) {
    if (quiz && !force && !quiz.finished) return;
    quiz = {
      items: shuffle(QUESTIONS).map(function (q) {
        return { q: q.q, why: q.why, right: q.a[0], answers: shuffle(q.a) };
      }),
      pos: 0,
      score: 0,
      streak: 0,
      finished: false
    };
    renderIntro();
  }

  function owlRow(img, name, lines) {
    var row = el("div", "owl-row");
    var pic = el("img", "owl owl-small");
    pic.src = "assets/img/" + img + ".jpg";
    pic.alt = "";
    var bubble = el("div", "bubble");
    if (name) bubble.appendChild(el("p", "bubble-name", name));
    lines.forEach(function (l) { bubble.appendChild(el("p", null, l)); });
    row.appendChild(pic);
    row.appendChild(bubble);
    return row;
  }

  function renderIntro() {
    var box = $("#quiz");
    box.textContent = "";
    var lines = ["Jetzt bist du dran! Ich habe zehn Fragen für dich. Lass dir ruhig Zeit – es gibt keine Uhr.", "Nach jeder Antwort erkläre ich dir kurz, warum sie stimmt. Du schaffst das!"];
    if (state.best != null) lines.push("Dein bisher bestes Ergebnis: " + state.best + " von " + QUESTIONS.length + " Punkten.");
    box.appendChild(owlRow("eule-hallo", "Herr Uhu", lines));
    var actions = el("div", "actions");
    var go = el("button", "btn btn-primary btn-big", "Quiz starten");
    go.addEventListener("click", renderQuestion);
    actions.appendChild(go);
    box.appendChild(actions);
  }

  function renderQuestion() {
    var box = $("#quiz");
    var item = quiz.items[quiz.pos];
    var total = quiz.items.length;
    box.textContent = "";

    var head = el("div", "quiz-head");
    head.appendChild(el("span", "quiz-count", "Frage " + (quiz.pos + 1) + " von " + total));
    head.appendChild(el("span", "quiz-score", "★ " + quiz.score));
    box.appendChild(head);
    var bar = el("div", "bar");
    var fill = el("div", "bar-fill");
    fill.style.width = (quiz.pos / total) * 100 + "%";
    bar.appendChild(fill);
    box.appendChild(bar);

    box.appendChild(el("h3", "quiz-q", item.q));
    var list = el("div", "choices");
    var teacher = el("div", "teacher");
    teacher.setAttribute("role", "status");
    teacher.setAttribute("aria-live", "polite");

    item.answers.forEach(function (text) {
      var b = el("button", "choice", text);
      b.addEventListener("click", function () {
        var ok = text === item.right;
        $$(".choice", list).forEach(function (x) {
          x.disabled = true;
          if (x.textContent === item.right) x.classList.add("is-right");
        });
        if (ok) {
          quiz.score++;
          quiz.streak++;
        } else {
          b.classList.add("is-wrong");
          quiz.streak = 0;
        }
        $(".quiz-score", box).textContent = "★ " + quiz.score;
        var say = ok ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : COMFORT[Math.floor(Math.random() * COMFORT.length)];
        if (ok && quiz.streak >= 3) say = quiz.streak + " richtige Antworten hintereinander – du bist in Bestform!";
        var lines = [say, item.why];
        teacher.textContent = "";
        var row = owlRow(ok ? "eule-jubel" : "eule-mut", "Herr Uhu", lines);
        row.classList.add(ok ? "is-right" : "is-wrong");
        teacher.appendChild(row);
        var actions = el("div", "actions");
        var last = quiz.pos === total - 1;
        var next = el("button", "btn btn-primary", last ? "Zum Ergebnis" : "Nächste Frage");
        next.addEventListener("click", function () {
          quiz.pos++;
          if (last) renderResult(); else renderQuestion();
        });
        actions.appendChild(next);
        teacher.appendChild(actions);
        next.focus();
      });
      list.appendChild(b);
    });
    box.appendChild(list);
    box.appendChild(teacher);
  }

  function renderResult() {
    var box = $("#quiz");
    var total = quiz.items.length;
    var s = quiz.score;
    quiz.finished = true;
    if (state.best == null || s > state.best) state.best = s;
    markDone(5);
    box.textContent = "";

    var rank, lines, img;
    if (s === total) {
      rank = "Fabel-Meister";
      img = "eule-jubel";
      lines = ["Alle Fragen richtig – das ist meisterhaft!", "Du kennst dich mit Fabeln jetzt richtig gut aus. Ich bin sehr stolz auf dich!"];
    } else if (s >= total - 2) {
      rank = "Fabel-Profi";
      img = "eule-jubel";
      lines = ["Ein ganz starkes Ergebnis!", "Du hast fast alles gewusst. Schaffst du beim nächsten Mal die volle Punktzahl?"];
    } else if (s >= total / 2) {
      rank = "Fabel-Kenner";
      img = "eule-mut";
      lines = ["Gut gemacht – das Wichtigste hast du verstanden!", "Schau dir die Stationen noch einmal an und versuche es erneut. Du wirst sehen: Es wird jedes Mal besser."];
    } else {
      rank = "Fabel-Entdecker";
      img = "eule-mut";
      lines = ["Aller Anfang ist schwer – und du hast angefangen. Das zählt!", "Denk an die Maus: Auch Kleine kommen ans Ziel. Geh die Stationen noch einmal durch und probiere es dann erneut."];
    }

    var card = el("div", "result");
    if (s >= total - 2) card.appendChild(confetti());
    card.appendChild(el("p", "kicker", "Dein Ergebnis"));
    card.appendChild(el("p", "result-score", s + " von " + total));
    var stars = el("p", "result-stars");
    var full = Math.round((s / total) * 5);
    stars.textContent = "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
    stars.setAttribute("aria-label", full + " von 5 Sternen");
    card.appendChild(stars);
    card.appendChild(el("p", "result-rank", rank));
    box.appendChild(card);
    box.appendChild(owlRow(img, "Herr Uhu", lines));

    var actions = el("div", "actions");
    var again = el("button", "btn btn-primary", "Quiz noch einmal spielen");
    again.addEventListener("click", function () { startQuiz(true); });
    var home = el("button", "btn", "Zurück zum Start");
    home.dataset.go = "0";
    actions.appendChild(again);
    actions.appendChild(home);
    box.appendChild(actions);
  }

  function confetti() {
    var wrap = el("div", "confetti");
    wrap.setAttribute("aria-hidden", "true");
    var colors = ["#c2541b", "#2f6b4f", "#e0a526", "#3d7fb5", "#b8336a"];
    for (var i = 0; i < 36; i++) {
      var p = el("i");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 1.2 + "s";
      p.style.animationDuration = 2.2 + Math.random() * 1.8 + "s";
      wrap.appendChild(p);
    }
    return wrap;
  }

  /* ---------- Start ---------- */
  $("#version").textContent = "v" + VERSION;

  $("#reset").addEventListener("click", function () {
    if (!window.confirm("Möchtest du deinen Fortschritt wirklich löschen?")) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* egal */ }
    location.hash = "";
    location.reload();
  });

  // Bereits erledigte Stationen: „Weiter“-Knöpfe direkt freigeben
  [1, 2, 3, 4].forEach(function (n) {
    if (state.done[n]) $("#next" + n).disabled = false;
  });

  var start = Number((location.hash || "").slice(1));
  show(start >= 0 && start <= 5 ? start : 0);
})();
