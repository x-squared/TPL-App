from pydantic import BaseModel


class SupportTicketConfigResponse(BaseModel):
    support_email: str
