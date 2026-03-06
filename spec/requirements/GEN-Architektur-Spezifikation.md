# Feature [GEN]: Architektur

## Spezifikationen

- [GEN-Architektur-Backlog](./GEN-Architektur-Backlog.md)

Dieses Feature macht die Vorgaben an die Architektur der App.

## Use Case: {architecture} Datenarchitektur [Spec]

### Story: {architecture} Datenobjekte [Spec]

#### Item: {architecture} Bewegungsdaten [Spec]

#### Item: {architecture} Standardattribute [Spec]
Alle Bewegungsdaten enthalten Standardattribute.
- CREATED_BY_ID (ID eines Users): Der Nutzer, der den Datensatz angelegt hat.
- CREATED_AT (Timestamp): Zeitpunkt der ersten Erstellung.
- CHANGED_BY_ID (ID eines Users): Der Nutzer, der die letzte Änderung gemacht hat.
- CHANGED_AT (Timestamp): Zeitpunkt der letzten Änderung.
- ROW_VERSION (Integer): Wird für Optimistic-Locking verwendet.

## Use Case: {architecture} Prozesssteuerung [Spec]

### Story: {architecture} UI-Prozesse steuern [Spec]
UI-Prozesse werden durch das Backend gesteuert. Folgende Regeln beschreiben die Erwartungen.

#### Item: {architecture} Keine Prozesslogik in der GUI [Spec]
Prozessschritte sollten nur in sehr einfachen Fällen in der GUI abgebildet werden. Komplexere Abläufe werden ausschließlich über eine Backend-Steuerung umgesetzt.



