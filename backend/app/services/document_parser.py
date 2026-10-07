import pandas as pd
import pdfplumber
import re
import os
import io
from typing import Optional
from fastapi import HTTPException
from app.services.transaction_mapper import standardize_transactions

def parse_document(file_path: str, file_type: str, password: Optional[str] = None) -> pd.DataFrame:
    """
    Parses an uploaded CSV or PDF document into a standardized DataFrame of transactions.
    """
    if not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="Uploaded file not found.")

    ext = file_type.lower().strip('.')

    if ext == 'csv':
        return parse_csv_document(file_path)
    elif ext == 'pdf':
        return parse_pdf_document(file_path, password=password)
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format '.{ext}'. Credify supports CSV and PDF financial statements."
        )

def parse_csv_document(file_path: str) -> pd.DataFrame:
    """
    Parses CSV bank statement into standardized DataFrame.
    """
    df = None
    encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252']
    
    file_bytes = None
    try:
        with open(file_path, 'rb') as f:
            file_bytes = f.read()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read the uploaded CSV file. Please make sure the file is not corrupted."
        )

    for enc in encodings:
        try:
            content_str = file_bytes.decode(enc)
            lines = content_str.splitlines()
            
            # Find candidate header row (skip top metadata lines if bank name/account info is present)
            header_idx = 0
            header_keywords = ['date', 'amount', 'narration', 'description', 'particulars', 'withdrawal', 'deposit', 'balance', 'credit', 'debit']
            
            for i, line in enumerate(lines[:30]):
                line_lower = line.lower()
                matches = sum(1 for kw in header_keywords if kw in line_lower)
                if matches >= 2:
                    header_idx = i
                    break

            df = pd.read_csv(io.StringIO(content_str), skiprows=header_idx)
            if not df.empty and len(df.columns) >= 2:
                break
        except Exception:
            continue

    if df is None or df.empty:
        raise HTTPException(
            status_code=400, 
            detail="Unable to extract transactions from this document. Please check that the uploaded file is a valid bank statement."
        )

    try:
        std_df = standardize_transactions(df)
        if std_df.empty or len(std_df) < 1:
            raise HTTPException(
                status_code=400, 
                detail="Unable to extract transactions from this document. Please check that the uploaded file is a valid bank statement."
            )
        return std_df

    except HTTPException as he:
        raise he
    except Exception:
        raise HTTPException(
            status_code=400, 
            detail="Unable to extract transactions from this document. Please check that the uploaded file is a valid bank statement."
        )

def build_header_mapping(headers: list) -> dict:
    """
    Analyzes table header strings and maps canonical roles ('date', 'time', 'description', 
    'ref', 'debit', 'credit', 'amount', 'type', 'balance') to column indices.
    """
    mapping = {}
    if not headers:
        return mapping

    clean_headers = [str(h).replace('\n', ' ').strip().lower() if h else "" for h in headers]

    assigned_roles = set()
    assigned_indices = set()

    for idx, h_text in enumerate(clean_headers):
        if not h_text or idx in assigned_indices:
            continue
        
        # Check time first
        if 'time' not in assigned_roles and any(re.search(p, h_text) for p in [r'\btime\b', r'txn\s*time']):
            mapping[idx] = 'time'
            assigned_roles.add('time')
            assigned_indices.add(idx)
            continue

        # Check ref/chq
        if 'ref' not in assigned_roles and any(re.search(p, h_text) for p in [r'\bref\b', r'\bchq\b', r'cheque', r'\butr\b', r'tran\s*id']):
            mapping[idx] = 'ref'
            assigned_roles.add('ref')
            assigned_indices.add(idx)
            continue

        # Check debit/withdrawal
        if 'debit' not in assigned_roles and any(re.search(p, h_text) for p in [r'withdrawal', r'debit', r'\bdr\b', r'outgoing']):
            mapping[idx] = 'debit'
            assigned_roles.add('debit')
            assigned_indices.add(idx)
            continue

        # Check credit/deposit
        if 'credit' not in assigned_roles and any(re.search(p, h_text) for p in [r'deposit', r'credit', r'\bcr\b', r'incoming']):
            mapping[idx] = 'credit'
            assigned_roles.add('credit')
            assigned_indices.add(idx)
            continue

        # Check balance
        if 'balance' not in assigned_roles and any(re.search(p, h_text) for p in [r'balance', r'\bbal\b', r'closing\s*bal']):
            mapping[idx] = 'balance'
            assigned_roles.add('balance')
            assigned_indices.add(idx)
            continue

        # Check date
        if 'date' not in assigned_roles and any(re.search(p, h_text) for p in [r'\bdate\b', r'val\s*dt', r'value\s*dt', r'txn\s*date', r'post\s*date']):
            mapping[idx] = 'date'
            assigned_roles.add('date')
            assigned_indices.add(idx)
            continue

        # Check description
        if 'description' not in assigned_roles and any(re.search(p, h_text) for p in [r'narration', r'particulars', r'description', r'remark', r'details', r'memo']):
            mapping[idx] = 'description'
            assigned_roles.add('description')
            assigned_indices.add(idx)
            continue

        # Check amount
        if 'amount' not in assigned_roles and any(re.search(p, h_text) for p in [r'amount', r'\bamt\b']):
            mapping[idx] = 'amount'
            assigned_roles.add('amount')
            assigned_indices.add(idx)
            continue

        # Check type
        if 'type' not in assigned_roles and any(re.search(p, h_text) for p in [r'\btype\b', r'cr/dr', r'd/c']):
            mapping[idx] = 'type'
            assigned_roles.add('type')
            assigned_indices.add(idx)
            continue

    # Fallback for description if missing
    if 'description' not in assigned_roles:
        for idx, h_text in enumerate(clean_headers):
            if idx not in assigned_indices:
                mapping[idx] = 'description'
                assigned_roles.add('description')
                assigned_indices.add(idx)
                break

    return mapping

def is_header_row(row_cells: list) -> bool:
    """
    Checks if a row of text cells looks like a bank statement table header.
    Excludes statement summary headers explicitly.
    """
    row_str = " ".join([str(c).lower() for c in row_cells if c]).strip()
    
    # Reject Statement Summary header rows explicitly
    summary_keywords = ['brought forward', 'dr count', 'cr count', 'total debits', 'total credits', 'closing balance(', 'statement summary']
    if any(sk in row_str for sk in summary_keywords):
        return False

    keywords = ['date', 'narration', 'description', 'particulars', 'details', 'debit', 'credit', 'withdrawal', 'deposit', 'balance', 'amount', 'cr/dr', 'val dt', 'type', 'ref', 'chq', 'cheque', 'value']
    matches = sum(1 for kw in keywords if kw in row_str)
    return matches >= 2

def is_junk_or_summary_row(row_str: str) -> bool:
    """
    Detects non-transaction header/footer/summary lines in bank statements.
    """
    row_lower = row_str.lower().strip()
    junk_patterns = [
        'page ', 'statement summary', 'opening balance', 'closing balance',
        'total debit', 'total credit', 'grand total', 'account number',
        'ifsc code', 'branch name', 'computer generated', 'end of statement',
        'continued on', 'brought forward', 'carried forward', 'dr count', 'cr count'
    ]
    return any(p in row_lower for p in junk_patterns)

def parse_pdf_document(file_path: str, password: Optional[str] = None) -> pd.DataFrame:
    """
    Parses PDF bank statement into standardized DataFrame of transactions.
    Supports multi-page transaction tables, text extraction, password detection,
    scanned PDF detection, and uniform schema normalization.
    """
    extracted_rows = []
    total_text_length = 0
    pdf_opened = False

    open_kwargs = {}
    if password is not None and password.strip() != "":
        open_kwargs['password'] = password.strip()

    try:
        with pdfplumber.open(file_path, **open_kwargs) as pdf:
            pdf_opened = True
            
            last_known_headers = None

            # Step 1: Multi-Page Table Extraction
            for page in pdf.pages:
                text = page.extract_text() or ""
                total_text_length += len(text.strip())

                tables = page.extract_tables()
                if not tables:
                    tables = page.extract_tables(table_settings={
                        "vertical_strategy": "text",
                        "horizontal_strategy": "text"
                    })

                for table in tables:
                    if not table or len(table) < 1:
                        continue

                    header_idx = None
                    for idx, row in enumerate(table[:5]):
                        cleaned_row = [str(c).replace('\n', ' ').strip() if c else "" for c in row]
                        if is_header_row(cleaned_row):
                            header_idx = idx
                            last_known_headers = cleaned_row
                            break

                    if header_idx is not None:
                        headers = last_known_headers
                        data_rows = table[header_idx + 1:]
                    elif last_known_headers is not None:
                        headers = last_known_headers
                        data_rows = table
                    else:
                        headers = None
                        data_rows = table

                    header_mapping = build_header_mapping(headers) if headers else {}
                    role_to_idx = {role: idx for idx, role in header_mapping.items()}

                    date_idx = role_to_idx.get('date', 0)
                    desc_idx = role_to_idx.get('description', None)
                    debit_idx = role_to_idx.get('debit', None)
                    credit_idx = role_to_idx.get('credit', None)
                    balance_idx = role_to_idx.get('balance', None)
                    amount_idx = role_to_idx.get('amount', None)
                    type_idx = role_to_idx.get('type', None)

                    for row in data_rows:
                        if not row:
                            continue
                        cleaned_cells = [str(c).replace('\n', ' ').strip() if c else "" for c in row]
                        row_str = " ".join(cleaned_cells)

                        if not row_str or is_header_row(cleaned_cells) or is_junk_or_summary_row(row_str):
                            continue

                        # Check if date is present in candidate cells
                        date_val = ""
                        if date_idx < len(cleaned_cells):
                            d_candidate = cleaned_cells[date_idx]
                            if bool(re.match(r'^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$', d_candidate)) or bool(re.match(r'^\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}$', d_candidate)):
                                date_val = d_candidate

                        if not date_val and len(cleaned_cells) > 0:
                            for c_i in [0, 1]:
                                if c_i < len(cleaned_cells):
                                    d_cand = cleaned_cells[c_i]
                                    if bool(re.match(r'^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$', d_cand)) or bool(re.match(r'^\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}$', d_cand)):
                                        date_val = d_cand
                                        break

                        if date_val:
                            row_dict = {"Date": date_val}

                            if desc_idx is not None and desc_idx < len(cleaned_cells):
                                row_dict["Description"] = cleaned_cells[desc_idx]
                            
                            if debit_idx is not None and debit_idx < len(cleaned_cells):
                                row_dict["Debit"] = cleaned_cells[debit_idx]
                            
                            if credit_idx is not None and credit_idx < len(cleaned_cells):
                                row_dict["Credit"] = cleaned_cells[credit_idx]
                            
                            if balance_idx is not None and balance_idx < len(cleaned_cells):
                                row_dict["Balance"] = cleaned_cells[balance_idx]
                            
                            if amount_idx is not None and amount_idx < len(cleaned_cells):
                                row_dict["Amount"] = cleaned_cells[amount_idx]
                            
                            if type_idx is not None and type_idx < len(cleaned_cells):
                                row_dict["Type"] = cleaned_cells[type_idx]

                            # Fallback if header_mapping could not assign roles
                            if not header_mapping:
                                if len(cleaned_cells) >= 7:
                                    row_dict = {
                                        "Date": cleaned_cells[0],
                                        "Description": cleaned_cells[2],
                                        "Debit": cleaned_cells[4],
                                        "Credit": cleaned_cells[5],
                                        "Balance": cleaned_cells[6]
                                    }
                                elif len(cleaned_cells) == 6:
                                    row_dict = {
                                        "Date": cleaned_cells[0],
                                        "Description": cleaned_cells[1],
                                        "Debit": cleaned_cells[3],
                                        "Credit": cleaned_cells[4],
                                        "Balance": cleaned_cells[5]
                                    }

                            extracted_rows.append(row_dict)
                        else:
                            # Multi-line narration continuation line
                            if extracted_rows:
                                continuation_text = ""
                                if desc_idx is not None and desc_idx < len(cleaned_cells):
                                    continuation_text = cleaned_cells[desc_idx]
                                elif len(cleaned_cells) > 1:
                                    for cell_c in cleaned_cells:
                                        if len(cell_c) > 3 and not re.match(r'^-?[\d,.]+$', cell_c):
                                            continuation_text = cell_c
                                            break

                                if continuation_text and not is_junk_or_summary_row(continuation_text):
                                    prev_desc = extracted_rows[-1].get("Description", "")
                                    extracted_rows[-1]["Description"] = (prev_desc + " " + continuation_text).strip()

            # Step 2: Check for scanned / image-only PDF
            if total_text_length < 25 and len(extracted_rows) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="This PDF appears to be scanned/image-based. Text extraction is not currently supported. Please upload a text-based bank statement PDF or CSV."
                )

            # Step 3: Fallback Text Line Parser (if table extraction returned 0 rows)
            if not extracted_rows:
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    lines = text.split('\n')
                    for line in lines:
                        line_clean = line.strip()
                        if not line_clean or is_junk_or_summary_row(line_clean):
                            continue
                        
                        # Pattern 1: Date | Description | Amount | Type | Balance
                        match1 = re.search(r'(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\s+(.+?)\s+([\d,]+(?:\.\d+)?)\s+(CREDIT|DEBIT|CR|DR)\s+([\d,]+(?:\.\d+)?)', line_clean, re.IGNORECASE)
                        if match1:
                            date_str, desc, amt, ttype, bal = match1.groups()
                            extracted_rows.append({
                                "Date": date_str,
                                "Description": desc,
                                "Amount": amt,
                                "Type": ttype,
                                "Balance": bal
                            })
                            continue

                        # Pattern 2: Date | Description | Debit | Credit | Balance
                        match2 = re.search(r'(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\s+(.+?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)', line_clean, re.IGNORECASE)
                        if match2:
                            date_str, desc, d_amt, c_amt, bal = match2.groups()
                            extracted_rows.append({
                                "Date": date_str,
                                "Description": desc,
                                "Debit": d_amt,
                                "Credit": c_amt,
                                "Balance": bal
                            })
                            continue

                        # Pattern 3: Date | Description | Amount | Balance
                        match3 = re.search(r'(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\s+(.+?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)', line_clean, re.IGNORECASE)
                        if match3:
                            date_str, desc, amt, bal = match3.groups()
                            extracted_rows.append({
                                "Date": date_str,
                                "Description": desc,
                                "Amount": amt,
                                "Balance": bal
                            })
                            continue

            # Step 4: Validate Extracted Data & Standardize Schema
            if not extracted_rows:
                raise HTTPException(
                    status_code=400, 
                    detail="We couldn't find a readable transaction table in this PDF. Please upload a clear bank statement PDF or CSV."
                )

            df = pd.DataFrame(extracted_rows)
            std_df = standardize_transactions(df)

            if std_df.empty or len(std_df) < 1:
                raise HTTPException(
                    status_code=400, 
                    detail="We couldn't find a readable transaction table in this PDF. Please upload a clear bank statement PDF or CSV."
                )

            return std_df

    except HTTPException as he:
        raise he
    except Exception as e:
        cause = getattr(e, '__cause__', None)
        err_full_str = f"{type(e).__name__} {str(e)} {repr(e)} {type(cause).__name__ if cause else ''} {str(cause)}".lower()
        
        if any(k in err_full_str for k in ['password', 'encrypt', 'pdfpasswordincorrect', 'protected']):
            if password and password.strip() != "":
                raise HTTPException(
                    status_code=400,
                    detail="Incorrect PDF password. Please try again."
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail="PASSWORD_REQUIRED: This PDF is password-protected. Please enter the PDF password."
                )
        
        if not pdf_opened:
            raise HTTPException(
                status_code=400,
                detail="Unable to read this PDF file. Please check that the uploaded file is a valid bank statement."
            )

        raise HTTPException(
            status_code=400, 
            detail="We couldn't find a readable transaction table in this PDF. Please upload a clear bank statement PDF or CSV."
        )
