import os
import sys
import shutil
import dotenv

# Load backend env
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

from app.database import engine, SessionLocal, Base
from app.models.user import User
from app.models.document import Document
from app.models.transaction import Transaction
from app.models.credit_analysis import CreditAnalysis
from app.routes.documents import upload_document
from app.routes.analysis import run_credit_analysis
from fastapi import UploadFile, HTTPException

def test_folder_upload_pipeline():
    print("\n=======================================================")
    print("      FOLDER UPLOAD & MULTI-FILE PIPELINE VERIFICATION")
    print("=======================================================\n")

    db = SessionLocal()

    # 1. Get or create test user
    test_user = db.query(User).filter(User.email == "folder_test@credify.com").first()
    if not test_user:
        test_user = User(
            email="folder_test@credify.com",
            password_hash="dummy_hash",
            name="Folder Upload Tester"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

    # 2. Setup mock folder structure: test_folder_samples/
    folder_dir = os.path.join(os.path.dirname(__file__), "test_folder_samples")
    if os.path.exists(folder_dir):
        shutil.rmtree(folder_dir)
    os.makedirs(folder_dir, exist_ok=True)

    # File 1: healthy.csv
    csv1_path = os.path.join(folder_dir, "healthy.csv")
    with open(csv1_path, "w", encoding="utf-8") as f:
        f.write("Date,Description,Amount,Type,Balance\n")
        f.write("2026-01-01,Salary Credit,50000,CREDIT,50000\n")
        f.write("2026-01-05,Rent Payment,15000,DEBIT,35000\n")

    # File 2: statement.pdf (copy from test_files/valid_statement.pdf)
    src_pdf = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_files", "valid_statement.pdf"))
    pdf1_path = os.path.join(folder_dir, "statement.pdf")
    shutil.copy(src_pdf, pdf1_path)

    # File 3: protected_statement.pdf (copy from test_files/protected_statement.pdf)
    src_pwd_pdf = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_files", "protected_statement.pdf"))
    pdf2_path = os.path.join(folder_dir, "protected_statement.pdf")
    shutil.copy(src_pwd_pdf, pdf2_path)

    # File 4: another.csv
    csv2_path = os.path.join(folder_dir, "another.csv")
    with open(csv2_path, "w", encoding="utf-8") as f:
        f.write("Date,Description,Amount,Type,Balance\n")
        f.write("2026-02-01,Consulting Income,30000,CREDIT,65000\n")
        f.write("2026-02-10,Groceries,2500,DEBIT,62500\n")

    # File 5: notes.txt (unsupported file)
    txt_path = os.path.join(folder_dir, "notes.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("This is a text note that should be skipped or rejected.")

    folder_files = os.listdir(folder_dir)
    print(f"[OK] Created test folder containing: {folder_files}")
    assert len(folder_files) == 5

    # 3. Simulate frontend folder selection & independent per-file upload
    results = []

    for fname in folder_files:
        fpath = os.path.join(folder_dir, fname)
        rel_filename = f"my_folder/{fname}" # Simulate webkitdirectory relative path sent by browser

        # Check extension filter in frontend
        ext = fname.split('.')[-1].lower()
        if ext not in ['csv', 'pdf']:
            print(f"\n--- File: {fname} (relative: {rel_filename}) ---")
            print(f"[SKIPPED] Frontend correctly skipped unsupported file '.{ext}'")
            results.append({
                "filename": fname,
                "status": "UNSUPPORTED_SKIPPED",
                "doc_id": None,
                "score": None
            })
            continue

        print(f"\n--- Processing File: {fname} (FormData filename: '{rel_filename}') ---")
        
        # Open file binary & create UploadFile
        with open(fpath, "rb") as f_bin:
            upload_file = UploadFile(filename=rel_filename, file=f_bin)

            # Test password requirement handling for protected PDF
            if fname == "protected_statement.pdf":
                # First attempt without password (expects 400 PASSWORD_REQUIRED)
                try:
                    import asyncio
                    asyncio.run(upload_document(file=upload_file, password=None, db=db, current_user=test_user))
                    assert False, "Should have failed with password required"
                except HTTPException as he:
                    print(f"[OK] Caught expected password prompt exception: status_code={he.status_code}, detail='{he.detail}'")
                    assert "PASSWORD" in str(he.detail).upper() or "PROTECTED" in str(he.detail).upper()

                # Second attempt with correct password
                f_bin.seek(0)
                upload_file_pwd = UploadFile(filename=rel_filename, file=f_bin)
                import asyncio
                doc_res = asyncio.run(upload_document(file=upload_file_pwd, password="Secret123", db=db, current_user=test_user))
            else:
                import asyncio
                doc_res = asyncio.run(upload_document(file=upload_file, password=None, db=db, current_user=test_user))

            doc_id = doc_res.id
            print(f"[OK] Successfully uploaded! PostgreSQL Document ID={doc_id}, Sanitize file_name='{doc_res.file_name}'")
            assert doc_res.file_name == fname, f"Expected clean basename '{fname}', got '{doc_res.file_name}'"

            # Run credit analysis
            analysis_res = run_credit_analysis(document_id=doc_id, db=db, current_user=test_user)
            tx_cnt = getattr(analysis_res.financial_metrics, "transaction_count", 0) if analysis_res.financial_metrics else 0
            
            print(f"[OK] Analysis completed! Score: {analysis_res.credit_score} ({analysis_res.risk_category}), Transactions: {tx_cnt}")
            assert analysis_res.credit_score > 0

            results.append({
                "filename": fname,
                "status": "COMPLETED",
                "doc_id": doc_id,
                "score": analysis_res.credit_score
            })

    # 4. Verify PostgreSQL isolation
    print("\n-------------------------------------------------------")
    print("         POSTGRESQL ISOLATION & RECORD VERIFICATION")
    print("-------------------------------------------------------")
    for r in results:
        if r["status"] == "COMPLETED":
            doc_id = r["doc_id"]
            d_rec = db.query(Document).filter(Document.id == doc_id).first()
            t_recs = db.query(Transaction).filter(Transaction.document_id == doc_id).all()
            a_rec = db.query(CreditAnalysis).filter(CreditAnalysis.document_id == doc_id).first()

            print(f"[OK] Document #{doc_id} ('{d_rec.file_name}'): {len(t_recs)} transactions saved, Analysis ID #{a_rec.id} (Score {a_rec.credit_score})")
            assert d_rec is not None
            assert len(t_recs) > 0
            assert a_rec is not None

    db.close()

    print("\n=======================================================")
    print("  FOLDER UPLOAD & MULTI-FILE PIPELINE PASSED CLEANLY!  ")
    print("=======================================================\n")

if __name__ == "__main__":
    test_folder_upload_pipeline()
