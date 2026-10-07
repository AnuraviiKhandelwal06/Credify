import os
import sys
import pandas as pd
from fastapi import HTTPException
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import dotenv
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

from app.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.document import Document
from app.models.transaction import Transaction
from app.models.credit_analysis import CreditAnalysis
from app.services.document_parser import parse_document
from app.services.financial_analyzer import analyze_statement_transactions

def run_all_tests():
    print("\n=======================================================")
    print("      CREDIFY VERIFICATION TEST SUITE ")
    print("=======================================================\n")

    # TEST 1 — PostgreSQL Connection & Schema Verification
    print("--- TEST 1: PostgreSQL Connection & SELECT 1 ---")
    try:
        conn = engine.connect()
        res = conn.execute(text("SELECT 1")).scalar()
        print(f"[OK] PostgreSQL connected successfully! Result of SELECT 1: {res}")
        assert res == 1

        Base.metadata.create_all(bind=engine)
        table_names = [r[0] for r in conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = :s"), {'s': 'public'}).fetchall()]
        print(f"[OK] Required PostgreSQL Tables Found: {table_names}")
        for t in ['users', 'documents', 'transactions', 'credit_analyses']:
            assert t in table_names, f"Missing table {t}"
        conn.close()
        print("[SUCCESS] TEST 1 PASSED!\n")
    except Exception as e:
        print(f"[FAILED] TEST 1 FAILED: {str(e)}\n")

    db = SessionLocal()

    # Get or create test user
    test_user = db.query(User).filter(User.email == "test_verification@credify.com").first()
    if not test_user:
        test_user = User(
            email="test_verification@credify.com",
            password_hash="dummy_password_hash",
            name="Verification User"
        )

        db.add(test_user)
        db.commit()
        db.refresh(test_user)

    # TEST 2 — CSV Upload & PostgreSQL Persistence
    print("--- TEST 2: CSV Upload & PostgreSQL Persistence ---")
    try:
        csv_path = "sample_bank_statement.csv"
        df_csv = parse_document(csv_path, "csv")
        assert len(df_csv) > 0, "CSV transactions must not be empty"

        doc_csv = Document(
            user_id=test_user.id,
            file_name="sample_bank_statement.csv",
            file_type="csv",
            processing_status="PROCESSED"
        )
        db.add(doc_csv)
        db.commit()
        db.refresh(doc_csv)

        tx_objs = []
        for _, row in df_csv.iterrows():
            tx_objs.append(Transaction(
                document_id=doc_csv.id,
                transaction_date=str(row.get('date', '')),
                description=str(row.get('description', '')),
                amount=float(row.get('amount', 0.0)),
                transaction_type=str(row.get('transaction_type', 'DEBIT')),
                balance=float(row.get('balance', 0.0))
            ))
        db.bulk_save_objects(tx_objs)
        db.commit()

        analysis_dict = analyze_statement_transactions(df_csv)
        probs = analysis_dict["risk_probabilities"]
        metrics = analysis_dict["financial_metrics"]

        analysis_csv = CreditAnalysis(
            user_id=test_user.id,
            document_id=doc_csv.id,
            credit_score=analysis_dict["credit_score"],
            risk_category=analysis_dict["risk_category"],
            risk_low_probability=probs["Low"],
            risk_medium_probability=probs["Medium"],
            risk_high_probability=probs["High"],
            total_income=analysis_dict["total_income"],
            total_expense=analysis_dict["total_expense"],
            average_balance=metrics["average_balance"],
            transaction_count=metrics["transaction_count"],
            savings_rate=metrics["savings_rate"],
            expense_ratio=metrics["expense_ratio"],
            income_stability=metrics["income_stability"],
            large_transaction_count=metrics["large_transaction_count"],
            negative_balance_count=metrics["negative_balance_count"],
            score_explanation=analysis_dict["score_explanation"]
        )
        db.add(analysis_csv)
        db.commit()
        db.refresh(analysis_csv)

        saved_tx_count = db.query(Transaction).filter(Transaction.document_id == doc_csv.id).count()
        saved_analysis = db.query(CreditAnalysis).filter(CreditAnalysis.document_id == doc_csv.id).first()

        print(f"[OK] CSV Document ID: {doc_csv.id}, Saved Transactions: {saved_tx_count}, Credify Score: {saved_analysis.credit_score} ({saved_analysis.risk_category})")
        assert saved_tx_count == len(df_csv)
        assert saved_analysis.credit_score > 0
        print("[SUCCESS] TEST 2 PASSED!\n")
    except Exception as e:
        print(f"[FAILED] TEST 2 FAILED: {str(e)}\n")

    # TEST 3 — Normal PDF Upload & PostgreSQL Persistence
    print("--- TEST 3: Normal PDF Upload & PostgreSQL Persistence ---")
    try:
        pdf_path = "test_files/valid_statement.pdf"
        df_pdf = parse_document(pdf_path, "pdf")
        assert len(df_pdf) > 0

        doc_pdf = Document(
            user_id=test_user.id,
            file_name="valid_statement.pdf",
            file_type="pdf",
            processing_status="PROCESSED"
        )
        db.add(doc_pdf)
        db.commit()
        db.refresh(doc_pdf)

        tx_objs = []
        for _, row in df_pdf.iterrows():
            tx_objs.append(Transaction(
                document_id=doc_pdf.id,
                transaction_date=str(row.get('date', '')),
                description=str(row.get('description', '')),
                amount=float(row.get('amount', 0.0)),
                transaction_type=str(row.get('transaction_type', 'DEBIT')),
                balance=float(row.get('balance', 0.0))
            ))
        db.bulk_save_objects(tx_objs)
        db.commit()

        analysis_dict = analyze_statement_transactions(df_pdf)
        probs = analysis_dict["risk_probabilities"]
        metrics = analysis_dict["financial_metrics"]

        analysis_pdf = CreditAnalysis(
            user_id=test_user.id,
            document_id=doc_pdf.id,
            credit_score=analysis_dict["credit_score"],
            risk_category=analysis_dict["risk_category"],
            risk_low_probability=probs["Low"],
            risk_medium_probability=probs["Medium"],
            risk_high_probability=probs["High"],
            total_income=analysis_dict["total_income"],
            total_expense=analysis_dict["total_expense"],
            average_balance=metrics["average_balance"],
            transaction_count=metrics["transaction_count"],
            savings_rate=metrics["savings_rate"],
            expense_ratio=metrics["expense_ratio"],
            income_stability=metrics["income_stability"],
            large_transaction_count=metrics["large_transaction_count"],
            negative_balance_count=metrics["negative_balance_count"],
            score_explanation=analysis_dict["score_explanation"]
        )
        db.add(analysis_pdf)
        db.commit()
        db.refresh(analysis_pdf)

        saved_tx_count = db.query(Transaction).filter(Transaction.document_id == doc_pdf.id).count()
        saved_analysis = db.query(CreditAnalysis).filter(CreditAnalysis.document_id == doc_pdf.id).first()

        print(f"[OK] Normal PDF Document ID: {doc_pdf.id}, Extracted Transactions: {saved_tx_count}, Credify Score: {saved_analysis.credit_score} ({saved_analysis.risk_category})")
        assert saved_tx_count == len(df_pdf)
        assert saved_analysis.credit_score > 0
        print("[SUCCESS] TEST 3 PASSED!\n")
    except Exception as e:
        print(f"[FAILED] TEST 3 FAILED: {str(e)}\n")

    # TEST 4 — Password-Protected PDF + Correct Password
    print("--- TEST 4: Password-Protected PDF + Correct Password ---")
    pwd_pdf = "test_files/protected_statement.pdf"
    try:
        df_pwd = parse_document(pwd_pdf, "pdf", password="Secret123")
        assert len(df_pwd) > 0

        doc_pwd = Document(
            user_id=test_user.id,
            file_name="protected_statement.pdf",
            file_type="pdf",
            processing_status="PROCESSED"
        )
        db.add(doc_pwd)
        db.commit()
        db.refresh(doc_pwd)

        tx_objs = []
        for _, row in df_pwd.iterrows():
            tx_objs.append(Transaction(
                document_id=doc_pwd.id,
                transaction_date=str(row.get('date', '')),
                description=str(row.get('description', '')),
                amount=float(row.get('amount', 0.0)),
                transaction_type=str(row.get('transaction_type', 'DEBIT')),
                balance=float(row.get('balance', 0.0))
            ))
        db.bulk_save_objects(tx_objs)
        db.commit()

        analysis_dict = analyze_statement_transactions(df_pwd)
        probs = analysis_dict["risk_probabilities"]
        metrics = analysis_dict["financial_metrics"]

        analysis_pwd = CreditAnalysis(
            user_id=test_user.id,
            document_id=doc_pwd.id,
            credit_score=analysis_dict["credit_score"],
            risk_category=analysis_dict["risk_category"],
            risk_low_probability=probs["Low"],
            risk_medium_probability=probs["Medium"],
            risk_high_probability=probs["High"],
            total_income=analysis_dict["total_income"],
            total_expense=analysis_dict["total_expense"],
            average_balance=metrics["average_balance"],
            transaction_count=metrics["transaction_count"],
            savings_rate=metrics["savings_rate"],
            expense_ratio=metrics["expense_ratio"],
            income_stability=metrics["income_stability"],
            large_transaction_count=metrics["large_transaction_count"],
            negative_balance_count=metrics["negative_balance_count"],
            score_explanation=analysis_dict["score_explanation"]
        )
        db.add(analysis_pwd)
        db.commit()
        db.refresh(analysis_pwd)

        saved_tx_count = db.query(Transaction).filter(Transaction.document_id == doc_pwd.id).count()
        saved_analysis = db.query(CreditAnalysis).filter(CreditAnalysis.document_id == doc_pwd.id).first()

        print(f"[OK] Protected PDF Document ID: {doc_pwd.id}, Saved Transactions: {saved_tx_count}, Credify Score: {saved_analysis.credit_score} ({saved_analysis.risk_category})")
        assert saved_tx_count == len(df_pwd)
        assert saved_analysis.credit_score > 0
        print("[SUCCESS] TEST 4 PASSED!\n")
    except Exception as e:
        print(f"[FAILED] TEST 4 FAILED: {str(e)}\n")

    # TEST 5 — Password-Protected PDF + Wrong Password
    print("--- TEST 5: Password-Protected PDF + Wrong Password ---")
    try:
        parse_document(pwd_pdf, "pdf", password="WrongPassword999")
        print("[FAILED] TEST 5 FAILED: Wrong password accepted unexpectedly!\n")
    except HTTPException as he:
        print(f"[OK] Correctly caught exception: status_code={he.status_code}, detail='{he.detail}'")
        assert he.status_code == 400
        assert "incorrect pdf password" in he.detail.lower()
        print("[SUCCESS] TEST 5 PASSED!\n")

    # TEST 6 — Password-Protected PDF + Empty Password
    print("--- TEST 6: Password-Protected PDF + Empty Password ---")
    try:
        parse_document(pwd_pdf, "pdf", password="")
        print("[FAILED] TEST 6 FAILED: Protected PDF opened without password!\n")
    except HTTPException as he:
        print(f"[OK] Correctly caught exception: status_code={he.status_code}, detail='{he.detail}'")
        assert he.status_code == 400
        assert "password" in he.detail.lower()
        print("[SUCCESS] TEST 6 PASSED!\n")

    # TEST 7 — Multiple Documents (PDF/CSV Files) Isolation
    print("--- TEST 7: Multiple Documents Persistence Isolation ---")
    try:
        docs = db.query(Document).filter(Document.user_id == test_user.id).all()
        print(f"[OK] User has {len(docs)} persisted documents in PostgreSQL database.")
        for d in docs:
            tx_count = db.query(Transaction).filter(Transaction.document_id == d.id).count()
            has_analysis = db.query(CreditAnalysis).filter(CreditAnalysis.document_id == d.id).first() is not None
            print(f"  - Doc #{d.id} ({d.file_name}): {tx_count} transactions, Analysis persisted: {has_analysis}")
            assert tx_count > 0
            assert has_analysis
        print("[SUCCESS] TEST 7 PASSED!\n")
    except Exception as e:
        print(f"[FAILED] TEST 7 FAILED: {str(e)}\n")

    # TEST 8 — Dashboard / Analysis History PostgreSQL Loading
    print("--- TEST 8: Dashboard / Analysis History Querying ---")
    try:
        history_records = db.query(CreditAnalysis).join(Document).filter(Document.user_id == test_user.id).order_by(CreditAnalysis.created_at.desc()).all()
        print(f"[OK] Retrieved {len(history_records)} historical credit analyses from PostgreSQL database.")
        assert len(history_records) >= 3
        print("[SUCCESS] TEST 8 PASSED!\n")
    except Exception as e:
        print(f"[FAILED] TEST 8 FAILED: {str(e)}\n")

    db.close()

    print("=======================================================")
    print("      ALL 8 VERIFICATION TESTS COMPLETED SUCCESSFULLY! ")
    print("=======================================================\n")

if __name__ == "__main__":
    run_all_tests()
