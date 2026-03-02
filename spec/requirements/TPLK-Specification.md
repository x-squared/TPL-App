# Ziel [Spec]

Dieses Dokument ist die übergeordnete Spezifikation für fachliche TPLK-Dokumente unter `spec/requirements/`.

# Strukturstandard für alle Spezifikationsdokumente [Ready]

Jedes Spezifikationsdokument folgt derselben Hierarchie:

1. Topic
2. Use Case
3. Story
4. Item

Jede Ebene muss ein Label tragen.

# Zulässige Labels [Ready]

- `Spec`: laufende Spezifikation, fachlich noch in Ausarbeitung
- `Ready`: fachlich bereit für Implementierung
- `Impl`: in Implementierung
- `QA`: Implementierung fertig, QA-Tests noch ausstehend
- `Done`: abgeschlossen inklusive QA

# Label-Darstellung (Markdown) [Ready]

Labels werden direkt als Status-Token am Ende der Überschrift gepflegt:

- `# Überschrift [Spec]`
- `## Überschrift [Ready]`
- `### Überschrift [Impl]`
- `#### Überschrift [QA]`
- `##### Überschrift [Done]`

## Status-Legende [Ready]

- Spec = laufende Spezifikation
- Ready = bereit für Implementierung
- Impl = in Umsetzung
- QA = Testdefinition/Ausführung offen
- Done = abgeschlossen

# Vorlage (Skelett) [Spec]

## Topic: <Topic-Name> [Spec]

### Use Case: <Use-Case-Name> [Spec]

#### Story: <Story-Name> [Spec]

##### Item: <konkrete Anforderung 1> [Spec]

##### Item: <konkrete Anforderung 2> [Spec]

# Dokumente [Spec]

- `STCS-Spezifikation.md`
- `Interface-Spezifikation.md`
- `LTPL-Spezifikation.md`
