import os
import sys

# Add root project path to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes.auth import router as auth_router
from app.routes.documents import router as documents_router
from app.routes.analysis import router as analysis_router

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Student-level financial document analysis and ML-based credit score estimation system.",
    version="1.0.0"
)

# CORS setup for Vite frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(analysis_router)

@app.get("/")
def root_status():
    return {
        "status": "online",
        "app": "Credify Financial Document & Credit Risk Analysis Engine",
        "disclaimer": "Credify Score is an estimated score generated using financial information extracted from the uploaded document and an ML-based risk assessment model. It is intended for educational and analytical purposes only."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
