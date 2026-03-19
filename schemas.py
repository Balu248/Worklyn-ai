from pydantic import BaseModel
from enum import Enum
from datetime import datetime


class TenantCreate(BaseModel):
    name: str


class TenantResponse(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: str
    password: str
    tenant_id: str
    role: str
    name: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    tenant_id: str
    name: str

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class TaskStatus(str, Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"

class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    assigned_to: str
    due_date: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    due_date: str | None = None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str | None
    assigned_to: str
    created_by: str
    status: TaskStatus
    due_date: str | None
    tenant_id: str
    created_at: str | None
    updated_at: str | None

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: str
    email: str
    role: str
    tenant_id: str
    name: str

    class Config:
        from_attributes = True


class PolicyOut(BaseModel):
    id: str
    filename: str
    tenant_id: str
    uploaded_by: str
    created_at: datetime | None

    class Config:
        from_attributes = True
