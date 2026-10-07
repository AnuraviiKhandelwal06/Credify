import pandas as pd
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.transaction import Transaction
from app.models.credit_analysis import CreditAnalysis
from app.schemas.analysis import AnalysisResponse, AnalysisHistoryItem, TransactionSchema
from app.services.financial_analyzer import analyze_statement_transactions

router = APIRouter(prefix="/analysis", tags=["Credit Analysis"])

@router.post("/{document_id}", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
def run_credit_analysis(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify document ownership
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if doc.processing_status == "FAILED":
        raise HTTPException(status_code=400, detail="Cannot analyze a document that failed processing.")

    # Retrieve document transactions
    db_transactions = db.query(Transaction).filter(Transaction.document_id == doc.id).all()
    if not db_transactions:
        raise HTTPException(status_code=400, detail="No transactions found for this document.")

    # Convert to DataFrame
    tx_dicts = [
        {
            "date": tx.transaction_date,
            "description": tx.description,
            "amount": tx.amount,
            "transaction_type": tx.transaction_type,
            "balance": tx.balance
        }
        for tx in db_transactions
    ]
    df_tx = pd.DataFrame(tx_dicts)

    # Run Analysis & ML Predictor
    result = analyze_statement_transactions(df_tx)
    metrics = result["financial_metrics"]
    probs = result["risk_probabilities"]

    # Check if analysis already exists for this document
    existing_analysis = db.query(CreditAnalysis).filter(CreditAnalysis.document_id == doc.id).first()
    if existing_analysis:
        analysis_obj = existing_analysis
        analysis_obj.credit_score = result["credit_score"]
        analysis_obj.risk_category = result["risk_category"]
        analysis_obj.risk_low_probability = probs["Low"]
        analysis_obj.risk_medium_probability = probs["Medium"]
        analysis_obj.risk_high_probability = probs["High"]
        analysis_obj.total_income = result["total_income"]
        analysis_obj.total_expense = result["total_expense"]
        analysis_obj.average_balance = metrics["average_balance"]
        analysis_obj.transaction_count = metrics["transaction_count"]
        analysis_obj.savings_rate = metrics["savings_rate"]
        analysis_obj.expense_ratio = metrics["expense_ratio"]
        analysis_obj.income_stability = metrics["income_stability"]
        analysis_obj.large_transaction_count = metrics["large_transaction_count"]
        analysis_obj.negative_balance_count = metrics["negative_balance_count"]
        analysis_obj.score_explanation = result["score_explanation"]
    else:
        analysis_obj = CreditAnalysis(
            user_id=current_user.id,
            document_id=doc.id,
            credit_score=result["credit_score"],
            risk_category=result["risk_category"],
            risk_low_probability=probs["Low"],
            risk_medium_probability=probs["Medium"],
            risk_high_probability=probs["High"],
            total_income=result["total_income"],
            total_expense=result["total_expense"],
            average_balance=metrics["average_balance"],
            transaction_count=metrics["transaction_count"],
            savings_rate=metrics["savings_rate"],
            expense_ratio=metrics["expense_ratio"],
            income_stability=metrics["income_stability"],
            large_transaction_count=metrics["large_transaction_count"],
            negative_balance_count=metrics["negative_balance_count"],
            score_explanation=result["score_explanation"]
        )
        db.add(analysis_obj)

    db.commit()
    db.refresh(analysis_obj)

    # Build response
    tx_schemas = [TransactionSchema.model_validate(tx) for tx in db_transactions]
    
    unique_months = len(set(
        t.transaction_date[:7] for t in tx_schemas 
        if t.transaction_date and len(t.transaction_date) >= 7
    ))
    months_count = max(1, unique_months)

    return AnalysisResponse(
        id=analysis_obj.id,
        user_id=analysis_obj.user_id,
        document_id=analysis_obj.document_id,
        credit_score=analysis_obj.credit_score,
        risk_category=analysis_obj.risk_category,
        risk_probabilities={
            "Low": analysis_obj.risk_low_probability,
            "Medium": analysis_obj.risk_medium_probability,
            "High": analysis_obj.risk_high_probability
        },
        financial_metrics={
            "monthly_income": round(analysis_obj.total_income / months_count, 2),
            "monthly_expenses": round(analysis_obj.total_expense / months_count, 2),
            "savings_rate": analysis_obj.savings_rate,
            "average_balance": analysis_obj.average_balance,
            "transaction_count": analysis_obj.transaction_count,
            "credit_transaction_count": sum(1 for t in tx_schemas if t.transaction_type == "CREDIT"),
            "debit_transaction_count": sum(1 for t in tx_schemas if t.transaction_type == "DEBIT"),
            "income_stability": analysis_obj.income_stability,
            "expense_ratio": analysis_obj.expense_ratio,
            "large_transaction_count": analysis_obj.large_transaction_count,
            "negative_balance_count": analysis_obj.negative_balance_count
        },
        score_explanation=analysis_obj.score_explanation or "",
        created_at=analysis_obj.created_at,
        file_name=doc.file_name,
        transactions=tx_schemas
    )

@router.get("/history", response_model=List[AnalysisHistoryItem])
def get_analysis_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analyses = db.query(CreditAnalysis).filter(CreditAnalysis.user_id == current_user.id).order_by(CreditAnalysis.created_at.desc()).all()
    history = []
    for a in analyses:
        doc = db.query(Document).filter(Document.id == a.document_id).first()
        file_name = doc.file_name if doc else "Document"
        history.append(AnalysisHistoryItem(
            id=a.id,
            document_id=a.document_id,
            file_name=file_name,
            credit_score=a.credit_score,
            risk_category=a.risk_category,
            total_income=a.total_income,
            total_expense=a.total_expense,
            created_at=a.created_at
        ))
    return history

@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_by_id(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analysis_obj = db.query(CreditAnalysis).filter(
        ((CreditAnalysis.id == analysis_id) | (CreditAnalysis.document_id == analysis_id)),
        CreditAnalysis.user_id == current_user.id
    ).order_by(CreditAnalysis.id.desc()).first()
    if not analysis_obj:
        raise HTTPException(status_code=404, detail="Analysis record not found.")


    doc = db.query(Document).filter(Document.id == analysis_obj.document_id).first()
    db_transactions = db.query(Transaction).filter(Transaction.document_id == analysis_obj.document_id).all()
    tx_schemas = [TransactionSchema.model_validate(tx) for tx in db_transactions]

    unique_months = len(set(
        t.transaction_date[:7] for t in tx_schemas 
        if t.transaction_date and len(t.transaction_date) >= 7
    ))
    months_count = max(1, unique_months)

    return AnalysisResponse(
        id=analysis_obj.id,
        user_id=analysis_obj.user_id,
        document_id=analysis_obj.document_id,
        credit_score=analysis_obj.credit_score,
        risk_category=analysis_obj.risk_category,
        risk_probabilities={
            "Low": analysis_obj.risk_low_probability,
            "Medium": analysis_obj.risk_medium_probability,
            "High": analysis_obj.risk_high_probability
        },
        financial_metrics={
            "monthly_income": round(analysis_obj.total_income / months_count, 2),
            "monthly_expenses": round(analysis_obj.total_expense / months_count, 2),
            "savings_rate": analysis_obj.savings_rate,
            "average_balance": analysis_obj.average_balance,
            "transaction_count": analysis_obj.transaction_count,
            "credit_transaction_count": sum(1 for t in tx_schemas if t.transaction_type == "CREDIT"),
            "debit_transaction_count": sum(1 for t in tx_schemas if t.transaction_type == "DEBIT"),
            "income_stability": analysis_obj.income_stability,
            "expense_ratio": analysis_obj.expense_ratio,
            "large_transaction_count": analysis_obj.large_transaction_count,
            "negative_balance_count": analysis_obj.negative_balance_count
        },
        score_explanation=analysis_obj.score_explanation or "",
        created_at=analysis_obj.created_at,
        file_name=doc.file_name if doc else "Bank Statement",
        transactions=tx_schemas
    )
