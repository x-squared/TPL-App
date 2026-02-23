from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, SessionLocal, engine
from .routers import absences, auth, catalogues, codes, contact_infos, diagnoses, episodes, medical_data, medical_values, patients, users
from .seed import sync_catalogues, sync_codes, sync_medical_value_templates, sync_patients, sync_users


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        sync_codes(db)
        sync_catalogues(db)
        sync_users(db)
        sync_patients(db)
        sync_medical_value_templates(db)
    finally:
        db.close()
    yield


app = FastAPI(title="TPL App", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
