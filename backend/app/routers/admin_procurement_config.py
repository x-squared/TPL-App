from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import require_admin
from ..database import get_db
from ..features.coordination_procurement_admin import (
    create_field_group_template as create_field_group_template_service,
    create_field_scope_template as create_field_scope_template_service,
    create_field_template as create_field_template_service,
    delete_field_group_template as delete_field_group_template_service,
    delete_field_scope_template as delete_field_scope_template_service,
    get_procurement_admin_config as get_procurement_admin_config_service,
    update_field_group_template as update_field_group_template_service,
    update_field_template as update_field_template_service,
)
from ..models import User
from ..schemas import (
    CoordinationProcurementAdminConfigResponse,
    CoordinationProcurementFieldGroupTemplateCreate,
    CoordinationProcurementFieldGroupTemplateResponse,
    CoordinationProcurementFieldGroupTemplateUpdate,
    CoordinationProcurementFieldScopeTemplateCreate,
    CoordinationProcurementFieldScopeTemplateResponse,
    CoordinationProcurementFieldTemplateCreate,
    CoordinationProcurementFieldTemplateResponse,
    CoordinationProcurementFieldTemplateUpdate,
)

router = APIRouter(prefix="/admin/procurement-config", tags=["admin_procurement_config"])


@router.get("/", response_model=CoordinationProcurementAdminConfigResponse)
def get_procurement_admin_config(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return get_procurement_admin_config_service(db=db)


@router.post("/groups", response_model=CoordinationProcurementFieldGroupTemplateResponse, status_code=201)
def create_field_group_template(
    payload: CoordinationProcurementFieldGroupTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return create_field_group_template_service(payload=payload, changed_by_id=current_user.id, db=db)


@router.patch("/groups/{group_template_id}", response_model=CoordinationProcurementFieldGroupTemplateResponse)
def update_field_group_template(
    group_template_id: int,
    payload: CoordinationProcurementFieldGroupTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return update_field_group_template_service(
        group_template_id=group_template_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )


@router.delete("/groups/{group_template_id}", status_code=204)
def delete_field_group_template(
    group_template_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    delete_field_group_template_service(group_template_id=group_template_id, db=db)


@router.post("/fields", response_model=CoordinationProcurementFieldTemplateResponse, status_code=201)
def create_field_template(
    payload: CoordinationProcurementFieldTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return create_field_template_service(payload=payload, changed_by_id=current_user.id, db=db)


@router.patch("/fields/{field_template_id}", response_model=CoordinationProcurementFieldTemplateResponse)
def update_field_template(
    field_template_id: int,
    payload: CoordinationProcurementFieldTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return update_field_template_service(
        field_template_id=field_template_id,
        payload=payload,
        changed_by_id=current_user.id,
        db=db,
    )


@router.delete("/fields/{field_template_id}", status_code=204)
def delete_field_template(
    field_template_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    raise HTTPException(status_code=422, detail="Field templates are protected and cannot be deleted")


@router.post("/scopes", response_model=CoordinationProcurementFieldScopeTemplateResponse, status_code=201)
def create_field_scope_template(
    payload: CoordinationProcurementFieldScopeTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return create_field_scope_template_service(payload=payload, changed_by_id=current_user.id, db=db)


@router.delete("/scopes/{scope_template_id}", status_code=204)
def delete_field_scope_template(
    scope_template_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    delete_field_scope_template_service(scope_template_id=scope_template_id, db=db)
