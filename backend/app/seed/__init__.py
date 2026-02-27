from typing import Any

from sqlalchemy.orm import Session

from .loader import SeedJob, SeedRunner
from .loaders.core import (
    sync_access_permissions,
    sync_catalogues,
    sync_codes,
    sync_colloqium_types_core,
    sync_coordination_procurement_field_scopes,
    sync_coordination_procurement_field_templates,
    sync_datatype_definitions,
    sync_information_core,
    sync_medical_value_groups,
    sync_medical_value_templates,
    sync_people_core,
    sync_users_core,
    sync_users_sample,
)
from .loaders.sample import (
    sync_colloqiums,
    sync_patients,
    sync_task_templates,
    sync_tasks,
)
from .profiles import resolve_seed_categories


def get_seed_jobs() -> tuple[SeedJob, ...]:
    """Seed registry used by the profile-based seed runner."""
    return (
        SeedJob(
            key="core.codes",
            category="core",
            description="Load CODE reference data",
            loader=sync_codes,
        ),
        SeedJob(
            key="core.catalogues",
            category="core",
            description="Load CATALOGUE reference data",
            loader=sync_catalogues,
        ),
        SeedJob(
            key="core.users",
            category="core",
            description="Load core users",
            loader=sync_users_core,
        ),
        SeedJob(
            key="core.access_permissions",
            category="core",
            description="Load RBAC permissions and role mappings",
            loader=sync_access_permissions,
        ),
        SeedJob(
            key="core.people",
            category="core",
            description="Load people and teams",
            loader=sync_people_core,
        ),
        SeedJob(
            key="core.colloqium_types",
            category="core",
            description="Load colloquium type definitions",
            loader=sync_colloqium_types_core,
        ),
        SeedJob(
            key="core.information",
            category="core",
            description="Load information rows",
            loader=sync_information_core,
        ),
        SeedJob(
            key="core.datatype_definitions",
            category="core",
            description="Load datatype definitions metadata",
            loader=sync_datatype_definitions,
        ),
        SeedJob(
            key="core.medical_value_groups",
            category="core",
            description="Load medical value groups",
            loader=sync_medical_value_groups,
        ),
        SeedJob(
            key="core.medical_value_templates",
            category="core",
            description="Load medical value templates",
            loader=sync_medical_value_templates,
        ),
        SeedJob(
            key="core.coordination_procurement_field_templates",
            category="core",
            description="Load procurement field templates",
            loader=sync_coordination_procurement_field_templates,
        ),
        SeedJob(
            key="core.coordination_procurement_field_scopes",
            category="core",
            description="Load procurement field scopes",
            loader=sync_coordination_procurement_field_scopes,
        ),
        SeedJob(
            key="sample.users",
            category="sample",
            description="Load demo users",
            loader=sync_users_sample,
        ),
        SeedJob(
            key="sample.task_templates",
            category="sample",
            description="Load demo task templates",
            loader=sync_task_templates,
        ),
        SeedJob(
            key="sample.colloqiums",
            category="sample",
            description="Load demo colloquiums",
            loader=sync_colloqiums,
        ),
        SeedJob(
            key="sample.patients",
            category="sample",
            description="Load demo patients and episodes",
            loader=sync_patients,
        ),
        SeedJob(
            key="sample.tasks",
            category="sample",
            description="Load demo tasks",
            loader=sync_tasks,
        ),
    )


def run_seed_profile(db: Session, app_env: str | None, seed_profile: str | None = None) -> dict[str, Any]:
    """
    Run registered seed jobs based on resolved environment/profile categories.

    Returns execution metadata for startup logging.
    """
    resolved_env, categories = resolve_seed_categories(app_env, seed_profile)
    runner = SeedRunner(get_seed_jobs())
    executed = runner.run(db, include_categories=categories)
    return {
        "environment": resolved_env,
        "categories": list(categories),
        "executed_jobs": executed,
    }
