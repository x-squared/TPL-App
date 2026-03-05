# TPL-Koordination-Spezifikation [Spec]

Dieses Dokument beschreibt den aktuell umgesetzten Stand der Koordinationsfunktionen an einer zentralen Stelle. Die fachlichen Anforderungen sind bewusst nicht nach UI/Backend getrennt, sondern nach Fachthemen strukturiert.

## Status-Legende [Ready]

- Spec = laufende Spezifikation
- Ready = bereit für Implementierung
- Impl = in Umsetzung
- QA = Testdefinition/Ausführung offen
- Done = abgeschlossen

## Topic: Koordination Laufzeitbetrieb (fachlich) [Done]

### Use Case: Organ pro Fall explizit ablehnen [Done]

#### Story: Ablehnung ist von Empfänger-Entkopplung getrennt modelliert [Done]

##### Item: Für jedes Organ kann ein eigener Ablehnungsstatus mit Begründungstext erfasst werden. [Done]

##### Item: Beim Ablehnen werden bestehende Empfängerzuordnungen des Organs entfernt. [Done]

##### Item: Solange ein Organ als abgelehnt markiert ist, sind neue Empfängerzuordnungen gesperrt. [Done]

##### Item: In der Zuordnungstabelle wird der Status als „Rejected“ statt „Discarded“ angezeigt. [Done]

### Use Case: Empfängerzuordnung über Slots MAIN/LEFT/RIGHT korrekt führen [Done]

#### Story: Slot-Regeln und Anzeige sind fachlich konsistent [Done]

##### Item: Eine Episode ist entweder MAIN oder LEFT/RIGHT zugeordnet, nicht in unzulässigen Mischkombinationen. [Done]

##### Item: Anzeige der Zuordnungstabelle folgt den Regeln: nur „Unassigned“ ohne Zuordnung, kein „MAIN“-Präfix bei MAIN, und bei LEFT/RIGHT nur relevante unbesetzte Hälfte. [Done]

#### Story: Zuordnungszustand synchronisiert ohne Inkonsistenzen [Done]

##### Item: Änderungen an Zuordnungen werden nach Speicherung sofort im Protokollzustand sichtbar. [Done]

##### Item: Doppelte Zuordnungen werden serverseitig bereinigt und im aggregierten Zustand defensiv abgefangen. [Done]

### Use Case: Geschäftsregeln für Organstatus und Entscheidungslogik [Done]

#### Story: Verzweigungen sind fachlich eindeutig beschrieben [Done]

##### Item: Branching-Regeln für Organstatus werden deterministisch angewendet. [Done]
Regel-Layout:
- Wenn `Organ abgelehnt = true`: entferne Zuordnungen, sperre neue Zuordnungen, erlaube Workflow-Bereinigung.
- Sonst wenn `Zuordnung MAIN vorhanden`: interpretiere Organ als zugeordnet, ohne LEFT/RIGHT-Mischbelegung.
- Sonst wenn `Zuordnung LEFT/RIGHT vorhanden`: zeige nur betroffene Slot-Sicht und fehlende Gegenhälfte.
- Sonst: Zustand ist fachlich „Unassigned“.

##### Item: Der Warnstatus pro Organ wird nur gesetzt, wenn beide Bedingungen erfüllt sind. [Done]
Regel: `Warnstatus = (offene Aufgaben > 0) UND (unerfasste Pflichtdaten > 0)`.

##### Item: Nach mutationsrelevanten Aktionen wird der fachliche Zustand sofort neu geladen. [Done]
Betroffene Aktionen: Zuordnung speichern, Ablehnung speichern, Workflow-Bereinigung auslösen.

### Use Case: Vollständigkeit 24h nach Explantation sicherstellen [Ready]

#### Story: 24h-Prüfung erzeugt gezielte Nacharbeitungsaufgaben pro Organ [Ready]

##### Item: 24 Stunden nach Explantationszeitpunkt startet das System eine Vollständigkeitsprüfung der Explantationsdaten je Organ. [Ready]

##### Item: Für jedes Organ mit fehlenden Explantationsdaten wird genau eine Aufgabe für die koordinierende Person erzeugt. [Ready]

##### Item: Existiert bereits eine offene Aufgabe für dieselbe Koordination und dasselbe Organ aus dieser 24h-Prüfung, wird keine Duplikat-Aufgabe erstellt. [Ready]

##### Item: Die Aufgabe enthält einen klaren Bezug auf Koordination und Organ sowie den Hinweis, welche Explantationsdaten noch fehlen. [Ready]

## Topic: Koordination Laufzeitbetrieb (Bedienung und Darstellung) [Done]

### Use Case: Arbeitsfortschritt pro Organ sichtbar machen [Done]

#### Story: Warnhinweis wird pro Organ-Tab statt global angezeigt [Done]

##### Item: Jeder Organ-Tab erhält einen roten Statusrahmen, wenn für dieses Organ gleichzeitig offene Aufgaben und noch nicht erfasste Daten vorliegen. [Done]

##### Item: Der Status wird bereits ohne vorherigen Tab-Klick durch initiales Laden aller sichtbaren Organzustände berechnet. [Done]

### Use Case: Organ-Workflow nach Ablehnung gezielt bereinigen [Impl]

#### Story: High-Risk-Aktion im Ablehnungsbereich ausführen [Impl]

##### Item: Im Ablehnungsbereich gibt es einen visuell deutlichen „Clear Organ Workflow“-Button, sichtbar nur bei abgelehntem Organ. [Done]

##### Item: Beim Ausführen werden verbleibende offene Aufgaben verworfen und offene Felder als erledigt behandelt; die Aufgabenansicht wird sofort aktualisiert. [Done]

##### Item: Die Persistenz des „Workflow bereinigt“-Zustands über Reloads hinweg ist umgesetzt. [Done]

### Use Case: Aufgabenanzeige bedarfsgerecht filtern [Done]

#### Story: Erledigte und abgebrochene Aufgaben optional einblenden [Done]

##### Item: Im Aufgabenbereich kann zwischen „nur offene Aufgaben“ und „inklusive erledigt/abgebrochen“ umgeschaltet werden. [Done]

### Use Case: Primäre und sekundäre Datengruppen klar anordnen [Done]

#### Story: Sekundäre Gruppen unterhalb der Hauptsektionen platzieren [Done]

##### Item: Gruppen werden in PRIMARY und SECONDARY aufgeteilt; SECONDARY wird unterhalb der oberen Hauptsektionen dargestellt. [Done]

##### Item: Sekundäre Boxen nutzen standardmäßig drei gleich breite Spalten und fallen auf schmaleren Breiten auf zwei Spalten zurück. [Done]

##### Item: Der Protokollbereich unterstützt horizontales Scrollen bei breiten Layouts. [Done]

##### Item: Die Höhe des Aufgabenpanels orientiert sich wieder an der linken Protokollspalte, damit die frühere visuelle Balance erhalten bleibt. [Done]

### Use Case: Empfängerbereich visuell konsistent führen [Done]

#### Story: Pflichtcharakter und Abschlusszustand eindeutig signalisieren [Done]

##### Item: Der Empfängerbereich ist als ausstehend markiert, bis eine gültige Auswahl getroffen wurde oder das Organ abgelehnt ist. [Done]

##### Item: Nach gültiger Auswahl bleibt kein roter Abschlussrahmen zurück. [Done]

## Topic: Koordination Admin-Konfiguration (separates Fachthema) [Done]

### Use Case: Gruppenkonfiguration vollständig im Admin pflegen [Done]

#### Story: Gruppen können erstellt, bearbeitet, verschoben und gelöscht werden [Done]

##### Item: Gruppen unterstützen Bearbeitung von Schlüssel, Name, Kommentar, Aktiv-Status, Lane und Position. [Done]

##### Item: In der Admin-Oberfläche sind PRIMARY- und SECONDARY-Lane klar getrennt dargestellt. [Done]

##### Item: Drag-and-drop funktioniert innerhalb einer Lane und zwischen Lanes; die Reihenfolge wird konsistent normalisiert. [Done]

##### Item: Serverseitig werden Gruppen bei Reorder lane-basiert und positionsbasiert stabil sortiert, sodass PRIMARY vor SECONDARY bleibt. [Done]

### Use Case: Feldsichtbarkeit nach Organ konfigurieren [Done]

#### Story: Scopes steuern, welche Felder je Organ sichtbar sind [Done]

##### Item: Feld-Scopes können als „alle Organe“ oder als spezifische Organ-Auswahl gepflegt werden. [Done]

##### Item: Die Protokollansicht rendert Felder nur dann, wenn der Scope zum aktiven Organ passt. [Done]

## Topic: Seed- und Konfigurationskonsistenz [Done]

### Use Case: Aktuelle Gruppen-/Felddefinition als Core-Seed sichern [Done]

#### Story: Core-Seed enthält den produktiv gepflegten Stand [Done]

##### Item: Für Gruppen, Felder und Feld-Scopes existieren Core-Datasets und Loader im Seed-System. [Done]

##### Item: Der aktuelle Datenbankstand der Gruppen- und Felddefinitionen wurde in den Core-Seed überführt und auf Gleichheit validiert. [Done]
