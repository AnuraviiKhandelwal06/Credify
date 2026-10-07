from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # csv or pdf
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processing_status = Column(String(50), default="PROCESSED") # PENDING, PROCESSED, FAILED

    user = relationship("User", back_populates="documents")
    transactions = relationship("Transaction", back_populates="document", cascade="all, delete-orphan")
    analysis = relationship("CreditAnalysis", back_populates="document", uselist=False, cascade="all, delete-orphan")
