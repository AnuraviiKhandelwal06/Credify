from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class TransactionSchema(BaseModel):
    id: Optional[int] = None
    transaction_date: Optional[str] = None
    description: Optional[str] = None
    amount: float
    transaction_type: str
    balance: float

    class Config:
        from_attributes = True

class FeatureMetrics(BaseModel):
    monthly_income: float
    monthly_expenses: float
    savings_rate: float
    average_balance: float
    transaction_count: int
    credit_transaction_count: int
    debit_transaction_count: int
    income_stability: float
    expense_ratio: float
    large_transaction_count: int
    negative_balance_count: int

class RiskProbabilities(BaseModel):
    Low: float
    Medium: float
    High: float

class AnalysisResponse(BaseModel):
    id: int
    user_id: int
    document_id: int
    credit_score: int
    risk_category: str
    risk_probabilities: RiskProbabilities
    financial_metrics: FeatureMetrics
    score_explanation: str
    created_at: datetime
    file_name: str
    transactions: List[TransactionSchema] = []

    class Config:
        from_attributes = True

class AnalysisHistoryItem(BaseModel):
    id: int
    document_id: int
    file_name: str
    credit_score: int
    risk_category: str
    total_income: float
    total_expense: float
    created_at: datetime

    class Config:
        from_attributes = True
