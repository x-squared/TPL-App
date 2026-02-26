from fastapi import FastAPI

from . import (
    absences,
    auth,
    catalogues,
    colloqium_agendas,
    colloqium_types,
    colloqiums,
    coordination_donors,
    coordination_episodes,
    coordination_organ_effects,
    coordination_procurements,
    coordination_procurement_hearts,
    coordination_procurement_heart_valves,
    coordination_procurement_intestines,
    coordination_procurement_islets,
    coordination_procurement_kidneys,
    coordination_procurement_livers,
    coordination_procurement_pancreases,
    coordination_time_logs,
    coordination_origins,
    coordinations,
    codes,
    contact_infos,
    diagnoses,
    episodes,
    favorites,
    medical_data,
    medical_values,
    patients,
    reports,
    task_group_templates,
    task_groups,
    task_templates,
    tasks,
    users,
)


def register_routers(app: FastAPI) -> None:
    """Register all API routers."""
    app.include_router(auth.router, prefix="/api")
    app.include_router(patients.router, prefix="/api")
    app.include_router(reports.router, prefix="/api")
    app.include_router(contact_infos.router, prefix="/api")
    app.include_router(absences.router, prefix="/api")
    app.include_router(diagnoses.router, prefix="/api")
    app.include_router(episodes.router, prefix="/api")
    app.include_router(favorites.router, prefix="/api")
    app.include_router(medical_data.router, prefix="/api")
    app.include_router(medical_values.router, prefix="/api")
    app.include_router(codes.router, prefix="/api")
    app.include_router(catalogues.router, prefix="/api")
    app.include_router(users.router, prefix="/api")
    app.include_router(colloqium_types.router, prefix="/api")
    app.include_router(colloqiums.router, prefix="/api")
    app.include_router(colloqium_agendas.router, prefix="/api")
    app.include_router(coordinations.router, prefix="/api")
    app.include_router(coordination_donors.router, prefix="/api")
    app.include_router(coordination_episodes.router, prefix="/api")
    app.include_router(coordination_organ_effects.router, prefix="/api")
    app.include_router(coordination_procurements.router, prefix="/api")
    app.include_router(coordination_procurement_hearts.router, prefix="/api")
    app.include_router(coordination_procurement_heart_valves.router, prefix="/api")
    app.include_router(coordination_procurement_intestines.router, prefix="/api")
    app.include_router(coordination_procurement_islets.router, prefix="/api")
    app.include_router(coordination_procurement_kidneys.router, prefix="/api")
    app.include_router(coordination_procurement_livers.router, prefix="/api")
    app.include_router(coordination_procurement_pancreases.router, prefix="/api")
    app.include_router(coordination_time_logs.router, prefix="/api")
    app.include_router(coordination_origins.router, prefix="/api")
    app.include_router(task_group_templates.router, prefix="/api")
    app.include_router(task_groups.router, prefix="/api")
    app.include_router(task_templates.router, prefix="/api")
    app.include_router(tasks.router, prefix="/api")
