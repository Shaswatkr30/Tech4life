from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from .database import Base, engine
from . import models

from routers import hospitals, blood, icu, organs, equipment, admin, hospital_admin, auth_recovery, emergencies

Base.metadata.create_all(bind=engine)
with engine.begin() as connection:
    admin_columns = {column["name"] for column in inspect(connection).get_columns("admins")}
    if "email" not in admin_columns:
        connection.execute(text("ALTER TABLE admins ADD COLUMN email VARCHAR(150)"))
    connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_admins_email ON admins (email)"))

    emergency_columns = {
        column["name"]
        for column in inspect(connection).get_columns("emergency_requests")
    }
    if "location_accuracy_m" not in emergency_columns:
        connection.execute(text(
            "ALTER TABLE emergency_requests "
            "ADD COLUMN location_accuracy_m FLOAT NOT NULL DEFAULT 0"
        ))

app = FastAPI(
    title="Tech4Life API",
    description="Hospital Resource Management and Integration Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
          "https://tech4life-frontend.vercel.app"
    ],
    # Vite automatically moves to the next port when 5173 is already in use.
    # Allow local development origins on those fallback ports as well.
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hospitals.router)
app.include_router(blood.router)
app.include_router(icu.router)
app.include_router(organs.router)
app.include_router(equipment.router)
app.include_router(admin.router)
app.include_router(hospital_admin.router)
app.include_router(auth_recovery.router)
app.include_router(emergencies.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to Tech4Life API",
        "status": "running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
