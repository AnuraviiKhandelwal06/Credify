from app.routes.auth import router as auth_router
from app.routes.documents import router as documents_router
from app.routes.analysis import router as analysis_router

__all__ = ["auth_router", "documents_router", "analysis_router"]
