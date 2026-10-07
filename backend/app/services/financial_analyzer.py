import pandas as pd
from app.services.feature_engineering import generate_financial_features
from app.services.credit_predictor import predict_credit_risk_and_score

def analyze_statement_transactions(df_transactions: pd.DataFrame) -> dict:
    """
    Takes standardized transactions DataFrame, extracts features,
    runs ML prediction model, and computes total metrics.
    """
    # 1. Feature Engineering
    features = generate_financial_features(df_transactions)

    # 2. ML Prediction & Credify Score Calculation
    ml_result = predict_credit_risk_and_score(features)

    # 3. Aggregates for convenience
    credits = df_transactions[df_transactions['transaction_type'] == 'CREDIT']
    debits = df_transactions[df_transactions['transaction_type'] == 'DEBIT']

    total_income = float(credits['amount'].sum()) if not credits.empty else 0.0
    total_expense = float(debits['amount'].sum()) if not debits.empty else 0.0

    return {
        "credit_score": ml_result["credit_score"],
        "risk_category": ml_result["risk_category"],
        "risk_probabilities": ml_result["risk_probabilities"],
        "score_explanation": ml_result["score_explanation"],
        "financial_metrics": features,
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "average_balance": features["average_balance"],
        "transaction_count": features["transaction_count"],
        "savings_rate": features["savings_rate"],
        "expense_ratio": features["expense_ratio"],
        "income_stability": features["income_stability"],
        "large_transaction_count": features["large_transaction_count"],
        "negative_balance_count": features["negative_balance_count"]
    }
