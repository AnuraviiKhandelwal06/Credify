from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class CreditAnalysis(Base):
    __tablename__ = "credit_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)

    credit_score = Column(Integer, nullable=False) # 300 to 850
    risk_category = Column(String(50), nullable=False) # Low, Medium, High

    risk_low_probability = Column(Float, nullable=False, default=0.0)
    risk_medium_probability = Column(Float, nullable=False, default=0.0)
    risk_high_probability = Column(Float, nullable=False, default=0.0)

    total_income = Column(Float, nullable=False, default=0.0)
    total_expense = Column(Float, nullable=False, default=0.0)
    average_balance = Column(Float, nullable=False, default=0.0)
    transaction_count = Column(Integer, nullable=False, default=0)
    savings_rate = Column(Float, nullable=False, default=0.0)
    expense_ratio = Column(Float, nullable=False, default=0.0)

    income_stability = Column(Float, nullable=False, default=0.0)
    large_transaction_count = Column(Integer, nullable=False, default=0)
    negative_balance_count = Column(Integer, nullable=False, default=0)

    score_explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="analyses")
    document = relationship("Document", back_populates="analysis")