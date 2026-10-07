import pandas as pd
import numpy as np

FEATURE_COLUMNS = [
    "monthly_income",
    "monthly_expenses",
    "savings_rate",
    "average_balance",
    "transaction_count",
    "credit_transaction_count",
    "debit_transaction_count",
    "income_stability",
    "expense_ratio",
    "large_transaction_count",
    "negative_balance_count"
]

def extract_features_from_transactions(df: pd.DataFrame) -> dict:
    """
    Extract financial features from a DataFrame of transactions.
    Expected columns in df:
    ['date', 'description', 'amount', 'transaction_type', 'balance']
    where transaction_type is 'CREDIT' or 'DEBIT'.
    """
    if df.empty:
        return {col: 0.0 for col in FEATURE_COLUMNS}

    # Ensure transaction_type is uppercase
    df['transaction_type'] = df['transaction_type'].astype(str).str.upper()
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0.0)
    df['balance'] = pd.to_numeric(df['balance'], errors='coerce').fillna(0.0)
    
    # Date parsing for monthly calculations
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
    else:
        df['date'] = pd.Timestamp.today()
        
    df['month'] = df['date'].dt.to_period('M')
    num_months = max(1, df['month'].nunique())

    # Credits & Debits
    credits = df[df['transaction_type'] == 'CREDIT']
    debits = df[df['transaction_type'] == 'DEBIT']

    total_income = float(credits['amount'].sum())
    total_expenses = float(debits['amount'].sum())

    monthly_income = total_income / num_months
    monthly_expenses = total_expenses / num_months

    # Savings Rate & Expense Ratio
    if monthly_income > 0:
        savings_rate = (monthly_income - monthly_expenses) / monthly_income
        expense_ratio = monthly_expenses / monthly_income
    else:
        savings_rate = -1.0
        expense_ratio = 2.0  # High ratio if no income

    average_balance = float(df['balance'].mean()) if 'balance' in df.columns and len(df) > 0 else 0.0

    transaction_count = len(df)
    credit_transaction_count = len(credits)
    debit_transaction_count = len(debits)

    # Income Stability (Consistency across months)
    if num_months > 1 and not credits.empty:
        monthly_credits = credits.groupby('month')['amount'].sum()
        mean_credit = monthly_credits.mean()
        std_credit = monthly_credits.std()
        if mean_credit > 0 and not np.isnan(std_credit):
            # Coefficient of variation inverted to 0-1 range (1 = very stable, 0 = volatile)
            cv = std_credit / mean_credit
            income_stability = float(max(0.0, min(1.0, 1.0 - (cv / 2.0))))
        else:
            income_stability = 0.5
    else:
        income_stability = 0.8 if credit_transaction_count > 0 else 0.0

    # Large transaction count (debits > 2.5x mean debit amount)
    if not debits.empty:
        avg_debit = debits['amount'].mean()
        large_transaction_count = int((debits['amount'] > (2.5 * avg_debit)).sum())
    else:
        large_transaction_count = 0

    # Negative balance count
    negative_balance_count = int((df['balance'] < 0).sum())

    return {
        "monthly_income": round(monthly_income, 2),
        "monthly_expenses": round(monthly_expenses, 2),
        "savings_rate": round(savings_rate, 4),
        "average_balance": round(average_balance, 2),
        "transaction_count": transaction_count,
        "credit_transaction_count": credit_transaction_count,
        "debit_transaction_count": debit_transaction_count,
        "income_stability": round(income_stability, 4),
        "expense_ratio": round(expense_ratio, 4),
        "large_transaction_count": large_transaction_count,
        "negative_balance_count": negative_balance_count
    }
