from fastapi import FastAPI

from . import (
    absences,
    auth,
    catalogues,
    codes,
    contact_infos,
    diagnoses,
    episodes,
    medical_data,
    medical_values,
    patients,
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
    app.include_router(contact_infos.router, prefix="/api")
    app.include_router(absences.router, prefix="/api")
    app.include_router(diagnoses.router, prefix="/api")
    app.include_router(episodes.router, prefix="/api")
    app.include_router(medical_data.router, prefix="/api")
    app.include_router(medical_values.router, prefix="/api")
    app.include_router(codes.router, prefix="/api")
    app.include_router(catalogues.router, prefix="/api")
    app.include_router(users.router, prefix="/api")
    app.include_router(task_group_templates.router, prefix="/api")
    app.include_router(task_groups.router, prefix="/api")
    app.include_router(task_templates.router, prefix="/api")
    app.include_router(tasks.router, prefix="/api")
