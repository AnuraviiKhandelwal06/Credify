from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DocumentBase(BaseModel):
    file_name: str
    file_type: str

class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    uploaded_at: datetime
    processing_status: str

    class Config:
        from_attributes = True
