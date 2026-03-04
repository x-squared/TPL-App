# Domain Concept Artifacts

This directory contains intent-level domain specifications that are independent from direct database implementation details.

## Artifacts

- `conceptual-domain-model.puml`: high-level integrated conceptual model.
- `conceptual-paths.puml`: scenario/path-centric conceptual view across domains.
- `identity-access-domain.puml`: identity, role, and permission concepts.
- `patient-care-domain.puml`: patient, episode, and medical value concepts.
- `colloquiums-domain.puml`: colloquium type, colloquium, agenda, and participant concepts.
- `coordinations-domain.puml`: coordination, donor/procurement, episode links, and logs.
- `tasking-domain.puml`: task templates, task groups, tasks, and context links.
- `communication-ux-domain.puml`: information/read-state and favorites concepts.

## Scope

The conceptual model captures:

- core domain concepts (business entities)
- conceptual edges between concepts
- cardinality intent where it is stable and known
- selected domain invariants as notes

The conceptual model intentionally does not capture:

- table names, column names, indexes, or ORM mechanics
- transport details (request/response payload structure)
- full technical constraints needed only for persistence/runtime performance

## How to render

Example with PlantUML installed locally:

```bash
plantuml spec/domain/conceptual-domain-model.puml
```

## Maintenance guidance

When changing domain behavior, update this model in the same change set if any of the following changes:

- concept added/removed/renamed
- conceptual relation/cardinality changed
- lifecycle or ownership intent changed
- business invariant changed

Use this as retrospective domain documentation and as an alignment aid between product language, backend model, and frontend behavior.
