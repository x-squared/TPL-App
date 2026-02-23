from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ItemBase(BaseModel):
    title: str
    description: str = ""
    completed: bool = False


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    completed: bool | None = None


class ItemResponse(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None
