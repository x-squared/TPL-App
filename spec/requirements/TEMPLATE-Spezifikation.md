# Feature: TEMPLATE-Spezifikation [Spec]

Dieses Dokument ist die aktuelle Vorlage für fachliche Spezifikationen im Projekt.

## Use Case: Struktur und Mindestregeln [Ready]

## Use Case: Eine neue Spezifikation wird erstellt [Ready]

#### Story: Die Hierarchie wird konsistent verwendet [Ready]

##### Item: Anforderungen werden in der Hierarchie `Feature -> Use Case -> Story -> Item` beschrieben. [Ready]

##### Item: Statuslabels sind `[Spec]`, `[Ready]`, `[Impl]`, `[QA]` oder `[Done]`. [Ready]

##### Item: Fehlt ein Statuslabel, wird standardmäßig `[Spec]` angenommen. [Ready]

##### Item: Formulierungen sind fachlich präzise und überprüfbar. [Ready]

### Use Case: Der Fortschritt wird über Status geführt [Ready]

#### Story: Statushierarchie bleibt logisch konsistent [Ready]

##### Item: Ein Elternknoten darf nicht `[Done]` sein, solange untergeordnete Knoten nicht `[Done]` sind. [Ready]

##### Item: `Feature [Done]` ist nur zulässig, wenn alle enthaltenen Use Cases, Stories und Items `[Done]` sind. [Ready]

##### Item: `Use Case [Done]` ist nur zulässig, wenn alle enthaltenen Stories und Items `[Done]` sind. [Ready]

##### Item: `Story [Done]` ist nur zulässig, wenn alle enthaltenen Items `[Done]` sind. [Ready]

## Use Case: Änderungsmodus für bestehende Features [Ready]

### Use Case: Eine bereits implementierte Funktion wird fachlich nachgezogen [Ready]

#### Story: Statusstart wird korrekt gesetzt [Ready]

##### Item: Bei normalen Spezifikationsupdates ist der Startstatus `[Spec]`. [Ready]

##### Item: Bei Reverse-Engineering aus bestehendem Code ist der Startstatus `[Impl]`. [Ready]

##### Item: Änderungen werden als neue Story oder klarer Änderungsblock dokumentiert, statt frühere Aussagen stillschweigend zu überschreiben. [Ready]

## Use Case: TODO-Markierung für offene Punkte [Ready]

### Use Case: Offene Diskussionen werden innerhalb der Spezifikation kenntlich gemacht [Ready]

#### Story: TODO wird als Diskussionsmarker verwendet [Ready]

##### Item: Das Inline-Label `TODO` markiert Inhalte als noch zu diskutieren und nicht final entschieden. [Ready]

##### Item: Alles, was nach `TODO` auf derselben Zeile steht, gilt als offener Diskussionsinhalt. [Ready]

##### Item: Bei Zeilenumbruch gehört der visuell überlaufende Fortsetzungstext weiterhin zum selben TODO-Hinweis. [Ready]

## Use Case: Beispiel A - Fachliche Entitäten definieren [Spec]

### Use Case: Eine Spezifikation beschreibt neue Business-Entitäten [Spec]

#### Story: Das Domänenmodell wird verständlich und konsistent beschrieben [Spec]

##### Item: Entität mit Zweck, Schlüsseln und Beziehungen definieren. [Spec]
Beispiel: Die Entität `Perfusionsprotokoll` wird über `ID` eindeutig identifiziert, gehört genau zu einer `Koordination` und referenziert optional ein `Organ`.

##### Item: Attribute mit Datentyp, Pflichtgrad und Bedeutung definieren. [Spec]
Beispiel: `perfusionsart` (Enum, Pflicht), `startzeit` (Zeitstempel, optional), `kommentar` (Text, optional).

##### Item: Lebenszyklus und Änderungsregeln der Entität definieren. [Spec]
Beispiel: Ein `Perfusionsprotokoll` darf nur im Status `offen` geändert werden; nach `abgeschlossen` nur über einen expliziten Korrekturprozess.

## Use Case: Beispiel B - Komplexe Logik mit Verzweigungen definieren [Spec]

### Use Case: Eine Spezifikation beschreibt regelbasierte Entscheidungen [Spec]

#### Story: Fachliche Bedingungen werden deterministisch dokumentiert [Spec]

##### Item: Verzweigungslogik mit klaren Wenn-Dann-Regeln definieren. [Spec]
Beispiel: Wenn `Organ = Lunge`, dann ist `perfusionsart` aus `{EVLP, keine}` wählbar; wenn `Organ = Leber`, dann aus `{HOPE, NMP, keine}`.

##### Item: Prioritäten und Konfliktauflösung bei mehreren Regeln definieren. [Spec]
Beispiel: Eine organspezifische Regel hat Vorrang vor einer allgemeinen Regel.

##### Item: Fehler- und Grenzfälle explizit beschreiben. [Spec]
Beispiel: Bei fehlenden Pflichtangaben wird der Vorgang fachlich abgelehnt.

##### Item: Verzweigungen zusätzlich als Bullet-Layout darstellen, wenn dies die Lesbarkeit erhöht. [Spec]
Beispiel-Layout:
- Eingangszustand: `Organ`, `Status`, `Pflichtfelder`
- Wenn `Organ = Lunge`: erlaube `EVLP`
- Wenn `Organ = Leber`: erlaube `HOPE` oder `NMP`
- Wenn `is_rejected = true`: stoppe weitere Empfängerzuordnung
- Sonst: fahre mit Standardprozess fort

## Use Case: Beispiel C - Architekturelle Anforderungen definieren [Spec]

### Use Case: Eine Spezifikation legt technische Leitplanken fest [Spec]

#### Story: Die Umsetzung bleibt über Module hinweg konsistent [Spec]

##### Item: Verantwortlichkeiten pro Schicht festlegen. [Spec]
Beispiel: Router-Schicht validiert Transport und Rechte, Service-Schicht enthält Geschäftslogik, Persistenzschicht verwaltet Integrität und Beziehungen.

##### Item: Integrations- und Schnittstellenregeln festlegen. [Spec]
Beispiel: Externe Systeme werden über dedizierte Adapter-Module angebunden; externe Feldnamen werden nicht ungeprüft in interne API-Verträge übernommen.

##### Item: Qualitäts- und Nachweisanforderungen festlegen. [Spec]
Beispiel: Für jede neue fachliche Regel werden mindestens ein positiver und ein negativer Testfall spezifiziert.
