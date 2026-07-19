export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryKey: string;
  i18nKey: string;
  date: string;
  readTime: string;
  author: string;
  image: string;
  content: string;
}

export const blogCategories = [
  "Alle",
  "Kindertagespflege",
  "Recht & Regulierung",
  "Für Eltern",
  "Für Betreuungspersonen",
  "Förderung & Steuer",
  "Gesundheit & Sicherheit",
];

export const blogPosts: BlogPost[] = [
  {
    slug: "kindertagespflege-in-deutschland-2026",
    title: "Kindertagespflege in Deutschland 2026: Der komplette Überblick für Eltern",
    excerpt: "Kindertagespflege nach § 22 SGB VIII ist eine gleichwertige Alternative zur Kita. Wir erklären Voraussetzungen, Kosten, Förderung und wie Sie eine geeignete Kindertagespflegeperson finden.",
    category: "Kindertagespflege",
    categoryKey: "kindertagespflege",
    i18nKey: "kindertagespflege2026",
    date: "2026-03-01",
    readTime: "7 Min. Lesezeit",
    author: "KinderStars Redaktion",
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",
    content: `## Was ist Kindertagespflege?

**Kindertagespflege** ist eine im Sozialgesetzbuch (§ 22 SGB VIII) verankerte Form der frühkindlichen Betreuung — gleichwertig zur Kita, aber in kleineren Gruppen und familiärer Atmosphäre.

### Wer darf betreuen?
Eine **Kindertagespflegeperson** benötigt in der Regel:
- Eine **Pflegeerlaubnis** des zuständigen Jugendamts (§ 43 SGB VIII)
- Ein aktuelles **erweitertes Führungszeugnis**
- Eine Qualifizierung nach dem **Bundesbildungsrahmenplan (QHB)** — meist 160–300 UE
- **Erste Hilfe am Kind** (regelmäßig aufgefrischt, i. d. R. alle 2 Jahre)
- Eine **Belehrung nach § 43 IfSG** (Gesundheitsamt)

### Was kostet Kindertagespflege?
Die Kosten hängen vom Bundesland, dem Umfang und Ihrem Einkommen ab. Über **§ 23 SGB VIII** kann das Jugendamt einen Großteil der Kosten übernehmen — bei anerkannten Pflegepersonen.

### KinderStars und Kindertagespflege
KinderStars ist eine **private Vermittlungsplattform**. Wir prüfen Führungszeugnisse, Qualifikationen und Referenzen. Die staatliche Anerkennung erteilt ausschließlich das Jugendamt.

> **Tipp:** Nutzen Sie unseren Jugendamt-Ready-Check, um zu sehen, welche Unterlagen für eine öffentliche Förderung noch fehlen.`,
  },
  {
    slug: "erweitertes-fuehrungszeugnis-fuer-kinderbetreuung",
    title: "Erweitertes Führungszeugnis (§ 30a BZRG): Was Betreuungspersonen wissen müssen",
    excerpt: "Ohne aktuelles erweitertes Führungszeugnis keine Kinderbetreuung. So beantragen Sie es, was es kostet und warum KinderStars es zwingend voraussetzt.",
    category: "Recht & Regulierung",
    categoryKey: "recht",
    i18nKey: "fuehrungszeugnis",
    date: "2026-02-24",
    readTime: "5 Min. Lesezeit",
    author: "KinderStars Compliance",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    content: `## Warum ein erweitertes Führungszeugnis?

Für alle Tätigkeiten mit Kindern verlangt § 72a SGB VIII ein **erweitertes Führungszeugnis** — es weist zusätzlich einschlägige Sexual- und Gewaltdelikte aus.

### Beantragung
- **Wo:** beim Einwohnermeldeamt oder online über das Bundesamt für Justiz.
- **Kosten:** rund **13 €** (bei Ehrenamt oft gebührenfrei).
- **Dauer:** i. d. R. 2–3 Wochen Postlaufzeit.

### Wichtig für Betreuungspersonen auf KinderStars
- Führungszeugnis darf **nicht älter als 3 Monate** bei Einreichung sein.
- Erneuerung mindestens **alle 3–5 Jahre**, je nach Anforderung des Trägers/Jugendamts.
- KinderStars markiert abgelaufene Zeugnisse automatisch und pausiert die Buchbarkeit.

> **Hinweis:** KinderStars **Verified** ersetzt keine staatliche Prüfung — ist aber eine transparente Grundlage für Eltern und Jugendämter.`,
  },
  {
    slug: "paragraph-23-sgb-viii-oeffentliche-foerderung",
    title: "§ 23 SGB VIII: So funktioniert die öffentliche Förderung der Kindertagespflege",
    excerpt: "Laufende Geldleistung, Sachaufwand, Krankenversicherungs- und Rentenzuschüsse — was das Jugendamt übernimmt und wie Eltern die Förderung beantragen.",
    category: "Förderung & Steuer",
    categoryKey: "foerderung",
    i18nKey: "paragraph23",
    date: "2026-02-18",
    readTime: "8 Min. Lesezeit",
    author: "KinderStars Redaktion",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    content: `## Was regelt § 23 SGB VIII?

§ 23 SGB VIII regelt die **laufende Geldleistung** an Kindertagespflegepersonen, die vom **Jugendamt** anerkannt sind. Sie umfasst:

1. **Sachaufwand** (Essen, Verbrauchsmaterial)
2. **Anerkennung der Förderungsleistung** (Honorar-Anteil)
3. **Zuschuss zur Unfallversicherung**
4. **Hälftige Erstattung** von angemessener Alters- und Krankenversicherung

### Wer bekommt was?
- **Eltern:** stellen Antrag beim Jugendamt am Wohnort.
- **Kindertagespflegeperson:** rechnet direkt mit dem Jugendamt ab.

### Warum das für KinderStars-Nutzer relevant ist
Nur **Jugendamt-anerkannte** Personen erhalten § 23-Förderung. Unser Tarif **Professional Compliance** enthält die **Jugendamt-Ready**-Vorbereitung, damit Sie den Antrag erfolgreich stellen können.`,
  },
  {
    slug: "erste-hilfe-am-kind-kurs",
    title: "Erste Hilfe am Kind: Pflichtkurs für jede Betreuungsperson",
    excerpt: "9 Unterrichtseinheiten, alle 2 Jahre wiederholen — hier finden Sie zertifizierte Anbieter (DRK, Malteser, Johanniter) und was der Kurs abdeckt.",
    category: "Gesundheit & Sicherheit",
    categoryKey: "gesundheit",
    i18nKey: "ersteHilfe",
    date: "2026-02-10",
    readTime: "4 Min. Lesezeit",
    author: "KinderStars Akademie",
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&q=80",
    content: `## Warum ist Erste Hilfe am Kind Pflicht?

Kinder verunglücken anders als Erwachsene. Der Kurs **Erste Hilfe am Kind** (9 UE) deckt u. a. ab:
- Reanimation bei Säuglingen und Kleinkindern
- Verschlucken/Bolusgeschehen (Heimlich-Manöver)
- Fieberkrampf, Vergiftungen, Verbrennungen
- Wundversorgung und Schockbekämpfung

### Zertifizierte Anbieter
- Deutsches Rotes Kreuz (DRK)
- Malteser Hilfsdienst
- Johanniter-Unfall-Hilfe
- Arbeiter-Samariter-Bund (ASB)

### Auffrischung
Der Nachweis darf i. d. R. **nicht älter als 2 Jahre** sein. KinderStars erinnert Sie automatisch 60 Tage vor Ablauf.

> **Angebot:** Über [KinderStars Erste Hilfe](/erste-hilfe) buchen Sie Präsenz-Gruppenkurse ab **69 € pro Platz**.`,
  },
  {
    slug: "dsgvo-fuer-kinderbetreuung",
    title: "DSGVO in der Kinderbetreuung: Was Betreuungspersonen wirklich beachten müssen",
    excerpt: "Fotos, Entwicklungsberichte, Elternchats — sensible Kinderdaten unterliegen strengen Regeln. Ein praktischer Leitfaden.",
    category: "Recht & Regulierung",
    categoryKey: "recht",
    i18nKey: "dsgvo",
    date: "2026-02-04",
    readTime: "6 Min. Lesezeit",
    author: "KinderStars Datenschutz",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80",
    content: `## Warum DSGVO in der Kinderbetreuung besonders wichtig ist

Daten über Kinder gehören zu den **besonders schutzwürdigen Kategorien** (Art. 8 DSGVO). Fehler können teuer werden.

### Die 5 wichtigsten Regeln
1. **Einwilligung schriftlich** einholen — separat für Fotos, Videos, Weitergabe an Dritte.
2. **Datenminimierung** — nur erfassen, was nötig ist.
3. **Sichere Kommunikation** — keine sensiblen Daten per WhatsApp/E-Mail unverschlüsselt.
4. **Löschfristen** einhalten (i. d. R. 3 Jahre nach Betreuungsende).
5. **Dokumentation** — Verzeichnis von Verarbeitungstätigkeiten (Art. 30 DSGVO).

### KinderStars-Vorteil
Alle Nachrichten, Verträge und Dokumente laufen DSGVO-konform in unserem Portal — Hosting in der EU, TLS-verschlüsselt, Zugriffsprotokoll.`,
  },
  {
    slug: "steuerfreie-arbeitgeberzuschuesse-kinderbetreuung",
    title: "§ 3 Nr. 33 EStG: Steuerfreier Arbeitgeberzuschuss für Kinderbetreuung",
    excerpt: "Arbeitgeber können Kinderbetreuung für Kinder unter 6 Jahren steuer- und sozialabgabenfrei bezuschussen. So funktioniert es.",
    category: "Förderung & Steuer",
    categoryKey: "foerderung",
    i18nKey: "arbeitgeberzuschuss",
    date: "2026-01-28",
    readTime: "5 Min. Lesezeit",
    author: "KinderStars Redaktion",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80",
    content: `## § 3 Nr. 33 EStG in der Praxis

Arbeitgeber dürfen **unbegrenzt** die Kosten für die Unterbringung und Betreuung **nicht schulpflichtiger Kinder** in Kindergärten, Kitas **oder bei einer Kindertagespflegeperson** übernehmen — **steuer- und sozialabgabenfrei**.

### Voraussetzungen
- Kind ist **nicht schulpflichtig**.
- Betreuung erfolgt **außerhalb der Wohnung** (bei Kindertagespflege ausdrücklich zulässig, auch im Haushalt der Pflegeperson bzw. der Eltern nach BFH-Rechtsprechung — Einzelfall prüfen).
- **Zusätzlich zum ohnehin geschuldeten Arbeitslohn** — keine Gehaltsumwandlung.
- **Belegnachweis** (Rechnung + Zahlungsnachweis) für die Lohnbuchhaltung.

### Für Arbeitgeber via KinderStars
Wir stellen [B2B-Rechnungen](/fuer-arbeitgeber) direkt an die Firma aus — komplettes Belegpaket inklusive. Mitarbeiterbindung, steuerlich sauber, DSGVO-konform.`,
  },
  {
    slug: "kinderschutz-paragraph-8a-sgb-viii",
    title: "Kinderschutz nach § 8a SGB VIII: Handlungspflichten für Betreuungspersonen",
    excerpt: "Was tun bei Verdacht auf Kindeswohlgefährdung? Meldewege, insoweit erfahrene Fachkraft (InsoFa) und die KinderStars-Meldeplattform.",
    category: "Recht & Regulierung",
    categoryKey: "recht",
    i18nKey: "kinderschutz",
    date: "2026-01-20",
    readTime: "7 Min. Lesezeit",
    author: "KinderStars Kinderschutz",
    image: "https://images.unsplash.com/photo-1490131784822-46706e37d3ec?w=800&q=80",
    content: `## Ihre Verantwortung nach § 8a SGB VIII

Alle Personen, die beruflich mit Kindern arbeiten, unterliegen bei **gewichtigen Anhaltspunkten für Kindeswohlgefährdung** einer Handlungspflicht.

### Handlungsschritte
1. **Wahrnehmung dokumentieren** — sachlich, mit Datum, Uhrzeit, Beobachtung.
2. **Kollegiale Beratung** — anonymisiert.
3. **Insoweit erfahrene Fachkraft (InsoFa)** hinzuziehen.
4. **Erziehungsberechtigte einbeziehen**, sofern der Schutz des Kindes dadurch nicht gefährdet wird.
5. **Jugendamt informieren**, wenn Gefährdung nicht abgewendet werden kann.
6. **Notruf 110** bei akuter Gefahr.

### KinderStars-Meldeplattform
Über [/childminder/kinderschutz](/childminder/kinderschutz) dokumentieren Sie Beobachtungen strukturiert, DSGVO-konform, mit Zeitstempel und Zugriffsprotokoll — die formale Meldung an das Jugendamt bleibt Ihre Verantwortung.

> **Notrufe:** Polizei **110** · Rettungsdienst **112** · Nummer gegen Kummer **116 111**`,
  },
  {
    slug: "babysitter-nanny-kindertagespflege-unterschiede",
    title: "Babysitter, Nanny oder Kindertagespflege? Die Unterschiede einfach erklärt",
    excerpt: "Drei Betreuungsformen, drei Rechtsrahmen. Wir zeigen, welche Option zu Ihrer Familie passt — und was steuerlich absetzbar ist.",
    category: "Für Eltern",
    categoryKey: "eltern",
    i18nKey: "unterschiede",
    date: "2026-01-14",
    readTime: "6 Min. Lesezeit",
    author: "KinderStars Redaktion",
    image: "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=800&q=80",
    content: `## Drei Modelle im Vergleich

| Merkmal | **Babysitter** | **Nanny / Kinderfrau** | **Kindertagespflege** |
|---|---|---|---|
| Rechtsgrundlage | Minijob/Privatverh. | Arbeitsvertrag i. d. R. | § 22 SGB VIII |
| Anerkennung | keine | keine | Jugendamt (§ 43) |
| Ort | Haushalt Eltern | Haushalt Eltern | Kinderfrau-Haushalt oder Eltern |
| Öffentliche Förderung | nein | nein | ja (§ 23 SGB VIII) |
| Steuerlich (§ 35a) | 20 % haushaltsn. DL | 20 % haushaltsn. DL | 2/3 als Sonderausgabe (§ 10 EStG) |

### Welche Form passt?
- **Flexible Stunden abends:** Babysitter.
- **Feste Betreuung 30+ h/Woche im eigenen Haushalt:** Nanny.
- **Regelmäßige Ganztagsbetreuung mit öffentlicher Förderung:** Kindertagespflege.

KinderStars vermittelt alle drei Modelle — inklusive rechtssicherer Vertragsvorlagen.`,
  },
  {
    slug: "scheinselbststaendigkeit-vermeiden",
    title: "Scheinselbständigkeit vermeiden: Wann Ihre Betreuungsperson ins Arbeitsverhältnis rutscht",
    excerpt: "Regelmäßige Betreuung im Haushalt der Eltern kann sozialversicherungsrechtlich als Anstellung gelten. So schützen sich Familien.",
    category: "Recht & Regulierung",
    categoryKey: "recht",
    i18nKey: "scheinselbststaendigkeit",
    date: "2026-01-08",
    readTime: "6 Min. Lesezeit",
    author: "KinderStars Compliance",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    content: `## Wann liegt Scheinselbständigkeit vor?

Die Deutsche Rentenversicherung prüft u. a.:
- **Weisungsgebundenheit** (Ort, Zeit, Ausführung)
- **Eingliederung** in fremden Betrieb/Haushalt
- **Nur ein Auftraggeber** (> 5/6 Umsatz)
- **Kein unternehmerisches Risiko**

Trifft mehreres zu, liegt oft ein **abhängiges Beschäftigungsverhältnis** vor — mit Nachzahlungen und Bußgeldern für den Haushalt als Arbeitgeber.

### So bleiben Sie sauber
- Für **regelmäßige Betreuung > 15 h/Woche** im eigenen Haushalt: **Minijob oder sozialversicherungspflichtige Anstellung** über die Minijob-Zentrale.
- Für **projektartige, wechselnde** Einsätze: freiberuflicher Vertrag ok.
- Bei Unsicherheit: **Statusfeststellungsverfahren** (§ 7a SGB IV).

### KinderStars-Schutz
Unser System erkennt **Wiederholungsmuster** und schlägt automatisch den passenden Vertragstyp (Minijob / Anstellung) vor — inklusive Rechnungs- und Steuerpaket.`,
  },
  {
    slug: "kinderstars-verified-badge-erklaert",
    title: "KinderStars Verified: Was das Prüfsiegel bedeutet — und was nicht",
    excerpt: "3 Verifizierungsstufen, transparente Kriterien, klare Grenzen. Warum unser Siegel keine staatliche Anerkennung ersetzt.",
    category: "Für Eltern",
    categoryKey: "eltern",
    i18nKey: "verifiedBadge",
    date: "2026-01-02",
    readTime: "5 Min. Lesezeit",
    author: "KinderStars Trust & Safety",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
    content: `## Unsere drei Stufen

1. **Registered** — E-Mail bestätigt, Grundprofil vollständig.
2. **Verified (79 €)** — Identität geprüft, erweitertes Führungszeugnis eingesehen, Erste Hilfe am Kind gültig, 2 Referenzen kontaktiert, Video-Interview absolviert. Gültigkeit **12 Monate**.
3. **Jugendamt Approved** — zusätzlich staatliche **Pflegeerlaubnis** nach § 43 SGB VIII nachgewiesen.

### Was Verified NICHT ist
- Keine staatliche Aufsicht oder Anerkennung.
- Kein Ersatz für Ihre eigene Einschätzung im Kennenlerngespräch.
- Kein Freibrief — Eltern bleiben verantwortlich für die Auswahl.

### Was Verified sehr wohl ist
Eine transparente, **dokumentierte** Grundprüfung, an der sich auch Jugendämter über [unser Behörden-Portal](/jugendamt) orientieren können.`,
  },
];

export const getPostBySlug = (slug: string): BlogPost | undefined =>
  blogPosts.find((p) => p.slug === slug);

export const getPostsByCategory = (category: string): BlogPost[] =>
  category === "Alle" ? blogPosts : blogPosts.filter((p) => p.category === category);
