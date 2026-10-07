import pandas as pd
import numpy as np
import re

COLUMN_ALIASES = {
    'date': [
        'date', 'txn date', 'transaction date', 'txndate', 'value date', 'date/time', 
        'dt', 'post date', 'posting date', 'tran date', 'value dt', 'val dt', 'value dt.', 'val dt.', 'value_dt',
        'booking date', 'trans date', 'txn. date', 'txn_date'
    ],
    'description': [
        'description', 'narration', 'particulars', 'details', 'memo', 'transaction details', 
        'remark', 'remarks', 'chq/ref no', 'cheque no', 'ref no', 'reference', 'payee', 
        'transaction particulars', 'chq/ref no.', 'chq/ref_no', 'narrative', 'transaction description', 'activity'
    ],
    'amount': [
        'amount', 'txn amount', 'transaction amount', 'amt', 'value', 'amount(rs.)', 
        'amount (inr)', 'net amount', 'amount in inr', 'amount.', 'amount (rs)', 'amount in rs'
    ],
    'type': [
        'type', 'txn type', 'transaction type', 'cr/dr', 'd/c', 'type (credit/debit)', 
        'transaction_type', 'indicator', 'dr/cr', 'credit/debit'
    ],
    'credit': [
        'credit', 'deposit', 'cr', 'deposit amount', 'incoming', 'credit amount', 
        'deposits', 'deposit(rs.)', 'cr amount', 'credit (inr)', 'credit(rs.)', 
        'deposit amt', 'deposit amt.', 'deposit_amt', 'cr amt', 'credit amt.',
        'credit(inr)', 'deposit (inr)', 'deposit(inr)', 'deposits (inr)'
    ],
    'debit': [
        'debit', 'withdrawal', 'dr', 'withdrawal amount', 'outgoing', 'debit amount', 
        'withdrawals', 'withdrawals(rs.)', 'dr amount', 'debit (inr)', 'debit(rs.)', 
        'withdrawal amt', 'withdrawal amt.', 'withdrawal_amt', 'dr amt', 'debit amt.',
        'debit(inr)', 'withdrawal (inr)', 'withdrawal(inr)', 'withdrawals (inr)'
    ],
    'balance': [
        'balance', 'closing balance', 'running balance', 'bal', 'avail balance', 
        'available balance', 'balance(rs.)', 'balance (inr)', 'closing bal', 'net balance',
        'closing balance(rs.)', 'closing balance (inr)', 'balance (rs)', 'balance(inr)'
    ]
}

def get_scalar(row, col_name, default=None):
    """Safely extracts a single scalar value from a Pandas Row (Series) avoiding Series ambiguity."""
    if col_name not in row.index:
        return default
    val = row[col_name]
    if isinstance(val, pd.Series):
        val = val.dropna().iloc[0] if not val.dropna().empty else default
    if pd.isna(val) or val is None:
        return default
    return val

def _clean_single_token(val_str: str) -> float:
    """Helper to parse a single numeric string token into a float."""
    if not val_str or val_str.lower() in ['nan', 'none', 'null', '', '-']:
        return 0.0

    is_neg = False
    if val_str.startswith('(') and val_str.endswith(')'):
        is_neg = True
        val_str = val_str[1:-1]
    elif val_str.startswith('-'):
        is_neg = True
        val_str = val_str[1:]
    elif val_str.endswith('-') or val_str.lower().endswith(' dr'):
        is_neg = True
        if val_str.endswith('-'):
            val_str = val_str[:-1]

    # Clean out currency symbols/words, DR/CR, spaces
    val_str = re.sub(r'(?i)\b(rs\.?|inr|usd|eur|gbp|cr|dr)\b', '', val_str)
    # Strip any non-numeric chars except period and minus
    cleaned = re.sub(r'[^0-9.-]', '', val_str)

    # Handle case where multiple dots exist (e.g. from 'Rs.' or multiple decimals)
    if cleaned.count('.') > 1:
        parts = cleaned.split('.')
        cleaned = "".join(parts[:-1]) + "." + parts[-1]

    try:
        num = float(cleaned) if cleaned else 0.0
        return -num if is_neg else num
    except Exception:
        return 0.0

def clean_number(val) -> float:
    """Parses a string or numeric value into a clean float with strict multi-value protection."""
    if val is None or pd.isna(val):
        return 0.0
    val_str = str(val).strip()
    if not val_str or val_str.lower() in ['nan', 'none', 'null', '', '-']:
        return 0.0

    # Reject time strings e.g. 18:45 or 18:45:20
    if re.match(r'^\d{1,2}:\d{2}(:\d{2})?$', val_str):
        return 0.0

    # If the string contains multiple space-separated or line-separated numbers,
    # extract numeric tokens to avoid concatenating multiple numbers together.
    if ' ' in val_str or '\n' in val_str or '\t' in val_str:
        # Match tokens like 1,500.00 or -49.00 or 16.48
        tokens = re.findall(r'-?[\d,]+\.?\d*', val_str)
        if tokens:
            for tok in tokens:
                num = _clean_single_token(tok)
                if abs(num) > 0 and abs(num) < 100000000:
                    return num
            return 0.0

    num = _clean_single_token(val_str)
    # Reject insane mega-numbers from concatenated multi-value strings
    if abs(num) >= 100000000:
        return 0.0
    return num

def standardize_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """
    Identifies column variations in a raw bank statement DataFrame
    and standardizes them into standard columns:
    ['date', 'description', 'amount', 'transaction_type', 'balance']
    """
    if df.empty:
        return pd.DataFrame(columns=['date', 'description', 'amount', 'transaction_type', 'balance'])

    orig_cols = [str(c).strip() for c in df.columns]
    
    col_map = {}
    assigned_std_keys = set()
    assigned_orig_cols = set()

    def norm_str(s):
        return re.sub(r'[^a-z0-9]', '', str(s).lower()).strip()

    # Pass 1: Exact matches or alias matches
    for orig in orig_cols:
        norm_orig = norm_str(orig)
        for std_key, aliases in COLUMN_ALIASES.items():
            if std_key not in assigned_std_keys and orig not in assigned_orig_cols:
                norm_aliases = [norm_str(a) for a in aliases]
                if norm_orig in norm_aliases:
                    col_map[orig] = std_key
                    assigned_std_keys.add(std_key)
                    assigned_orig_cols.add(orig)
                    break

    # Pass 2: Keyword containment rules
    keyword_rules = [
        ('credit', ['deposit', 'credit']),
        ('debit', ['withdrawal', 'debit']),
        ('balance', ['balance', 'bal']),
        ('description', ['narration', 'particulars', 'description', 'details']),
        ('date', ['date', 'value dt', 'val dt', 'txn dt']),
        ('amount', ['amount', 'amt']),
        ('type', ['type', 'cr/dr'])
    ]

    for std_key, keywords in keyword_rules:
        if std_key in assigned_std_keys:
            continue
        for orig in orig_cols:
            if orig in assigned_orig_cols:
                continue
            norm_orig = norm_str(orig)
            if any(norm_str(kw) in norm_orig for kw in keywords):
                col_map[orig] = std_key
                assigned_std_keys.add(std_key)
                assigned_orig_cols.add(orig)
                break

    renamed_df = df.rename(columns=col_map)

    records = []
    
    has_credit_col = 'credit' in renamed_df.columns
    has_debit_col = 'debit' in renamed_df.columns
    has_amount_col = 'amount' in renamed_df.columns
    has_type_col = 'type' in renamed_df.columns
    has_balance_col = 'balance' in renamed_df.columns
    has_date_col = 'date' in renamed_df.columns
    has_desc_col = 'description' in renamed_df.columns

    for idx, row in renamed_df.iterrows():
        raw_date = get_scalar(row, 'date', '') if has_date_col else ''
        raw_desc = get_scalar(row, 'description', '') if has_desc_col else 'Transaction'
        raw_bal = get_scalar(row, 'balance', 0.0) if has_balance_col else 0.0

        tx_date = str(raw_date).strip() if raw_date is not None else ''
        desc = str(raw_desc).strip() if raw_desc is not None else 'Transaction'
        balance = clean_number(raw_bal)

        # Reject insane balance values resulting from malformed multi-value concatenation
        if abs(balance) >= 100000000:
            balance = 0.0

        amount = 0.0
        tx_type = "DEBIT"

        raw_credit = get_scalar(row, 'credit', None) if has_credit_col else None
        raw_debit = get_scalar(row, 'debit', None) if has_debit_col else None
        raw_amount = get_scalar(row, 'amount', None) if has_amount_col else None

        # Check Credit column first
        if raw_credit is not None:
            c_amt = clean_number(raw_credit)
            if c_amt > 0:
                amount = c_amt
                tx_type = "CREDIT"

        # Check Debit column if credit yielded nothing
        if amount == 0.0 and raw_debit is not None:
            d_amt = clean_number(raw_debit)
            if d_amt > 0:
                amount = d_amt
                tx_type = "DEBIT"

        # Fallback to single Amount column
        if amount == 0.0 and raw_amount is not None:
            amt_val = clean_number(raw_amount)
            if amt_val != 0.0:
                raw_type = get_scalar(row, 'type', '') if has_type_col else ''
                t_str = str(raw_type).strip().upper() if raw_type else ''

                if t_str:
                    if any(kw in t_str for kw in ['CR', 'DEPOSIT', 'CREDIT', 'IN']):
                        tx_type = "CREDIT"
                    else:
                        tx_type = "DEBIT"
                else:
                    tx_type = "CREDIT" if amt_val > 0 else "DEBIT"

                amount = abs(amt_val)

        # Ignore summary / header / non-transaction metadata rows
        desc_lower = desc.lower()
        if any(kw in desc_lower for kw in ['opening balance', 'closing balance', 'grand total', 'total amount', 'statement summary', 'page ']):
            continue

        # Strict validation: transaction amount must be positive & within realistic limits
        if 0 < amount < 50000000:
            records.append({
                "date": tx_date if tx_date and tx_date.lower() != 'nan' else '2026-01-01',
                "description": desc if desc and desc.lower() != 'nan' else 'General Transaction',
                "amount": round(amount, 2),
                "transaction_type": tx_type,
                "balance": round(balance, 2)
            })

    return pd.DataFrame(records)
