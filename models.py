from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy import Enum
from sqlalchemy.orm import relationship
from database import Base
import uuid
import enum


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    tenant_id = Column(String, ForeignKey("tenants.id"))
    role = Column(String, nullable=False, default="employee")
    name = Column(String, nullable=False)

    tenant = relationship("Tenant")

class TaskStatus(enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)

    assigned_to = Column(String, ForeignKey("users.id"))
    created_by = Column(String, ForeignKey("users.id"))

    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    due_date = Column(String, nullable=True)

    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)

    created_at = Column(String)
    updated_at = Column(String)

    tenant = relationship("Tenant")

class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    question = Column(String, nullable=False)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"))

    retrieval_count = Column(String)
    latency_ms = Column(String)

    created_at = Column(String)

class Policy(Base):
    __tablename__ = "policies"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String)
    tenant_id = Column(String)
    uploaded_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
