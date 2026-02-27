from fastapi import APIRouter

from ..features.support_ticket import get_support_ticket_email
from ..schemas import SupportTicketConfigResponse

router = APIRouter(prefix="/support-ticket", tags=["support_ticket"])


@router.get("/config", response_model=SupportTicketConfigResponse)
def get_support_ticket_config():
    return SupportTicketConfigResponse(support_email=get_support_ticket_email())
