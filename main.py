import token
from fastapi import FastAPI, Depends,HTTPException
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
import models
from typing import List
import schemas
from security import hash_password
from security import verify_password, create_access_token
from fastapi import Header, HTTPException
from security import decode_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import File, UploadFile
import shutil
import os
from pathlib import Path
from rag import store_chunks
from utils import extract_text_from_pdf, chunk_text
from rag import query_chunks, generate_answer
from datetime import datetime
from models import Task, TaskStatus
import time   
from models import QueryLog
from datetime import datetime
from security import create_refresh_token
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

Base.metadata.create_all(bind=engine)


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if credentials is None:
        return None

    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload


def get_current_user(
    current_user: dict | None = Depends(get_current_user_optional)
):
    if current_user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user

def require_roles(allowed_roles: list):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Permission denied")
        return current_user
    return role_checker

@app.get("/")
def root():
    return {"message": "HR RAG SaaS is running 🚀"}

@app.post("/tenants", response_model=schemas.TenantResponse)
def create_tenant(tenant: schemas.TenantCreate, db: Session = Depends(get_db)):
    new_tenant = models.Tenant(name=tenant.name)
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    return new_tenant

@app.get("/tenants", response_model=list[schemas.TenantResponse])
def get_tenants(db: Session = Depends(get_db)):
    return db.query(models.Tenant).all()



@app.post("/register", response_model=schemas.UserOut)
def register_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: dict | None = Depends(get_current_user_optional)
):
    # Check if tenant exists
    tenant = db.query(models.Tenant).filter(
        models.Tenant.id == user.tenant_id
    ).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Check if the target tenant already has users
    tenant_user = db.query(models.User).filter(
        models.User.tenant_id == user.tenant_id
    ).first()

    # If users already exist → only admin can create new users
    if tenant_user:
        if not current_user or current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admin can create users")
        if current_user.get("tenant_id") != user.tenant_id:
            raise HTTPException(status_code=403, detail="Cannot create users for another tenant")
        role = user.role
    else:
        # First user in a tenant becomes that tenant's admin.
        role = "admin"

    hashed_password = hash_password(user.password)

    new_user = models.User(
        email=user.email,
        password=hashed_password,
        tenant_id=user.tenant_id,
        role=role,
        name=user.name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.post("/login", response_model=schemas.TokenResponse)
def login(user: schemas.LoginRequest, db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
    "user_id": db_user.id,
    "tenant_id": db_user.tenant_id,
    "role": db_user.role
})

    refresh_token = create_refresh_token({
    "user_id": db_user.id,
    "tenant_id": db_user.tenant_id,
    "role": db_user.role
})

    return {
    "access_token": token,
    "refresh_token": refresh_token,
    "token_type": "bearer"
}



@app.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
    "user_id": current_user["user_id"],
    "tenant_id": current_user["tenant_id"],
    "role": current_user["role"]
}

from uuid import uuid4
from datetime import datetime

@app.post("/upload")
def upload_policy(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin", "hr"]))
):
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)

    original_filename = Path(file.filename).name
    stored_filename = f"{uuid4()}_{original_filename}"
    file_location = str(uploads_dir / stored_filename)

    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text
    text = extract_text_from_pdf(file_location)

    # Chunk text
    chunks = chunk_text(text)

    # Store in vector DB
    tenant_id = current_user["tenant_id"]
    store_chunks(chunks, tenant_id)

    # ✅ ADD THIS PART HERE (INSIDE FUNCTION)
    new_policy = models.Policy(
        id=str(uuid4()),
        filename=original_filename,
        tenant_id=current_user["tenant_id"],
        uploaded_by=current_user["user_id"],
        created_at=datetime.utcnow()
    )

    db.add(new_policy)
    db.commit()

    return {"message": "Document uploaded and processed successfully"}


@app.get("/policies", response_model=List[schemas.PolicyOut])
def get_policies(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin", "hr", "employee"]))
):
    policies = db.query(models.Policy).filter(
        models.Policy.tenant_id == current_user["tenant_id"]
    ).order_by(models.Policy.created_at.desc()).all()

    return policies
@app.post("/ask")
def ask_question(
    question: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin", "hr", "employee"]))
):
    tenant_id = current_user["tenant_id"]

    start_time = time.time()

    # --- Retrieval timing ---
    retrieval_start = time.time()
    chunks = query_chunks(question, tenant_id)
    retrieval_time = time.time() - retrieval_start

    if not chunks:
        return {
            "answer": "No relevant information found.",
            "sources": [],
            "confidence": 0.0,
            "latency_ms": int((time.time() - start_time) * 1000)
        }

    # --- Generation timing ---
    generation_start = time.time()
    answer = generate_answer(chunks, question)
    generation_time = time.time() - generation_start

    total_latency = int((time.time() - start_time) * 1000)

    log = QueryLog(
    question=question,
    tenant_id=current_user["tenant_id"],
    user_id=current_user["user_id"],
    retrieval_count=str(len(chunks)),
    latency_ms=str(total_latency),
    created_at=str(datetime.utcnow())
    )

    db.add(log)
    db.commit()

    return {
        "answer": answer,
        "sources": chunks[:3],   # top retrieved chunks
        "confidence": round(1 - retrieval_time, 2),  # simple proxy confidence
        "latency_ms": total_latency
    }

@app.post("/tasks", response_model=schemas.TaskResponse)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin", "hr"]))
):
    # Ensure assigned user exists within same tenant
    assigned_user = db.query(models.User).filter(
        models.User.id == task.assigned_to,
        models.User.tenant_id == current_user["tenant_id"]
    ).first()

    if not assigned_user:
        raise HTTPException(status_code=404, detail="Assigned user not found in tenant")

    new_task = Task(
        title=task.title,
        description=task.description,
        assigned_to=task.assigned_to,
        created_by=current_user["user_id"],
        status=TaskStatus.TODO,
        due_date=task.due_date,
        tenant_id=current_user["tenant_id"],
        created_at=str(datetime.utcnow()),
        updated_at=str(datetime.utcnow())
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task

@app.get("/tasks", response_model=list[schemas.TaskResponse])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin", "hr", "employee"]))
):
    tasks = db.query(Task).filter(
        Task.tenant_id == current_user["tenant_id"]
    ).all()

    return tasks

@app.put("/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: str,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin", "hr", "employee"]))
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.tenant_id == current_user["tenant_id"]
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Employee can only update their own tasks
    if current_user["role"] == "employee":
        if task.assigned_to != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Permission denied")

    # Update fields dynamically
    if task_update.title is not None:
        task.title = task_update.title

    if task_update.description is not None:
        task.description = task_update.description

    if task_update.status is not None:
        task.status = task_update.status

    if task_update.due_date is not None:
        task.due_date = task_update.due_date

    task.updated_at = str(datetime.utcnow())

    db.commit()
    db.refresh(task)

    return task

@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin", "hr"]))
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.tenant_id == current_user["tenant_id"]
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

    return {"message": "Task deleted successfully"}  


@app.get("/analytics/latency")
def get_latency_analytics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["admin", "hr"]))
):
    logs = db.query(QueryLog).filter(
        QueryLog.tenant_id == current_user["tenant_id"]
    ).all()

    if not logs:
        return {
            "tenant_id": current_user["tenant_id"],
            "average_latency_ms": 0,
            "total_queries": 0
        }

    total_latency = sum(int(log.latency_ms) for log in logs)
    avg_latency = total_latency / len(logs)

    return {
        "tenant_id": current_user["tenant_id"],
        "average_latency_ms": int(avg_latency),
        "total_queries": len(logs)
    }


@app.post("/refresh")
def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):

    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    new_access_token = create_access_token({
        "user_id": payload["user_id"],
        "tenant_id": payload["tenant_id"],
        "role": payload["role"]
    })

    return {
        "access_token": new_access_token
    }


@app.get("/users", response_model=List[schemas.UserOut])
def get_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Optional: restrict access
    if current_user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    users = db.query(models.User).filter(
        models.User.tenant_id == current_user["tenant_id"]
    ).all()

    return users
