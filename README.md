# Fabel-Werkstatt

Interaktive Lern-WebApp für die **6. Klasse** zum Thema **Fabel** – Version **1.1.0**

Die App führt in fünf kurzen Stationen durch das Thema. Lehrer-Eule **Herr Uhu** begleitet die Kinder und motiviert im Abschlussquiz.

| Station | Inhalt | Übung |
|---|---|---|
| 1 · Was ist das? | Die drei Merkmale einer Fabel, Äsop | Aufklapp-Karten, „Welche Geschichte ist eine Fabel?“ |
| 2 · Die Tiere | Typische Eigenschaften der Fabeltiere | Tier und Eigenschaft zuordnen |
| 3 · Der Aufbau | Ausgangssituation – Konflikt – Lösung – Lehre | „Der Fuchs und der Rabe“ in die richtige Reihenfolge bringen |
| 4 · Die Fabel | „Der Löwe und die Maus“ als animierter Film (89 s, mit Sprecher und Untertiteln) | Frage zur Übertragung auf Menschen |
| 5 · Das Quiz | 10 Fragen in zufälliger Reihenfolge | Rückmeldung von Herrn Uhu nach jeder Antwort, Ergebnis mit Sternen, zum Abschluss das Fabel-Lied „Fabelschlau“ mit Text zum Mitsingen |

## Starten

Die App besteht nur aus statischen Dateien – kein Build, kein Server-Code, keine externen Abrufe (Schriften, Bilder und Film liegen im Repo).

- **Lokal:** `index.html` im Browser öffnen oder im Ordner `python3 -m http.server` starten.
- **GitHub Pages:** Settings → Pages → Branch `main`, Ordner `/ (root)`.

Der Lernfortschritt wird nur im Browser des Geräts gespeichert (`localStorage`); es werden keine Daten übertragen.

## Aufbau des Repos

```
index.html            Seite mit allen Stationen
css/style.css         Gestaltung
js/app.js             Übungen, Quiz, Fortschritt (Versionsnummer: VERSION)
assets/img            Illustrationen (Szenen, Herr Uhu)
assets/video          Fertig gerenderter Film
assets/audio          Fabel-Lied „Fabelschlau“
assets/fonts          Schriften Fraunces und Nunito
hyperframes/          Quelle des Films (Hyperframes-Komposition)
```

## Den Film ändern (Hyperframes)

Der Film ist eine [Hyperframes](https://hyperframes.heygen.com)-Komposition: HTML + GSAP, gerendert zu MP4.
Texte, Zeiten und Kamerafahrten stehen in `hyperframes/build.mjs`; daraus entsteht `hyperframes/index.html`.

```bash
cd hyperframes
npm run dev      # Vorschau im Browser
npm run render   # erzeugt out/fabel.mp4 (1920×1080)
# fürs Web verkleinern:
ffmpeg -i out/fabel.mp4 -vf scale=1280:720 -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart ../assets/video/der-loewe-und-die-maus.mp4
```

Voraussetzungen: Node.js 22+, FFmpeg, Chrome.

## Quellen und Lizenzen

- Fabel „Der Löwe und die Maus“ frei nacherzählt nach Äsop (gemeinfrei).
- Illustrationen und Sprecherstimme: KI-generiert mit Higgsfield (Bilder: GPT Image, Stimme: ElevenLabs).
- Lied „Fabelschlau“: Text eigens für die App geschrieben, Musik und Gesang KI-generiert mit Suno.
- Schriften: Fraunces und Nunito (SIL Open Font License 1.1).
- Animation: GSAP (im Ordner `hyperframes/vendor`, Standard-Lizenz von GSAP).

## Versionen

- **1.1.0** – Fabel-Lied „Fabelschlau“ als Abschluss nach dem Quiz, mit Text zum Mitsingen.
- **1.0.0** – Erste Fassung: fünf Stationen, Film „Der Löwe und die Maus“, Abschlussquiz mit Herrn Uhu.
