# Domain Concept Artifacts

This directory contains intent-level domain specifications that are independent from direct database implementation details.

## Artifacts

- `gen-domain.puml`: integrated GEN-centric overview across all defined domains.
- `gen-paths-domain.puml`: scenario/path-centric view (`P1..P6`) across domains.
- `pat-domain.puml`: PAT patient and medical-values domain concepts.
- `tplk-domain.puml`: TPLK episode/coordination/procurement workflow concepts.
- `koll-domain.puml`: KOLL colloquium, agenda, and participant concepts.
- `ltpl-domain.puml`: LTPL domain boundary/status in current model.
- `stcs-domain.puml`: STCS domain boundary/status in current model.
- `domain-sync-mapping.json`: conceptual-to-model alias and checker configuration.

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
plantuml spec/domain/gen-domain.puml
```

## Domain sync check

Run the conceptual-vs-model consistency check:

```bash
cd /Users/stephan/Workspace/TPL-App/backend
source .venv/bin/activate
cd /Users/stephan/Workspace/TPL-App
python -m qa.spec_tools.check_domain_sync
```

## Maintenance guidance

When changing domain behavior, update this model in the same change set if any of the following changes:

- concept added/removed/renamed
- conceptual relation/cardinality changed
- lifecycle or ownership intent changed
- business invariant changed

Use this as retrospective domain documentation and as an alignment aid between product language, backend model, and frontend behavior.
