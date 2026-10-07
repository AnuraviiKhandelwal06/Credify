from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    transaction_date = Column(String(50), nullable=True)
    description = Column(String(500), nullable=True)
    amount = Column(Float, nullable=False, default=0.0)
    transaction_type = Column(String(20), nullable=False) # CREDIT or DEBIT
    balance = Column(Float, nullable=False, default=0.0)

    document = relationship("Document", back_populates="transactions")
