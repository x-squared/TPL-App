# STCS-Spezifikation [Spec]

Dieses Dokument beschreibt erste fachliche Anforderungen für STCS.

## Status-Legende [Ready]

- Spec = laufende Spezifikation
- Ready = bereit für Implementierung
- Impl = in Umsetzung
- QA = Testdefinition/Ausführung offen
- Done = abgeschlossen

## Topic: STCS-Patientenverwaltung [Spec]

### Use Case: Patient aus Empfängerliste anlegen [Ready]

#### Story: Vollständige Übernahme von Stammdaten [Ready]

##### Item: Beim Anlegen werden Name, Vorname, Geburtsdatum und Referenznummer übernommen. [Ready]

##### Item: Die Herkunft (Empfängerliste) wird am Patienten nachvollziehbar gespeichert. [Ready]

##### Item: Bei fehlenden Pflichtdaten wird keine Anlage ausgeführt und ein klarer Hinweis angezeigt. [Ready]

#### Story: Duplikatsschutz bei der Anlage [Spec]

##### Item: Vor dem Speichern wird auf potenzielle Duplikate (z. B. gleiche Referenznummer) geprüft. [Spec]

##### Item: Bei potenziellen Duplikaten kann der Benutzer abbrechen oder bewusst fortfahren. [Spec]

### Use Case: Patientenstammdaten aktualisieren [Spec]

#### Story: Nachvollziehbare Änderungshistorie [Spec]

##### Item: Änderungen an relevanten Stammdaten werden mit Zeitstempel und Benutzer dokumentiert. [Spec]

##### Item: Vorher/Nachher-Werte sind für berechtigte Rollen einsehbar. [Spec]

## Topic: STCS Follow-Up Management [Spec]

### Use Case: Follow-Up Termin planen [Ready]

#### Story: Standardisierte Terminplanung [Ready]

##### Item: Follow-Up Termin kann mit Datum, Uhrzeit, Typ und Kommentar erfasst werden. [Ready]

##### Item: Der Termin wird dem korrekten Patienten eindeutig zugeordnet. [Ready]

#### Story: Erinnerungsstatus verwalten [Spec]

##### Item: Termin kann als offen, erinnert oder abgeschlossen markiert werden. [Spec]

##### Item: Überfällige offene Termine werden in der Liste hervorgehoben. [Spec]

### Use Case: Follow-Up Ergebnis dokumentieren [Spec]

#### Story: Strukturierte Ergebnisdokumentation [Spec]

##### Item: Ergebnistext, klinische Bewertung und nächster geplanter Schritt können gespeichert werden. [Spec]

##### Item: Abschluss eines Follow-Ups setzt den Status automatisch auf abgeschlossen. [Spec]
